import { createFileRoute } from '@tanstack/react-router'

import { faviconUrlForTarget } from '../domain/favicon.ts'
import { PLATFORMS, normalizeIdentity, type PlatformId } from '../domain/identity.ts'
import { staticAvatarUrl } from '../domain/avatar.ts'
import { completeListingMetadata } from '../domain/listing-metadata.ts'
import { allowResolve } from '../server/env.ts'
import { scrapePublicUrl } from '../server/scrape.ts'
import { extractShareTarget } from '../server/share-input.ts'

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

        const isSocial = /^(x|instagram|tiktok|douyin|youtube|rednote|weibo):/.test(identity.identity.canonicalKey)
        const [platformId, socialHandle] = identity.identity.canonicalKey.split(':')

        let title = ''
        let description = ''
        let imageUrl = null as string | null

        if (isSocial) {
          // unavatar-backed platforms (x/tiktok/youtube) return the account's
          // real avatar. instagram/douyin/rednote/weibo have no anonymous
          // source from Workers → leave avatar null, open manual entry, and
          // fall back to a platform-letter tile (not the platform logo).
          imageUrl = staticAvatarUrl(platformId as PlatformId, socialHandle ?? '')
          // Light scrape for a title where the avatar source gives none.
          if (!['douyin', 'weibo', 'rednote'].includes(platformId)) {
            const scraped = await scrapePublicUrl(identity.identity.targetUrl)
            title = scraped.title || title
            description = scraped.description || description
          }
        } else {
          // Web URLs keep the site favicon.
          const scraped = await scrapePublicUrl(identity.identity.targetUrl)
          title = scraped.title
          description = scraped.description
          imageUrl = faviconUrlForTarget(identity.identity.targetUrl)
        }

        const metadata = { title, description, imageUrl }
        const complete = completeListingMetadata(metadata, null)
        return Response.json({
          identity: identity.identity,
          metadata: complete.metadata,
          source: title || description ? (isSocial ? 'handle' : 'scrape') : 'none',
          missing: complete.ok ? [] : complete.missing,
        })
      },
    },
  },
})
