<script lang="ts">
  import { Check, Copy, Download, ExternalLink, FileCheck2, ShieldCheck } from '@lucide/svelte'
  import {
    buildTradingTrapper,
    convertToWarperBundle,
    downloadJson,
    tradingViewUrl,
    type TradingTrapper,
    type TradingTrapperDraft,
    type TradingTrapperDirection,
  } from './tradingTrappers'
  import type { MarketAsset } from './types'

  export let asset: MarketAsset
  export let chartDays: number
  export let chartMode: 'live' | 'fallback'
  export let suggestedDirection: TradingTrapperDirection = 'neutral'
  export let suggestedThesis = ''
  export let suggestedInvalidation = ''
  export let suggestedConfidence = 0.5
  export let paperPositionUsd = 250
  export let stopPrice = 0
  export let takeProfitPrice = 0
  export let maxSlippageBps = 50
  export let onbuilt: (trapper: TradingTrapper) => void = () => undefined

  let seededAssetId = ''
  let expanded = false
  let direction: TradingTrapperDirection = 'neutral'
  let thesis = ''
  let invalidation = ''
  let entryCondition = ''
  let targetPrice = 0
  let maxPaperLossUsd = 12.5
  let tradingViewSourceUrl = ''
  let sourceNote = ''
  let busy = false
  let error = ''
  let notice = ''
  let latest: TradingTrapper | null = null
  let copied = false

  $: if (asset.id !== seededAssetId) seedFromMarket()

  function seedFromMarket() {
    seededAssetId = asset.id
    direction = suggestedDirection
    thesis = suggestedThesis || `${asset.symbol} is selected for a paper-only market structure review.`
    invalidation = suggestedInvalidation || 'The observed market structure no longer supports the thesis.'
    entryCondition = `Wait for a confirmed ${direction === 'short' ? 'breakdown' : direction === 'long' ? 'breakout or supported retest' : 'directional setup'} before recording a paper order.`
    targetPrice = takeProfitPrice > 0 ? takeProfitPrice : asset.price * (direction === 'short' ? 0.96 : 1.04)
    maxPaperLossUsd = Math.max(1, paperPositionUsd * 0.05)
    tradingViewSourceUrl = tradingViewUrl(asset)
    sourceNote = ''
    latest = null
    notice = ''
    error = ''
  }

  function bounded(value: number, minimum: number, maximum: number) {
    return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum))
  }

  async function build() {
    error = ''
    notice = ''
    if (!thesis.trim() || !invalidation.trim() || !entryCondition.trim()) {
      error = 'Add a thesis, entry condition, and invalidation before building the Trapper.'
      return
    }
    if (paperPositionUsd <= 0 || maxPaperLossUsd < 0 || maxPaperLossUsd > paperPositionUsd) {
      error = 'Paper size must be positive and maximum loss cannot exceed the paper position.'
      return
    }

    busy = true
    try {
      const observedAt = new Date().toISOString()
      const evidence: TradingTrapperDraft['evidence'] = [
        {
          id: `evidence:whale-chart:${crypto.randomUUID()}`,
          provider: 'market-api' as const,
          title: `${asset.symbol} Whale League chart observation`,
          observedAt,
          url: 'https://whale.dreamnet.ink',
          note: `Rendered with TradingView Lightweight Charts from ${chartMode === 'live' ? 'public market data' : 'clearly labeled teaching data'}.`,
        },
      ]
      if (tradingViewSourceUrl.trim()) {
        evidence.push({
          id: `evidence:tradingview:${crypto.randomUUID()}`,
          provider: 'tradingview-desktop-user-export' as const,
          title: `${asset.symbol} TradingView research reference`,
          observedAt,
          url: tradingViewSourceUrl.trim(),
          note: sourceNote.trim() || 'User-provided TradingView chart reference. No TradingView data was copied or redistributed.',
        })
      }

      latest = await buildTradingTrapper({
        title: `${asset.symbol} ${direction} paper setup`,
        status: 'ready',
        observation: {
          symbol: `${asset.symbol}${asset.assetType === 'stock' ? '' : 'USD'}`,
          displayName: asset.name,
          assetClass: asset.assetType === 'stock' ? 'equity' : asset.assetType === 'crypto' ? 'crypto' : 'other',
          timeframe: chartDays === 1 ? '1d' : `${chartDays}d`,
          observedAt,
          referencePrice: asset.price,
          priceCurrency: 'USD',
          dataMode: chartMode === 'live' ? 'live' : 'teaching',
        },
        setup: {
          direction,
          thesis: thesis.trim(),
          invalidation: invalidation.trim(),
          entryCondition: entryCondition.trim(),
          targetPrices: targetPrice > 0 ? [targetPrice] : [],
          confidence: bounded(suggestedConfidence, 0, 1),
        },
        risk: {
          paperPositionUsd,
          maxPaperLossUsd,
          ...(stopPrice > 0 ? { stopPrice } : {}),
          ...(targetPrice > 0 ? { takeProfitPrice: targetPrice } : {}),
          maxSlippageBps: bounded(maxSlippageBps, 0, 10_000),
        },
        evidence,
        tags: [asset.symbol.toLowerCase(), direction, 'paper', 'whale-league'],
        agent: {
          organism: 'DreamNet',
          agentId: 'whale-league-trapper-builder',
          model: 'human-reviewed-market-context',
        },
      })
      const saved = JSON.parse(localStorage.getItem('whale-trading-trappers-v1') ?? '[]') as TradingTrapper[]
      localStorage.setItem('whale-trading-trappers-v1', JSON.stringify([latest, ...saved].slice(0, 25)))
      notice = 'Trading Trapper verified and saved to this paper desk.'
      onbuilt(latest)
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Trading Trapper could not be created.'
    } finally {
      busy = false
    }
  }

  async function copyLatest() {
    if (!latest) return
    await navigator.clipboard.writeText(JSON.stringify(latest, null, 2))
    copied = true
    window.setTimeout(() => (copied = false), 1600)
  }

  async function exportWarper() {
    if (!latest) return
    busy = true
    error = ''
    try {
      const bundle = await convertToWarperBundle(latest)
      downloadJson(`${asset.symbol.toLowerCase()}-paper-setup.warper.json`, bundle)
      notice = 'Warper Keeper bundle verified and downloaded.'
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Warper Keeper export failed.'
    } finally {
      busy = false
    }
  }
