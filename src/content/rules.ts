import { en } from '../i18n/locales/en.ts'

export interface RulesSection {
  heading: string
  lead?: string
  bullets: readonly string[]
}

export const RULES_TITLE = en.rulesTitle
export const RULES_LEAD = en.rulesLead
export const RULES_SECTIONS = en.rulesSections

export function rulesMarkdown(origin: string): string {
  const sections = RULES_SECTIONS.map((section) => {
    const body = section.lead ? `${section.lead}\n\n` : ''
    const bullets = section.bullets.map((bullet) => `- ${bullet}`).join('\n')
    return `## ${section.heading}\n\n${body}${bullets}`
  })
  return [
    `# Youbid rules: ${RULES_TITLE}`,
    `> ${RULES_LEAD}`,
    ...sections,
    `## ${en.rulesCanonicalHeading}\n\n- [${en.rulesCanonicalRules}](${origin}/rules)\n- [${en.rulesCanonicalBoard}](${origin}/)\n- [${en.rulesCanonicalStats}](${origin}/stats)`,
    '',
  ].join('\n\n')
}
