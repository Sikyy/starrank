import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { formatUsd } from '../domain/money.ts'
import type { PublicStatsSnapshot } from '../domain/stats.ts'
import { localeHtmlLang, useLocale } from '../i18n/context.tsx'
import { interpolate } from '../i18n/locale.ts'
import { database } from '../server/env.ts'
import { loadPublicStats } from '../server/db.ts'
import { resolveRequestLocale } from '../server/locale.ts'
import { SiteFooter, SiteHeader } from '../ui/site-chrome.tsx'

// This loader re-runs every few seconds. Recording a traffic fact here would bill one
// open tab as hundreds of visits an hour and count nothing anyone reads.
const loadStats = createServerFn({ method: 'GET' }).handler(async () => {
  resolveRequestLocale()
  return loadPublicStats(database(), new Date())
})

export const Route = createFileRoute('/stats')({
  loader: () => loadStats(),
  component: StatsPage,
})

function StatsPage() {
  const stats = Route.useLoaderData()
  const router = useRouter()
  const { copy, locale } = useLocale()
  const htmlLang = localeHtmlLang(locale)

  useEffect(() => {
    const timer = window.setInterval(() => {
      void router.invalidate()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [router])

  return (
    <main className="site-shell">
      <SiteHeader visitorsOnline={stats.visitorsOnline} visitorsLast24h={stats.visitorsLast24h} />
      <section className="page-panel" aria-labelledby="stats-heading">
        <p className="page-kicker">{copy.statsKicker}</p>
        <h1 id="stats-heading">{copy.statsTitle}</h1>
        <p className="page-lead">{copy.statsLead}</p>
        <p className="live-updated">{interpolate(copy.updated, { time: formatClock(stats.generatedAt, htmlLang) })}</p>

        <dl className="stat-grid">
          <Stat label={copy.statOnline} value={stats.visitorsOnline.toLocaleString(htmlLang)} />
          <Stat label={copy.statHour} value={stats.visitorsLastHour.toLocaleString(htmlLang)} />
          <Stat label={copy.statDay} value={stats.visitorsLast24h.toLocaleString(htmlLang)} />
          <Stat label={copy.statClicks} value={stats.clicksLast24h.toLocaleString(htmlLang)} />
          <Stat label={copy.statListings} value={stats.listingsLive.toLocaleString(htmlLang)} />
          <Stat label={copy.statVolume} value={formatUsd(stats.volumeLiveCents)} />
          <Stat label={copy.statFirst} value={stats.firstPlaceCents ? formatUsd(stats.firstPlaceCents) : '—'} />
          <Stat
            label={copy.statTakeover}
            value={stats.takeover ? `${stats.takeover.display} · ${formatUsd(stats.takeover.amountCents)}` : copy.takeoverNone}
          />
        </dl>

        <h2>{copy.recentSettlements}</h2>
        {stats.recentSettlements.length === 0 ? (
          <p className="empty-note">{copy.noSettlements}</p>
        ) : (
          <ol className="settlement-list">
            {stats.recentSettlements.map((row) => (
              <li key={`${row.listingId}-${row.settledAt}`}>
                <span>#{row.rank}</span>
                <strong>{row.display}</strong>
                <em>{formatUsd(row.amountCents)}</em>
                <small>{formatClock(row.settledAt, htmlLang)}</small>
              </li>
            ))}
          </ol>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function formatClock(value: string, htmlLang: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(htmlLang, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export type { PublicStatsSnapshot }
