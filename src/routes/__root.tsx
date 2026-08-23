import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { LocaleProvider, useLocale } from '../i18n/context.tsx'
import { LOCALE_BOOT_SCRIPT } from '../i18n/locale.ts'
import { resolveRequestLocale } from '../server/locale.ts'
import appCss from '../styles.css?url'

const loadLocale = createServerFn({ method: 'GET' }).handler(() => {
  return { locale: resolveRequestLocale() }
})

export const Route = createRootRoute({
  loader: () => loadLocale(),
  component: RootLayout,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'waffo-verify',
        content: 'e42a02ce09f9e48a34fe393a6856faa8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'StarRank · 谁出价高，谁站 C 位' },
      {
        name: 'description',
        content: '为明星、应援站与粉圈项目竞价上榜。价高者排前。',
      },
      { property: 'og:title', content: 'StarRank · 谁出价高，谁站 C 位' },
      { property: 'og:description', content: '为明星、应援站与粉圈项目竞价上榜。价高者排前。' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'StarRank' },
      { property: 'og:url', content: 'https://starrank.lol/' },
      { name: 'twitter:title', content: 'StarRank · 谁出价高，谁站 C 位' },
      { property: 'og:image', content: 'https://starrank.lol/og-image.webp' },
      { property: 'og:image:type', content: 'image/webp' },
      { property: 'og:image:width', content: '2400' },
      { property: 'og:image:height', content: '1260' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'https://starrank.lol/og-image.webp' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: '128x128' },
      { rel: 'apple-touch-icon', href: '/icon-512.png' },
      { rel: 'alternate', type: 'text/plain', href: '/llms.txt' },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

// Every claim here is also stated in visible copy on the board or in /rules.
const SITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://starrank.lol/#org',
      name: 'StarRank',
      url: 'https://starrank.lol/',
      logo: 'https://starrank.lol/icon-512.png',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://starrank.lol/#site',
      name: 'StarRank',
      url: 'https://starrank.lol/',
      publisher: { '@id': 'https://starrank.lol/#org' },
      inLanguage: 'zh',
    },
    {
      '@type': 'WebApplication',
      name: 'StarRank',
      url: 'https://starrank.lol/',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'A public paid leaderboard for stars and fan projects. Bid on a URL or X handle to rank. Highest total bid takes #1 — amounts never decay.',
      offers: {
        '@type': 'Offer',
        price: '1',
        priceCurrency: 'CNY',
        description: 'Minimum bid for a ranked placement. New spots start at ¥10, in whole-yuan steps.',
      },
      publisher: { '@id': 'https://starrank.lol/#org' },
    },
  ],
}

function RootLayout() {
  const { locale } = Route.useLoaderData()
  return (
    <LocaleProvider initialLocale={locale}>
      <Outlet />
    </LocaleProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hans">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_SCHEMA) }} />
        {/* Datafa.st analytics — defer-loaded, cookieless */}
        <script
          defer
          data-website-id="dfid_SwiRXiNlTaTixNRBnLI2Z"
          data-domain="starrank.lol"
          src="https://datafa.st/js/script.js"
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  const { copy } = useLocale()
  return (
    <main className="site-shell">
      <section className="page-panel">
        <p className="page-kicker">404</p>
        <h1>{copy.notFoundTitle}</h1>
        <p className="page-lead">{copy.notFoundLead}</p>
        <Link className="primary-button modal-primary" to="/">
          {copy.backToBoard}
        </Link>
      </section>
    </main>
  )
}
