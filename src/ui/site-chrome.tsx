import { Link } from '@tanstack/react-router'

import { localeHtmlLang, useLocale } from '../i18n/context.tsx'
import { formatCount } from '../i18n/format.ts'
import { interpolate } from '../i18n/locale.ts'
import { LocaleSwitcher } from './locale-switcher.tsx'

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
          <img className="wordmark-logo" src="/logo.avif" alt="" width="50" height="50" />
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
        <Link className="stats-link" to="/stats" target="_blank" rel="noreferrer">
          {copy.seeStats}
        </Link>
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
        <Link to="/stats">{copy.footerStats}</Link>
        <a href="https://starrank.lol">starrank.lol</a>
      </nav>
    </footer>
  )
}
