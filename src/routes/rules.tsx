import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { RULES_LEAD, RULES_TITLE } from '../content/rules.ts'
import { useLocale } from '../i18n/context.tsx'
import { database } from '../server/env.ts'
import { loadPublicStats } from '../server/db.ts'
import { resolveRequestLocale } from '../server/locale.ts'
import { SiteFooter, SiteHeader } from '../ui/site-chrome.tsx'

const loadRules = createServerFn({ method: 'GET' }).handler(async () => {
  resolveRequestLocale()
  const stats = await loadPublicStats(database(), new Date())
  return { visitorsOnline: stats.visitorsOnline, visitorsLast24h: stats.visitorsLast24h }
})

export const Route = createFileRoute('/rules')({
  loader: () => loadRules(),
  component: RulesPage,
  head: () => ({
    meta: [
      { title: `StarRank rules · ${RULES_TITLE}` },
      { name: 'description', content: RULES_LEAD },
      { property: 'og:title', content: `StarRank rules · ${RULES_TITLE}` },
      { property: 'og:description', content: RULES_LEAD },
      { property: 'og:url', content: 'https://starrank.lol/rules' },
    ],
    links: [
      { rel: 'canonical', href: 'https://starrank.lol/rules' },
      { rel: 'alternate', type: 'text/markdown', href: '/rules.md' },
    ],
  }),
})

function RulesPage() {
  void Route.useLoaderData()
  const { copy } = useLocale()
  return (
    <main className="site-shell">
      <SiteHeader />
      <article className="page-panel" aria-labelledby="rules-heading">
        <p className="page-kicker">{copy.rulesKicker}</p>
        <h1 id="rules-heading">{copy.rulesTitle}</h1>
        <p className="page-lead">{copy.rulesLead}</p>

        {copy.rulesSections.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            {section.lead ? <p className="page-lead">{section.lead}</p> : null}
            <ul className="rules-list">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </article>
      <SiteFooter />
    </main>
  )
}
