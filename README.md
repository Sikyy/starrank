<img src="public/logo.avif" alt="StarRank" width="120">

# StarRank

StarRank is a paid public leaderboard at [starrank.lol](https://starrank.lol). A visitor picks a bid of at least ¥10, submits a product URL or a social handle, pays through hosted checkout (Waffo Pancake, with Stripe as a fallback), and ranks by the **total** amount paid. Every live amount is **static** — it never decays, and a listing stays on the board until it is refunded to zero. Creating checkout never changes the board. Only a verified paid webhook does.

The product idea and board layout take cues from [outbid.lol](http://outbid.lol/). StarRank is a separate implementation.

## What you get

- A public board with live projected rank, current (static) amounts, and the date each listing was settled
- Hover/focus **claim this rank** pills priced at that row’s current amount plus ¥1, not the historical total
- Identity as a URL or a platform handle (X, Instagram, TikTok, YouTube, 抖音, 小红书, 微博). StarRank tries to read a title, description, and avatar. For social handles it uses a real avatar where a free source exists and a platform-letter tile otherwise; where it cannot scrape, the visitor fills title and description before paying
- Hosted checkout for the reserved bid. A raise charges the gap to the current amount. Localhost can mock-settle through the same planner
- A three-hour first-page takeover. Price starts at 4× current #1 after the last takeover ends and falls to 1.2× over 24 hours. First place is the highest contributor
- `/rules` for the public contract: ¥10 minimum, static ranking, owner-only raises while live, the falling takeover, identity, and refunds
- `/stats` for live listings, volume, distinct visitors, and outbound clicks, computed from D1 at request time
- `/llms.txt`, `/robots.txt`, `/sitemap.xml`, and JSON-LD so search engines and assistants can describe the board accurately
- `/go/$listingId` records a click and redirects to the sponsored URL (with `utm_source=starrank`)
- `/receipts/$intentId` after return from checkout

## Stack

TanStack Start on Cloudflare Workers, D1 as the authority store, Waffo Pancake Checkout (CNY) with **dynamic** `priceSnapshot.amount`. There is no Waffo/Stripe Product catalog. Each bid is one ad-hoc line item in integer cents. Package manager is **pnpm**.

## Local setup

```bash
git clone <this-repo>
cd starrank
pnpm install
cp .dev.vars.example .dev.vars
pnpm exec wrangler d1 migrations apply starrank-db --local
pnpm dev
```

Open `http://localhost:3000`. Keep `APP_URL="http://localhost:3000"` in `.dev.vars` so mock checkout stays local. Fill secret **names** from the example file; never commit real keys.

```bash
pnpm typecheck
pnpm test
```

`wrangler.jsonc` binds `DB` to D1 database `starrank-db`. Schema is in `migrations/`. Apply a new file the same way (`--local` for Vite, `--remote` for production).

## Local vs production

The board is paid D1 rows only, locally and on [starrank.lol](https://starrank.lol). An empty board is correct until a live payment settles. Mock checkout and `POST /api/mock/settle` run only when `APP_URL` is localhost and no payment provider is configured.

## Deploy

```bash
pnpm exec wrangler d1 migrations apply starrank-db --remote
pnpm run deploy
```

Set production secrets with `pnpm exec wrangler secret put` (`OWNER_COOKIE_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the `WAFFO_*` keys). Do not commit `.dev.vars`.

## Automatic deploys

This is **Workers Builds**, not Pages. On the existing Worker `starrank`: **Settings → Builds → Connect**. The dashboard Worker name must match `name` in `wrangler.jsonc` (`starrank`).

Workers Builds does **not** honor a `[build]` block in Wrangler. Commit `pnpm-lock.yaml` so the build image installs with pnpm. Fill **Settings → Build**:

| Field | Value |
| --- | --- |
| Git branch | `main` |
| Root directory | leave empty (repo root) |
| Build command | `pnpm run build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Non-production branch deploy command | `pnpm exec wrangler versions upload` (only if you enable non-production branch builds) |
| API token | leave the auto-created token |

There is **no install command**. The image installs from `pnpm-lock.yaml`. Do not set `pnpm run deploy` as the deploy command: that script already runs `vite build`, so you would build twice.

Do not put Stripe/Waffo keys, webhook secrets, or `OWNER_COOKIE_SECRET` in **Build variables**. Those are runtime secrets: **Settings → Variables & Secrets**, or `pnpm exec wrangler secret put`. `APP_URL` is already a Wrangler `vars` value (`https://starrank.lol`). Build vars are not available at runtime.

D1 migrations are not part of `wrangler deploy`. After a schema change, run `pnpm exec wrangler d1 migrations apply starrank-db --remote` yourself (idempotent), or prepend that command to the deploy command if you want it on every push.

Docs: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

## Payments

Hosted Checkout builds one line item from the reserved bid cents:

```ts
price_data: { currency: 'cny', unit_amount: reservedBidCents, product_data: { name, description } }
```

Waffo webhook: `https://starrank.lol/api/webhooks/waffo` (RSA-SHA256 signed). Stripe webhook: `https://starrank.lol/api/webhooks/stripe`.

Events: `order.completed` (Waffo), `checkout.session.completed` / `checkout.session.async_payment_succeeded` / `charge.refunded` (Stripe).

Success URL is `/receipts/$intentId?session_id={CHECKOUT_SESSION_ID}`. Cancel URL is `/?checkout=cancelled`. No publishable key; checkout is hosted.

## Routes

| Path | Role |
| --- | --- |
| `/` | Public board and bid form |
| `/stats` | Live public facts |
| `/rules` | Ranking contract |
| `/rules.md` | Same rules as Markdown, from one shared source |
| `/receipts/$intentId` | Checkout return |
| `/go/$listingId` | Sponsored outbound + click |
| `/api/resolve` | Normalize identity and scrape metadata |
| `/api/checkout` | Reserve intent, then Waffo/Stripe or local mock |
| `/api/mock/settle` | Local paid planner only |
| `/api/webhooks/waffo` | Verified paid and refund settlement |
| `/api/webhooks/stripe` | Verified paid and refund settlement |
| `/api/stats` | Public stats JSON |

## Docs

Product truth: `docs/product/starrank.md`. Settlement decision: `docs/decisions/0001-d1-payment-settlement.md`.

## License

MIT. See `LICENSE`.
