# Adaptive Market Intelligence Roadmap

## Product position

Whale Intelligence League should not claim that an AI can reliably pick winning trades. Its durable product is an evidence-linked research system where users can:

- inspect public market and wallet behavior;
- compare competing theses;
- rehearse decisions in paper mode;
- understand disagreement and risk;
- preserve the evidence behind every decision;
- graduate strategies only after reproducible evaluation.

Promotional claims such as a specific win rate, Sharpe ratio, account return, number of trades analyzed, or reduction in losing trades are not product evidence until DreamNet can reproduce the dataset, query, assumptions, time window, fees, slippage, survivorship treatment, and result.

## Shipped foundation

The Whale Signal Lab uses Polymarket's public APIs directly:

- `GET https://data-api.polymarket.com/v1/leaderboard`
- `GET https://data-api.polymarket.com/activity`
- `GET https://gamma-api.polymarket.com/events`

The first release provides:

- category-aware trader rankings;
- day, week, month, and all-time windows;
- P&L and volume ranking modes;
- public-wallet watchlists stored locally;
- sample-derived behavior profiles;
- recent public activity with source links;
- top active event genomes based on public structural data;
- explicit sample-size and evidence limitations.

Wallet DNA currently measures only observable behavior in the returned sample:

- buy share;
- longshot and favorite price-band exposure;
- average and median ticket size;
- activity pace;
- market breadth;
- top-market concentration.

It does not infer identity, private intent, insider status, skill, causality, or future returns.

## Data architecture

Keep four object classes separate:

1. **Raw observations**
   Immutable public trades, activity, market state, source timestamp, and endpoint.

2. **Derived features**
   Pace, breadth, concentration, price-band bias, liquidity support, and market horizon.

3. **Claims**
   Falsifiable statements with evidence references, confidence, counterevidence, and expiry.

4. **Receipts**
   Reproducible records of the query, feature version, strategy version, decision, paper result, and verifier outcome.

The application should never silently turn a derived feature into a verified claim.

## Agent progression

### 1. Market Genome Observer

Maintains a changing profile for each market:

- creator and resolution history;
- liquidity and spread evolution;
- open interest;
- holder concentration;
- social and news velocity;
- related-market dependencies;
- manipulation and anomaly evidence.

### 2. Wallet DNA Profiler

Creates versioned, sample-bounded behavioral profiles and detects regime changes without assigning real-world identities.

### 3. Whale Arrival Forecaster

Predicts which observed wallet cohorts may enter a market. It must publish calibrated probabilities and abstain when evidence is weak.

### 4. Agent Reputation Registry

Scores each specialist by domain, calibration, abstention quality, realized paper outcomes, and evidence completeness. Decision weight follows demonstrated competency, not model brand.

### 5. Strategy Evolution Lab

Forks strategies, runs controlled paper comparisons, records failures, and retires versions that no longer survive current regimes.

### 6. Digital Twin Simulator

Replays candidate strategies across historical and perturbed market states before a strategy can request promotion.

### 7. Opportunity Graph

Links prediction markets, crypto, equities, rates, options, news, and social events so agents can reason about propagation instead of isolated symbols.

### 8. Temporal Pattern Memory

Retrieves prior market states by evidence-linked similarity and records whether analogies remained predictive after use.

### 9. Adversarial Trade Reviewer

Must answer:

- What would make this thesis false?
- What material evidence is missing?
- Which observations may be stale or correlated?
- What is the strongest counter-position?
- Why should the system abstain?

### 10. Capital Governor

Remains paper-only until legal, security, identity, venue, custody, and execution controls are independently approved. It should enforce exposure, correlation, drawdown, liquidity, slippage, and revocation limits before any live mandate exists.

## Promotion ladder

```text
Observation
  -> derived feature
  -> falsifiable claim
  -> historical replay
  -> adversarial review
  -> paper strategy
  -> forward paper evaluation
  -> independent receipt verification
  -> human approval
  -> narrowly scoped live pilot
```

No strategy advances because agents voted for it. Promotion requires evidence and a passing policy gate.

## Next implementation slices

1. Persist public observations and feature snapshots in the existing trader-intelligence schema.
2. Add source timestamps, query hashes, and versioned feature receipts.
3. Add holder concentration and market-level whale overlap.
4. Build cross-category wallet specialization histories.
5. Add weighted paper quorum with explicit dissent and abstention.
6. Add strategy versioning and forward paper scorecards.
7. Add an opportunity graph spanning prediction, crypto, equities, rates, and news.
8. Add a user-facing evidence drawer for every metric and signal.
