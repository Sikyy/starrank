import type { Locale } from './locale.ts'
import { de } from './locales/de.ts'
import { en } from './locales/en.ts'
import { es } from './locales/es.ts'
import { fa } from './locales/fa.ts'
import { fr } from './locales/fr.ts'
import { hi } from './locales/hi.ts'
import { ja } from './locales/ja.ts'
import { ko } from './locales/ko.ts'
import { pt } from './locales/pt.ts'
import { zh } from './locales/zh.ts'
import type { Messages } from './types.ts'

export const CATALOG: Record<Locale, Messages> = {
  en,
  zh,
  ja,
  ko,
  de,
  fr,
  es,
  pt,
  fa,
  hi,
}

export function messagesFor(locale: Locale): Messages {
  return CATALOG[locale]
}
