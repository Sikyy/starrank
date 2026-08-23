import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createWaffoCheckout,
  verifyWebhookSignature,
  verifyWaffoWebhookEvent,
  waffoSignHeaders,
} from './waffo.ts'
import type { ProductionConfig } from './contracts.ts'

// Node webcrypto can export PKCS8/SPKI — same format Waffo uses (PEM).
const { publicKeyPem, privateKeyPem } = await (async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey)
  const spki = await crypto.subtle.exportKey('spki', pair.publicKey)
  const toPem = (der: ArrayBuffer, label: string) =>
    `-----BEGIN ${label}-----\n${btoa(String.fromCharCode(...new Uint8Array(der)))}\n-----END ${label}-----`
  return {
    publicKeyPem: toPem(spki, 'PUBLIC KEY'),
    privateKeyPem: toPem(pkcs8, 'PRIVATE KEY'),
  }
})()

test('waffo request signing produces verifiable RSA-SHA256 signatures', async () => {
  const body = JSON.stringify({ productId: 'PROD_test', currency: 'CNY' })
  const headers = await waffoSignHeaders('POST', '/v1/actions/checkout/create-session', body, {
    merchantId: 'MER_test',
    privateKey: privateKeyPem,
  })
  assert.equal(headers['X-Merchant-Id'], 'MER_test')
  assert.ok(headers['X-Timestamp'].match(/^\d+$/))
  assert.ok(headers['X-Signature'].length > 100)

  // Verify the signature round-trips through the canonical request.
  const canonical = `POST\n/v1/actions/checkout/create-session\n${headers['X-Timestamp']}\n${btoa(
    String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)))),
  )}`
  const key = await crypto.subtle.importKey(
    'spki',
    (() => {
      const b64 = publicKeyPem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '')
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes.buffer
    })(),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    new Uint8Array(atob(headers['X-Signature']).split('').map((c) => c.charCodeAt(0))),
    new TextEncoder().encode(canonical),
  )
  assert.equal(valid, true)
})

test('webhook signature verifies a signed envelope and rejects tampering', async () => {
  const rawBody = JSON.stringify({ eventId: 'PAY_1', eventType: 'order.completed' })
  const t = Date.now().toString()
  const key = await crypto.subtle.importKey(
    'pkcs8',
    (() => {
      const b64 = privateKeyPem.replace(/-----(BEGIN|END) (RSA )?PRIVATE KEY-----/g, '').replace(/\s+/g, '')
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes.buffer
    })(),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sign = async (payload: string) =>
    btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(payload)))))

  const goodHeader = `t=${t},v1=${await sign(`${t}.${rawBody}`)}`
  assert.equal(await verifyWebhookSignature(rawBody, goodHeader, publicKeyPem), true)

  // Tampered body
  assert.equal(await verifyWebhookSignature(rawBody + ' ', goodHeader, publicKeyPem), false)
  // Stale timestamp (> 5 min)
  const oldT = (Date.now() - 6 * 60 * 1000).toString()
  const staleHeader = `t=${oldT},v1=${await sign(`${oldT}.${rawBody}`)}`
  assert.equal(await verifyWebhookSignature(rawBody, staleHeader, publicKeyPem), false)
  // Missing parts
  assert.equal(await verifyWebhookSignature(rawBody, 'v1=abc', publicKeyPem), false)
})

function waffoRequest(envelope: unknown, body: string): Request {
  return new Request('https://youbid.lol/api/webhooks/waffo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Waffo-Signature': envelope ? '' : '',
    },
    body,
  })
}

test('order.completed maps to a paid snapshot with intent from metadata', async () => {
  const t = Date.now().toString()
  const envelope = {
    id: 'PAY_abc',
    eventId: 'PAY_abc',
    eventType: 'order.completed',
    timestamp: '2026-08-23T08:00:00.000Z',
    storeId: 'STO_1',
    mode: 'test',
    data: {
      orderId: 'ORD_1',
      orderStatus: 'completed',
      paymentStatus: 'succeeded',
      currency: 'CNY',
      amount: '12.34',
      total: '12.34',
      orderMetadata: { youbid_intent_id: 'intent-123' },
      paymentMethod: 'wechat',
    },
  }
  const rawBody = JSON.stringify(envelope)
  const key = await crypto.subtle.importKey(
    'pkcs8',
    (() => {
      const b64 = privateKeyPem.replace(/-----(BEGIN|END) (RSA )?PRIVATE KEY-----/g, '').replace(/\s+/g, '')
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes.buffer
    })(),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = btoa(
    String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${t}.${rawBody}`)))),
  )

  const config: ProductionConfig = { waffoWebhookPublicKey: publicKeyPem }
  const request = waffoRequest(envelope, rawBody)
  // Inject the real signature header.
  Object.defineProperty(request.headers, 'get', {
    value(name: string) {
      if (name.toLowerCase() === 'x-waffo-signature') return `t=${t},v1=${sig}`
      return null
    },
    configurable: true,
  })

  const result = await verifyWaffoWebhookEvent(request, config)
  assert.equal(result.ok, true)
  if (!result.ok || result.value.kind !== 'paid') throw new Error('expected paid event')
  assert.equal(result.value.snapshot.intentId, 'intent-123')
  assert.equal(result.value.snapshot.principalPaidCents, 1234)
  assert.equal(result.value.snapshot.providerOrderId, 'ORD_1')
  assert.equal(result.value.snapshot.eventType, 'order.completed')
})

test('createWaffoCheckout fails closed without configuration', async () => {
  const result = await createWaffoCheckout(
    {
      requestId: 'req_1',
      intentId: 'i-1',
      amountCents: 500,
      canonicalIdentity: 'url:x.com',
      takeover: false,
      turnstileToken: '',
    },
    {},
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.status, 503)
})
