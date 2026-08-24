import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { formatCny } from '../domain/money.ts'
import type { PublicReceipt } from '../domain/receipt.ts'
import { localeHtmlLang, useLocale } from '../i18n/context.tsx'
import { interpolate } from '../i18n/locale.ts'
import { database } from '../server/env.ts'
import { loadPublicStats, loadReceipt } from '../server/db.ts'
import { resolveRequestLocale } from '../server/locale.ts'
import { SiteFooter, SiteHeader } from '../ui/site-chrome.tsx'
import { Logo } from '../ui/logo.tsx'

const SITE_URL = 'https://starrank.lol'

const loadReceiptPage = createServerFn({ method: 'GET' })
  .validator((intentId: string) => intentId)
  .handler(async ({ data: intentId }) => {
    resolveRequestLocale()
    const db = database()
    const now = new Date()
    const receipt = await loadReceipt(db, intentId, now.toISOString())
    const stats = await loadPublicStats(db, now)
    return { receipt, visitorsOnline: stats.visitorsOnline, visitorsLast24h: stats.visitorsLast24h }
  })

export const Route = createFileRoute('/receipts/$intentId')({
  loader: ({ params }) => loadReceiptPage({ data: params.intentId }),
  component: ReceiptPage,
})

function ReceiptPage() {
  const { receipt } = Route.useLoaderData()
  const router = useRouter()

  useEffect(() => {
    if (!receipt || receipt.status !== 'awaiting-payment') return
    const timer = window.setInterval(() => {
      void router.invalidate()
    }, 2000)
    return () => window.clearInterval(timer)
  }, [receipt, router])

  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="page-panel receipt-panel" aria-labelledby="receipt-heading">
        {receipt ? <ReceiptBody receipt={receipt} /> : <MissingReceipt />}
      </section>
      <SiteFooter />
    </main>
  )
}

function ReceiptBody({ receipt }: { receipt: PublicReceipt }) {
  const { copy, locale } = useLocale()
  const htmlLang = localeHtmlLang(locale)
  const settled = receipt.status === 'ranked' || receipt.status === 'takeover-active'
  const title =
    receipt.status === 'takeover-active'
      ? copy.pageOneYours
      : receipt.status === 'ranked'
        ? interpolate(copy.claimedRank, { rank: receipt.rank ?? '' })
        : receipt.status === 'needs-support'
          ? copy.needsReview
          : receipt.status === 'expired'
            ? copy.checkoutExpired
            : copy.waitingPayment

  return (
    <>
      <p className={`page-kicker ${settled ? 'paid' : ''}`}>
        {settled ? copy.paidSettled : copy.checkoutReturn}
      </p>
      <h1 id="receipt-heading">{title}</h1>

      {settled ? (
        <ReceiptTicket receipt={receipt} htmlLang={htmlLang} />
      ) : (
        <dl className="receipt-dl">
          <div>
            <dt>{copy.listing}</dt>
            <dd>{receipt.display ?? copy.pendingIdentity}</dd>
          </div>
          <div>
            <dt>{copy.amount}</dt>
            <dd>{formatCny(receipt.amountCents)}</dd>
          </div>
          <div>
            <dt>{copy.status}</dt>
            <dd>{receipt.status}</dd>
          </div>
        </dl>
      )}

      {receipt.status === 'awaiting-payment' ? (
        <p className="page-lead">{copy.awaitingLead}</p>
      ) : null}
      {receipt.status === 'takeover-active' && receipt.takeoverEndsAt ? (
        <p className="page-lead">
          {interpolate(copy.takeoverActiveUntil, {
            time: new Date(receipt.takeoverEndsAt).toLocaleTimeString(htmlLang, { hour: '2-digit', minute: '2-digit' }),
          })}
        </p>
      ) : null}
      {receipt.status === 'expired' ? (
        <p className="page-lead">{copy.expiredLead}</p>
      ) : null}
      {receipt.status === 'needs-support' ? (
        <p className="page-lead">{copy.supportLead}</p>
      ) : null}
      <Link className="primary-button receipt-cta no-print" to="/">
        {copy.seeBoard}
      </Link>
    </>
  )
}

function ReceiptTicket({ receipt, htmlLang }: { receipt: PublicReceipt; htmlLang: string }) {
  const settledAt = receipt.settledAt ? new Date(receipt.settledAt) : null
  const time = settledAt
    ? settledAt.toLocaleString(htmlLang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
  return (
    <div className="receipt-ticket" id="receipt-ticket" aria-label="付款小票">
      <div className="ticket-head">
        <Logo size={30} />
        <div className="ticket-brand">
          <strong>StarRank</strong>
          <span>{SITE_URL}</span>
        </div>
      </div>
      <div className="ticket-body">
        {receipt.imageUrl ? (
          <img className="ticket-avatar" src={receipt.imageUrl} alt="" />
        ) : (
          <span className="ticket-avatar ticket-avatar-fallback">S</span>
        )}
        <div className="ticket-listing">
          <h2>{receipt.display ?? '—'}</h2>
          {receipt.rank ? <span className="ticket-rank">#{receipt.rank}</span> : null}
        </div>
        <dl className="ticket-dl">
          <div>
            <dt>当前排名</dt>
            <dd>{receipt.rank ? `#${receipt.rank}` : '—'}</dd>
          </div>
          <div>
            <dt>付款金额</dt>
            <dd>{formatCny(receipt.amountCents)}</dd>
          </div>
          <div>
            <dt>时间</dt>
            <dd>{time}</dd>
          </div>
        </dl>
      </div>
      <div className="ticket-foot">
        <span className="ticket-id">No. {receipt.intentId.slice(0, 8).toUpperCase()}</span>
        <button type="button" className="secondary-button ticket-print" onClick={() => window.print()}>
          打印小票
        </button>
      </div>
    </div>
  )
}

function MissingReceipt() {
  const { copy } = useLocale()
  return (
    <>
      <p className="page-kicker">{copy.receiptKicker}</p>
      <h1 id="receipt-heading">{copy.noCheckout}</h1>
      <p className="page-lead">{copy.noCheckoutLead}</p>
      <Link className="primary-button modal-primary" to="/">
        {copy.backToStarRank}
      </Link>
    </>
  )
}
