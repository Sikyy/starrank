import { Link } from '@tanstack/react-router'

import { localeHtmlLang, useLocale } from '../i18n/context.tsx'
import { formatCount } from '../i18n/format.ts'
import { interpolate } from '../i18n/locale.ts'
import { LocaleSwitcher } from './locale-switcher.tsx'

// Public analytics for starrank.lol — a DataFast public share that any visitor
// can open without signing in (pageviews, revenue, referrers, visited URLs).
export const DATAFAT_DASHBOARD_URL = 'https://datafa.st/share/6a8aed1a25c806f747d17130'

export function SiteHeader(input: {
  visitorsOnline: number
  visitorsLast24h: number
  visitorsSinceLaunch?: number
}) {
  const { copy, locale } = useLocale()
  const lang = localeHtmlLang(locale)
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link className="wordmark" to="/" aria-label={copy.homeAria}>
          Star<span>Rank</span>
        </Link>
        <nav className="header-nav" aria-label={copy.navSite}>
          <Link to="/rules">{copy.navRules}</Link>
          <a href="https://github.com/Sikyy/starrank" target="_blank" rel="noreferrer">
            {copy.navGitHub}
          </a>
          <LocaleSwitcher />
        </nav>
      </div>
      <div className="live-pill" aria-live="polite">
        <span className="live-dot" />
        <strong>
          {interpolate(copy.visitorsOnline, { count: formatCount(input.visitorsOnline, lang) })}
        </strong>
        <span>
          · {interpolate(copy.visitorsLast24h, { count: formatCount(input.visitorsLast24h, lang) })} ·{' '}
          {input.visitorsSinceLaunch != null
            ? `${interpolate(copy.visitorsSinceLaunch, { count: formatCount(input.visitorsSinceLaunch, lang) })} · `
            : ''}
        </span>
        <a className="stats-link" href={DATAFAT_DASHBOARD_URL} target="_blank" rel="noreferrer">
          {copy.seeStats}
        </a>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const { copy } = useLocale()
  return (
    <footer>
      <p>{copy.footerBlurb}</p>
      <nav className="footer-nav">
        <Link to="/rules">{copy.navRules}</Link>
        <Link to="/terms">服务条款</Link>
        <Link to="/privacy">隐私政策</Link>
        <a href={DATAFAT_DASHBOARD_URL} target="_blank" rel="noreferrer">{copy.footerStats}</a>
        <a href="https://starrank.lol">starrank.lol</a>
        <a href="mailto:yyymalicious@gmail.com">客服邮箱：yyymalicious@gmail.com</a>
      </nav>
    </footer>
  )
}
