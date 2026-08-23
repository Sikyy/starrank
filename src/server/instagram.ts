// Instagram profile lookup via SearchAPI.io.
// Instagram blocks Cloudflare Worker egress, so we can't hit Instagram directly.
// SearchAPI runs the fetch from its own (non-Cloudflare) infrastructure and
// returns the profile's public info. Caller provides the SearchAPI key from the
// SEARCHAPI_API_KEY secret; if it's missing or the call fails we return null and
// the caller falls back to a platform-letter tile (no broken image).

const SEARCHAPI_URL = 'https://www.searchapi.io/api/v1/search'

export interface InstagramUser {
  username: string
  fullName: string
  biography: string
  avatarUrl: string | null
}

/** Resolve an Instagram profile by username via SearchAPI. Null on failure. */
export async function lookupInstagramUser(username: string, apiKey?: string): Promise<InstagramUser | null> {
  if (!username || !apiKey) return null
  const params = new URLSearchParams({
    engine: 'instagram_profile',
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

  return {
    username: typeof p.username === 'string' ? p.username : username,
    fullName: typeof p.name === 'string' ? p.name : '',
    biography: typeof p.bio === 'string' ? p.bio : '',
    avatarUrl:
      (typeof p.avatar_hd === 'string' ? p.avatar_hd : null) ??
      (typeof p.avatar === 'string' ? p.avatar : null),
  }
}
