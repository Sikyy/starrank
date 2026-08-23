import type { PlatformId } from './identity.ts'

/**
 * Per-platform avatar provider + the unique-ID shape each platform uses.
 *
 * Sources verified live from the deployed Cloudflare Worker egress (2026-08-23):
 *   - X / TikTok / YouTube → unavatar.io avatars (free tier, works from Workers)
 *   - Instagram            → unavatar instagram needs a paid plan → rely on the
 *                            user's manual image URL as fallback
 *   - 抖音 / 小红书 / 微博  → 平台对 CF Worker 出口返回反爬壳 / 登录墙，无
 *                            anonymous avatar source → manual entry
 * The platforms' own JSON APIs (IG web_profile_info, douyin web/api) also 401
 * from CF egress. So only unavatar-backed platforms get real avatars.
 */
export interface PlatformLookup {
  /** The unique, immutable identifier users should enter. */
  idType: 'handle' | 'uid' | 'sec_uid' | 'nil'
  /** Human guide shown in the placeholder. */
  idHint: string
  /** Deterministic public avatar URL — only set where a free, Worker-reachable
   * source exists. */
  avatar?: (id: string) => string
}

export const PLATFORM_LOOKUP: Record<PlatformId, PlatformLookup> = {
  x: {
    idType: 'handle',
    idHint: '@用户名（唯一）',
    avatar: (id) => `https://unavatar.io/twitter/${encodeURIComponent(id)}?fallback=false`,
  },

  instagram: {
    idType: 'handle',
    idHint: '@用户名（唯一）',
    // unavatar/instagram is paid-only; no free anonymous source from Workers.
  },

  tiktok: {
    idType: 'handle',
    idHint: '@用户名（唯一）',
    avatar: (id) => `https://unavatar.io/tiktok/${encodeURIComponent(id)}?fallback=false`,
  },

  youtube: {
    idType: 'handle',
    idHint: '@频道名（唯一）',
    avatar: (id) => `https://unavatar.io/youtube/${encodeURIComponent(id.replace(/^@/, ''))}?fallback=false`,
  },

  douyin: {
    idType: 'sec_uid',
    idHint: 'App 内「分享→复制链接」直接粘贴',
  },

  rednote: {
    idType: 'uid',
    idHint: '粘贴主页分享链接（含24位UID；小红书号不行）',
  },

  weibo: {
    idType: 'uid',
    idHint: '粘贴 weibo.com/u/数字 链接（昵称不是ID）',
  },
}

/** True when the canonical key names a social handle identity. */
export function isSocialCanonical(canonicalKey: string): boolean {
  return /^(x|instagram|tiktok|douyin|youtube|rednote|weibo):/.test(canonicalKey)
}

/** The platform id from a canonical key `<platform>:<id>`. */
export function platformFromCanonical(canonicalKey: string): { platform: PlatformId; id: string } | null {
  const idx = canonicalKey.indexOf(':')
  if (idx === -1) return null
  return { platform: canonicalKey.slice(0, idx) as PlatformId, id: canonicalKey.slice(idx + 1) }
}

/** A stable avatar URL when the platform has a direct public source. */
export function staticAvatarUrl(platform: PlatformId, id: string): string | null {
  return PLATFORM_LOOKUP[platform]?.avatar?.(id) ?? null
}
