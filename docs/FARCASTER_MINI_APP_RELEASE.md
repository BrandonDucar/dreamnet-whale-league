# Farcaster Mini App release

Production URL:

`https://whale.dreamnet.ink/`

Mini App launch URL:

`https://whale.dreamnet.ink/?miniApp=true`

## Implemented

- `@farcaster/miniapp-sdk` with lazy loading for Mini App launches
- `sdk.actions.ready()` with a bounded timeout
- Farcaster host context for local paper-desk identity
- Host capability and chain detection
- Native Farcaster EVM provider when supported
- Server-verified Farcaster Quick Auth for Founder Cup entry and invitations
- One-use, expiring, revocable Founder Cup invitations backed by Cloudflare D1
- Fresh outbound share pass after an incoming invitation is accepted
- `addMiniApp`, `composeCast`, and haptics behind capability and manifest gates
- Safe-area support for mobile hosts
- Current `fc:miniapp` feed metadata
- Backward-compatible `fc:frame` metadata
- 1200x800 PNG feed image
- 1024x1024 PNG icon without alpha
- 200x200 PNG splash image
- 1284x2778 portrait discovery screenshot
- 1200x630 discovery and Open Graph hero

The app remains paper-only. Host wallet support is used only to read an address
and public balances into the simulator. No live transaction is requested.

The invitation boundary runs separately in the private
`BrandonDucar/dreamnet-whale-league-api` repository. It stores opaque player
IDs and one-way identity and invitation hashes. It does not store raw FIDs,
Quick Auth tokens, signatures, wallet addresses, or contact data.

## Remaining ownership step

Farcaster requires a signed account association for the exact production
domain. Generate it while signed into the `ghostmintops` Farcaster account:

1. Open `https://farcaster.xyz/~/developers/mini-apps/manifest`.
2. Use the domain `whale.dreamnet.ink`.
3. Enter the Mini App metadata below.
4. Download or copy the complete manifest.
5. Save it as `public/.well-known/farcaster.json`.
6. Set `VITE_FARCASTER_MANIFEST_READY=true` for the production build.
7. Run `npm run farcaster:preflight`.
8. Deploy and use Farcaster Developer Tools to refresh and audit the manifest
   and feed embed.

Do not set the manifest-ready flag before the signed file passes the preflight.

## Mini App metadata

```json
{
  "version": "1",
  "name": "Whale Intelligence League",
  "homeUrl": "https://whale.dreamnet.ink/?miniApp=true",
  "iconUrl": "https://whale.dreamnet.ink/whale-league-icon.png",
  "splashImageUrl": "https://whale.dreamnet.ink/whale-league-splash.png",
  "splashBackgroundColor": "#07060c",
  "subtitle": "Paper trading battle arena",
  "description": "Explore live markets, rehearse trades, study public whale activity, and compete in receipted player-versus-player paper rounds.",
  "screenshotUrls": [
    "https://whale.dreamnet.ink/whale-league-screenshot.png"
  ],
  "primaryCategory": "finance",
  "tags": [
    "papertrading",
    "markets",
    "wallets",
    "competition",
    "research"
  ],
  "heroImageUrl": "https://whale.dreamnet.ink/whale-league-wide.png",
  "tagline": "Trade the tape, not the hype",
  "ogTitle": "Whale Intelligence League",
  "ogDescription": "Live market intelligence and receipted paper trading battles.",
  "ogImageUrl": "https://whale.dreamnet.ink/whale-league-wide.png",
  "canonicalDomain": "whale.dreamnet.ink",
  "noindex": false,
  "requiredCapabilities": [
    "actions.ready"
  ]
}
```

Wallet and haptic capabilities are optional and detected at runtime so clients
without them can still run the market and paper-trading experience.
