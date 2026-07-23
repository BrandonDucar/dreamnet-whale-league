# Whale Intelligence League

Whale Intelligence League is a user-facing market intelligence terminal and competitive trading arena. It combines market-map discovery, interactive charting, public depth data, source-linked trader research, read-only wallet discovery, guided risk planning, AI-ranked setups, player-versus-player rounds, advanced paper orders, swap quotes, and verifiable receipts.

The first release contains one clearly disclosed simulation agent, **DOW JONES**. It ranks teaching setups using deterministic market heuristics and always exposes its thesis and invalidation condition. It does not create hidden traders or claim to predict future prices.

## What it does

- Renders an interactive physics-based crypto bubble map from public market data.
- Displays interactive price history using TradingView Lightweight Charts.
- Shows a public order-book depth ladder when the selected pair is available.
- Runs local player-versus-player paper matches where each trader chooses a market, direction, and playbook against the same clock.
- Includes a disclosed DOW JONES practice opponent and a first-run walkthrough that remains available from the top bar.
- Supports market, limit, stop, bracket, and TWAP paper-order workflows.
- Produces cross-network paper swap quotes with fee, impact, and slippage visibility.
- Lets a real person join locally with a display name and paper desk.
- Produces SHA-256 receipts and keeps a local paper order ledger.
- Connects an injected EVM wallet for public account and native-balance discovery without requesting signing authority.
- Offers 20 source-linked research templates: 10 institutional/traditional sources and 10 public onchain profiles.
- Lets users add a public trader, filing, profile, or wallet as a personal source.
- Supports observe, alert, and paper-copy follow modes.
- Captures a short risk interview and builds an explainable paper-plan draft.
- Defines the Postgres lineage, marketplace, mandate, policy, execution, alert, and receipt control plane for later server integration.
- Defines remote challenge, player-entry, round, and result tables without pretending the current local match code is an online invitation.
- Works across desktop and mobile layouts.

## What it does not do

- Store wallet private keys, seed phrases, venue signing keys, or session secrets.
- Place live orders, sign transactions, or move funds.
- Seed fake traders, fake community activity, or invented performance rankings.
- Predict market outcomes or provide financial advice.

When public APIs are unavailable, the interface fails over to clearly labeled teaching data and simulated depth so the learning tools remain usable without presenting fallback data as live.

Live Autopilot remains gated. Its design requires a complete portfolio coverage report, paper rehearsal, explicit time-limited mandate, mandatory execution alerts, deterministic policy checks, a non-withdrawing signer, independent oracle inputs, receipts, security review, and jurisdiction approval.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify

```bash
npm run check
npm run build
npm run qa:visual
```

## Data and chart attribution

- Market snapshots and historical price series: CoinGecko public API.
- Public market depth when available: Binance market-data-only API.
- Interactive financial chart rendering: [TradingView Lightweight Charts](https://www.tradingview.com/).
- Traditional trader research: source-linked SEC filings and official investment research.
- Onchain trader research: source-linked public Hyperliquid and Polymarket profiles.

## Architecture notes

- [Trader intelligence and Autopilot boundary](docs/TRADER_INTELLIGENCE_AND_AUTOPILOT.md)
- [Open-source trading stack audit](docs/OPEN_SOURCE_TRADING_STACK_AUDIT.md)
- [Postgres control-plane schema](db/001_trader_intelligence.sql)

## Product boundary

This repository is the interactive Svelte product. The public launch and explanation site lives separately in `dreamnet-whale-league-site`. Evidence schemas will move into the shared `dreamnet-evidence-core` package as the league expands beyond its first workout.

## License

Apache-2.0. See [LICENSE](LICENSE).
