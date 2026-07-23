# Trader Intelligence and Autopilot Boundary

## Product flow

The user experience is intentionally linear even though the underlying system is strict:

1. Connect one or more wallets read-only.
2. Discover holdings and open positions across supported chains and venues.
3. Show coverage, freshness, missing accounts, liabilities, and unknown assets.
4. Ask a short risk and objective interview.
5. Offer source-linked trader templates or a custom public source.
6. Generate an explainable trading plan with explicit missing context.
7. Rehearse the plan in paper mode.
8. Create a time-limited, revocable execution mandate only after the rehearsal passes.
9. Alert on start, proposal, fill, dump/exit, failure, pause, limit hit, and completion.
10. Preserve every decision and execution as a receipt.

There is no silent mode. Notification preferences may select delivery channels, but they cannot suppress critical execution events or remove activity from the ledger.

## Wallet boundary

- The browser requests public account access from an injected wallet.
- Portfolio discovery is read-only and stores public addresses plus source-linked snapshots.
- DreamNet never stores seed phrases, private keys, exchange API secrets, or session-key secrets in Postgres.
- Live automation requires an audited smart-account/session-key design with venue, asset, chain, notional, slippage, leverage, loss, and expiry limits.
- A trading delegate can never withdraw, transfer to arbitrary recipients, change its own limits, or renew itself.
- Users can pause or revoke a mandate immediately.

## Portfolio discovery

One wallet address is not a full portfolio. The scanner must union:

- EVM balances, tokens, NFTs, lending positions, LP positions, and perpetuals.
- Solana accounts when the user connects a Solana wallet.
- Centralized venue positions only through separate, read-only API credentials.
- Kalshi and other regulated venue positions through their authenticated portfolio APIs.
- Prediction-market positions from venue APIs and public onchain settlement data.
- Liabilities, borrows, collateral, pending orders, and bridge transactions.

Every provider receives a freshness timestamp and a coverage score. The planner must abstain from live recommendations when the portfolio is materially incomplete.

## Risk interview

The first interview should ask only what materially changes the plan:

- Experience level.
- Primary goal: learn, growth, income, or preservation.
- Time horizon.
- Maximum daily loss in dollars.
- Maximum position size as a percentage of discovered net value.
- Leverage ceiling.
- Asset and venue exclusions.
- Preference for alerts, supervised execution, or autopilot.
- Interest in following a verified template or adding a custom source.

Changing the answers supersedes the old plan and requires a new mandate signature.

## Trader templates and marketplace

Templates are source-linked strategies, not identity claims or guaranteed returns. A creator may keep one private, share it unlisted, publish it for free, or charge for access after the template passes paper testing and disclosure review.

A publishable template needs:

- Public source identities and source delays.
- Exact transformation from source event to proposed order.
- Risk limits and supported venues.
- Paper and live performance separated clearly.
- Fees, slippage, turnover, and maximum drawdown.
- Receipts sufficient to reproduce the published metrics.
- A suspension path when the source disappears, changes behavior, or becomes disputed.

Revenue should come from template subscriptions, execution infrastructure, premium intelligence, and opt-in aggregate benchmarks. Raw private user trading behavior must not be resold without specific, revocable consent.

## Oracle quorum

The oracle is not one agent and not one price feed. It is a deterministic verification boundary:

1. Venue quote and order-book state.
2. Independent market-data provider.
3. Chainlink or another supported decentralized feed where applicable.
4. Onchain pool state for the execution route.
5. Prediction-market lifecycle and resolution state for event contracts.
6. Freshness, confidence, and cross-source deviation checks.

An execution is denied when the sources are stale, the deviation is above policy, a market is halted/closed, or the route cannot be reproduced. Polygon's current documentation supports Chainlink, Chronicle, and Supra integrations; these are oracle inputs, not permission to execute.

For Kalshi, the official REST OpenAPI and WebSocket AsyncAPI specifications are the production source of truth. SDKs may help during development but can lag the API. Authentication uses API keys and RSA-PSS request signing, which belongs in an isolated venue adapter, never the browser bundle.

## DreamNet 75-spike enrichment

All specialized spikes may contribute world variables to a plan, but no probabilistic agent can authorize a trade. Each world signal carries:

- `spike_id`
- subject and category
- observed and expiry timestamps
- evidence references
- confidence and trust state
- lineage into any derived trader signal or plan

The planner can use verified variables for scenario analysis, regime classification, correlation warnings, and position sizing. The deterministic mandate and policy engine remains the final authority.

## Runtime

```text
Wallets and venue accounts
        -> read-only scanners
        -> portfolio snapshot + coverage
        -> risk interview
        -> planning agents + 75-spike world context
        -> claim and oracle verification
        -> paper rehearsal
        -> signed bounded mandate
        -> deterministic policy gate
        -> venue adapter / smart account
        -> alerts + receipts + outcome metrics
```

Recommended deployment split:

- Svelte app: user control surface and wallet interaction.
- Cloudflare Worker: authenticated API edge and read-only public ingestion.
- Neon Postgres: source of truth for profiles, snapshots, plans, mandates, lineage, and receipts.
- NATS JetStream: internal DreamNet event circulation and replay.
- Isolated signer/venue adapter: live execution, separate from the web app and general agent runtime.

## Rollout gates

1. Read-only wallet connection and portfolio coverage report.
2. Risk interview and explainable plan.
3. Trader-source following and alerts.
4. Paper copy with complete receipts.
5. Template marketplace in paper mode.
6. External security review, legal review, and venue-specific sandbox tests.
7. Small-value supervised execution.
8. Revocable live autopilot only after measured reliability and jurisdiction approval.
