// E2E smoke test: create a real checkout session in Waffo test env.
import { createHash, createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

const vars = Object.fromEntries(
  readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^"|"$/g, '')]
    }),
)

let PRIVATE_KEY = vars.WAFFO_PRIVATE_KEY
if (!PRIVATE_KEY.includes('\n')) {
  const body = PRIVATE_KEY
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')
  const lines = body.match(/.{1,64}/g) ?? []
  PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----\n${lines.join('\n')}\n-----END RSA PRIVATE KEY-----\n`
}

const path = '/v1/actions/checkout/create-session'
const bodyStr = JSON.stringify({
  productId: process.argv[2] ?? 'PROD_1SLx3j3gvrfybsytlL28zK',
  currency: 'CNY',
  productType: 'onetime',
  language: 'zh-Hans',
  darkMode: true,
  successUrl: 'https://starrank.lol/receipts/test-intent',
  orderMerchantExternalId: 'e2e-smoke-test',
  metadata: { youbid_intent_id: 'test-intent', purchase_kind: 'rank' },
  priceSnapshot: { amount: '10.00', taxCategory: 'digital_goods' },
})

const timestamp = Math.floor(Date.now() / 1000).toString()
const hash = createHash('sha256').update(bodyStr).digest('base64')
const canonical = `POST\n${path}\n${timestamp}\n${hash}`
const signature = createSign('RSA-SHA256').update(canonical).sign(PRIVATE_KEY, 'base64')

const res = await fetch(`https://api.waffo.ai${path}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Merchant-Id': vars.WAFFO_MERCHANT_ID,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  },
  body: bodyStr,
})
const json = await res.json().catch(() => ({}))
console.log('status:', res.status)
console.log(JSON.stringify(json, null, 2).slice(0, 800))
if (json.data?.checkoutUrl) console.log('\nCHECKOUT URL:', json.data.checkoutUrl)
