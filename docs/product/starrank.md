# StarRank product truth

Status: current

StarRank is a public paid leaderboard at starrank.lol. A visitor chooses an absolute bid, submits a URL or a social handle, pays through hosted checkout, and appears at the rank determined by their total paid amount. Amounts are static: they never decay.

## Current behavior

- The home page shows the first-place amount, a default bid of first place plus one yuan, live projected rank, and a three-hour first-page takeover whose price starts at four times current first place after the last takeover ends and falls to 1.2× over 24 hours.
- Hovering or focusing a leaderboard row reveals a coral pill: `claim this rank for ¥N`, where N is that row’s current amount plus one yuan. The pill sets the same global bid field and continues the existing identity and checkout flow. Mouse leave hides it. Keyboard users reach it through focus-within.
- Each listing shows how long ago it settled. A listing stays on the board until it is refunded to zero.
- Identity is a public URL or a platform handle: X, Instagram, TikTok, YouTube, 抖音, 小红书, 微博. URLs are canonicalized; query strings and hashes are stripped; invite hosts are rejected. A URL scrape prefills title, description, and favicon when it can. Social handles use a real avatar where a free, Worker-reachable source exists (unavatar for X/TikTok/YouTube) and a platform-letter tile otherwise. Missing title or description must be filled before checkout.
- Checkout reserves a D1 intent before any provider call. Creating or confirming checkout never changes the board.
- Only a verified, idempotent paid webhook — or the local mock settlement that uses the same planner — publishes or raises a listing.
- Rank is total paid amount descending (equivalent to current standing), then settlement time, then stable id. Amounts never decay. A raise extends the listing’s total from the live balance plus the new payment.
- A product identity can be raised only by its owning visitor cookie. Secrets and ownership tokens never enter client loader data.
- After checkout return, `/receipts/$intentId` is presentational and polls until settlement. Typed receipts are `awaiting-payment`, `ranked`, `takeover-active`, or `needs-support`.
- `/go/$listingId` records a click fact and redirects to a sponsored outbound URL.
- `/stats` is a live public stats page. Every figure is computed from D1 at request time; nothing is cached or precomputed. It refreshes every few seconds with listing count, volume, first place, takeover state, recent settlements, visitors, and outbound clicks. It does not show secrets, owner tokens, or checkout internals.
- Visitor figures count distinct visitors, not page views. A board view records one traffic fact carrying a random visitor cookie with no owner authority. Counts are `COUNT(DISTINCT visitor_key)` over windows; rows written before that cookie existed fall back to their own id and count once each.
- Viewing `/stats` or `/api/stats` records no traffic fact.
- `/rules` states the public contract: rank by static paid amount, owner-only raises while live, the falling takeover auction, identity rules, and refunds. Unmatched routes render a StarRank not-found page.
- Rules copy has one source, `src/content/rules.ts`. `/rules` renders it as HTML and `/rules.md` serves the same sections as Markdown, so the human and machine-readable versions cannot drift.
- `/llms.txt`, `/robots.txt`, and `/sitemap.xml` are static assets. The document head carries Organization, WebSite, and WebApplication JSON-LD whose claims also appear in visible copy.
- Local development uses mock checkout. Local and production boards show only D1-paid rows. Production never settles mock payments.

## Failure and boundary scenarios

- Replayed webhooks with the same payload hash are no-ops. The same event id with a different hash is quarantined.
- A late takeover payment never creates a second active lease. The receipt becomes `needs-support` and the lease is marked `needs-refund`.
- Refunds apply an absolute provider snapshot. Rank contribution is recomputed. Tax never contributes.
- Expiry blocks checkout reuse. Verified money that arrives late still settles.
- If a payment provider is configured, mock settlement is rejected. If none is configured, `/api/checkout` still reserves an intent and `/api/mock/settle` runs the paid planner.
- Missing owner-cookie signing with a provider configured refuses checkout. Local mock uses a local-only signing secret.

## Product constraints

- Amounts are integer cents, displayed as CNY (¥), minimum ¥10, step ¥1.
- Outbound targets open as sponsored placements.
- The mobile layout keeps the same interaction order without horizontal overflow.
- Remote D1 `starrank-db` (`51af159d-4584-44e2-86ef-78ba6424536b`) is live. The Worker is deployed on `starrank.lol/*`. Waffo keys are the production checkout config.

## Technical constraints

- D1 is the single authority for owners, listings, checkout intents, provider orders, webhook receipts, takeover leases, click facts, and traffic facts. There is no `board_state` table.
- Settlement and refund writes apply one planned D1 batch. Public rank changes only after that batch succeeds.
- Owner cookie is signed, HttpOnly, SameSite=Lax. Only the hashed token is stored.

## Verification surfaces

- `pnpm typecheck`
- `pnpm test`
- Deployed board: `https://starrank.lol`
- Local mock loop: POST `/api/checkout`, POST `/api/mock/settle`, then confirm the listing on `/` and `/stats`
- `/stats` polling, `/go/$listingId` click increment, `/receipts/$intentId` after return

## Related decisions

- `docs/decisions/0001-d1-payment-settlement.md`
