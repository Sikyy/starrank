// Xiaohongshu (小红书) profile lookup via rnote.dev.
// Cloudflare Worker egress can't reach xiaohongshu.com, so we use the rnote.dev
// crawler API (a separate, non-Cloudflare service) to fetch a user's public
// nickname, bio, and avatar. The caller passes the API key from the XHS_API_KEY
// secret; on any failure we return null and fall back to a platform-letter tile.

const RNOTE_URL = 'https://rnote.dev/api/v2/crawler/user/info'

export interface XiaohongshuUser {
  userId: string
  nickname: string
  description: string
  avatarUrl: string | null
}

/** Resolve a Xiaohongshu profile by its 24-hex user_id. Null on failure. */
export async function lookupXiaohongshuUser(userId: string, apiKey?: string): Promise<XiaohongshuUser | null> {
  if (!userId || !apiKey) return null
  const url = `${RNOTE_URL}?user_id=${encodeURIComponent(userId)}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  let payload: { data?: { data?: Record<string, unknown> } }
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    return null
  }
  const data = payload.data?.data
  if (!data || typeof data !== 'object') return null
  const nickname = typeof data.nickname === 'string' ? data.nickname : ''
  if (!nickname) return null

  return {
    userId: typeof data.userid === 'string' ? data.userid : userId,
    nickname,
    description: typeof data.desc === 'string' ? data.desc : '',
    avatarUrl:
      (typeof data.imageb === 'string' ? data.imageb : null) ??
      (typeof data.images === 'string' ? data.images : null),
  }
}
