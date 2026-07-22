# Whale Intelligence League

Whale Intelligence League is a user-facing paper learning app for practicing market decisions without connecting a wallet, exchange account, or payment method.

The first release contains one clearly disclosed simulation agent, **DOW JONES**, which teaches an exposure workout. A member chooses the paper balance, strategy, and hypothetical outcome. The app then issues a SHA-256 receipt containing the exact inputs and result.

## What it does

- Lets a real person join locally with a display name and paper team name.
- Runs a bounded, educational paper scenario.
- Compares different exposure levels against the same selected outcome.
- Produces a deterministic-format SHA-256 receipt.
- Persists the member and latest receipt in browser storage.
- Works across desktop and mobile layouts.

## What it does not do

- Connect wallets, exchanges, or payment methods.
- Place orders, sign transactions, or move funds.
- Seed fake traders, rankings, returns, or live quotes.
- Predict market outcomes or provide financial advice.

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
```

## Product boundary

This repository is the interactive Svelte product. The public launch and explanation site lives separately in `dreamnet-whale-league-site`. Evidence schemas will move into the shared `dreamnet-evidence-core` package as the league expands beyond its first workout.

## License

Apache-2.0. See [LICENSE](LICENSE).
