-- Split the leaderboard into celebrity category boards (Korea / Japan /
-- Mainland China / North America). Existing listings default to 'kr' (they are
-- K-pop idols); the bid form lets a new bid pick a category.

ALTER TABLE listings ADD COLUMN category TEXT NOT NULL DEFAULT 'kr' CHECK (category IN ('kr','jp','cn','na'));
ALTER TABLE checkout_intents ADD COLUMN category TEXT NOT NULL DEFAULT 'kr' CHECK (category IN ('kr','jp','cn','na'));

CREATE INDEX listings_category_rank
  ON listings(category, (principal_paid_cents - principal_refunded_cents) DESC, settled_at DESC, id ASC);
