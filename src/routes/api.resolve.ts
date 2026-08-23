import { createFileRoute } from '@tanstack/react-router'

import { faviconUrlForTarget } from '../domain/favicon.ts'
import { PLATFORMS, normalizeIdentity, type PlatformId } from '../domain/identity.ts'
import { avatarUrlForIdentity } from '../domain/avatar.ts'
import { completeListingMetadata } from '../domain/listing-metadata.ts'
import { allowResolve } from '../server/env.ts'
import { scrapePublicUrl } from '../server/scrape.ts'

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

        // Share-sheet short links (v.douyin.com/xxx, xhslink.com/xxx) don't
        // carry the UID in the URL itself — follow redirects first and feed
        // the resolved URL through identity parsing.
        if (/^https?:\/\/(v\.douyin\.com|xhslink\.com)\//i.test(identityInput.trim())) {
          platform = null
          try {
            const probe = await fetch(identityInput.trim(), {
              method: 'GET',
              redirect: 'follow',
              headers: {
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'accept-language': 'zh-CN,zh;q=0.9',
              },
              signal: AbortSignal.timeout(12000),
            })
            const finalUrl = probe.url
            void probe.body?.cancel()
            if (finalUrl && /^https?:\/\//i.test(finalUrl)) {
              identityInput = finalUrl
            }
          } catch {
            // Fall through: the original input will fail validation with a clear message.
          }
        }
        const identity = normalizeIdentity(identityInput, platform)
        if (!identity.ok) {
          return Response.json({ message: identity.message }, { status: 400 })
        }

        const isSocial = /^(x|instagram|tiktok|youtube):/.test(identity.identity.canonicalKey)
        // Platforms behind login walls (douyin/weibo) never yield server-side
        // metadata; skip the scrape so users fill title/description manually.
        const [platformId, socialHandle] = identity.identity.canonicalKey.split(':')
        const scrapeable = !['douyin', 'weibo'].includes(platformId)
        const scraped = scrapeable ? await scrapePublicUrl(identity.identity.targetUrl) : { title: '', description: '', imageUrl: null }
        // Social identities show the person's avatar, never the platform favicon.
        // unavatar-backed platforms get a stable avatar URL; instagram gets the
        // og:image scraped straight from the profile page.
        const avatar = isSocial
          ? avatarUrlForIdentity(platformId as PlatformId, socialHandle ?? '') ?? scraped.imageUrl
          : faviconUrlForTarget(identity.identity.targetUrl)
        const metadata = {
          ...scraped,
          imageUrl: avatar,
        }
        const complete = completeListingMetadata(metadata, null)
        return Response.json({
          identity: identity.identity,
          metadata: complete.metadata,
          source: metadata.title || metadata.description ? (isSocial ? 'handle' : 'scrape') : 'none',
          missing: complete.ok ? [] : complete.missing,
        })
      },
    },
  },
})
