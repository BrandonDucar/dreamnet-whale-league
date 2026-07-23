-- Whale Intelligence League control-plane schema.
-- Public addresses are permitted. Private keys, seed phrases, API signing keys,
-- and session-key secrets are explicitly forbidden from every table below.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject text UNIQUE,
  display_name text,
  jurisdiction_country text,
  jurisdiction_region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  chain_namespace text NOT NULL,
  chain_id text NOT NULL,
  public_address text NOT NULL,
  wallet_kind text NOT NULL DEFAULT 'injected',
  verified_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chain_namespace, chain_id, public_address),
  CONSTRAINT wallet_accounts_public_only CHECK (length(public_address) BETWEEN 8 AND 160)
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  wallet_account_id uuid REFERENCES wallet_accounts(id) ON DELETE SET NULL,
  observed_at timestamptz NOT NULL,
  source_count integer NOT NULL DEFAULT 0 CHECK (source_count >= 0),
  total_value_usd numeric(30, 8),
  positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  liabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_receipts jsonb NOT NULL DEFAULT '[]'::jsonb,
  completeness numeric(5, 4) NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 1),
  content_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  experience_level text NOT NULL CHECK (experience_level IN ('new', 'active', 'advanced')),
  primary_goal text NOT NULL CHECK (primary_goal IN ('learn', 'growth', 'income', 'preservation')),
  risk_posture text NOT NULL CHECK (risk_posture IN ('conservative', 'balanced', 'aggressive')),
  time_horizon text NOT NULL CHECK (time_horizon IN ('intraday', 'weeks', 'months', 'years')),
  max_daily_loss_usd numeric(20, 2) NOT NULL CHECK (max_daily_loss_usd > 0),
  max_position_pct numeric(7, 4) NOT NULL CHECK (max_position_pct > 0 AND max_position_pct <= 1),
  leverage_ceiling numeric(8, 3) NOT NULL DEFAULT 1 CHECK (leverage_ceiling >= 1),
  preferred_assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  automation_preference text NOT NULL CHECK (automation_preference IN ('alerts', 'supervised', 'autopilot')),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  consented_at timestamptz NOT NULL,
  superseded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trader_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  operator_label text,
  market text NOT NULL CHECK (market IN ('traditional', 'crypto', 'prediction')),
  source_kind text NOT NULL CHECK (source_kind IN ('sec-13f', 'official-research', 'onchain-wallet', 'leaderboard-profile', 'venue-api', 'user-source')),
  verification_status text NOT NULL CHECK (verification_status IN ('verified-primary', 'verified-onchain', 'user-supplied', 'quarantined', 'retired')),
  public_identity text,
  source_url text NOT NULL,
  strategy_summary text NOT NULL,
  expected_delay_seconds bigint CHECK (expected_delay_seconds IS NULL OR expected_delay_seconds >= 0),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trader_source_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_source_id uuid NOT NULL REFERENCES trader_sources(id) ON DELETE CASCADE,
  event_kind text NOT NULL,
  venue text,
  external_event_id text,
  occurred_at timestamptz,
  observed_at timestamptz NOT NULL,
  raw_payload jsonb NOT NULL,
  source_url text NOT NULL,
  content_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trader_source_id, content_hash)
);

