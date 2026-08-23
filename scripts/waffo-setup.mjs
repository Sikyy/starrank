// One-shot Waffo Pancake test-env setup: verify auth, create CNY product,
// register webhook. Run: node scripts/waffo-setup.mjs (reads .dev.vars)
import { createSign } from 'node:crypto'
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

const MERCHANT = vars.WAFFO_MERCHANT_ID
let PRIVATE_KEY = vars.WAFFO_PRIVATE_KEY
if (!PRIVATE_KEY.includes('\n')) {
  // Single-line PEM: rewrap base64 body at 64 chars so Node/OpenSSL can parse it.
  const body = PRIVATE_KEY
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')
  const lines = body.match(/.{1,64}/g) ?? []
  PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----\n${lines.join('\n')}\n-----END RSA PRIVATE KEY-----\n`
} else {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n')
}

async function call(path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const bodyStr = JSON.stringify(body)
  const bodyHash = createSign('sha256') // placeholder replaced below
  void bodyHash
  const { createHash } = await import('node:crypto')
  const hash = createHash('sha256').update(bodyStr).digest('base64')
  const canonical = `POST\n${path}\n${timestamp}\n${hash}`
  const signature = createSign('RSA-SHA256').update(canonical).sign(PRIVATE_KEY, 'base64')
  const res = await fetch(`https://api.waffo.ai${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Id': MERCHANT,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    },
    body: bodyStr,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

// 1. Auth check + store visibility via create-product dry path: list stores is not in the
// signed API set we need, so go straight to product creation (idempotent-ish: named uniquely).
const product = await call('/v1/actions/onetime-product/create-product', {
  storeId: vars.WAFFO_STORE_ID,
  name: 'StarRank Leaderboard Bid',
  description: 'Paid placement on the StarRank public leaderboard (starrank.lol). One-time charge in CNY; the amount is set per bid via priceSnapshot at checkout.',
  prices: { CNY: { amount: '10.00', taxIncluded: false, taxCategory: 'digital_goods' } },
})
console.log('create-product:', product.status, JSON.stringify(product.json).slice(0, 600))
const productId = product.json?.data?.productId ?? product.json?.data?.id ?? product.json?.data?.product?.id
if (productId) console.log('PRODUCT_ID =', productId)

// 2. Register the HTTP webhook for order.completed in test mode.
const hook = await call('/v1/actions/store/add-webhook', {
  storeId: vars.WAFFO_STORE_ID,
  channel: 'http',
  url: 'https://starrank.lol/api/webhooks/waffo',
  events: ['order.completed'],
  testMode: true,
})
console.log('add-webhook:', hook.status, JSON.stringify(hook.json).slice(0, 600))
