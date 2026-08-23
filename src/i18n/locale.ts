export const LOCALES = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'fa', 'hi'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'zh'
export const LOCALE_COOKIE = 'youbid_locale'
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365

export const LOCALE_META: Record<Locale, { label: string; htmlLang: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English', htmlLang: 'en', dir: 'ltr' },
  zh: { label: '中文', htmlLang: 'zh-Hans', dir: 'ltr' },
  ja: { label: '日本語', htmlLang: 'ja', dir: 'ltr' },
  ko: { label: '한국어', htmlLang: 'ko', dir: 'ltr' },
  de: { label: 'Deutsch', htmlLang: 'de', dir: 'ltr' },
  fr: { label: 'Français', htmlLang: 'fr', dir: 'ltr' },
  es: { label: 'Español', htmlLang: 'es', dir: 'ltr' },
  pt: { label: 'Português', htmlLang: 'pt', dir: 'ltr' },
  fa: { label: 'فارسی', htmlLang: 'fa', dir: 'rtl' },
  hi: { label: 'हिन्दी', htmlLang: 'hi', dir: 'ltr' },
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value)
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  const parts = header.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';')
    const q = params.find((param) => param.trim().startsWith('q='))
    return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split('=')[1]) : 1 }
  })
  parts.sort((left, right) => right.q - left.q)
  for (const { tag } of parts) {
    if (isLocale(tag)) return tag
    const base = tag.split('-')[0]
    if (base === 'zh') return 'zh'
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}

export function persistLocaleCookie(locale: Locale, secure: boolean): void {
  document.cookie = [
    `${LOCALE_COOKIE}=${locale}`,
    'Path=/',
    `Max-Age=${LOCALE_MAX_AGE}`,
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function applyDocumentLocale(locale: Locale): void {
  const meta = LOCALE_META[locale]
  document.documentElement.lang = meta.htmlLang
  document.documentElement.dir = meta.dir
}

export function localeFromDocumentCookie(): Locale | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]) : null
  return isLocale(value) ? value : null
}

export const LOCALE_BOOT_SCRIPT = `(function(){var m=document.cookie.match(/(?:^|; )youbid_locale=([^;]*)/);var v=m?decodeURIComponent(m[1]):'';var known={en:1,zh:1,ja:1,ko:1,de:1,fr:1,es:1,pt:1,fa:1,hi:1};if(!known[v])return;var langs={en:'en',zh:'zh-Hans',ja:'ja',ko:'ko',de:'de',fr:'fr',es:'es',pt:'pt',fa:'fa',hi:'hi'};document.documentElement.lang=langs[v];document.documentElement.dir=v==='fa'?'rtl':'ltr';})();`
