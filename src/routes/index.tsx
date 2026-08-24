import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import type { Listing } from '../data/listings.ts'
import { faviconUrlForTarget } from '../domain/favicon.ts'
import { PLATFORM_LIST, PLATFORMS, containsShareLink, normalizeIdentity, type PlatformId, type ProductIdentity } from '../domain/identity.ts'
import {
  BID_STEP_CENTS,
  MINIMUM_BID_CENTS,
  amountToClaim,
  formatCny,
} from '../domain/money.ts'
import { projectedRank, rankListings } from '../domain/ranking.ts'
import { CATEGORY_PICKER, type Category } from '../domain/category.ts'
import { database, publicCheckoutConfig } from '../server/env.ts'
import { loadPublicBoard, loadPublicStats, recordTraffic } from '../server/db.ts'
import { localeHtmlLang, useLocale } from '../i18n/context.tsx'
import { formatCount, formatRelativeAge, localizeError } from '../i18n/format.ts'
import { interpolate } from '../i18n/locale.ts'
import { resolveRequestLocale } from '../server/locale.ts'
import { resolveVisitorKey } from '../server/visitor-cookie.ts'
import { SiteFooter, SiteHeader } from '../ui/site-chrome.tsx'
import { PlatformIcon } from '../ui/platform-icon.tsx'
import { CategoryIcon } from '../ui/category-icon.tsx'

/** Letter shown in the avatar tile when a social identity has no avatar yet. */
function platformInitial(identity: { canonicalKey: string }): string {
  const key = identity.canonicalKey
  const label = key.includes(':') ? PLATFORMS[key.split(':')[0] as PlatformId]?.label : ''
  return label ? label.charAt(0).toUpperCase() : 'S'
}

const loadHome = createServerFn({ method: 'GET' }).handler(async () => {
  resolveRequestLocale()
  const db = database()
  const now = new Date()
  await recordTraffic(db, {
    kind: 'board',
    countryCode: getRequestHeader('CF-IPCountry') ?? null,
    visitorKey: resolveVisitorKey(),
  })
  const board = await loadPublicBoard(db, now)
  const stats = await loadPublicStats(db, now)
  return {
    listings: board.listings,
    takeover: board.takeover,
    lastEndedTakeoverAt: board.lastEndedTakeoverAt,
    trending: board.trending,
    recentBids: board.recentBids,
    nowIso: now.toISOString(),
    checkout: publicCheckoutConfig(),
    visitorsOnline: stats.visitorsOnline,
    visitorsLast24h: stats.visitorsLast24h,
    visitorsSinceLaunch: stats.visitorsSinceLaunch,
    revenueTotalCents: stats.revenueTotalCents,
  }
})

export const Route = createFileRoute('/')({
  loader: () => loadHome(),
  component: Home,
})

