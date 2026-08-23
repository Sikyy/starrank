// Waffo Pancake (pancake.waffo.ai) payment provider for StarRank.
// Docs: https://docs.waffo.ai — API Key auth = RSA-SHA256 signed requests,
// webhooks = RSA-SHA256-signed JSON envelope verified with the platform public key.
// Runs on Cloudflare Workers: Web Crypto only, no Node built-ins.

import { sha256Hex } from '../domain/owner.ts'
import type {
  CheckoutRequest,
  PaidWebhookSnapshot,
  ProductionBoundaryResult,
  ProductionConfig,
  RefundWebhookSnapshot,
  WaffoWebhookResult,
} from './contracts.ts'

const WAFFO_API_BASE = 'https://api.waffo.ai'

// ---------- API request signing (X-Merchant-Id / X-Timestamp / X-Signature) ----------
// canonicalRequest = METHOD + "\n" + PATH + "\n" + TIMESTAMP + "\n" + SHA256_BASE64(BODY)

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN (RSA )?(PRIVATE|PUBLIC) KEY-----/, '')
    .replace(/-----END (RSA )?(PRIVATE|PUBLIC) KEY-----/, '')
    .replace(/\s+/g, '')
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export async function importWaffoPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
}

async function base64Sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

/** Sign a Waffo API request; returns the headers object to attach. */
export async function waffoSignHeaders(
  method: 'POST',
  path: string,
  bodyJson: string,
  config: { merchantId: string; privateKey: string },
): Promise<{ 'X-Merchant-Id': string; 'X-Timestamp': string; 'X-Signature': string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const bodyHash = await base64Sha256(bodyJson)
  const canonicalRequest = `${method}\n${path}\n${timestamp}\n${bodyHash}`
  const key = await importPrivateKey(config.privateKey)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(canonicalRequest),
  )
  return {
    'X-Merchant-Id': config.merchantId,
    'X-Timestamp': timestamp,
    'X-Signature': arrayBufferToBase64(signature),
  }
}

// ---------- Checkout session creation ----------

interface WaffoSessionResponse {
  data?: { sessionId?: string; checkoutUrl?: string }
  errors?: Array<{ message?: string }>
}

