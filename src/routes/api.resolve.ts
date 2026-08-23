import { createFileRoute } from '@tanstack/react-router'

import { faviconUrlForTarget } from '../domain/favicon.ts'
import { PLATFORMS, normalizeIdentity, type PlatformId } from '../domain/identity.ts'
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

        const identityInput =
          raw && typeof raw === 'object' && 'identity' in raw && typeof raw.identity === 'string'
            ? raw.identity
            : ''
        const platformRaw =
          raw && typeof raw === 'object' && 'platform' in raw && typeof raw.platform === 'string'
            ? raw.platform
            : ''
        const platform = platformRaw in PLATFORMS ? (platformRaw as PlatformId) : null
        const identity = normalizeIdentity(identityInput, platform)
        if (!identity.ok) {
          return Response.json({ message: identity.message }, { status: 400 })
        }

        const handle = identity.identity.canonicalKey.startsWith('x:')
        // Platforms behind login walls (douyin/weibo) never yield server-side
        // metadata; skip the scrape so users fill title/description manually.
        const platformId = identity.identity.canonicalKey.split(':')[0]
        const scrapeable = !['douyin', 'weibo'].includes(platformId)
        const scraped = scrapeable ? await scrapePublicUrl(identity.identity.targetUrl) : { title: '', description: '', imageUrl: null }
        const metadata = {
          ...scraped,
          imageUrl: handle || !scrapeable ? scraped.imageUrl : faviconUrlForTarget(identity.identity.targetUrl),
        }
        const complete = completeListingMetadata(metadata, null)
        return Response.json({
          identity: identity.identity,
          metadata: complete.metadata,
          source: metadata.title || metadata.description ? (handle ? 'handle' : 'scrape') : 'none',
          missing: complete.ok ? [] : complete.missing,
        })
      },
    },
  },
})
