import type { Listing } from '../data/listings'
import { listingStanding } from './decay.ts'
import { faviconUrlForTarget } from './favicon.ts'
import { type ListingRecord, type TakeoverRecord } from './records.ts'

export const BOARD_PAGE_SIZE = 50

export interface TakeoverSlot {
  amountCents: number
  display: string
  href: string
  endsAt: string
}

export interface BoardPage<T> {
  page: number
  pageCount: number
  takeover: TakeoverSlot | null
  listings: T[]
  firstRank: number
}

/**
 * An active takeover owns its own page ahead of the listing pages rather than
 * replacing page one, so paid listings stay reachable while a takeover runs.
 */
export function boardPage<T>(input: {
  listings: readonly T[]
  takeover: TakeoverSlot | null
  requestedPage: number
}): BoardPage<T> {
  const takeoverPages = input.takeover ? 1 : 0
  const listingPages = Math.max(1, Math.ceil(input.listings.length / BOARD_PAGE_SIZE))
  const pageCount = takeoverPages + listingPages
  const requested = Number.isFinite(input.requestedPage) ? Math.trunc(input.requestedPage) : 1
  const page = Math.min(Math.max(1, requested), pageCount)

  if (input.takeover && page === 1) {
    return { page, pageCount, takeover: input.takeover, listings: [], firstRank: 0 }
  }

  const offset = (page - 1 - takeoverPages) * BOARD_PAGE_SIZE
  return {
    page,
    pageCount,
    takeover: null,
    listings: input.listings.slice(offset, offset + BOARD_PAGE_SIZE),
    firstRank: offset + 1,
  }
}

export function ageLabel(settledAt: string, now: Date): string {
  const deltaMs = now.getTime() - Date.parse(settledAt)
  if (!Number.isFinite(deltaMs) || deltaMs < 45_000) return 'just now'
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function toPublicListing(
  listing: ListingRecord,
  clicks: number,
  now: Date,
): Listing {
  const nowIso = now.toISOString()
  return {
    id: listing.id,
    domain: listing.displayName,
    description: listing.description || 'Paid and verified on StarRank.',
    href: `/go/${listing.id}`,
    // Social identities never fall back to the platform favicon as their logo.
    // When they have no avatar we render a platform-initial tile instead.
    image: listing.imageUrl || (isSocialIdentity(listing.canonicalIdentity) ? letterTile(listing.canonicalIdentity) : faviconUrlForTarget(listing.targetUrl)),
    amountCents: listingStanding(listing, nowIso),
    settledAt: listing.settledAt ?? nowIso,
    age: listing.settledAt ? ageLabel(listing.settledAt, now) : 'just now',
    clicks,
  }
}

/** True when the listing is a social handle (x:/instagram:/tiktok:/…). */
export function isSocialIdentity(canonicalKey: string): boolean {
  return /^(x|instagram|tiktok|douyin|rednote|weibo):/.test(canonicalKey)
}

const PLATFORM_LETTERS: Record<string, string> = {
  x: 'X',
  instagram: 'IG',
  tiktok: 'TT',
  douyin: '抖音',
  rednote: 'RED',
  weibo: 'WB',
}

/** A tiny inline-SVG letter tile so the board never shows a platform favicon. */
function letterTile(canonicalKey: string): string {
  const platform = canonicalKey.split(':')[0]
  const letter = PLATFORM_LETTERS[platform] ?? (platform.charAt(0).toUpperCase() || 'S')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">` +
    `<rect width="56" height="56" rx="28" fill="#7c5cff"/>` +
    `<text x="28" y="35" font-family="-apple-system,sans-serif" font-weight="700" font-size="${letter.length > 2 ? 14 : 20}" fill="#fff" text-anchor="middle" dominant-baseline="middle">${letter}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function publicTakeover(
  takeover: TakeoverRecord | null,
  listing: ListingRecord | null,
  nowIso: string,
): TakeoverSlot | null {
  if (!takeover || !listing || takeover.status !== 'active' || takeover.endsAt <= nowIso) return null
  return {
    amountCents: listingStanding(listing, nowIso),
    display: listing.displayName,
    href: `/go/${listing.id}`,
    endsAt: takeover.endsAt,
  }
}

