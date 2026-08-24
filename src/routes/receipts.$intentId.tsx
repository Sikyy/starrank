import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useCallback, useEffect, useState } from 'react'

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
  const [printed, setPrinted] = useState(false)
  const [invoice, setInvoice] = useState(false)
  const [copied, setCopied] = useState(false)
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
  const shareUrl = `${SITE_URL}/receipts/${receipt.intentId}`

  useEffect(() => {
    const t = window.setTimeout(() => setPrinted(true), 900)
    return () => window.clearTimeout(t)
  }, [])

  const share = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'StarRank 付款小票', text: receipt.display ?? '', url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* user cancelled */
    }
  }, [receipt.display, shareUrl])

  const printTicket = () => window.print()
  const printInvoice = () => {
    setInvoice(true)
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => setInvoice(false), 500)
    }, 50)
  }

  return (
    <div className={`receipt-stage ${printed ? 'printed' : ''} ${invoice ? 'invoice-mode' : ''}`} id="receipt-ticket">
      <div className="printer-slot" aria-hidden="true"><span className="slot-paper" /></div>
      <div className="receipt-paper-wrap">
      <div className="receipt-ticket ticket-cartoon">
        <div className="ticket-head">
          <Logo size={30} />
          <div className="ticket-brand">
            <strong>StarRank</strong>
            <span>{SITE_URL}</span>
          </div>
          <span className="ticket-type">{invoice ? '正式发票' : '付款小票'}</span>
        </div>
        <div className="ticket-body">
          {receipt.imageUrl ? (
            <img className="ticket-avatar" src={receipt.imageUrl} alt="" />
          ) : (
            <span className="ticket-avatar ticket-avatar-fallback">S</span>
          )}
          <div className="ticket-listing">
            <h2>{receipt.display ?? '—'}</h2>
            {invoice && receipt.rank ? <span className="ticket-rank">#{receipt.rank}</span> : null}
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
          <div className="ticket-meta">
            <span>网站 {SITE_URL}</span>
            <span>编号 {receipt.intentId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      </div>
      <div className="ticket-actions no-print">
        <button type="button" className="secondary-button" onClick={printTicket}>
          保存小票
        </button>
        <button type="button" className="secondary-button" onClick={share}>
          {copied ? '已复制链接' : '分享'}
        </button>
        <button type="button" className="secondary-button" onClick={printInvoice}>
          正式发票
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
