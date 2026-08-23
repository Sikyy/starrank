import { BID_STEP_CENTS } from './money.ts'
import { listingContribution, type ListingRecord } from './records.ts'

export const DAILY_DECAY = 1
export const DECAY_FLOOR_CENTS = 0
export const MS_PER_DAY = 86_400_000

// StarRank uses outbid-style static amounts: what you paid is what shows.
// The decay helpers below are kept as identity functions so the settlement,
// receipt, and reservation pipelines stay untouched.

const NEVER_DROPS_OFF = '9999-12-31T23:59:59.000Z'

export function decayedBalance(contributionCents: number, _settledAt: string, _nowIso: string): number {
  return snapDecayCents(contributionCents)
}

export function dropsOffAt(_contributionCents: number, _settledAt: string): string {
  // Far-future sentinel: listings never decay off the board.
  return NEVER_DROPS_OFF
}

export function toppedUpDropsOffAt(currentDropsOffAt: string, deltaCents: number, nowIso: string): string {
  return currentDropsOffAt || dropsOffAt(deltaCents, nowIso)
}

export function listingStanding(listing: ListingRecord, _nowIso: string): number {
  return snapDecayCents(listingContribution(listing))
}

export function listingDropsOffAt(_listing: ListingRecord): string {
  return NEVER_DROPS_OFF
}

function snapDecayCents(cents: number): number {
  return Math.max(0, Math.round(cents / BID_STEP_CENTS) * BID_STEP_CENTS)
}