CREATE TABLE IF NOT EXISTS world_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spike_id text NOT NULL,
  category text NOT NULL,
  subject text NOT NULL,
  observed_at timestamptz NOT NULL,
  expires_at timestamptz,
  confidence numeric(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  trust_state text NOT NULL CHECK (trust_state IN ('verified', 'provisional', 'disputed', 'quarantined')),
  payload jsonb NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS world_signals_subject_time_idx ON world_signals (subject, observed_at DESC);
CREATE INDEX IF NOT EXISTS world_signals_spike_time_idx ON world_signals (spike_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS trader_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_source_id uuid NOT NULL REFERENCES trader_sources(id) ON DELETE CASCADE,
  source_event_id uuid REFERENCES trader_source_events(id) ON DELETE SET NULL,
  instrument_namespace text NOT NULL,
  instrument_id text NOT NULL,
  signal_kind text NOT NULL CHECK (signal_kind IN ('observe', 'entry', 'exit', 'increase', 'decrease', 'hedge', 'research')),
  side text CHECK (side IS NULL OR side IN ('buy', 'sell', 'yes', 'no', 'long', 'short')),
  observed_at timestamptz NOT NULL,
  source_delay_seconds bigint NOT NULL DEFAULT 0 CHECK (source_delay_seconds >= 0),
  confidence numeric(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  payload jsonb NOT NULL,
  content_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signal_lineage (
  parent_kind text NOT NULL CHECK (parent_kind IN ('source-event', 'world-signal', 'trader-signal', 'plan', 'intent', 'execution')),
  parent_id uuid NOT NULL,
  child_kind text NOT NULL CHECK (child_kind IN ('world-signal', 'trader-signal', 'plan', 'intent', 'execution', 'receipt')),
  child_id uuid NOT NULL,
  relationship text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_kind, parent_id, child_kind, child_id, relationship)
);

CREATE TABLE IF NOT EXISTS trader_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  trader_source_id uuid REFERENCES trader_sources(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  configuration jsonb NOT NULL,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public', 'paid')),
  monthly_price_usd numeric(12, 2) CHECK (monthly_price_usd IS NULL OR monthly_price_usd >= 0),
  verification_status text NOT NULL DEFAULT 'draft' CHECK (verification_status IN ('draft', 'paper-testing', 'verified', 'suspended', 'retired')),
  performance_disclosure jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_version text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trader_follows (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  trader_template_id uuid NOT NULL REFERENCES trader_templates(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('observe', 'alerts', 'paper-copy', 'live-autopilot')),
  paused_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, trader_template_id)
);

CREATE TABLE IF NOT EXISTS trading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  portfolio_snapshot_id uuid REFERENCES portfolio_snapshots(id) ON DELETE SET NULL,
  risk_profile_id uuid NOT NULL REFERENCES risk_profiles(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('proposed', 'paper-testing', 'approved', 'superseded', 'rejected')),
  allocations jsonb NOT NULL,
  risk_limits jsonb NOT NULL,
  source_template_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  world_signal_cutoff timestamptz NOT NULL,
  rationale_claims jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_context jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS copy_mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  wallet_account_id uuid NOT NULL REFERENCES wallet_accounts(id) ON DELETE RESTRICT,
  trading_plan_id uuid NOT NULL REFERENCES trading_plans(id) ON DELETE RESTRICT,
  mode text NOT NULL CHECK (mode IN ('paper-copy', 'live-autopilot')),
  status text NOT NULL CHECK (status IN ('draft', 'paper-testing', 'active', 'paused', 'expired', 'revoked')),
  venue_allowlist jsonb NOT NULL,
  chain_allowlist jsonb NOT NULL,
  asset_allowlist jsonb NOT NULL,
  max_position_usd numeric(20, 2) NOT NULL CHECK (max_position_usd > 0),
  max_daily_loss_usd numeric(20, 2) NOT NULL CHECK (max_daily_loss_usd > 0),
  max_weekly_loss_usd numeric(20, 2) NOT NULL CHECK (max_weekly_loss_usd >= max_daily_loss_usd),
  max_slippage_bps integer NOT NULL CHECK (max_slippage_bps BETWEEN 1 AND 1000),
  max_leverage numeric(8, 3) NOT NULL CHECK (max_leverage >= 1),
  withdrawals_allowed boolean NOT NULL DEFAULT false CHECK (withdrawals_allowed = false),
  session_public_key text,
  signed_mandate_hash text,
  starts_at timestamptz,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS copy_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid NOT NULL REFERENCES copy_mandates(id) ON DELETE RESTRICT,
  trader_signal_id uuid REFERENCES trader_signals(id) ON DELETE SET NULL,
  venue text NOT NULL,
  instrument_id text NOT NULL,
  action text NOT NULL,
  requested_quantity numeric(30, 12),
  requested_notional_usd numeric(20, 2),
  limit_price numeric(30, 12),
  max_spend_usd numeric(20, 2),
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('proposed', 'policy-pending', 'approved', 'rejected', 'submitted', 'expired', 'cancelled')),
  idempotency_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL REFERENCES copy_intents(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('allow', 'deny', 'require-human')),
  checks jsonb NOT NULL,
  denied_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_version text NOT NULL,
  content_hash text NOT NULL UNIQUE,
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS copy_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL UNIQUE REFERENCES copy_intents(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('signing', 'submitted', 'partial', 'filled', 'failed', 'cancelled', 'reverted')),
  venue_order_id text,
  transaction_hash text,
  executed_quantity numeric(30, 12),
  average_price numeric(30, 12),
  fees_usd numeric(20, 8),
  slippage_bps integer,
  submitted_at timestamptz,
  completed_at timestamptz,
  raw_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS execution_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES copy_executions(id) ON DELETE SET NULL,
  intent_id uuid NOT NULL REFERENCES copy_intents(id) ON DELETE RESTRICT,
  receipt_kind text NOT NULL CHECK (receipt_kind IN ('proposed', 'policy', 'started', 'fill', 'dump', 'failure', 'paused', 'limit-hit', 'completed')),
  canonical_payload jsonb NOT NULL,
  content_hash text NOT NULL UNIQUE,
  signature text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES execution_receipts(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('push', 'email', 'telegram', 'sms', 'in-app')),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  status text NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'acknowledged')),
  provider_message_id text,
  attempted_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (receipt_id, channel)
);

CREATE TABLE IF NOT EXISTS strategy_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_template_id uuid NOT NULL REFERENCES trader_templates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('paper-copy', 'live-autopilot')),
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  realized_pnl_usd numeric(20, 8),
  max_drawdown_pct numeric(9, 6),
  turnover_usd numeric(30, 8),
  metrics jsonb NOT NULL,
  evidence_receipt_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trader_template_id, user_id, mode, window_start, window_end)
);

CREATE TABLE IF NOT EXISTS data_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('portfolio-analysis', 'strategy-personalization', 'aggregate-benchmarking', 'marketplace-performance', 'marketing')),
  granted boolean NOT NULL,
  terms_version text NOT NULL,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row-level security policies are deployment-specific because the identity
-- provider has not been selected. Enable RLS before exposing these tables.
COMMENT ON TABLE wallet_accounts IS 'Public wallet identifiers only. Never store wallet secrets.';
COMMENT ON TABLE copy_mandates IS 'Revocable, bounded authority. Withdrawals are prohibited by constraint.';
COMMENT ON TABLE alert_deliveries IS 'Mandatory execution-state notifications and acknowledgement trail.';
