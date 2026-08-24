// TikTok profile lookup via SearchAPI.io.
// We use it to fill the display name and bio (the avatar still comes from
// unavatar, which already works for TikTok without hotlink issues). Fails to
// null so the caller falls back to a letter tile / manual entry.

const SEARCHAPI_URL = 'https://www.searchapi.io/api/v1/search'

export interface TikTokUser {
  username: string
  fullName: string
  bio: string
}

/** Resolve a TikTok profile by handle via SearchAPI. Null on failure. */
export async function lookupTikTokUser(username: string, apiKey?: string): Promise<TikTokUser | null> {
  if (!username || !apiKey) return null
  const params = new URLSearchParams({
    engine: 'tiktok_profile',
    username,
    api_key: apiKey,
  })

  let response: Response
  try {
    response = await fetch(`${SEARCHAPI_URL}?${params.toString()}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  let payload: { profile?: Record<string, unknown> }
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    return null
  }
  const p = payload.profile
  if (!p || typeof p !== 'object') return null

  const fullName = (typeof p.name === 'string' ? p.name : '') || (typeof p.nickname === 'string' ? p.nickname : '')
  const bio = typeof p.bio === 'string' ? p.bio : ''
  if (!fullName && !bio) return null

  return {
    username: typeof p.username === 'string' ? p.username : username,
    fullName,
    bio,
  }
}
