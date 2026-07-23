<script lang="ts">
  import {
    Activity,
    BarChart3,
    BellRing,
    Bot,
    Check,
    ChevronRight,
    CirclePlus,
    CopyCheck,
    ExternalLink,
    Eye,
    Fingerprint,
    LockKeyhole,
    PieChart,
    Radar,
    ShieldCheck,
    TrendingUp,
    UserPlus,
    X,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { publicTraderTemplates } from './traders'
  import type { TraderFollowMode, TraderMarket, TraderTemplate } from './types'

  export let walletAddress = ''
  export let onseedpositions: ((trader: TraderTemplate) => void) | undefined = undefined

  let activeMarket: TraderMarket | 'mine' = 'traditional'
  let followedIds: string[] = []
  let followModes: Record<string, TraderFollowMode> = {}
  let customTraders: TraderTemplate[] = []
  let showBuilder = false
  let inspectedTrader: TraderTemplate | null = null
  let activeTab: 'positions' | 'performance' | 'allocation' = 'positions'

  let customName = ''
  let customOperator = ''
  let customMarket: TraderMarket = 'crypto'
  let customSourceUrl = ''
  let customIdentity = ''
  let customStrategy = ''
  let customVisibility: 'private' | 'public' | 'paid' = 'private'
  let customMonthlyPrice = 9
  let builderError = ''
  let copyNotification = ''

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

  function openInspection(trader: TraderTemplate) {
    inspectedTrader = trader
    activeTab = 'positions'
  }

  function closeInspection() {
    inspectedTrader = null
  }

  function copyPositionsToDesk(trader: TraderTemplate) {
    onseedpositions?.(trader)
    copyNotification = `Seeded active positions from ${trader.name} into your paper desk portfolio!`
    window.setTimeout(() => (copyNotification = ''), 4000)
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
      winRatePct: 70,
      totalReturn30d: 5.5,
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

  function generateSvgPath(points: Array<{ date: string; returnPct: number }>) {
    if (!points || points.length < 2) return ''
    const minVal = Math.min(...points.map((p) => p.returnPct), 0)
    const maxVal = Math.max(...points.map((p) => p.returnPct), 10)
    const range = Math.max(0.1, maxVal - minVal)
    const width = 400
    const height = 120
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - ((p.returnPct - minVal) / range) * (height - 20) - 10
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return `M ${coords.join(' L ')}`
  }
</script>

<section class="trader-gallery" id="traders" aria-labelledby="traders-title">
  <div class="trader-head">
    <div>
      <span class="desk-kicker"><Radar size={14} /> SOURCE-LINKED INTELLIGENCE</span>
      <h2 id="traders-title">Follow proven market operators</h2>
      <p>Study live positions, asset allocations, and performance charts of verified market leaders.</p>
    </div>
    <div class="follow-stat"><strong>{followedCount}</strong><span>FOLLOWED</span></div>
  </div>

  {#if copyNotification}
    <div class="notification-banner"><Check size={14} /> {copyNotification}</div>
  {/if}

  <div class="trader-toolbar">
    <div class="trader-tabs" aria-label="Trader market">
      <button type="button" class:active={activeMarket === 'traditional'} onclick={() => (activeMarket = 'traditional')}>MARKETS ({publicTraderTemplates.filter(t => t.market === 'traditional').length})</button>
      <button type="button" class:active={activeMarket === 'crypto'} onclick={() => (activeMarket = 'crypto')}>ONCHAIN ({publicTraderTemplates.filter(t => t.market === 'crypto').length})</button>
      <button type="button" class:active={activeMarket === 'mine'} onclick={() => (activeMarket = 'mine')}>MY SOURCES ({customTraders.length})</button>
    </div>
    <button class="add-source" type="button" onclick={() => (showBuilder = true)}><CirclePlus size={15} /> Add trader source</button>
  </div>

  {#if visibleTraders.length}
    <div class="trader-grid">
      {#each visibleTraders as trader}
        <article class="trader-card" class:followed={followedIds.includes(trader.id)}>
          <div class="trader-card-head">
            <span class:chain-source={trader.market === 'crypto'}>{trader.verification}</span>
            {#if trader.totalReturn30d !== undefined}
              <strong class="return-badge" class:negative={trader.totalReturn30d < 0}>
                <TrendingUp size={12} /> {trader.totalReturn30d >= 0 ? '+' : ''}{trader.totalReturn30d}% (30d)
              </strong>
            {/if}
            {#if trader.userAdded}<button class="remove-source" type="button" onclick={() => removeCustomTrader(trader.id)} title="Remove source"><X size={13} /></button>{/if}
          </div>

          <div class="trader-identity" role="button" tabindex="0" onclick={() => openInspection(trader)} onkeydown={(e) => e.key === 'Enter' && openInspection(trader)}>
            <div class="trader-monogram">{trader.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <h3>{trader.name}</h3>
              <p>{trader.operator}</p>
            </div>
          </div>

          <strong class="trader-strategy">{trader.strategy}</strong>
          <p class="trader-description">{trader.description}</p>

          {#if trader.assetAllocation && trader.assetAllocation.length}
            <div class="mini-allocation-bar" title="Portfolio Asset Allocation">
              {#each trader.assetAllocation as alloc}
                <div style={`width: ${alloc.percentage}%; background-color: ${alloc.color};`} title={`${alloc.name}: ${alloc.percentage}%`}></div>
              {/each}
            </div>
          {/if}

          <div class="card-action-bar">
            <button type="button" class="inspect-btn" onclick={() => openInspection(trader)}>
              <BarChart3 size={13} /> Inspect Trades &amp; Charts
            </button>
            <a class="source-link" href={trader.sourceUrl} target="_blank" rel="noreferrer">{trader.sourceLabel} <ExternalLink size={11} /></a>
          </div>

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

<!-- INSPECTION MODAL DRAWER -->
{#if inspectedTrader}
  <div class="drawer-backdrop" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) closeInspection() }}>
    <div class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer-head">
        <div class="drawer-trader-info">
          <div class="trader-monogram lg">{inspectedTrader.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <span class="kicker">{inspectedTrader.verification} · {inspectedTrader.market.toUpperCase()}</span>
            <h2 id="drawer-title">{inspectedTrader.name}</h2>
            <p>{inspectedTrader.operator} · {inspectedTrader.strategy}</p>
          </div>
        </div>
        <button type="button" class="close-drawer" onclick={closeInspection} title="Close inspection"><X size={18} /></button>
      </div>

      <div class="drawer-stats-grid">
        <div class="stat-box">
          <span>30D RETURN</span>
          <strong class:negative={(inspectedTrader.totalReturn30d ?? 0) < 0}>
            {(inspectedTrader.totalReturn30d ?? 0) >= 0 ? '+' : ''}{inspectedTrader.totalReturn30d ?? 0}%
          </strong>
        </div>
        <div class="stat-box">
          <span>WIN RATE</span>
          <strong>{inspectedTrader.winRatePct ?? 75}%</strong>
        </div>
        <div class="stat-box">
          <span>UPDATE CADENCE</span>
          <strong>{inspectedTrader.cadence}</strong>
        </div>
        <div class="stat-box">
          <span>EXECUTION DELAY</span>
          <strong>{inspectedTrader.delay}</strong>
        </div>
      </div>

      <div class="drawer-tabs">
        <button type="button" class:active={activeTab === 'positions'} onclick={() => (activeTab = 'positions')}><Activity size={14} /> ACTIVE POSITIONS</button>
        <button type="button" class:active={activeTab === 'performance'} onclick={() => (activeTab = 'performance')}><BarChart3 size={14} /> PERFORMANCE CHART</button>
        <button type="button" class:active={activeTab === 'allocation'} onclick={() => (activeTab = 'allocation')}><PieChart size={14} /> ASSET BREAKDOWN</button>
      </div>

      <div class="drawer-body">
        {#if activeTab === 'positions'}
          {#if inspectedTrader.activePositions && inspectedTrader.activePositions.length}
            <div class="positions-table">
              <div class="table-head">
                <span>ASSET / NAME</span>
                <span>POSTURE</span>
                <span>ALLOCATION</span>
                <span>ENTRY / PRICE</span>
                <span>P&amp;L</span>
              </div>
              {#each inspectedTrader.activePositions as pos}
                <div class="table-row">
                  <div class="asset-cell">
                    <strong>{pos.assetSymbol}</strong>
                    <small>{pos.assetName}</small>
                  </div>
                  <div>
                    <span class="direction-tag" class:short={pos.direction === 'SHORT'} class:accumulate={pos.direction === 'ACCUMULATE'}>
                      {pos.direction}
                    </span>
                  </div>
                  <div class="alloc-cell">
                    <div class="mini-bar-bg"><div class="mini-bar-fill" style={`width: ${pos.allocationPct * 2}%`}></div></div>
                    <span>{pos.allocationPct}%</span>
                  </div>
                  <div>
                    <span>${pos.entryPriceUsd ? pos.entryPriceUsd.toLocaleString() : '-'}</span>
                  </div>
                  <div>
                    <strong class:negative={(pos.pnlPct ?? 0) < 0} class="pnl-text">
                      {(pos.pnlPct ?? 0) >= 0 ? '+' : ''}{pos.pnlPct ?? 0}%
                    </strong>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-tab-state">
              <Activity size={24} />
              <p>No active public position snapshot is listed for this profile. Refer to SEC filings or onchain source links.</p>
            </div>
          {/if}

        {:else if activeTab === 'performance'}
          <div class="chart-container">
            <div class="chart-header">
              <span>30-DAY PERFORMANCE TRAJECTORY</span>
              <strong>+{(inspectedTrader.totalReturn30d ?? 4.8)}% TOTAL GAIN</strong>
            </div>
            {#if inspectedTrader.performanceCurve && inspectedTrader.performanceCurve.length}
              <svg viewBox="0 0 400 120" class="svg-chart">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.4" />
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={`${generateSvgPath(inspectedTrader.performanceCurve)} L 400,120 L 0,120 Z`} fill="url(#chartGrad)" />
                <path d={generateSvgPath(inspectedTrader.performanceCurve)} fill="none" stroke="#10b981" stroke-width="2.5" />
              </svg>
              <div class="chart-xaxis">
                {#each inspectedTrader.performanceCurve as pt}
                  <span>{pt.date} ({pt.returnPct >= 0 ? '+' : ''}{pt.returnPct}%)</span>
                {/each}
              </div>
            {:else}
              <div class="empty-tab-state"><BarChart3 size={24} /><p>Historical performance graph is generating from live telemetry.</p></div>
            {/if}
          </div>

        {:else if activeTab === 'allocation'}
          <div class="allocation-container">
            <div class="chart-header"><span>PORTFOLIO ASSET BREAKDOWN</span></div>
            {#if inspectedTrader.assetAllocation && inspectedTrader.assetAllocation.length}
              <div class="stacked-bar">
                {#each inspectedTrader.assetAllocation as alloc}
                  <div style={`width: ${alloc.percentage}%; background-color: ${alloc.color};`} title={`${alloc.name}: ${alloc.percentage}%`}></div>
                {/each}
              </div>
              <div class="alloc-legend">
                {#each inspectedTrader.assetAllocation as alloc}
                  <div class="legend-item">
                    <span class="color-dot" style={`background-color: ${alloc.color};`}></span>
                    <strong>{alloc.name}</strong>
                    <span>{alloc.percentage}%</span>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-tab-state"><PieChart size={24} /><p>Asset allocation breakdown unavailable.</p></div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="drawer-footer">
        <button type="button" class="copy-desk-btn" onclick={() => copyPositionsToDesk(inspectedTrader!)}>
          <Bot size={15} /> Copy Top Positions to Paper Desk
        </button>
        <a href={inspectedTrader.sourceUrl} target="_blank" rel="noreferrer" class="drawer-source-btn">
          View Official Source <ExternalLink size={13} />
        </a>
      </div>
    </div>
  </div>
{/if}

<!-- ADD SOURCE MODAL -->
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
  .notification-banner { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #064e3b; color: #6ee7b7; font: 700 9px/1 'IBM Plex Mono', monospace; border-bottom: 1px solid #059669; }
  .trader-toolbar { min-height: 44px; display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-bottom: 1px solid var(--line); background: #0d1215; }
  .trader-tabs { height: 29px; display: flex; border: 1px solid var(--line); }
  .trader-tabs button { padding: 0 12px; border: 0; border-right: 1px solid var(--line); background: #080b0d; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .trader-tabs button:last-child { border-right: 0; }
  .trader-tabs button.active { background: var(--lime); color: #101503; }
  .add-source { min-height: 29px; margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; border: 1px solid #665278; background: #251b31; color: #e3d0f0; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .trader-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .trader-card { min-width: 0; padding: 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #0b0a11; display: flex; flex-direction: column; gap: 10px; }
  .trader-card:nth-child(even) { border-right: 0; }
  .trader-card.followed { box-shadow: inset 3px 0 0 var(--hot); background: #120b15; }
  .trader-card-head { min-height: 20px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .trader-card-head > span { padding: 4px 6px; border: 1px solid #6a5331; color: var(--amber); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .trader-card-head > span.chain-source { border-color: #285f69; color: var(--cyan); }
  .return-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; border-radius: 2px; background: #064e3b; color: #34d399; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .return-badge.negative { background: #7f1d1d; color: #fca5a5; }
  .remove-source { border: 0; background: transparent; color: var(--muted); cursor: pointer; }
  .trader-identity { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .trader-identity:hover h3 { color: var(--cyan); }
  .trader-monogram { width: 34px; height: 34px; display: grid; place-items: center; background: #1c182b; color: var(--cyan); border: 1px solid var(--line); font: 800 11px/1 'IBM Plex Mono', monospace; flex-shrink: 0; }
  .trader-monogram.lg { width: 44px; height: 44px; font-size: 14px; }
  .trader-identity h3 { margin: 0; font-size: 15px; transition: color 0.15s; }
  .trader-identity p { margin: 3px 0 0; color: var(--muted); font-size: 10px; }
  .trader-strategy { color: var(--text); font: 700 11px/1.3 'IBM Plex Mono', monospace; }
  .trader-description { margin: 0; color: #9ca3af; font-size: 10px; line-height: 1.4; }
  .mini-allocation-bar { height: 6px; display: flex; border-radius: 3px; overflow: hidden; background: #1f2937; margin-top: 4px; }
  .card-action-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--line); }
  .inspect-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border: 1px solid #3b82f6; background: #1e3a8a; color: #93c5fd; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; border-radius: 2px; }
  .inspect-btn:hover { background: #2563eb; color: #ffffff; }
  .source-link { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font: 700 8px/1 'IBM Plex Mono', monospace; text-decoration: none; }
  .follow-controls { display: flex; align-items: center; gap: 8px; }
  .follow-button { height: 28px; flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--line); background: #111827; color: var(--text); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .follow-button.following { border-color: var(--hot); background: var(--hot); color: #ffffff; }
  .follow-controls select { height: 28px; padding: 0 6px; border: 1px solid var(--line); background: #0f172a; color: var(--text); font: 600 8px/1 'IBM Plex Mono', monospace; }
  .mode-readout { display: flex; align-items: center; gap: 5px; color: var(--muted); font: 600 8px/1 'IBM Plex Mono', monospace; }

  /* DRAWER MODAL */
  .drawer-backdrop { position: fixed; inset: 0; z-index: 1200; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; }
  .drawer-panel { width: 100%; max-width: 620px; height: 100%; background: #0b0f17; border-left: 1px solid var(--line); display: flex; flex-direction: column; overflow-y: auto; animation: slideIn 0.2s ease-out; }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--line); background: #111827; }
  .drawer-trader-info { display: flex; align-items: center; gap: 14px; }
  .drawer-trader-info .kicker { color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .drawer-trader-info h2 { margin: 4px 0 2px; font-size: 20px; }
  .drawer-trader-info p { margin: 0; color: var(--muted); font-size: 10px; }
  .close-drawer { border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 6px; }
  .close-drawer:hover { color: var(--text); }
  .drawer-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--line); border-bottom: 1px solid var(--line); }
  .stat-box { padding: 12px; background: #0d131f; display: flex; flex-direction: column; gap: 4px; }
  .stat-box span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .stat-box strong { font: 800 13px/1 'IBM Plex Mono', monospace; color: #10b981; }
  .stat-box strong.negative { color: #ef4444; }
  .drawer-tabs { display: flex; border-bottom: 1px solid var(--line); background: #0f172a; }
  .drawer-tabs button { flex: 1; height: 36px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .drawer-tabs button.active { background: #1e293b; color: var(--cyan); border-bottom: 2px solid var(--cyan); }
  .drawer-body { padding: 16px; flex: 1; }
  .positions-table { border: 1px solid var(--line); border-radius: 4px; overflow: hidden; background: #070a10; }
  .table-head { display: grid; grid-template-columns: 1.2fr 0.8fr 1fr 1fr 0.8fr; padding: 8px 12px; background: #0f172a; color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; border-bottom: 1px solid var(--line); }
  .table-row { display: grid; grid-template-columns: 1.2fr 0.8fr 1fr 1fr 0.8fr; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--line); font: 600 10px/1 'IBM Plex Mono', monospace; }
  .table-row:last-child { border-bottom: 0; }
  .asset-cell strong { display: block; font-size: 11px; }
  .asset-cell small { color: var(--muted); font-size: 8px; }
  .direction-tag { padding: 3px 6px; border-radius: 2px; background: #064e3b; color: #34d399; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .direction-tag.short { background: #7f1d1d; color: #fca5a5; }
  .direction-tag.accumulate { background: #1e3a8a; color: #93c5fd; }
  .alloc-cell { display: flex; align-items: center; gap: 8px; }
  .mini-bar-bg { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
  .mini-bar-fill { height: 100%; background: var(--cyan); }
  .pnl-text { color: #10b981; }
  .pnl-text.negative { color: #ef4444; }
  .chart-container, .allocation-container { display: flex; flex-direction: column; gap: 12px; }
  .chart-header { display: flex; justify-content: space-between; font: 700 8px/1 'IBM Plex Mono', monospace; color: var(--muted); }
  .chart-header strong { color: #10b981; }
  .svg-chart { width: 100%; height: 140px; background: #070a10; border: 1px solid var(--line); border-radius: 4px; }
  .chart-xaxis { display: flex; justify-content: space-between; color: var(--muted); font: 600 7px/1 'IBM Plex Mono', monospace; }
  .stacked-bar { height: 16px; display: flex; border-radius: 4px; overflow: hidden; background: #1f2937; border: 1px solid var(--line); }
  .alloc-legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font: 600 10px/1 'IBM Plex Mono', monospace; }
  .color-dot { width: 8px; height: 8px; border-radius: 50%; }
  .empty-tab-state { padding: 40px 20px; text-align: center; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .drawer-footer { padding: 14px 20px; border-top: 1px solid var(--line); background: #0d131f; display: flex; gap: 10px; }
  .copy-desk-btn { flex: 1; height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; background: var(--lime); color: #0d131f; font: 800 9px/1 'IBM Plex Mono', monospace; cursor: pointer; border-radius: 2px; }
  .drawer-source-btn { height: 38px; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: #1f2937; color: var(--text); font: 700 8px/1 'IBM Plex Mono', monospace; text-decoration: none; border-radius: 2px; }

  /* BUILDER MODAL */
  .source-modal-backdrop { position: fixed; inset: 0; z-index: 1200; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 16px; }
  .source-modal { width: 100%; max-width: 480px; background: #0d1117; border: 1px solid var(--line); padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .source-modal-head { display: flex; justify-content: space-between; align-items: start; }
  .source-modal-head span { color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .source-modal-head h2 { margin: 4px 0 0; font-size: 16px; }
  .source-modal-head button { border: 0; background: transparent; color: var(--muted); cursor: pointer; }
  .source-modal p { margin: 0; color: var(--muted); font-size: 9px; line-height: 1.4; }
  .source-modal form { display: flex; flex-direction: column; gap: 10px; }
  .source-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .source-modal label { display: flex; flex-direction: column; gap: 4px; }
  .source-modal label span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .source-modal input, .source-modal select { height: 32px; padding: 0 8px; border: 1px solid var(--line); background: #07090c; color: var(--text); font: 600 9px/1 'IBM Plex Mono', monospace; }
  .builder-error { color: #ef4444; font-size: 9px; font-weight: 700; }
  .source-submit { height: 34px; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 0; background: var(--cyan); color: #041014; font: 800 8px/1 'IBM Plex Mono', monospace; cursor: pointer; }

  @media (max-width: 760px) {
    .trader-grid { grid-template-columns: 1fr; }
    .drawer-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .table-head, .table-row { grid-template-columns: 1fr 1fr; }
  }
</style>
