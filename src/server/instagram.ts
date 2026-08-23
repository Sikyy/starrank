// Instagram public profile lookup.
// The web_profile_info endpoint returns a profile's public info (full name,
// biography, and avatar) for a username, using the well-known public app id.
// From a Cloudflare Worker this lets us fill in the display name, description,
// and avatar that a page scrape can't (Instagram blocks anonymous fetches).

const WEB_PROFILE_URL = 'https://www.instagram.com/api/v1/users/web_profile_info/'
const IG_APP_ID = '936619743392459'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface InstagramUser {
  username: string
  fullName: string
  biography: string
  avatarUrl: string | null
  isPrivate: boolean
}

/** Resolve an Instagram profile by username (handle). Returns null on failure. */
export async function lookupInstagramUser(username: string): Promise<InstagramUser | null> {
  if (!username) return null
  let response: Response
  try {
    response = await fetch(`${WEB_PROFILE_URL}?username=${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': UA,
        'x-ig-app-id': IG_APP_ID,
      },
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  let payload: { data?: { user?: Record<string, unknown> } }
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    return null
  }
  const u = payload.data?.user
  if (!u || typeof u !== 'object') return null

  return {
    username: typeof u.username === 'string' ? u.username : username,
    fullName: typeof u.full_name === 'string' ? u.full_name : '',
    biography: typeof u.biography === 'string' ? u.biography : '',
    avatarUrl:
      (typeof u.profile_pic_url_hd === 'string' ? u.profile_pic_url_hd : null) ??
      (typeof u.profile_pic_url === 'string' ? u.profile_pic_url : null),
    isPrivate: Boolean(u.is_private),
  }
}
