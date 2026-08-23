import { useEffect, useId, useRef, useState } from 'react'

import { useLocale } from '../i18n/context.tsx'
import { LOCALES, LOCALE_META } from '../i18n/locale.ts'

export function LocaleSwitcher() {
  const { locale, copy, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="locale-switcher" ref={rootRef}>
      <button
        type="button"
        className="locale-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((current) => !current)}
      >
        <GlobeIcon />
        <span id={labelId}>{LOCALE_META[locale].label}</span>
      </button>
      {open ? (
        <ul className="locale-menu" role="listbox" aria-label={copy.language}>
          {LOCALES.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                className={code === locale ? 'current' : undefined}
                lang={LOCALE_META[code].htmlLang}
                onClick={() => {
                  setLocale(code)
                  setOpen(false)
                }}
              >
                {LOCALE_META[code].label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M2 8h12M8 2c1.8 1.8 2.7 3.8 2.7 6S9.8 12.2 8 14C6.2 12.2 5.3 10.2 5.3 8S6.2 3.8 8 2Z" />
    </svg>
  )
}
