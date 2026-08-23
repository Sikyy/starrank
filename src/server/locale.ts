import { getCookie, getRequestHeader, setCookie } from '@tanstack/react-start/server'

import {
  DEFAULT_LOCALE,
  isLocale,
  localeFromAcceptLanguage,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  type Locale,
} from '../i18n/locale.ts'
import { isLocalDevelopment } from './env.ts'

export function resolveRequestLocale(): Locale {
  const existing = getCookie(LOCALE_COOKIE)
  if (isLocale(existing)) return existing
  const next = localeFromAcceptLanguage(getRequestHeader('Accept-Language')) ?? DEFAULT_LOCALE
  setCookie(LOCALE_COOKIE, next, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: !isLocalDevelopment(),
    maxAge: LOCALE_MAX_AGE,
  })
  return next
}
