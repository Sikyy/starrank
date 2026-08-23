import { createFileRoute } from '@tanstack/react-router'

import { faviconUrlForTarget } from '../domain/favicon.ts'
import { PLATFORMS, normalizeIdentity, type PlatformId } from '../domain/identity.ts'
import { staticAvatarUrl } from '../domain/avatar.ts'
import { completeListingMetadata } from '../domain/listing-metadata.ts'
import { allowResolve, readProductionConfig } from '../server/env.ts'
import { scrapePublicUrl } from '../server/scrape.ts'
import { extractShareTarget } from '../server/share-input.ts'
import { isDouyinSecUid, lookupDouyinUser } from '../server/douyin.ts'
import { lookupInstagramUser } from '../server/instagram.ts'

export const Route = createFileRoute('/api/resolve')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await allowResolve(request.headers.get('CF-Connecting-IP')))) {
          return Response.json(
            { message: 'Too many lookups. Wait a moment and try again.' },
            { status: 429 },
          )
        }

        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return Response.json({ message: 'Body must be JSON.' }, { status: 400 })
        }

        let identityInput =
          raw && typeof raw === 'object' && 'identity' in raw && typeof raw.identity === 'string'
            ? raw.identity
            : ''
        const platformRaw =
          raw && typeof raw === 'object' && 'platform' in raw && typeof raw.platform === 'string'
            ? raw.platform
            : ''
        let platform = platformRaw in PLATFORMS ? (platformRaw as PlatformId) : null

        // Share sheets embed a short or profile link in a longer message (e.g.
        // "长按复制... https://v.douyin.com/xxx/ ...抖音号是…"). Extract and follow
        // any Douyin/Xiaohongshu URL before parsing.
        const share = await extractShareTarget(identityInput)
        if (share.candidate) {
          identityInput = share.candidate
          platform = null
        }
        const identity = normalizeIdentity(identityInput, platform)
        if (!identity.ok) {
          return Response.json({ message: identity.message }, { status: 400 })
        }
        const config = readProductionConfig()

        const [platformId, socialHandle] = identity.identity.canonicalKey.split(':')
        let resolvedIdentity = identity.identity
        let title = ''
        let description = ''
        let imageUrl = null as string | null
        let origin = ''

        if (platformId === 'douyin') {
          // Resolve the stable sec_uid and pull public metadata (nickname,
          // signature, avatar) from Douyin's official API. This is what lets a
          // bare 抖音号 (unique_id) be found and gives the profile its real info.
          const rawId = socialHandle ?? ''
          const lookup = await lookupDouyinUser(
            isDouyinSecUid(rawId) ? { secUid: rawId } : { uniqueId: rawId },
          )
          if (lookup) {
            resolvedIdentity = {
              canonicalKey: `douyin:${lookup.secUid}`,
              display: lookup.nickname || `抖音 @${lookup.uniqueId}`,
              targetUrl: `https://www.douyin.com/user/${lookup.secUid}`,
            }
            title = lookup.nickname
            description = lookup.signature
            imageUrl = lookup.avatarUrl
            origin = 'handle'
          } else if (!isDouyinSecUid(rawId)) {
            // A bare 抖音号 we couldn't resolve: don't fabricate an invalid URL.
            return Response.json(
              { message: '未找到该抖音号。请粘贴抖音分享链接或主页链接。' },
              { status: 400 },
            )
          }
        } else if (platformId === 'instagram' && socialHandle) {
          // Instagram blocks Cloudflare egress, so a handle lookup goes through
          // SearchAPI (non-Cloudflare). Fills the display name, bio, and avatar;
          // falls back to a platform-letter tile when unavailable.
          const ig = await lookupInstagramUser(socialHandle, config.searchApiKey)
          if (ig) {
            resolvedIdentity = {
              canonicalKey: `instagram:${ig.username}`,
              display: ig.fullName || `Instagram @${ig.username}`,
              targetUrl: `https://instagram.com/${ig.username}`,
            }
            title = ig.fullName
            description = ig.biography
            imageUrl = ig.avatarUrl
            origin = 'handle'
          }
        }

        const isSocial = /^(x|instagram|tiktok|douyin|rednote|weibo):/.test(resolvedIdentity.canonicalKey)
        if (isSocial) {
          // unavatar-backed platforms (x/tiktok) return the account's
          // real avatar. douyin/instagram/rednote/weibo use their own lookup
          // above when available; otherwise fall back to a platform-letter tile.
          if (platformId !== 'douyin' && platformId !== 'instagram') {
            imageUrl = staticAvatarUrl(platformId as PlatformId, socialHandle ?? '')
            if (!['weibo', 'rednote'].includes(platformId)) {
              const scraped = await scrapePublicUrl(resolvedIdentity.targetUrl)
              title = title || scraped.title
              description = description || scraped.description
            }
          }
        } else {
          // Web URLs keep the site favicon.
          const scraped = await scrapePublicUrl(resolvedIdentity.targetUrl)
          title = title || scraped.title
          description = description || scraped.description
          imageUrl = imageUrl || faviconUrlForTarget(resolvedIdentity.targetUrl)
        }

        const metadata = { title, description, imageUrl }
        const complete = completeListingMetadata(metadata, null)
        return Response.json({
          identity: resolvedIdentity,
          metadata: complete.metadata,
          source: title || description ? (origin || (isSocial ? 'handle' : 'scrape')) : 'none',
          missing: complete.ok ? [] : complete.missing,
        })
      },
    },
  },
})
