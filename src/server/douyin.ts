// Douyin public profile lookup.
// `https://www.douyin.com/web/api/v2/user/info/` accepts `unique_id` (the 抖音号)
// or `sec_uid` and returns the account's public info (nickname, signature,
// avatar, and the stable sec_uid) without login. We use it to resolve a bare
// 抖音号 to its profile and to fill in metadata the share link alone can't give.

const WEB_API = 'https://www.douyin.com/web/api/v2/user/info/'
const SEC_UID_RE = /^MS4wLjAB[A-Za-z0-9_-]{20,}$/

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

export interface DouyinUser {
  secUid: string
  uniqueId: string
  nickname: string
  signature: string
  avatarUrl: string | null
}

export function isDouyinSecUid(id: string): boolean {
  return SEC_UID_RE.test(id)
}

/** Resolve a Douyin account by its 抖音号 (unique_id) or sec_uid. */
export async function lookupDouyinUser(params: {
  uniqueId?: string
  secUid?: string
}): Promise<DouyinUser | null> {
  const qs = new URLSearchParams()
  if (params.uniqueId) qs.set('unique_id', params.uniqueId)
  else if (params.secUid) qs.set('sec_uid', params.secUid)
  else return null

  let response: Response
  try {
    response = await fetch(`${WEB_API}?${qs.toString()}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': UA,
        referer: 'https://www.douyin.com/',
      },
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  let payload: { user_info?: Record<string, unknown> }
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    return null
  }
  const u = payload.user_info
  if (!u || typeof u !== 'object') return null

  const secUid = typeof u.sec_uid === 'string' ? u.sec_uid : ''
  if (!secUid) return null
  const avatarObj = (u.avatar_thumb ?? u.avatar_medium ?? u.avatar_larger) as
    | { url_list?: unknown[] }
    | undefined
  const avatarUrl = Array.isArray(avatarObj?.url_list) && typeof avatarObj.url_list[0] === 'string'
    ? avatarObj.url_list[0]
    : null

  return {
    secUid,
    uniqueId: typeof u.unique_id === 'string' ? u.unique_id : params.uniqueId ?? secUid,
    nickname: typeof u.nickname === 'string' ? u.nickname : '',
    signature: typeof u.signature === 'string' ? u.signature : '',
    avatarUrl,
  }
}