function Home() {
  const data = Route.useLoaderData()
  const { copy, locale } = useLocale()
  const htmlLang = localeHtmlLang(locale)
  const bidFormRef = useRef<HTMLElement>(null)
  const listings = data.listings
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [bidCategory, setBidCategory] = useState<Category>('kr')
  const [clockIso, setClockIso] = useState(data.nowIso)
  const rankedListings = useMemo(
    () =>
      rankListings(
        listings.filter(
          (listing) => listing.amountCents > 0 && (category === 'all' || listing.category === category),
        ),
      ),
    [listings, category],
  )
  const leaderAmount = rankedListings[0]?.amountCents ?? 0
  // Empty board: start at the entry price itself, not entry + one step.
  const [amountCents, setAmountCents] = useState(() =>
    rankedListings.length > 0 ? amountToClaim(leaderAmount) : Math.max(MINIMUM_BID_CENTS, leaderAmount),
  )
  const [identityInput, setIdentityInput] = useState('')
  const [platform, setPlatform] = useState<PlatformId | null>('instagram')
  const [identityError, setIdentityError] = useState('')
  const [listingTitle, setListingTitle] = useState('')
  const [listingDescription, setListingDescription] = useState('')
  const [listingImageUrl, setListingImageUrl] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolvedKey, setResolvedKey] = useState('')
  // Identity resolved by the server. Used when local parsing can't follow a
  // Douyin/Xiaohongshu share short link (which needs a redirect the client
  // cannot do synchronously).
  const [serverIdentity, setServerIdentity] = useState<ProductIdentity | null>(null)
  const lastCanonical = useRef('')
  const resolveSeq = useRef(0)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const board = { page: 1, pageCount: 1, takeover: data.takeover, listings: rankedListings, firstRank: 1 }
  const previewRank = projectedRank(amountCents, rankedListings)
  const normalizedIdentity = normalizeIdentity(identityInput, platform)
  // The server-resolved identity is authoritative (it enriches a bare 抖音号 into
  // its real profile); fall back to the local parse only until it resolves.
  const activeIdentity = serverIdentity ?? (normalizedIdentity.ok ? normalizedIdentity.identity : null)
  const canCheckout =
    data.checkout.mode !== 'unavailable' &&
    Boolean(activeIdentity) &&
    listingTitle.trim() !== '' &&
    amountCents >= MINIMUM_BID_CENTS &&
    !busy
  const showListingMeta = Boolean(activeIdentity)
  // Social identities never use the platform favicon as their logo. unavatar
  // platforms get the real avatar; others fall back to a platform initial tile
  // until the user supplies an image URL.
  const socialIdentity = Boolean(activeIdentity && /^[a-z]+:/.test(activeIdentity.canonicalKey))
  const identityLogo = activeIdentity
    ? faviconUrlForTarget(activeIdentity.targetUrl)
    : null
  // For social identities the resolve layer fills imageUrl (avatar) or leaves
  // it empty; don't show a platform favicon as the logo for them.
  const logoForPreview =
    listingImageUrl || (socialIdentity ? null : identityLogo) || null
  const previewLogo = logoForPreview
  const resolveFailed =
    showListingMeta &&
    Boolean(activeIdentity) &&
    resolvedKey === activeIdentity?.canonicalKey &&
    !resolving &&
    !listingTitle.trim()

  function applyIdentityInput(value: string) {
    setIdentityInput(value)
    setIdentityError('')
    const next = normalizeIdentity(value, platform)
    const key = next.ok ? next.identity.canonicalKey : ''
    if (key !== lastCanonical.current) {
      lastCanonical.current = key
      setResolvedKey('')
      setServerIdentity(null)
      setListingTitle('')
      setListingDescription('')
      setListingImageUrl('')
    }
  }

  useEffect(() => {
    setClockIso(new Date().toISOString())
    const timer = window.setInterval(() => {
      setClockIso(new Date().toISOString())
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const result = normalizeIdentity(identityInput, platform)
    if (!result.ok && !containsShareLink(identityInput)) return
    const timer = window.setTimeout(() => {
      void resolveIdentityFields(identityInput)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [identityInput, platform])

  async function resolveIdentityFields(value: string) {
    const result = normalizeIdentity(value, platform)
    if (!result.ok && !containsShareLink(value)) return
    const seq = ++resolveSeq.current
    setResolving(true)
    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identity: value, platform }),
      })
      if (seq !== resolveSeq.current) return
      const payload = (await response.json()) as {
        identity?: ProductIdentity
        metadata?: { title?: string; description?: string; imageUrl?: string | null }
      }
      // Prefer the server's resolved identity (authoritative + enriched); the
      // local parse only serves as a fallback when the server sends none.
      const resolved = payload.identity ?? (result.ok ? result.identity : null)
      setResolvedKey(resolved?.canonicalKey ?? '')
      if (!response.ok || !payload.metadata || !resolved) return
      setServerIdentity(resolved)
      // Title falls back to the account display; description uses the real bio
      // when available and stays empty otherwise (no fake default text).
      const fallbackTitle = resolved.display
      setListingTitle((current) => current || payload.metadata?.title || fallbackTitle)
      setListingDescription((current) => current || payload.metadata?.description || '')
      setListingImageUrl((current) => current || payload.metadata?.imageUrl || '')
    } catch {
      if (seq === resolveSeq.current) setResolvedKey(result.ok ? result.identity.canonicalKey : '')
    } finally {
      if (seq === resolveSeq.current) setResolving(false)
    }
  }
  function scrollToBidForm() {
    bidFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function chooseRank(listing: Listing) {
    setAmountCents(amountToClaim(listing.amountCents))
    setIdentityError('')
    scrollToBidForm()
  }

  async function openCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = normalizeIdentity(identityInput, platform)
    const share = containsShareLink(identityInput)
    if (!result.ok && !share) {
      setIdentityError(localizeError(result.message, copy))
      return
    }
    setBusy(true)
    setIdentityError('')
    try {
      const turnstileInput = event.currentTarget.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]')
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          amountCents,
          identity: identityInput,
          platform,
          title: listingTitle,
          description: listingDescription,
          imageUrl: listingImageUrl || null,
          category: bidCategory,
          turnstileToken: turnstileInput?.value ?? '',
        }),
      })
      const payload = (await response.json()) as {
        message?: string
        mode?: 'mock' | 'stripe' | 'waffo' | 'settled' | 'unavailable'
        intentId?: string
        checkoutUrl?: string
      }
      if (!response.ok || !payload.intentId) {
        setIdentityError(localizeError(payload.message ?? copy.errorCheckoutStart, copy))
        return
      }
      if ((payload.mode === 'stripe' || payload.mode === 'waffo' || payload.mode === 'settled') && payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl)
        return
      }
      setPendingIntentId(payload.intentId)
      setCheckoutOpen(true)
    } finally {
      setBusy(false)
    }
  }

  async function confirmMockPayment() {
    if (!pendingIntentId) return
    setBusy(true)
    try {
      const response = await fetch('/api/mock/settle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intentId: pendingIntentId }),
      })
      const payload = (await response.json()) as { message?: string; receipt?: string }
      if (!response.ok) {
        setIdentityError(localizeError(payload.message ?? copy.errorMockSettle, copy))
        return
      }
      window.location.assign(`/receipts/${pendingIntentId}`)
    } finally {
      setBusy(false)
    }
  }

  function closeCheckout() {
    setCheckoutOpen(false)
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="intro" id="top">
        <section className="bid-panel" ref={bidFormRef} aria-labelledby="bid-heading">
          <div className="bid-title-row">
            <h1 id="bid-heading">
              {interpolate(copy.claimRankFor, { rank: previewRank })}
            </h1>
            <button
              className="step-button"
              type="button"
              aria-label={copy.decreaseBid}
              onClick={() => setAmountCents((amount) => Math.max(MINIMUM_BID_CENTS, amount - BID_STEP_CENTS))}
            >
              −
            </button>
            <strong className="bid-amount">{formatCny(amountCents)}</strong>
            <button
              className="step-button"
              type="button"
              aria-label={copy.increaseBid}
              onClick={() => setAmountCents((amount) => amount + BID_STEP_CENTS)}
            >
              +
            </button>
          </div>
          <p className="bid-explainer">
            {copy.explainerBid}
          </p>

          <form className="bid-composer-wrap" onSubmit={openCheckout} noValidate>
            <div className="platform-picker" role="group" aria-label={copy.platformLabel}>
              {PLATFORM_LIST.map((meta) => {
                const comingSoon = meta.id === 'weibo'
                return (
                  <button
                    key={meta.id}
                    type="button"
                    disabled={comingSoon}
                    className={`platform-pill ${platform === meta.id ? 'active' : ''} ${comingSoon ? 'coming-soon' : ''}`}
                    onClick={() => { if (!comingSoon) setPlatform(platform === meta.id ? null : meta.id) }}
                    aria-pressed={platform === meta.id}
                  >
                    {meta.label}
                    {comingSoon ? <span className="platform-soon">未上线</span> : null}
                  </button>
                )
              })}
            </div>
            <div className="bid-composer">
              <div className="bid-form">
                <label className="identity-field">
                  <span className="input-prefix" aria-hidden="true">
                    {platform ? (
                      <PlatformIcon platform={platform} size={18} />
                    ) : activeIdentity && socialIdentity ? (
                      <span className="avatar-initial avatar-initial-sm">{platformInitial(activeIdentity)}</span>
                    ) : identityLogo ? (
                      <img src={identityLogo} alt="" width="16" height="16" />
                    ) : (
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <circle cx="8" cy="8" r="6.2" />
                        <path d="M2 8h12M8 2c1.8 1.8 2.7 3.8 2.7 6S9.8 12.2 8 14C6.2 12.2 5.3 10.2 5.3 8S6.2 3.8 8 2Z" />
                      </svg>
                    )}
                  </span>
                  <span className="sr-only">{copy.identityLabel}</span>
                  <input
                    value={identityInput}
                    onChange={(event) => applyIdentityInput(event.target.value)}
                    onBlur={(event) => void resolveIdentityFields(event.target.value)}
                    placeholder={
                      platform
                        ? `${PLATFORM_LIST.find((p) => p.id === platform)?.placeholder ?? ''}（${PLATFORM_LIST.find((p) => p.id === platform)?.label}）`
                        : copy.identityPlaceholder
                    }
                    aria-invalid={Boolean(identityError)}
                    aria-describedby="identity-help identity-error"
                    autoComplete="url"
                  />
                </label>
                <label className="category-select-wrap">
                  <span className="sr-only">榜单分类</span>
                  <CategoryIcon category={bidCategory} size={14} />
                  <select
                    className="category-select"
                    value={bidCategory}
                    onChange={(event) => setBidCategory(event.target.value as Category)}
                  >
                    {CATEGORY_PICKER.filter((c) => c.value !== 'all').map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <button className="primary-button" type="submit" disabled={!canCheckout}>
                  {busy ? copy.working : copy.bid}
                </button>
              </div>
              <p className="identity-help" id="identity-help">
                {data.checkout.mode === 'unavailable'
                  ? copy.helpUnavailable
                  : resolving
                    ? copy.helpResolving
                    : resolveFailed
                      ? copy.helpResolveFailed
                      : copy.helpDefault}
              </p>
            </div>
            {data.checkout.turnstileSiteKey ? (
              <div className="cf-turnstile" data-sitekey={data.checkout.turnstileSiteKey} />
            ) : null}
            {showListingMeta && (platform !== null || resolveFailed) ? (
              <div className="listing-meta">
                {previewLogo || listingTitle ? (
                  <div className="resolved-identity">
                    {previewLogo ? (
                      <img src={previewLogo} alt="" width="40" height="40" />
                    ) : activeIdentity ? (
                      <span className="avatar-initial" aria-hidden="true">
                        {platformInitial(activeIdentity)}
                      </span>
                    ) : null}
                    <div>
                      <strong>{listingTitle || activeIdentity?.display || ''}</strong>
                      {listingDescription ? <p>{listingDescription}</p> : null}
                    </div>
                  </div>
                ) : null}
                <label>
                  <span>{copy.title}</span>
                  <input
                    value={listingTitle}
                    onChange={(event) => setListingTitle(event.target.value)}
                    placeholder={copy.titlePlaceholder}
                    maxLength={80}
                    required
                  />
                </label>
                <label>
                  <span>{copy.description}</span>
                  <textarea
                    value={listingDescription}
                    onChange={(event) => setListingDescription(event.target.value)}
                    placeholder={copy.descriptionPlaceholder}
                    maxLength={240}
                    rows={2}
                    required
                  />
                </label>
                <label>
                  <span>{copy.imageUrl} <em>{copy.optional}</em></span>
                  <input
                    value={listingImageUrl}
                    onChange={(event) => setListingImageUrl(event.target.value)}
                    placeholder="https://…"
                    inputMode="url"
                  />
                </label>
              </div>
            ) : null}
            <p className="field-error" id="identity-error" role="alert">{identityError}</p>
          </form>
        </section>

      </section>

      <section className="leaderboard" aria-labelledby="leaderboard-heading">
        <h2 className="sr-only" id="leaderboard-heading">{copy.boardHeading}</h2>

        <div className="category-tabs" role="tablist" aria-label="分类榜单">
          {CATEGORY_PICKER.map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={category === c.value}
              className={`category-tab ${category === c.value ? 'active' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              <CategoryIcon category={c.value} size={15} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <div className="listing-stack">
          {board.listings.length === 0 ? (
            <p className="empty-note">{copy.emptyBoard}</p>
          ) : null}
          {board.listings.map((listing, index) => {
            const rank = board.firstRank + index
            const claimCents = amountToClaim(listing.amountCents)
            const groupBoundary =
              rank === 1 || rank === 4 || rank === 11 || (rank > 10 && (rank - 1) % 10 === 0)
            return (
              <>
                {groupBoundary ? (
                  <p className="group-heading" key={`group-${rank}`} aria-hidden="true">
                    Top {rank === 1 ? '3' : rank === 4 ? '10' : rank - 1}
                  </p>
                ) : null}
                <article
                  className={`listing-card rank-${Math.min(rank, 4)}`}
                  key={listing.id}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('a, .claim-rank')) return
                    chooseRank(listing)
                  }}
                >
                  <button
                    className="claim-rank"
                    type="button"
                    onClick={() => chooseRank(listing)}
                  >
                    {interpolate(copy.claimRank, { amount: formatCny(claimCents) })}
                  </button>
                  <button className="rank-badge" type="button" onClick={() => chooseRank(listing)} aria-label={interpolate(copy.claimRankAria, { rank, amount: formatCny(claimCents) })}>
                    #{rank}
                  </button>
                  {listing.image ? <img src={listing.image} alt="" width="56" height="56" loading="lazy" /> : null}
                  <div className="listing-copy">
                    <a href={listing.href} target="_blank" rel="sponsored noopener noreferrer">
                      {listing.domain}
                    </a>
                    {listing.description ? <p>{listing.description}</p> : null}
                    <small>
                      {formatRelativeAge(listing.settledAt, clockIso, copy)}
                      <span className="meta-dot" aria-hidden="true">•</span>
                      <strong>{interpolate(copy.clicks, { count: formatCount(listing.clicks, htmlLang) })}</strong>
                    </small>
                  </div>
                  <button className="listing-price" type="button" onClick={() => chooseRank(listing)} aria-label={interpolate(copy.currentAmountAria, { amount: formatCny(listing.amountCents) })}>
                    {formatCny(listing.amountCents)}
                  </button>
                </article>
              </>
            )
          })}
        </div>
      </section>

      <SiteFooter />

      {checkoutOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeCheckout()
        }}>
          <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <span className="modal-kicker">{copy.checkoutKicker}</span>
            <h2 id="checkout-title">{copy.reviewBid}</h2>
            <dl>
              <div><dt>{copy.listing}</dt><dd>{listingTitle || activeIdentity?.display || identityInput}</dd></div>
              <div><dt>{copy.placement}</dt><dd>{interpolate(copy.projectedRank, { rank: previewRank })}</dd></div>
              <div><dt>{copy.total}</dt><dd>{formatCny(amountCents)}</dd></div>
            </dl>
            <p className="payment-note">
              {copy.paymentNote}
            </p>
            <button className="primary-button modal-primary" type="button" disabled={busy} onClick={() => void confirmMockPayment()}>
              {copy.confirmMock}
            </button>
            <button className="text-button" type="button" onClick={closeCheckout}>{copy.cancel}</button>
          </section>
        </div>
      ) : null}
    </main>
  )
}
