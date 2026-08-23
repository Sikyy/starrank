export const CENTS_PER_YUAN = 100
// outbid-style static ranking: amounts never decay. The minimum bid only gates
// entry, so it can be raised without rewriting any stored timestamps.
export const MINIMUM_BID_CENTS = 1000
export const BID_STEP_CENTS = 100
export const TAKEOVER_OPEN_MULTIPLE = 4
export const TAKEOVER_FLOOR_NUMERATOR = 6
export const TAKEOVER_FLOOR_DENOMINATOR = 5
export const TAKEOVER_FALL_MS = 24 * 60 * 60 * 1000

export function yuanToCents(yuan: number): number {
  if (!Number.isFinite(yuan)) return MINIMUM_BID_CENTS
  return snapToBidStep(Math.round(yuan * CENTS_PER_YUAN))
}

export function centsToWholeYuan(cents: number): number {
  return Math.round(cents / CENTS_PER_YUAN)
}

export function isValidBidCents(cents: number): boolean {
  return Number.isInteger(cents) && cents >= MINIMUM_BID_CENTS && cents % BID_STEP_CENTS === 0
}

export function formatCny(cents: number): string {
  const showCents = cents % CENTS_PER_YUAN !== 0
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(cents / CENTS_PER_YUAN)
}

export function takeoverIdleMs(nowIso: string, lastEndedAtIso: string | null): number {
  if (!lastEndedAtIso) return 0
  const idle = Date.parse(nowIso) - Date.parse(lastEndedAtIso)
  return Number.isFinite(idle) ? Math.max(0, idle) : 0
}

export function takeoverPrice(leaderAmountCents: number, idleMs: number): number {
  const open = snapToBidStep(leaderAmountCents * TAKEOVER_OPEN_MULTIPLE)
  const floor = snapToBidStep(
    Math.ceil((leaderAmountCents * TAKEOVER_FLOOR_NUMERATOR) / TAKEOVER_FLOOR_DENOMINATOR),
  )
  const span = open - floor
  if (span <= 0) return open
  const progress = Math.min(1, Math.max(0, idleMs / TAKEOVER_FALL_MS))
  return snapToBidStep(open - span * progress)
}

export function snapToBidStep(cents: number): number {
  return Math.max(MINIMUM_BID_CENTS, Math.round(cents / BID_STEP_CENTS) * BID_STEP_CENTS)
}

export function amountToClaim(amountCents: number): number {
  return Math.max(MINIMUM_BID_CENTS, amountCents + BID_STEP_CENTS)
}
