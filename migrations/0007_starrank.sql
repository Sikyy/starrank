-- StarRank: outbid-style static ranking.
-- Amounts never decay, so drops_off_at is meaningless; keep the column for
-- schema compatibility but stop reading it. Latest-activity needs the listing
-- link from intents joined through provider_orders.
CREATE INDEX provider_orders_occurred ON provider_orders(occurred_at DESC);
