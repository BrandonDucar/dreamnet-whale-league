# Whale League Founder Cup

## Purpose

Season 0 is the first public, measurable Whale League beta. It turns the
existing player-vs-player paper arena into a five-round qualifier without
inventing competitors, fills, results, or live-money capabilities.

## Current Product Boundary

- A signed-in member can enter the Founder Cup and receive an invite link.
- A member can complete local player-vs-player rounds on one shared clock.
- A member can rehearse against the single disclosed `DOW JONES` simulation
  agent.
- Every completed round emits a SHA-256 battle receipt.
- Standings are rebuilt deterministically from completed battle receipts.
- Three points are awarded for a win, one for a tie, and zero for a loss.
- Five completed rounds qualify a member for the next beta stage.
- All balances and stakes are `FKUSDC` paper values. No funds move.

## Explicitly Not Implemented

- Remote matchmaking or cross-device synchronized rounds.
- Server-authoritative tournament state.
- Live-money execution, custody, delegated signing, or copy trading.
- Fabricated users, standings, performance history, or trading activity.
- A hidden simulation fleet. `DOW JONES` is the only visible simulation agent.

## Receipt-Derived Standings

The client stores battle receipts under
`whale-player-battle-receipts-v2`. `buildTournamentStandings()` treats those
receipts as the only standings input. Empty receipts must produce an empty
leaderboard.

Each participant row includes:

- completed rounds;
- wins, losses, and ties;
- points;
- cumulative, average, and best directional return;
- simulation disclosure when the participant is `DOW JONES`.

## Next Backend Contract

The remote tournament service should add:

1. Farcaster Quick Auth validation at the edge.
2. An opaque player identifier for downstream events.
3. Durable invitations with expiry and one-time acceptance.
4. A Temporal match workflow that starts only after both players lock choices.
5. A server timestamp and immutable price snapshot from an approved market-data
   adapter.
6. Idempotent settlement and an immutable canonical receipt.
7. A transactional outbox for tournament events.
8. An independent Claim Factory that recomputes standings from receipts.

Auth infrastructure may map a validated Farcaster FID to an opaque player ID.
Telemetry and downstream tournament events must use the opaque ID and must not
include wallet addresses, emails, access tokens, or raw FIDs.

## Required Failure Behavior

- An expired or already-used invitation is rejected.
- A duplicate start or settlement request returns the original result.
- A missing or stale price snapshot blocks settlement.
- Receipt tampering invalidates the result and excludes it from standings.
- A worker restart resumes the existing match workflow.
- A disagreement between primary and independent standings turns the result
  yellow or red and blocks publication until reviewed.
- No failure path may fall through to live-money execution.

## Release Gates

Run:

```bash
npm run check
npm test
npm run build
npm run qa:visual
npm run farcaster:preflight
```

The first four commands must pass. Farcaster preflight remains blocked until
the account-association signature is created by the owner account and installed
in the manifest.