export async function createWaffoCheckout(
  input: CheckoutRequest,
  config: ProductionConfig,
): Promise<ProductionBoundaryResult<{ checkoutUrl: string; sessionId: string }>> {
  if (!config.waffoMerchantId || !config.waffoPrivateKey || !config.waffoProductId || !config.appUrl) {
    return {
      ok: false,
      status: 503,
      message: 'Production Waffo Checkout is not configured.',
    }
  }

  const appUrl = config.appUrl.replace(/\/$/, '')
  // StarRank amounts are integer CNY cents; Waffo takes a display string ("12.34").
  const amountYuan = (input.amountCents / 100).toFixed(2)
  const body = JSON.stringify({
    productId: config.waffoProductId,
    currency: 'CNY',
    productType: 'onetime',
    language: 'zh-Hans',
    darkMode: true,
    successUrl: `${appUrl}/receipts/${input.intentId}`,
    orderMerchantExternalId: input.intentId.slice(0, 128),
    // The metadata key `youbid_intent_id` is kept to match in-flight and already
    // recorded Waffo orders; the webhook reads this exact field to map back to an intent.
    metadata: {
      youbid_intent_id: input.intentId,
      purchase_kind: input.takeover ? 'takeover' : 'rank',
    },
    priceSnapshot: {
      amount: amountYuan,
      taxCategory: 'digital_goods',
    },
  })
  const path = '/v1/actions/checkout/create-session'
  const auth = await waffoSignHeaders('POST', path, body, {
    merchantId: config.waffoMerchantId,
    privateKey: config.waffoPrivateKey,
  })

  let response: Response
  try {
    response = await fetch(`${WAFFO_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body,
    })
  } catch (error) {
    console.error('waffo checkout session create failed', {
      intentId: input.intentId,
      message: error instanceof Error ? error.message : String(error),
    })
    return {
      ok: false,
      status: 502,
      message: 'Waffo Checkout is unavailable right now. Nothing was charged — try again.',
    }
  }

  let payload: WaffoSessionResponse
  try {
    payload = (await response.json()) as WaffoSessionResponse
  } catch {
    return { ok: false, status: 502, message: 'Waffo returned a malformed response.' }
  }

  if (!response.ok || !payload.data?.checkoutUrl) {
    const message = payload.errors?.[0]?.message ?? `HTTP ${response.status}`
    console.error('waffo checkout rejected', { intentId: input.intentId, status: response.status, message })
    return {
      ok: false,
      status: response.status === 401 ? 503 : 502,
      message: 'Waffo Checkout is unavailable right now. Nothing was charged — try again.',
    }
  }

  return {
    ok: true,
    value: { checkoutUrl: payload.data.checkoutUrl, sessionId: payload.data.sessionId ?? '' },
  }
}

// ---------- Webhook verification (RSA-SHA256 JSON envelope) ----------
// X-Waffo-Signature: "t=<ms>,v1=<base64 sig over `${t}.${rawBody}`>"

function parseSignatureHeader(header: string): { t?: string; v1?: string } {
  const parts: Record<string, string> = {}
  for (const pair of header.split(',')) {
    const [key, ...rest] = pair.split('=')
    parts[key.trim()] = rest.join('=').trim()
  }
  return { t: parts['t'], v1: parts['v1'] }
}

export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  publicKeyPem: string,
): Promise<boolean> {
  const { t, v1 } = parseSignatureHeader(signatureHeader)
  if (!t || !v1) return false
  const toleranceMs = 5 * 60 * 1000
  if (Math.abs(Date.now() - Number(t)) > toleranceMs) return false
  const key = await importWaffoPublicKey(publicKeyPem)
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    new Uint8Array(atob(v1).split('').map((c) => c.charCodeAt(0))),
    new TextEncoder().encode(`${t}.${rawBody}`),
  )
}

interface WaffoEnvelope {
  id?: string
  eventId?: string
  eventType?: string
  timestamp?: string
  storeId?: string
  mode?: string
  data?: {
    orderId?: string
    orderStatus?: string
    currency?: string
    amount?: string
    subtotal?: string
    total?: string
    orderMetadata?: Record<string, unknown>
    orderMerchantExternalId?: string
    paymentStatus?: string
    eventType?: never
  }
}

export async function verifyWaffoWebhookEvent(
  request: Request,
  config: ProductionConfig,
): Promise<ProductionBoundaryResult<WaffoWebhookResult>> {
  if (!config.waffoWebhookPublicKey) {
    return { ok: false, status: 503, message: 'Waffo webhook verification is not configured.' }
  }

  const signatureHeader = request.headers.get('x-waffo-signature')
  if (!signatureHeader) return { ok: false, status: 400, message: 'Missing X-Waffo-Signature header.' }

  const rawBody = await request.text()
  const valid = await verifyWebhookSignature(rawBody, signatureHeader, config.waffoWebhookPublicKey)
  if (!valid) return { ok: false, status: 401, message: 'Invalid Waffo webhook signature.' }

  let envelope: WaffoEnvelope
  try {
    envelope = JSON.parse(rawBody) as WaffoEnvelope
  } catch {
    return { ok: false, status: 400, message: 'Waffo webhook body must be JSON.' }
  }

  const eventId = envelope.eventId ?? envelope.id ?? ''
  const eventType = envelope.eventType ?? ''
  const payloadHash = await sha256Hex(rawBody)

  // Only settle fully paid one-time orders.
  if (
    eventType === 'order.completed' &&
    envelope.data?.orderStatus === 'completed' &&
    envelope.data.paymentStatus === 'succeeded'
  ) {
    const intentId =
      (typeof envelope.data.orderMetadata?.youbid_intent_id === 'string'
        ? envelope.data.orderMetadata.youbid_intent_id
        : null) ??
      envelope.data.orderMerchantExternalId ??
      ''
    if (!intentId) {
      return { ok: false, status: 409, message: 'Waffo order carries no StarRank intent reference.' }
    }
    const snapshot: PaidWebhookSnapshot = {
      eventId,
      payloadHash,
      providerOrderId: envelope.data.orderId ?? eventId,
      intentId,
      principalPaidCents: Math.round(Number.parseFloat(envelope.data.total ?? envelope.data.amount ?? '0') * 100),
      principalRefundedCents: 0,
      occurredAt: envelope.timestamp ?? new Date().toISOString(),
      eventType,
    }
    return { ok: true, value: { kind: 'paid', snapshot } }
  }

  if (eventType.startsWith('refund.')) {
    const data = envelope.data as WaffoEnvelope['data'] & {
      refundAmountCents?: number
    }
    const snapshot: RefundWebhookSnapshot = {
      eventId,
      payloadHash,
      providerOrderId: data.orderId ?? eventId,
      principalPaidCents: Math.round(Number.parseFloat(data.amount ?? '0') * 100),
      // `amount` on refund events is the refunded sum per the docs.
      principalRefundedCents: Math.round(Number.parseFloat(data.amount ?? '0') * 100),
      occurredAt: envelope.timestamp ?? new Date().toISOString(),
      eventType,
    }
    void data.refundAmountCents
    return { ok: true, value: { kind: 'refund', snapshot } }
  }

  return { ok: true, value: { kind: 'ignored', eventId, payloadHash, eventType } }
}
