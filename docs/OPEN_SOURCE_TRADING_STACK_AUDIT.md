# Open-Source Trading Stack Audit

This audit extracts product and control-plane patterns. It does not copy branding, proprietary assets, or code whose license is incompatible with this application.

| Project | License posture | Pattern to adopt | Boundary |
| --- | --- | --- | --- |
| TradingView Lightweight Charts | Apache-2.0 | Canvas charting, stable series APIs, explicit attribution | Already used as a dependency |
| Coinbase OnchainKit | MIT | Wallet capability discovery, typed transaction states, batched-call fallback, sponsored-transaction verification | Reimplement the state machine for Svelte; do not import React UI |
| MetaMask Extension | Noncommercial source license | Separate permissions, approvals, keyring/signing, transaction, phishing, and notification controllers | Study only; do not copy production code |
| Uniswap Interface | GPL-3.0 for the web app | Quote freshness, stale/no-route states, route provenance, gas and sponsorship validation | Study only unless this app adopts GPL compatibility |
| GMX Interface | Business Source License 1.1, change date 2026-08-31 in the inspected source | Protective TP/SL orders, acceptable price, execution fee, edit/cancel lifecycle | Study only before the change date and re-check the converted license afterward |
| dYdX v4 Web | AGPL-3.0 plus project terms | Central transaction supervisor, reducer-driven trade form, orphaned trigger cleanup, close/cancel confirmations | Study only for a non-AGPL product |
| Binance Spot API docs | API documentation; no root license found in the inspected repository | Validate symbol filters, tick sizes, percent-price bounds, and order-event sequences locally | Use documented APIs; do not treat docs as reusable source code |
| Polymarket TypeScript SDK | MIT | Schema-validated responses, typed errors, max-spend/max-price controls, order expiry, builder attribution | Candidate isolated venue adapter; current SDK only |
| Hyperliquid Python SDK | MIT | API wallet with no withdrawal authority, expiring actions, public account ingestion | Candidate service-side adapter; use stricter slippage defaults |
| Kalshi official starter code and API specs | Official docs say OpenAPI/AsyncAPI are source of truth | RSA-PSS signing, fixed-point prices, WebSocket sequencing, idempotent client order IDs | Generate or maintain our own isolated client from current specs |
| Polygon Chain Indexer Framework | MIT in the inspected organization listing | Event-driven onchain ingestion and normalized consumers | Candidate portfolio/indexing service |
| Polygon Agent CLI | MIT in the inspected organization listing | Agent-facing chain tools | Evaluate separately; never grant signing authority by default |
| Polygon oracle integrations | Documentation for Chainlink, Chronicle, and Supra | Cross-source oracle quorum and stale/deviation checks | Inputs to policy; never a sole execution authority |

## Control patterns now required

### Quote state machine

Every quote is one of `loading`, `invalid`, `stale`, `no-route`, `valid`, or `expired`. A route includes source, block/sequence, fee, gas, price impact, and expiry. The app cannot promote a quote to execution without all mandatory fields.

### Transaction supervisor

Every transaction moves through `proposed -> policy-pending -> approved -> signing -> submitted -> partial/filled/failed/reverted`. Refresh or process death cannot erase ownership. Idempotency keys prevent a successor worker from replaying the same order.

### Capability and authority split

Portfolio scanners are read-only. Planners can propose. Policy can approve within a signed mandate. Signers can execute only the approved call/order. No component can expand its own authority.

### Venue adapter contract

Each venue adapter must normalize:

- instrument and account identifiers
- quote/order lifecycle
- tick, size, notional, leverage, and jurisdiction constraints
- sequence numbers and reconnect gaps
- idempotency and expiry
- fees, fills, cancellations, and failures
- source receipts and raw response hashes

### Protective execution

Live position creation requires an explicit exit policy. Where the venue supports it, protective orders are independent children whose lifecycle is supervised. Orphaned stops or take-profit orders must be detected and cancelled safely.

## DreamNet monorepo finding

The existing DreamNet market/oracle code is useful naming and integration scaffolding, not a live oracle:

- `FreeMarketDataIngestionService` starts with clearly labeled demo spikes.
- `PriceOracle` and `DreamBetOracle` only announce activation.
- `market-oracle-node` exposes service and health responses without market feeds.
- `MarketOrgan` keeps signals in memory and uses generated event IDs.

These components should not be wired into real-money execution until they are replaced or wrapped by source-linked, freshness-aware adapters with deterministic policy checks and receipts.

## Primary references

- <https://github.com/tradingview/lightweight-charts>
- <https://github.com/coinbase/onchainkit>
- <https://github.com/MetaMask/metamask-extension>
- <https://github.com/Uniswap/interface>
- <https://github.com/gmx-io/gmx-interface>
- <https://github.com/dydxprotocol/v4-web>
- <https://github.com/binance/binance-spot-api-docs>
- <https://github.com/Polymarket/ts-sdk>
- <https://github.com/hyperliquid-dex/hyperliquid-python-sdk>
- <https://github.com/Kalshi/kalshi-starter-code-python>
- <https://docs.kalshi.com/sdks/overview>
- <https://github.com/0xPolygon/chain-indexer-framework>
- <https://docs.polygon.technology/tools/oracles/getting-started>
