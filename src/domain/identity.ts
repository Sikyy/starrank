export type PlatformId =
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'douyin'
  | 'youtube'
  | 'rednote'
  | 'weibo'

export interface PlatformMeta {
  id: PlatformId
  label: string
  /** Shown in the input placeholder when selected — documents the exact ID format. */
  placeholder: string
  profileHost: string
}

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  x: { id: 'x', label: 'X', placeholder: '@用户名（字母/数字/下划线）', profileHost: 'x.com' },
  instagram: { id: 'instagram', label: 'Instagram', placeholder: '@用户名（字母/数字/._）', profileHost: 'instagram.com' },
  tiktok: { id: 'tiktok', label: 'TikTok', placeholder: '@用户名（如 @starrank）', profileHost: 'tiktok.com' },
  douyin: { id: 'douyin', label: '抖音', placeholder: '粘贴主页分享链接（或数字 UID）', profileHost: 'douyin.com' },
  youtube: { id: 'youtube', label: 'YouTube', placeholder: '@频道名', profileHost: 'youtube.com' },
  rednote: {
    id: 'rednote',
    label: '小红书',
    // Verified: profile URLs only resolve with the 24-hex user UID found in
    // the share link, NOT the 小红书号 (nickname/search handle).
    placeholder: '粘贴主页分享链接（含 24 位 UID）',
    profileHost: 'xiaohongshu.com',
  },
  weibo: {
    id: 'weibo',
    label: '微博',
    // Weibo blocks server-side reads (visitor wall); numeric UID links still
    // work for visitors, so we accept the UID but skip metadata scraping.
    placeholder: '粘贴主页链接（weibo.com/u/数字）',
    profileHost: 'weibo.com',
  },
}

export const PLATFORM_LIST = Object.values(PLATFORMS)

export interface ProductIdentity {
  canonicalKey: string
  display: string
  targetUrl: string
}

export type IdentityResult =
  | { ok: true; identity: ProductIdentity }
  | { ok: false; message: string }

const HANDLE_BODY = /^[a-zA-Z0-9_.]{1,30}$/
const HANDLE_PATTERN = /^@([a-zA-Z0-9_.]{1,30})$/
const X_HOSTS = new Set(['x.com', 'twitter.com'])
const IG_HOSTS = new Set(['instagram.com', 'instagr.am'])
const TIKTOK_HOSTS = new Set(['tiktok.com'])
const DOUYIN_HOSTS = new Set(['douyin.com', 'iesdouyin.com'])
const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtu.be'])
const REDNOTE_HOSTS = new Set(['xiaohongshu.com', 'xhslink.com'])
const WEIBO_HOSTS = new Set(['weibo.com', 'm.weibo.cn'])
const X_RESERVED = new Set([
  'home',
  'explore',
  'search',
  'i',
  'settings',
  'compose',
  'intent',
  'share',
  'tos',
  'privacy',
  'login',
  'signup',
  'notifications',
  'messages',
])
const BLOCKED_HOSTS = new Set([
  't.me',
  'telegram.me',
  'telegram.dog',
  'discord.gg',
  'discord.com',
  'discordapp.com',
  'chat.whatsapp.com',
])

/**
 * Parse an input value against a chosen platform.
 * `platform` may be null — the value is then auto-detected (URLs always work;
 * a bare @handle falls back to X for backward compatibility).
 */
export function normalizeIdentity(rawValue: string, platform: PlatformId | null): IdentityResult {
  const value = rawValue.trim()
  if (!value) return { ok: false, message: '请填写账号或链接。' }

  const tagged = HANDLE_PATTERN.exec(value)
  const bareHandle = !tagged && HANDLE_BODY.test(value) && !value.includes('.')

  // Handle-style inputs resolve through the selected platform.
  if ((tagged || bareHandle) && platform) {
    return handleIdentity(platform, tagged ? tagged[1] : value)
  }
  if (tagged) return handleIdentity('x', tagged[1])
  if (bareHandle && platform === null) return handleIdentity('x', value)

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return { ok: false, message: '请输入有效的公开网址或账号。' }
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) {
    return { ok: false, message: '请输入有效的公开 http(s) 网址。' }
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  if (BLOCKED_HOSTS.has(hostname)) {
    return { ok: false, message: '不接受邀请链接。请使用主页网址或账号。' }
  }

  const socialHandle = handleFromSocialUrl(hostname, url.pathname)
  if (socialHandle) return socialHandle

  url.hash = ''
  url.search = ''
  url.hostname = hostname
  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')
  url.pathname = path || '/'

  return {
    ok: true,
    identity: {
      canonicalKey: `url:${hostname}${path}`,
      display: hostname,
      targetUrl: url.toString(),
    },
  }
}

