# Whale Intelligence League

Whale Intelligence League is a user-facing market intelligence terminal and competitive paper trading arena. It combines market-map discovery, interactive charting, public depth data, AI-ranked setups, head-to-head rounds, advanced paper orders, swap quotes, and verifiable receipts without connecting a wallet, exchange account, or payment method.

The first release contains one clearly disclosed simulation agent, **DOW JONES**. It ranks teaching setups using deterministic market heuristics and always exposes its thesis and invalidation condition. It does not create hidden traders or claim to predict future prices.

## What it does

- Renders an interactive physics-based crypto bubble map from public market data.
- Displays interactive price history using TradingView Lightweight Charts.
- Shows a public order-book depth ladder when the selected pair is available.
- Runs 60-second asset-vs-asset paper battles based on relative return.
- Supports market, limit, stop, bracket, and TWAP paper-order workflows.
- Produces cross-network paper swap quotes with fee, impact, and slippage visibility.
- Lets a real person join locally with a display name and paper desk.
- Produces SHA-256 receipts and keeps a local paper order ledger.
- Works across desktop and mobile layouts.

## What it does not do

- Connect wallets, exchanges, or payment methods.
- Place live orders, sign transactions, or move funds.
- Seed fake traders, fake community activity, or invented performance rankings.
- Predict market outcomes or provide financial advice.

When public APIs are unavailable, the interface fails over to clearly labeled teaching data and simulated depth so the learning tools remain usable without presenting fallback data as live.

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

## Product boundary

This repository is the interactive Svelte product. The public launch and explanation site lives separately in `dreamnet-whale-league-site`. Evidence schemas will move into the shared `dreamnet-evidence-core` package as the league expands beyond its first workout.

## License

Apache-2.0. See [LICENSE](LICENSE).
