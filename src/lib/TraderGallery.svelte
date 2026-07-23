<script lang="ts">
  import { BellRing, Bot, CirclePlus, CopyCheck, Eye, ExternalLink, LockKeyhole, Radar, ShieldCheck, UserPlus, X } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { publicTraderTemplates } from './traders'
  import type { TraderFollowMode, TraderMarket, TraderTemplate } from './types'

  export let walletAddress = ''

  let activeMarket: TraderMarket | 'mine' = 'traditional'
  let followedIds: string[] = []
  let followModes: Record<string, TraderFollowMode> = {}
  let customTraders: TraderTemplate[] = []
  let showBuilder = false
  let customName = ''
  let customOperator = ''
  let customMarket: TraderMarket = 'crypto'
  let customSourceUrl = ''
  let customIdentity = ''
  let customStrategy = ''
  let customVisibility: 'private' | 'public' | 'paid' = 'private'
  let customMonthlyPrice = 9
  let builderError = ''

  $: allTraders = [...publicTraderTemplates, ...customTraders]
  $: visibleTraders = activeMarket === 'mine'
    ? customTraders
    : allTraders.filter((trader) => trader.market === activeMarket && !trader.userAdded)
  $: followedCount = followedIds.length

  onMount(() => {
    followedIds = readJson<string[]>('whale-followed-traders', [])
    followModes = readJson<Record<string, TraderFollowMode>>('whale-follow-modes', {})
    customTraders = readJson<TraderTemplate[]>('whale-custom-traders', [])
  })

  function readJson<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) as T : fallback
    } catch {
      return fallback
    }
  }

  function toggleFollow(id: string) {
    if (followedIds.includes(id)) {
      followedIds = followedIds.filter((traderId) => traderId !== id)
      const nextModes = { ...followModes }
      delete nextModes[id]
      followModes = nextModes
    } else {
      followedIds = [...followedIds, id]
      followModes = { ...followModes, [id]: 'observe' }
    }
    persistFollows()
  }

  function setFollowMode(id: string, mode: TraderFollowMode) {
    followModes = { ...followModes, [id]: mode }
    persistFollows()
  }

  function persistFollows() {
    localStorage.setItem('whale-followed-traders', JSON.stringify(followedIds))
    localStorage.setItem('whale-follow-modes', JSON.stringify(followModes))
  }

  function addCustomTrader() {
    builderError = ''
    const hasValidUrl = /^https:\/\//i.test(customSourceUrl.trim())
    const hasWallet = /^0x[a-fA-F0-9]{40}$/.test(customIdentity.trim())
    if (customName.trim().length < 2 || customStrategy.trim().length < 3) {
      builderError = 'Add a name and a strategy description.'
      return
    }
    if (!hasValidUrl && !hasWallet) {
      builderError = 'Add a public HTTPS source or a valid EVM wallet address.'
      return
    }

    const trader: TraderTemplate = {
      id: `custom-${crypto.randomUUID()}`,
      name: customName.trim(),
      operator: customOperator.trim() || 'User-supplied source',
      market: customMarket,
      sourceKind: 'user-source',
      verification: 'USER SUPPLIED',
      strategy: customStrategy.trim(),
      cadence: hasWallet ? 'Onchain account updates' : 'Source publication updates',
      delay: hasWallet ? 'Near real time' : 'Depends on source',
      description: 'A source you added for observation. Verify identity and suitability before relying on it.',
      sourceUrl: hasValidUrl ? customSourceUrl.trim() : `https://basescan.org/address/${customIdentity.trim()}`,
      sourceLabel: 'User-supplied public source',
      identity: hasWallet ? customIdentity.trim() : undefined,
      userAdded: true,
      visibility: customVisibility,
      monthlyPriceUsd: customVisibility === 'paid' ? Math.max(1, Number(customMonthlyPrice) || 1) : undefined,
    }
    customTraders = [trader, ...customTraders]
    localStorage.setItem('whale-custom-traders', JSON.stringify(customTraders))
    followedIds = [...followedIds, trader.id]
    followModes = { ...followModes, [trader.id]: 'observe' }
    persistFollows()
    resetBuilder()
    activeMarket = 'mine'
  }

  function removeCustomTrader(id: string) {
    customTraders = customTraders.filter((trader) => trader.id !== id)
    localStorage.setItem('whale-custom-traders', JSON.stringify(customTraders))
    if (followedIds.includes(id)) toggleFollow(id)
  }

  function resetBuilder() {
    showBuilder = false
    customName = ''
    customOperator = ''
    customSourceUrl = ''
    customIdentity = ''
    customStrategy = ''
    customVisibility = 'private'
    customMonthlyPrice = 9
    builderError = ''
  }

  function modeLabel(mode: TraderFollowMode) {
    if (mode === 'paper-copy') return 'Paper copy'
    if (mode === 'alerts') return 'Alerts'
    return 'Observe'
  }
