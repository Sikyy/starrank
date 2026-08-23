import assert from 'node:assert/strict'
import test from 'node:test'

import { CATALOG } from './catalog.ts'
import { formatRelativeAge, localizeError } from './format.ts'
import { interpolate, localeFromAcceptLanguage, LOCALES } from './locale.ts'

test('Accept-Language picks the first supported tag', () => {
  assert.equal(localeFromAcceptLanguage('zh-CN,zh;q=0.9,en;q=0.8'), 'zh')
  assert.equal(localeFromAcceptLanguage('ja,en;q=0.8'), 'ja')
  assert.equal(localeFromAcceptLanguage('fa-IR,fa;q=0.9'), 'fa')
  assert.equal(localeFromAcceptLanguage('xx,yy;q=0.8'), 'zh')
  assert.equal(localeFromAcceptLanguage(null), 'zh')
})

test('every locale fills the English message keys', () => {
  const keys = Object.keys(CATALOG.en)
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(CATALOG[locale]), keys, locale)
    assert.equal(CATALOG[locale].rulesSections.length, 4, locale)
  }
})

test('relative age and identity errors follow the active copy', () => {
  assert.equal(interpolate('{count} clicks', { count: 12 }), '12 clicks')
  assert.equal(formatRelativeAge('2026-08-23T00:00:00.000Z', '2026-08-23T00:00:10.000Z', CATALOG.en), 'just now')
  assert.equal(formatRelativeAge('2026-08-23T00:00:00.000Z', '2026-08-23T03:00:00.000Z', CATALOG.zh), '3 小时前')
  assert.equal(localizeError('Add a product URL or @handle.', CATALOG.zh), '请填写产品网址或 @handle。')
  assert.equal(localizeError('Unknown server message', CATALOG.de), 'Unknown server message')
})
