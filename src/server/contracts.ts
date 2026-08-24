import type { PlatformId } from '../domain/identity.ts'
import type { Category } from '../domain/category.ts'

export interface ProductionConfig {
  appUrl?: string
  stripeSecretKey?: string
  stripeWebhookSecret?: string
  waffoMerchantId?: string
  waffoPrivateKey?: string
  waffoProductId?: string
  waffoWebhookPublicKey?: string
  turnstileSecret?: string
  turnstileSiteKey?: string
  ownerCookieSecret?: string
  /** SearchAPI.io key for profile lookups that Cloudflare egress can't reach. */
  searchApiKey?: string
  /** rnote.dev API key for Xiaohongshu profile lookups. */
  xhsApiKey?: string
}

export interface CheckoutRequest {
  requestId: string
  intentId: string
  amountCents: number
  canonicalIdentity: string
  takeover: boolean
  turnstileToken: string
}

export type ProductionBoundaryResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 401 | 409 | 501 | 502 | 503; message: string }

export interface PaidWebhookSnapshot {
  eventId: string
  payloadHash: string
  providerOrderId: string
  intentId: string
  principalPaidCents: number
  principalRefundedCents: number
  occurredAt: string
  eventType: string
}

export interface RefundWebhookSnapshot {
  eventId: string
  payloadHash: string
  providerOrderId: string
  principalPaidCents: number
  principalRefundedCents: number
  occurredAt: string
  eventType: string
}

export type StripeWebhookResult =
  | { kind: 'paid'; snapshot: PaidWebhookSnapshot }
  | { kind: 'refund'; snapshot: RefundWebhookSnapshot }
  | { kind: 'ignored'; eventId: string; payloadHash: string; eventType: string }

export type WaffoWebhookResult = StripeWebhookResult

export interface ParsedCheckoutBody {
  requestId: string
  amountCents: number
  identityInput: string
  platform: PlatformId | null
  title: string
  description: string
  imageUrl: string | null
  takeover: boolean
  turnstileToken: string
  category: Category
}

export interface PublicCheckoutConfig {
  mode: 'mock' | 'stripe' | 'waffo' | 'unavailable'
  turnstileSiteKey: string | null
}
