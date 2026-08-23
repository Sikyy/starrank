export interface RankableListing {
  id: string
  amountCents: number
  settledAt: string
}

/**
 * outbid-style ranking: pure accumulated amount, highest first. Ties break to
 * the most recent settlement (last payer leads), then by id for stability.
 */
export function rankListings<T extends RankableListing>(listings: readonly T[]): T[] {
  return [...listings].sort(
    (left, right) =>
      right.amountCents - left.amountCents ||
      right.settledAt.localeCompare(left.settledAt) ||
      left.id.localeCompare(right.id),
  )
}

export function projectedRank(
  amountCents: number,
  listings: readonly RankableListing[],
): number {
  return listings.filter((listing) => listing.amountCents >= amountCents).length + 1
}
