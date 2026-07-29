# Whale League Beta Telemetry Contract

## Purpose

Measure whether a new player can complete the paper-only path:

`open -> identity -> desk -> wallet/watch address -> scan -> plan -> paper trade -> battle receipt`

Telemetry is operational evidence, not a user profile. It must never grant trading
authority, trigger an order, or contain a wallet address or direct identifier.

## Client contract

The browser sends `POST` requests to `VITE_WHALE_TELEMETRY_ENDPOINT` with:

```json
{
  "id": "event:<uuid>",
  "name": "paper_order_recorded",
  "occurredAt": "2026-07-29T12:00:00.000Z",
  "sessionId": "session:<uuid>",
  "release": "0.2.0-beta",
  "properties": {
    "environment": "desk",
    "mode": "paper"
  }
}
```

Allowed event names are defined in `src/lib/telemetry.ts`. The client keeps the
latest 200 events locally when no endpoint is configured or delivery fails.

## Privacy boundary

Reject any property key containing:

- address
- email
- fid
- name
- username
- wallet
- secret
- token
- signature

Do not infer or store direct identity from IP address, user agent, Quick Auth,
connected wallets, or RPC requests. A beta session is an opaque client-generated
identifier and is not an authentication credential.

## Ingestion requirements

- Validate the exact event schema and event-name allowlist.
- Enforce `Content-Type: application/json` and a small request-body limit.
- Make `event.id` idempotent.
- Rate-limit by short-lived transport characteristics without persisting them.
- Return `202` after durable acceptance, not after downstream analysis.
- Expose `/live`, `/ready`, and redacted aggregate metrics.
- Preserve the raw accepted event as an append-only receipt.
- Normalize before publishing `whale.beta.events.v1`.
- Never put wallet addresses or direct identifiers on Kafka, Temporal, logs, or
  the Memory Grid.

## Workflow boundary

A Temporal workflow may aggregate anonymous milestones into a beta-journey
receipt. A Claim Factory may derive product claims such as completion rate or
common abandonment step only from aggregate, receipted evidence. An independent
Claim Factory must verify public claims before publication.

No beta event may:

- submit or approve a live transaction
- hold or request a private key
- authorize silent copy trading
- change a user's portfolio
- promote paper results as expected financial performance

## Release gates

Before enabling remote ingestion:

1. Unit-test schema rejection, idempotency, rate limits, and PII-key rejection.
2. Verify paper-only events cannot reach execution services.
3. Verify duplicate delivery produces one durable event.
4. Verify downstream outage does not lose the accepted receipt.
5. Run one synthetic journey and publish a sanitized verification receipt.