</script>

<section class="trapper-builder" id="trading-trapper" aria-labelledby="trading-trapper-title">
  <header>
    <div class="trapper-title">
      <span class="trapper-icon"><FileCheck2 size={18} /></span>
      <div><span>PORTABLE RESEARCH</span><h2 id="trading-trapper-title">Trading Trapper</h2></div>
    </div>
    <div class="trapper-status"><ShieldCheck size={13} /> PAPER ONLY / $0 MOVED</div>
    <button class="toggle" type="button" onclick={() => (expanded = !expanded)}>{expanded ? 'Close builder' : 'Build from this chart'}</button>
  </header>

  <div class="trapper-summary">
    <span><small>MARKET</small><strong>{asset.symbol} / USD</strong></span>
    <span><small>DATA</small><strong>{chartMode === 'live' ? 'PUBLIC LIVE' : 'TEACHING'}</strong></span>
    <span><small>THESIS</small><strong>{direction.toUpperCase()}</strong></span>
    <span><small>AUTHORITY</small><strong>NONE</strong></span>
  </div>

  {#if expanded}
    <div class="builder-body">
      <div class="builder-fields">
        <div class="field-row">
          <label><span>DIRECTION</span><select bind:value={direction}><option value="long">Long thesis</option><option value="short">Short thesis</option><option value="neutral">Wait / neutral</option></select></label>
          <label><span>PAPER POSITION</span><input type="number" min="1" step="25" bind:value={paperPositionUsd} /></label>
          <label><span>MAX PAPER LOSS</span><input type="number" min="0" step="1" bind:value={maxPaperLossUsd} /></label>
          <label><span>TARGET PRICE</span><input type="number" min="0" step="any" bind:value={targetPrice} /></label>
        </div>
        <label><span>THESIS</span><textarea rows="2" bind:value={thesis}></textarea></label>
        <label><span>ENTRY CONDITION</span><textarea rows="2" bind:value={entryCondition}></textarea></label>
        <label><span>INVALIDATION</span><textarea rows="2" bind:value={invalidation}></textarea></label>
        <div class="source-fields">
          <label><span>TRADINGVIEW REFERENCE</span><input type="url" bind:value={tradingViewSourceUrl} /></label>
          <label><span>RESEARCH NOTE</span><input bind:value={sourceNote} placeholder="What did you observe on the chart?" /></label>
          <a href={tradingViewUrl(asset)} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Inspect in TradingView</a>
        </div>
      </div>

      <aside>
        <span>THE CONTRACT</span>
        <strong>Research becomes portable evidence.</strong>
        <p>Agents can analyze this setup, challenge it, attach artifacts, and return a Warper Keeper bundle. They cannot place a trade or access your wallet.</p>
        <ul>
          <li>Timestamped market observation</li>
          <li>Explicit invalidation and risk</li>
          <li>SHA-256 receipt</li>
          <li>Agent-readable JSON</li>
        </ul>
        <button class="build" type="button" onclick={() => void build()} disabled={busy}>{busy ? 'Verifying...' : 'Build verified Trapper'}</button>
      </aside>
    </div>
    {#if error}<div class="trapper-message error" role="alert">{error}</div>{/if}
    {#if notice}<div class="trapper-message success"><Check size={13} />{notice}</div>{/if}
    {#if latest}
      <div class="trapper-result">
        <div><span>VERIFIED</span><strong>{latest.title}</strong><code>sha256:{latest.receipt.hash.slice(0, 18)}...{latest.receipt.hash.slice(-10)}</code></div>
        <div class="result-actions">
          <button type="button" onclick={() => downloadJson(`${asset.symbol.toLowerCase()}-paper-setup.trading-trapper.json`, latest)}><Download size={13} /> Trading Trapper</button>
          <button type="button" onclick={() => void exportWarper()} disabled={busy}><Download size={13} /> Warper bundle</button>
          <button type="button" onclick={() => void copyLatest()}>{#if copied}<Check size={13} /> Copied{:else}<Copy size={13} /> Copy JSON{/if}</button>
        </div>
      </div>
    {/if}
  {/if}
</section>

<style>
  .trapper-builder { border-bottom: 1px solid var(--line); background: #090d10; }
  header { min-height: 64px; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 16px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
  .trapper-title { display: flex; align-items: center; gap: 10px; }
  .trapper-icon { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid #1d8f74; background: #0c2b24; color: #5de3bd; }
  .trapper-title div { display: grid; gap: 3px; }
  .trapper-title span, label > span, aside > span { color: var(--muted); font: 700 8px/1 'IBM Plex Mono', monospace; }
  h2 { margin: 0; font-size: 15px; letter-spacing: 0; }
  .trapper-status { display: flex; align-items: center; gap: 6px; color: var(--green); font: 700 8px/1 'IBM Plex Mono', monospace; }
  button, a { min-height: 30px; border: 1px solid var(--line); border-radius: 3px; background: #11171b; color: var(--text); font: 700 9px/1 'IBM Plex Mono', monospace; cursor: pointer; }
  .toggle { padding: 0 12px; border-color: #2a6157; }
  .trapper-summary { display: grid; grid-template-columns: repeat(4, 1fr); }
  .trapper-summary > span { min-height: 48px; display: grid; align-content: center; gap: 5px; padding: 0 12px; border-right: 1px solid var(--line); }
  .trapper-summary > span:last-child { border-right: 0; }
  small { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .trapper-summary strong { font: 700 10px/1 'IBM Plex Mono', monospace; }
  .builder-body { display: grid; grid-template-columns: minmax(0, 1fr) 260px; border-top: 1px solid var(--line); }
  .builder-fields { display: grid; gap: 10px; padding: 12px; }
  .field-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  label { display: grid; gap: 6px; min-width: 0; }
  input, select, textarea { width: 100%; min-width: 0; border: 1px solid #263138; border-radius: 3px; background: #070a0c; color: var(--text); padding: 8px; font: 500 10px/1.4 'IBM Plex Mono', monospace; resize: vertical; }
  .source-fields { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
  .source-fields a { display: flex; align-items: center; gap: 6px; padding: 0 10px; text-decoration: none; white-space: nowrap; }
  aside { padding: 13px; border-left: 1px solid var(--line); background: #0c1215; }
  aside strong { display: block; margin: 8px 0; font-size: 12px; }
  aside p, aside li { color: #9ba7ad; font-size: 9px; line-height: 1.5; }
  aside ul { margin: 8px 0 12px; padding-left: 16px; }
  .build { width: 100%; border-color: #1d8f74; background: #0e3b30; color: #8ef2d2; }
  button:disabled { cursor: wait; opacity: .55; }
  .trapper-message { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-top: 1px solid var(--line); font: 600 9px/1.4 'IBM Plex Mono', monospace; }
  .trapper-message.error { color: #ff8b9d; background: #2a1016; }
  .trapper-message.success { color: #7ce8c7; background: #0b241f; }
  .trapper-result { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-top: 1px solid #1d8f74; background: #0b1816; }
  .trapper-result > div:first-child { min-width: 0; display: grid; gap: 4px; }
  .trapper-result span { color: var(--green); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .trapper-result strong { font-size: 11px; }
  .trapper-result code { overflow: hidden; color: #819097; font-size: 8px; text-overflow: ellipsis; }
  .result-actions { display: flex; gap: 6px; }
  .result-actions button { display: flex; align-items: center; gap: 5px; padding: 0 9px; white-space: nowrap; }
  @media (max-width: 900px) {
    header { grid-template-columns: 1fr auto; }
    .trapper-status { display: none; }
    .builder-body { grid-template-columns: 1fr; }
    aside { border-left: 0; border-top: 1px solid var(--line); }
    .field-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .source-fields { grid-template-columns: 1fr; }
  }
  @media (max-width: 620px) {
    header { gap: 8px; }
    .toggle { padding: 0 8px; }
    .trapper-summary { grid-template-columns: repeat(2, 1fr); }
    .trapper-summary > span:nth-child(2) { border-right: 0; }
    .trapper-summary > span:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
    .field-row { grid-template-columns: 1fr; }
    .trapper-result { align-items: stretch; flex-direction: column; }
    .result-actions { display: grid; grid-template-columns: 1fr; }
  }
</style>