/** Canonical key prefix per platform so identities never collide across platforms. */
function handleIdentity(platform: PlatformId, rawHandle: string): IdentityResult {
  const meta = PLATFORMS[platform]
  const normalizedHandle = rawHandle.replace(/^@/, '').toLowerCase()

  // Douyin sec_uid (from share links) is MS4wLjAB… base64 and is the stable ID.
  if (platform === 'douyin' && /^ms4wljab[a-z0-9_-]{20,}$/.test(normalizedHandle)) {
    return {
      ok: true,
      identity: {
        canonicalKey: 'douyin:' + normalizedHandle,
        display: `抖音 ${normalizedHandle.slice(0, 12)}…`,
        targetUrl: `https://www.douyin.com/user/${normalizedHandle}`,
      },
    }
  }

  if (!HANDLE_BODY.test(normalizedHandle)) {
    return { ok: false, message: `${meta.label} 的账号格式不正确。` }
  }
  // UID-based platforms only accept numeric IDs (verified against real profiles).
  if ((platform === 'douyin' || platform === 'weibo') && !/^\d{5,32}$/.test(normalizedHandle)) {
    return {
      ok: false,
      message:
        platform === 'douyin'
          ? '抖音需要数字 UID 或主页分享链接。App 内点「分享 → 复制链接」后直接粘贴即可。'
          : `${meta.label} 需要数字 UID（在个人主页链接里），不是昵称。`,
    }
  }
  let targetUrl: string
  switch (platform) {
    case 'youtube':
      targetUrl = `https://www.youtube.com/@${normalizedHandle}`
      break
    case 'douyin':
      targetUrl = `https://www.douyin.com/user/${normalizedHandle}`
      break
    case 'rednote':
      targetUrl = `https://www.xiaohongshu.com/user/profile/${normalizedHandle}`
      break
    case 'weibo':
      targetUrl = `https://weibo.com/u/${normalizedHandle}`
      break
    default:
      targetUrl = `https://${meta.profileHost}/${normalizedHandle}`
  }
  return {
    ok: true,
    identity: {
      canonicalKey: `${platform}:${normalizedHandle}`,
      display: platform === 'x' ? `@${normalizedHandle}` : `${meta.label} @${normalizedHandle}`,
      targetUrl,
    },
  }
}

/** Detect and convert a pasted social profile URL into its platform identity. */
function handleFromSocialUrl(hostname: string, pathname: string): IdentityResult | null {
  const segment = pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '') ?? ''
  if (X_HOSTS.has(hostname)) {
    if (!segment || X_RESERVED.has(segment.toLowerCase())) return null
    return handleIdentity('x', segment)
  }
  if (IG_HOSTS.has(hostname)) {
    if (!segment) return null
    return handleIdentity('instagram', segment)
  }
  if (TIKTOK_HOSTS.has(hostname)) {
    if (!segment) return null
    return handleIdentity('tiktok', segment)
  }
  if (DOUYIN_HOSTS.has(hostname)) {
    // douyin.com/user/<id> or iesdouyin.com/share/user/<sec_uid>
    const segments = pathname.split('/').filter(Boolean)
    const uid = (segments[0] === 'share' ? segments[2] : segments[1]) ?? segment
    if (!uid) return null
    return handleIdentity('douyin', uid)
  }
  if (REDNOTE_HOSTS.has(hostname)) {
    // xiaohongshu.com/user/profile/<24-hex UID>
    const uid = pathname.split('/').filter(Boolean)[2] ?? ''
    if (!uid || !/^[0-9a-f]{24}$/.test(uid)) return null
    return handleIdentity('rednote', uid)
  }
  if (WEIBO_HOSTS.has(hostname)) {
    // weibo.com/u/<numeric UID>
    const uid = pathname.split('/').filter(Boolean)[1] ?? ''
    if (pathname.split('/').filter(Boolean)[0] !== 'u' || !/^\d+$/.test(uid)) return null
    return handleIdentity('weibo', uid)
  }
  if (YOUTUBE_HOSTS.has(hostname)) {
    const channel = pathname.split('/').filter(Boolean).join('/')
    if (!channel.startsWith('@')) return null
    return handleIdentity('youtube', channel.slice(1))
  }
  return null
}

export function sponsoredUrl(targetUrl: string): string {
  const url = new URL(targetUrl)
  url.searchParams.set('utm_source', 'starrank')
  return url.toString()
}

export function identityFromCanonical(canonicalKey: string): ProductIdentity | null {
  const legacyX = /^x:([a-z0-9_]{1,30})$/.exec(canonicalKey)
  if (legacyX) {
    return {
      canonicalKey,
      display: `@${legacyX[1]}`,
      targetUrl: `https://x.com/${legacyX[1]}`,
    }
  }
  for (const meta of PLATFORM_LIST) {
    const pattern = new RegExp(`^${meta.id}:([a-z0-9_.]{1,30})$`)
    const match = pattern.exec(canonicalKey)
    if (match) {
      const result = handleIdentity(meta.id, match[1])
      if (result.ok) return result.identity
    }
  }
  const urlMatch = /^url:([^/]+)(.*)$/.exec(canonicalKey)
  if (!urlMatch) return null
  const hostname = urlMatch[1]
  const path = urlMatch[2] ?? ''
  return {
    canonicalKey,
    display: hostname,
    targetUrl: `https://${hostname}${path || '/'}`,
  }
}
