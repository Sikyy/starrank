import type { PlatformId } from './identity.ts'

/**
 * Resolve the best available avatar URL for a social identity.
 *
 * Verified sources (2026-08):
 * - tiktok:     profile HTML is WAF-protected server-side; unavatar.io/tiktok
 *               returns the real avatar (tested: NASA logo).
 * - youtube:    unavatar.io/youtube/@handle works.
 * - instagram:  unavatar is rate-limited (403) — but our server-side scrape
 *               reads og:image directly from the profile page (scontent CDN),
 *               so the resolve endpoint fills imageUrl itself.
 * - x:          unavatar.io/twitter works; our scrape also gets og:image.
 * - douyin / weibo / rednote: login-walled, no public avatar source → null
 *               (board falls back to favicon or letter tile).
 */
export function avatarUrlForIdentity(platform: PlatformId, handle: string): string | null {
  switch (platform) {
    case 'x':
      // X blocks most scrapers; unavatar has dedicated access.
      return `https://unavatar.io/twitter/${encodeURIComponent(handle)}?fallback=false`
    case 'tiktok':
      return `https://unavatar.io/tiktok/${encodeURIComponent(handle)}?fallback=false`
    case 'youtube':
      return `https://unavatar.io/youtube/${encodeURIComponent(handle.replace(/^@/, ''))}?fallback=false`
    default:
      // instagram + others: resolved via og:image scrape at /api/resolve time.
      return null
  }
}

/** True when the canonical key is a social handle (x:/instagram:/tiktok:/youtube:). */
export function isSocialCanonical(canonicalKey: string): boolean {
  return /^(x|instagram|tiktok|douyin|youtube|rednote|weibo):/.test(canonicalKey)
}
