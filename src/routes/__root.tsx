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
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Youbid · you bid, you get' },
      {
        name: 'description',
        content: 'Bid for a verified place on the Youbid product leaderboard.',
      },
      { property: 'og:title', content: 'Youbid · you bid, you get' },
      { property: 'og:description', content: 'Bid for a verified place on the Youbid product leaderboard.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Youbid' },
      { property: 'og:url', content: 'https://youbid.lol/' },
      { name: 'twitter:title', content: 'Youbid · you bid, you get' },
      { property: 'og:image', content: 'https://youbid.lol/og-image.webp' },
      { property: 'og:image:type', content: 'image/webp' },
      { property: 'og:image:width', content: '2400' },
      { property: 'og:image:height', content: '1260' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'https://youbid.lol/og-image.webp' },
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
      '@id': 'https://youbid.lol/#org',
      name: 'Youbid',
      url: 'https://youbid.lol/',
      logo: 'https://youbid.lol/icon-512.png',
      sameAs: ['https://github.com/Go7hic/youbid'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://youbid.lol/#site',
      name: 'Youbid',
      url: 'https://youbid.lol/',
      publisher: { '@id': 'https://youbid.lol/#org' },
      inLanguage: 'en',
    },
    {
      '@type': 'WebApplication',
      name: 'Youbid',
      url: 'https://youbid.lol/',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'A public paid leaderboard. Bid on a URL or X handle to rank. Every amount falls 3% a day, so rank tracks what bidders pay now.',
      offers: {
        '@type': 'Offer',
        price: '1',
        priceCurrency: 'USD',
        description: 'Minimum bid for a ranked placement. Bids are $1 and up, in whole-dollar steps.',
      },
      publisher: { '@id': 'https://youbid.lol/#org' },
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
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_SCHEMA) }} />
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
