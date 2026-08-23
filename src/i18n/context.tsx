import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { messagesFor } from './catalog.ts'
import {
  applyDocumentLocale,
  DEFAULT_LOCALE,
  LOCALE_META,
  persistLocaleCookie,
  type Locale,
} from './locale.ts'
import type { Messages } from './types.ts'

interface LocaleContextValue {
  locale: Locale
  copy: Messages
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      copy: messagesFor(locale),
      setLocale(next) {
        persistLocaleCookie(next, window.location.protocol === 'https:')
        applyDocumentLocale(next)
        setLocaleState(next)
      },
    }),
    [locale],
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (value) return value
  return {
    locale: DEFAULT_LOCALE,
    copy: messagesFor(DEFAULT_LOCALE),
    setLocale() {},
  }
}

export function localeHtmlLang(locale: Locale): string {
  return LOCALE_META[locale].htmlLang
}
