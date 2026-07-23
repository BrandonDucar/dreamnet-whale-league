-- Evidence-linked public market and wallet intelligence.
-- This migration stores public observations and derived snapshots separately so
-- a feature calculation can never overwrite or impersonate raw source evidence.

CREATE TABLE IF NOT EXISTS external_market_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue text NOT NULL,
  external_market_id text NOT NULL,
  slug text,
  title text NOT NULL,
  source_url text NOT NULL,
  first_observed_at timestamptz NOT NULL,
  last_observed_at timestamptz NOT NULL,
  retired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue, external_market_id)
);

CREATE TABLE IF NOT EXISTS market_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_entity_id uuid NOT NULL REFERENCES external_market_entities(id) ON DELETE CASCADE,
  observed_at timestamptz NOT NULL,
  source_endpoint text NOT NULL,
  volume_24h_usd numeric(30, 8),
  liquidity_usd numeric(30, 8),
  open_interest_usd numeric(30, 8),
  competition_score numeric(8, 6),
  listed_end_at timestamptz,
  resolution_source text,
  restricted boolean,
  raw_payload jsonb NOT NULL,
  content_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_entity_id, content_hash)
);

CREATE INDEX IF NOT EXISTS market_observations_entity_time_idx
  ON market_observations (market_entity_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS public_wallet_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue text NOT NULL,
  public_address text NOT NULL,
  public_name text,
  profile_url text NOT NULL,
  identity_status text NOT NULL DEFAULT 'unattributed'
    CHECK (identity_status IN ('unattributed', 'self-asserted', 'venue-verified', 'disputed')),
  first_observed_at timestamptz NOT NULL,
  last_observed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue, public_address),
  CONSTRAINT public_wallet_entities_address_shape
    CHECK (length(public_address) BETWEEN 8 AND 160)
);

CREATE TABLE IF NOT EXISTS wallet_leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_entity_id uuid NOT NULL REFERENCES public_wallet_entities(id) ON DELETE CASCADE,
  observed_at timestamptz NOT NULL,
  category text NOT NULL,
  time_period text NOT NULL,
  order_by text NOT NULL CHECK (order_by IN ('pnl', 'volume')),
  rank integer NOT NULL CHECK (rank > 0),
  pnl_usd numeric(30, 8),
  volume_usd numeric(30, 8),
  source_endpoint text NOT NULL,
  raw_payload jsonb NOT NULL,
  content_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_entity_id, category, time_period, order_by, observed_at)
);

CREATE INDEX IF NOT EXISTS wallet_leaderboard_category_time_idx
  ON wallet_leaderboard_snapshots (category, time_period, order_by, observed_at DESC, rank);

CREATE TABLE IF NOT EXISTS public_wallet_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_entity_id uuid NOT NULL REFERENCES public_wallet_entities(id) ON DELETE CASCADE,
  venue_event_id text,
  transaction_hash text,
  market_external_id text,
  activity_kind text NOT NULL,
  side text CHECK (side IS NULL OR side IN ('buy', 'sell')),
  outcome text,
  price numeric(20, 10),
  notional_usd numeric(30, 8),
  occurred_at timestamptz NOT NULL,
  observed_at timestamptz NOT NULL,
  source_endpoint text NOT NULL,
  raw_payload jsonb NOT NULL,
  content_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_entity_id, content_hash)
);

CREATE INDEX IF NOT EXISTS public_wallet_activity_wallet_time_idx
  ON public_wallet_activity (wallet_entity_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS wallet_behavior_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_entity_id uuid NOT NULL REFERENCES public_wallet_entities(id) ON DELETE CASCADE,
  feature_version text NOT NULL,
  sample_started_at timestamptz,
  sample_ended_at timestamptz,
  sample_size integer NOT NULL CHECK (sample_size >= 0),
  activity_event_ids jsonb NOT NULL,
  features jsonb NOT NULL,
  behavior_label text,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_behavior_wallet_created_idx
  ON wallet_behavior_snapshots (wallet_entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS market_genome_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_entity_id uuid NOT NULL REFERENCES external_market_entities(id) ON DELETE CASCADE,
  feature_version text NOT NULL,
  observation_ids jsonb NOT NULL,
  features jsonb NOT NULL,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_genome_entity_created_idx
  ON market_genome_snapshots (market_entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS market_intelligence_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_kind text NOT NULL CHECK (subject_kind IN ('market', 'wallet', 'strategy', 'cross-market')),
  subject_id uuid,
  statement text NOT NULL,
  status text NOT NULL CHECK (status IN ('proposed', 'supported', 'disputed', 'falsified', 'expired')),
  confidence numeric(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  evidence_refs jsonb NOT NULL,
  counterevidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_context jsonb NOT NULL DEFAULT '[]'::jsonb,
  method_version text NOT NULL,
  expires_at timestamptz,
  content_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public_wallet_entities IS
  'Public venue identifiers only. A listed wallet is not a verified real-world identity.';
COMMENT ON TABLE wallet_behavior_snapshots IS
  'Sample-bounded derived features. Never treat a behavior label as identity, intent, or future-performance proof.';
COMMENT ON TABLE market_intelligence_claims IS
  'Falsifiable statements linked to evidence and counterevidence. Claims are separate from raw observations.';
