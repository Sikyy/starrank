import { Link } from '@tanstack/react-router'

import { useLocale } from '../i18n/context.tsx'
import { LocaleSwitcher } from './locale-switcher.tsx'

// Public analytics for starrank.lol — a DataFast public share that any visitor
// can open without signing in (pageviews, revenue, referrers, visited URLs).
export const DATAFAT_DASHBOARD_URL = 'https://datafa.st/share/6a8aed1a25c806f747d17130'

export function SiteHeader() {
  const { copy } = useLocale()
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link className="wordmark" to="/" aria-label={copy.homeAria}>
          Star<span>Rank</span>
        </Link>
        <nav className="header-nav" aria-label={copy.navSite}>
          <LocaleSwitcher />
        </nav>
      </div>
      <div className="live-pill" aria-live="polite">
        <span className="live-dot" />
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
        <Link to="/terms">服务条款</Link>
        <Link to="/privacy">隐私政策</Link>
        <a href={DATAFAT_DASHBOARD_URL} target="_blank" rel="noreferrer">{copy.footerStats}</a>
        <a href="https://starrank.lol">starrank.lol</a>
        <a href="mailto:yyymalicious@gmail.com">客服邮箱：yyymalicious@gmail.com</a>
      </nav>
    </footer>
  )
}