</script>

<section class="trader-gallery" id="traders" aria-labelledby="traders-title">
  <div class="trader-head">
    <div>
      <span class="desk-kicker"><Radar size={14} /> SOURCE-LINKED INTELLIGENCE</span>
      <h2 id="traders-title">Follow proven market operators</h2>
      <p>Start with verified filings, official research, and public onchain accounts. No invented traders.</p>
    </div>
    <div class="follow-stat"><strong>{followedCount}</strong><span>FOLLOWED</span></div>
  </div>

  <div class="trader-toolbar">
    <div class="trader-tabs" aria-label="Trader market">
      <button type="button" class:active={activeMarket === 'traditional'} onclick={() => (activeMarket = 'traditional')}>MARKETS 10</button>
      <button type="button" class:active={activeMarket === 'crypto'} onclick={() => (activeMarket = 'crypto')}>ONCHAIN 10</button>
      <button type="button" class:active={activeMarket === 'mine'} onclick={() => (activeMarket = 'mine')}>MY SOURCES {customTraders.length}</button>
    </div>
    <button class="add-source" type="button" onclick={() => (showBuilder = true)}><CirclePlus size={15} /> Add trader source</button>
  </div>

  {#if visibleTraders.length}
    <div class="trader-grid">
      {#each visibleTraders as trader}
        <article class="trader-card" class:followed={followedIds.includes(trader.id)}>
          <div class="trader-card-head">
            <span class:chain-source={trader.market === 'crypto'}>{trader.verification}</span>
            {#if trader.userAdded && trader.visibility}<em>{trader.visibility === 'paid' ? `$${trader.monthlyPriceUsd}/MO INTENT` : `${trader.visibility.toUpperCase()} DRAFT`}</em>{/if}
            {#if trader.userAdded}<button class="remove-source" type="button" onclick={() => removeCustomTrader(trader.id)} title="Remove source"><X size={13} /></button>{/if}
          </div>
          <div class="trader-identity">
            <div class="trader-monogram">{trader.name.slice(0, 2).toUpperCase()}</div>
            <div><h3>{trader.name}</h3><p>{trader.operator}</p></div>
          </div>
          <strong class="trader-strategy">{trader.strategy}</strong>
          <p class="trader-description">{trader.description}</p>
          <div class="trader-metadata"><span>{trader.cadence}</span><span>{trader.delay}</span></div>
          <a class="source-link" href={trader.sourceUrl} target="_blank" rel="noreferrer">{trader.sourceLabel}<ExternalLink size={12} /></a>

          <div class="follow-controls">
            <button class="follow-button" class:following={followedIds.includes(trader.id)} type="button" onclick={() => toggleFollow(trader.id)}>
              {#if followedIds.includes(trader.id)}<CopyCheck size={14} /> Following{:else}<UserPlus size={14} /> Follow{/if}
            </button>
            {#if followedIds.includes(trader.id)}
              <select value={followModes[trader.id] ?? 'observe'} onchange={(event) => setFollowMode(trader.id, event.currentTarget.value as TraderFollowMode)} aria-label={`Follow mode for ${trader.name}`}>
                <option value="observe">Observe</option>
                <option value="alerts">Alerts</option>
                <option value="paper-copy">Paper copy</option>
              </select>
            {/if}
          </div>
          {#if followedIds.includes(trader.id)}
            <div class="mode-readout">
              {#if (followModes[trader.id] ?? 'observe') === 'observe'}<Eye size={12} />{:else if followModes[trader.id] === 'alerts'}<BellRing size={12} />{:else}<Bot size={12} />{/if}
              {modeLabel(followModes[trader.id] ?? 'observe')} active on this device
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {:else}
    <div class="empty-sources"><Radar size={24} /><strong>No personal sources yet</strong><span>Add a public profile, filing feed, or onchain wallet to build your own desk.</span></div>
  {/if}

  <div class="autopilot-strip">
    <div><LockKeyhole size={17} /><span><strong>LIVE AUTOPILOT</strong> Explicit mandate, hard loss limits, mandatory execution alerts, revocable session key, no withdrawal authority.</span></div>
    <span class="autopilot-state">GATED BUILD</span>
    <span class="wallet-state"><ShieldCheck size={13} />{walletAddress ? 'WALLET ATTACHED' : 'WALLET REQUIRED'}</span>
  </div>
</section>

{#if showBuilder}
  <div class="source-modal-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) resetBuilder() }}>
    <div class="source-modal" role="dialog" aria-modal="true" aria-labelledby="source-modal-title">
      <div class="source-modal-head"><div><span>PERSONAL INTELLIGENCE FEED</span><h2 id="source-modal-title">Add a trader source</h2></div><button type="button" onclick={resetBuilder} title="Close"><X size={17} /></button></div>
      <p>Add only public data you are authorized to monitor. A source is not considered verified merely because it was added.</p>
      <form onsubmit={(event) => { event.preventDefault(); addCustomTrader() }}>
        <div class="source-split">
          <label><span>Source name</span><input bind:value={customName} placeholder="Desk, trader, or wallet label" /></label>
          <label><span>Market</span><select bind:value={customMarket}><option value="crypto">Crypto / onchain</option><option value="traditional">Traditional markets</option></select></label>
        </div>
        <label><span>Operator or identity note</span><input bind:value={customOperator} placeholder="Public profile or organization" /></label>
        <label><span>Strategy to study</span><input bind:value={customStrategy} placeholder="Macro, perps, prediction markets..." /></label>
        <div class="source-split">
          <label><span>Marketplace intent</span><select bind:value={customVisibility}><option value="private">Private</option><option value="public">Public after review</option><option value="paid">Paid after review</option></select></label>
          {#if customVisibility === 'paid'}<label><span>Monthly price USD</span><input type="number" min="1" step="1" bind:value={customMonthlyPrice} /></label>{/if}
        </div>
        <label><span>Public source URL</span><input type="url" bind:value={customSourceUrl} placeholder="https://..." /></label>
        <label><span>EVM wallet (optional)</span><input bind:value={customIdentity} placeholder="0x..." /></label>
        {#if builderError}<div class="builder-error">{builderError}</div>{/if}
        <button class="source-submit" type="submit"><CirclePlus size={15} /> Add and follow source</button>
        <div class="publish-boundary"><ShieldCheck size={13} />Public and paid drafts require paper results, source verification, disclosures, and reproducible receipts before listing.</div>
      </form>
    </div>
  </div>
{/if}

<style>
  .trader-gallery { border-bottom: 1px solid var(--line); background: #0a0810; scroll-margin-top: 90px; }
  .trader-head { min-height: 116px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 22px; border-bottom: 1px solid var(--line); background: #0e0b17; }
  .desk-kicker { display: flex; align-items: center; gap: 7px; color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .trader-head h2 { margin: 9px 0 6px; font-size: 23px; line-height: 1.05; }
  .trader-head p { max-width: 630px; margin: 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
  .follow-stat { min-width: 86px; height: 66px; display: grid; place-content: center; justify-items: center; border: 1px solid #5b356d; background: #25102d; }
  .follow-stat strong { color: var(--hot); font: 800 24px/1 'IBM Plex Mono', monospace; }
  .follow-stat span { margin-top: 5px; color: #bb9fc8; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .trader-toolbar { min-height: 44px; display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-bottom: 1px solid var(--line); background: #0d1215; }
  .trader-tabs { height: 29px; display: flex; border: 1px solid var(--line); }
  .trader-tabs button { padding: 0 12px; border: 0; border-right: 1px solid var(--line); background: #080b0d; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .trader-tabs button:last-child { border-right: 0; }
  .trader-tabs button.active { background: var(--lime); color: #101503; }
  .add-source { min-height: 29px; margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; border: 1px solid #665278; background: #251b31; color: #e3d0f0; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .trader-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .trader-card { min-width: 0; padding: 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #0b0a11; }
  .trader-card:nth-child(even) { border-right: 0; }
  .trader-card.followed { box-shadow: inset 3px 0 0 var(--hot); background: #120b15; }
  .trader-card-head { min-height: 20px; display: flex; align-items: start; justify-content: space-between; }
  .trader-card-head > span { padding: 4px 6px; border: 1px solid #6a5331; color: var(--amber); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .trader-card-head > span.chain-source { border-color: #285f69; color: var(--cyan); }
  .trader-card-head em { margin-left: auto; padding: 4px 5px; color: #bfa7cd; font: normal 700 7px/1 'IBM Plex Mono', monospace; }
  .remove-source { width: 21px; height: 21px; display: grid; place-items: center; padding: 0; border: 1px solid var(--line); background: transparent; color: var(--red); cursor: pointer; }
  .trader-identity { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
  .trader-monogram { width: 38px; height: 38px; display: grid; place-items: center; flex: 0 0 auto; border: 1px solid #814869; background: #361129; color: #ffc6e3; font: 800 11px/1 'IBM Plex Mono', monospace; }
  .trader-identity h3 { margin: 0; font-size: 14px; line-height: 1.1; }
  .trader-identity p { margin: 4px 0 0; color: var(--muted); font: 600 8px/1.25 'IBM Plex Mono', monospace; }
  .trader-strategy { display: block; color: var(--lime); font: 700 9px/1.25 'IBM Plex Mono', monospace; }
  .trader-description { min-height: 38px; margin: 7px 0; color: #aaa4b4; font-size: 10px; line-height: 1.45; }
  .trader-metadata { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 9px; }
  .trader-metadata span { padding: 4px 5px; background: #16131d; color: #817b8c; font: 600 7px/1 'IBM Plex Mono', monospace; }
  .source-link { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; color: var(--cyan); text-decoration: underline; font: 600 8px/1.2 'IBM Plex Mono', monospace; }
  .follow-controls { display: flex; gap: 7px; margin-top: 12px; }
  .follow-button, .follow-controls select { height: 31px; border: 1px solid #60546a; background: #17131d; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .follow-button { min-width: 96px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: #ddd4e6; }
  .follow-button.following { border-color: var(--hot); background: #42112d; color: #ffc9e4; }
  .follow-controls select { min-width: 104px; padding: 0 6px; color: var(--text); }
  .mode-readout { min-height: 27px; display: flex; align-items: center; gap: 5px; margin-top: 8px; color: #8f8899; font: 600 7px/1.2 'IBM Plex Mono', monospace; }
  .empty-sources { min-height: 220px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #6d6676; text-align: center; }
  .empty-sources strong { color: var(--text); font-size: 12px; }
  .empty-sources span { max-width: 380px; font-size: 10px; line-height: 1.5; }
  .autopilot-strip { min-height: 47px; display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #081113; border-top: 1px solid #22353a; }
  .autopilot-strip > div { min-width: 0; display: flex; align-items: center; gap: 8px; color: #8b979b; font: 600 8px/1.35 'IBM Plex Mono', monospace; }
  .autopilot-strip > div :global(svg) { color: var(--cyan); flex: 0 0 auto; }
  .autopilot-strip strong { color: var(--text); }
  .autopilot-state, .wallet-state { flex: 0 0 auto; padding: 5px 6px; border: 1px solid #6a5331; color: var(--amber); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .wallet-state { display: inline-flex; align-items: center; gap: 4px; border-color: #285f69; color: var(--cyan); }
  .source-modal-backdrop { position: fixed; inset: 0; z-index: 110; display: grid; place-items: center; padding: 18px; background: rgba(2, 3, 5, .88); }
  .source-modal { width: min(520px, 100%); max-height: calc(100vh - 36px); overflow-y: auto; border: 1px solid var(--line-bright); border-radius: 5px; background: #0c0a13; box-shadow: 0 24px 70px rgba(0,0,0,.7); }
  .source-modal-head { min-height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid var(--line); }
  .source-modal-head span { color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .source-modal-head h2 { margin: 5px 0 0; font-size: 19px; }
  .source-modal-head button { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; }
  .source-modal > p { margin: 0; padding: 13px 16px 0; color: var(--muted); font-size: 10px; line-height: 1.5; }
  .source-modal form { display: grid; gap: 10px; padding: 14px 16px 17px; }
  .source-modal label { display: grid; gap: 5px; }
  .source-modal label span { color: var(--muted); font: 600 8px/1 'IBM Plex Mono', monospace; }
  .source-modal input, .source-modal select { width: 100%; height: 36px; padding: 0 9px; border: 1px solid var(--line); background: #07060c; color: var(--text); outline: 0; font-size: 10px; }
  .source-modal input:focus, .source-modal select:focus { border-color: var(--cyan); }
  .source-split { display: grid; grid-template-columns: 1fr 150px; gap: 9px; }
  .builder-error { color: #ff92b2; font-size: 10px; }
  .source-submit { height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 0; background: var(--lime); color: #101503; cursor: pointer; font: 800 9px/1 'IBM Plex Mono', monospace; }
  .publish-boundary { display: flex; align-items: flex-start; gap: 6px; color: #756f7e; font: 600 7px/1.45 'IBM Plex Mono', monospace; }
  .publish-boundary :global(svg) { flex: 0 0 auto; color: var(--green); }

  @media (max-width: 760px) {
    .trader-head { min-height: 104px; padding: 15px 13px; }
    .trader-head h2 { font-size: 18px; }
    .follow-stat { min-width: 66px; height: 58px; }
    .trader-toolbar { align-items: stretch; flex-direction: column; }
    .trader-tabs { width: 100%; }
    .trader-tabs button { flex: 1; padding: 0 5px; }
    .add-source { width: 100%; margin-left: 0; justify-content: center; }
    .trader-grid { grid-template-columns: 1fr; }
    .trader-card, .trader-card:nth-child(even) { border-right: 0; }
    .autopilot-strip { align-items: flex-start; flex-wrap: wrap; }
    .autopilot-strip > div { width: 100%; }
    .source-split { grid-template-columns: 1fr; }
  }
</style>
