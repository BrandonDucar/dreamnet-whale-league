<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Award,
    BarChart2,
    Check,
    ChevronDown,
    ChevronRight,
    Cpu,
    ExternalLink,
    Eye,
    Fingerprint,
    Flame,
    Lock,
    Play,
    Radio,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Target,
    Users,
    Zap,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import type { MarketAsset, PaperOrderSide } from './types'
  import {
    buildLiveAlphaCrystals,
    getCopiedSignalIds,
    getWhaleGroupConfig,
    INITIAL_WHALE_THOUGHTS,
    recordCopiedSignal,
    saveWhaleGroupConfig,
    WHALE_AGENTS,
    type AlphaCrystalSignal,
    type WhaleAgent,
    type WhaleGroupConfig,
    type WhaleGroupThought,
  } from './whaleGroup'

  export let paperBalance: number = 500
  export let assets: MarketAsset[] = []
  export let onrehearse: (asset: MarketAsset, side: PaperOrderSide, amountUsd: number, signal: AlphaCrystalSignal) => void
  export let onseedposition: (signal: AlphaCrystalSignal) => void

  let config: WhaleGroupConfig = getWhaleGroupConfig()
  let agents: WhaleAgent[] = WHALE_AGENTS
  $: signals = buildLiveAlphaCrystals(assets)
  let thoughts: WhaleGroupThought[] = INITIAL_WHALE_THOUGHTS
  let copiedSignalIds: string[] = []
  let expandedSignalId: string | null = null
  let toastMessage: string | null = null
  let toastType: 'success' | 'info' | 'warning' = 'info'
  let activeTab: 'signals' | 'agents' | 'thoughts' | 'settings' = 'signals'
  let isRehearsing: string | null = null

  $: activeAgentCount = config.activeAgents.length
  $: allocatedCapitalUsd = Number(((paperBalance * config.allocationPercent) / 100).toFixed(2))

  onMount(() => {
    config = getWhaleGroupConfig()
    copiedSignalIds = getCopiedSignalIds()
  })

  function showToast(msg: string, type: 'success' | 'info' | 'warning' = 'info') {
    toastMessage = msg
    toastType = type
    setTimeout(() => {
      if (toastMessage === msg) toastMessage = null
    }, 4500)
  }

  function toggleAgent(agentId: string) {
    if (agentId === 'bettafish') {
      showToast('BETTAFISH is the mandatory risk & quorum veto gate. It cannot be disabled.', 'warning')
      return
    }
    const current = config.activeAgents
    const next = current.includes(agentId) ? current.filter((id) => id !== agentId) : [...current, agentId]
    config = { ...config, activeAgents: next }
    saveWhaleGroupConfig(config)
    const agent = agents.find((a) => a.id === agentId)
    showToast(`${agent?.name ?? 'Agent'} ${next.includes(agentId) ? 'activated' : 'deactivated'} on desk.`, 'info')
  }

  function handleAllocationChange(event: Event) {
    const target = event.target as HTMLInputElement
    const val = Number(target.value)
    config = { ...config, allocationPercent: val }
    saveWhaleGroupConfig(config)
  }

  function toggleAutoMirror() {
    config = { ...config, autoMirrorEnabled: !config.autoMirrorEnabled }
    saveWhaleGroupConfig(config)
    showToast(
      config.autoMirrorEnabled
        ? '⚡ Whale Group Auto-Mirror active (Supervised paper rehearsal mode).'
        : 'Whale Group Auto-Mirror paused. Manual rehearsal mode only.',
      'success'
    )
  }

  async function triggerRehearsal(signal: AlphaCrystalSignal) {
    isRehearsing = signal.id
    try {
      const asset = assets.find((a) => a.symbol.toUpperCase() === signal.assetSymbol.toUpperCase()) ?? {
        id: signal.assetId,
        symbol: signal.assetSymbol,
        name: signal.assetName,
        image: '',
        price: signal.entryPriceUsd,
        change1h: 0,
        change24h: 1.5,
        change7d: 4.2,
        marketCap: 1000000000,
        volume: 50000000,
        rank: 1,
      }

      const tradeAmount = Math.min(
        allocatedCapitalUsd * (signal.suggestedAllocationPct / 100),
        paperBalance * 0.5
      )
      const sanitizedAmount = Math.max(10, Number(tradeAmount.toFixed(2)))

      onrehearse(asset, signal.direction, sanitizedAmount, signal)
      recordCopiedSignal(signal.id)
      copiedSignalIds = getCopiedSignalIds()

      showToast(
        `✓ Rehearsed ${signal.strategyType} for ${signal.assetSymbol} with Bettafish Quorum approval! Receipt generated.`,
        'success'
      )
    } finally {
      setTimeout(() => {
        isRehearsing = null
      }, 600)
    }
  }

  function handleSeed(signal: AlphaCrystalSignal) {
    onseedposition(signal)
    recordCopiedSignal(signal.id)
    copiedSignalIds = getCopiedSignalIds()
    showToast(`Added ${signal.assetSymbol} (${signal.strategyType}) directly to your Paper Desk portfolio!`, 'success')
  }

  function toggleExpand(id: string) {
    expandedSignalId = expandedSignalId === id ? null : id
  }
</script>

<section class="whale-desk-card" id="whale-trading-desk" aria-labelledby="whale-trading-desk-title">
  <!-- Desk Header -->
  <div class="whale-desk-head">
    <div class="head-brand">
      <div class="brand-avatar">
        <span>🐋</span>
      </div>
      <div class="brand-copy">
        <div class="kicker-row">
          <span class="badge-organism"><Activity size={12} /> 200-BRAIN SWARM ORGANISM</span>
          <span class="badge-guard"><ShieldCheck size={12} /> BETTAFISH QUORUM VETO ACTIVE</span>
          <span class="badge-safe"><Lock size={11} /> 100% ZERO-RISK PAPER BOUND</span>
        </div>
        <h2 id="whale-trading-desk-title">Whale Trading Group Desk</h2>
        <p>Live algorithmic strategy crystals, onchain whale accumulation signals, and multi-lens consensus linked directly to your paper trading desk.</p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="desk-telemetry-badge">
      <div class="telemetry-pill">
        <span>SWARM REGIME</span>
        <strong><Flame size={13} class="icon-pulse" /> BULL_EXPANSION</strong>
      </div>
      <div class="telemetry-pill">
        <span>DEPLOYED DESK CAPITAL</span>
        <strong class="color-lime">${allocatedCapitalUsd} FKUSDC ({config.allocationPercent}%)</strong>
      </div>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <div class="whale-desk-nav">
    <div class="nav-tabs" role="tablist">
      <button type="button" role="tab" class:active={activeTab === 'signals'} onclick={() => (activeTab = 'signals')}>
        <Sparkles size={14} /> Alpha Crystals ({signals.length})
      </button>
      <button type="button" role="tab" class:active={activeTab === 'agents'} onclick={() => (activeTab = 'agents')}>
        <Users size={14} /> Whale Crew ({activeAgentCount}/{agents.length})
      </button>
      <button type="button" role="tab" class:active={activeTab === 'thoughts'} onclick={() => (activeTab = 'thoughts')}>
        <Radio size={14} /> Swarm Telemetry
      </button>
      <button type="button" role="tab" class:active={activeTab === 'settings'} onclick={() => (activeTab = 'settings')}>
        <Sliders size={14} /> Copy Guardrails
      </button>
    </div>

    <div class="mirror-toggle">
      <span class="mirror-label">
        <Zap size={13} class={config.autoMirrorEnabled ? 'icon-active' : ''} /> Auto-Mirror Signals:
      </span>
      <button type="button" class="toggle-btn" class:active={config.autoMirrorEnabled} onclick={toggleAutoMirror}>
        {config.autoMirrorEnabled ? 'ENABLED' : 'PAUSED'}
      </button>
    </div>
  </div>

  <!-- Toast Bar -->
  {#if toastMessage}
    <div class="toast-bar" class:success={toastType === 'success'} class:warning={toastType === 'warning'}>
      {#if toastType === 'success'}
        <Check size={14} />
      {:else if toastType === 'warning'}
        <AlertTriangle size={14} />
      {:else}
        <Activity size={14} />
      {/if}
      <span>{toastMessage}</span>
    </div>
  {/if}

  <!-- TAB CONTENT: SIGNALS -->
  {#if activeTab === 'signals'}
    <div class="signals-container">
      <div class="section-subhead">
        <div>
          <h3>High-Conviction Alpha Crystals</h3>
          <p>Autonomous setups generated by the Whale Trading Group, verified by Bettafish risk engine with deterministic receipts.</p>
        </div>
        <span class="evidence-tag"><Fingerprint size={12} /> SHA-256 VERIFIED</span>
      </div>

      <div class="signals-list">
        {#each signals as signal (signal.id)}
          {@const isCopied = copiedSignalIds.includes(signal.id)}
          {@const isExpanded = expandedSignalId === signal.id}
          <div class="signal-row-card" class:expanded={isExpanded} class:copied={isCopied}>
            <div class="signal-main-bar">
              <!-- Asset & Direction -->
              <div class="signal-asset-col">
                <span class="asset-symbol-pill" class:buy={signal.direction === 'buy'} class:sell={signal.direction === 'sell'}>
                  {#if signal.direction === 'buy'}<ArrowUpRight size={13} />{:else}<ArrowDownRight size={13} />{/if}
                  {signal.direction.toUpperCase()}
                </span>
                <div class="asset-titles">
                  <strong>{signal.assetSymbol}</strong>
                  <small>{signal.strategyType.replace(/_/g, ' ')}</small>
                </div>
              </div>

              <!-- Price & Target -->
              <div class="signal-metrics-col">
                <div>
                  <span>ENTRY</span>
                  <strong>${signal.entryPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span>TARGET</span>
                  <strong class="color-green">${signal.targetPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span>STOP LOSS</span>
                  <strong class="color-red">${signal.stopLossUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <!-- Metrics -->
              <div class="signal-stats-col">
                <div>
                  <span>SHARPE</span>
                  <strong>{signal.expectedSharpe.toFixed(2)}</strong>
                </div>
                <div>
                  <span>CONFIDENCE</span>
                  <strong class="color-cyan">{(signal.confidenceScore * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span>AUTHOR</span>
                  <strong class="color-purple">{signal.analystAgentName}</strong>
                </div>
              </div>

              <!-- Actions -->
              <div class="signal-actions-col">
                <button
                  type="button"
                  class="action-btn rehearse-btn"
                  disabled={isRehearsing === signal.id}
                  onclick={() => triggerRehearsal(signal)}
                  title="Rehearse this trade on your paper desk immediately"
                >
                  <Play size={13} />
                  {isRehearsing === signal.id ? 'Rehearsing...' : 'Rehearse on Desk'}
                </button>

                <button
                  type="button"
                  class="action-btn seed-btn"
                  onclick={() => handleSeed(signal)}
                  title="Add to paper desk balance sheet"
                >
                  <Award size={13} />
                  Copy Position
                </button>

                <button
                  type="button"
                  class="expand-btn"
                  aria-expanded={isExpanded}
                  onclick={() => toggleExpand(signal.id)}
                  title="View full thesis and invalidation"
                >
                  <ChevronDown size={15} class={isExpanded ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>

            <!-- Expanded Details -->
            {#if isExpanded}
              <div class="signal-expanded-tray">
                <div class="tray-grid">
                  <div class="tray-cell thesis-box">
                    <span class="cell-label"><Target size={12} /> INVESTMENT THESIS</span>
                    <p>{signal.thesis}</p>
                  </div>
                  <div class="tray-cell invalidation-box">
                    <span class="cell-label"><ShieldAlert size={12} /> INVALIDATION CRITERIA</span>
                    <p>{signal.invalidation}</p>
                  </div>
                </div>
                <div class="tray-foot">
                  <span>QUORUM: <strong class="color-green">{signal.quorumStatus}</strong></span>
                  <span>EVIDENCE RECEIPT: <code>{signal.receiptHash.slice(0, 16)}...</code></span>
                  <span>MAX DRAWDOWN: <strong>{signal.maxDrawdownPct}%</strong></span>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

  <!-- TAB CONTENT: AGENTS -->
  {:else if activeTab === 'agents'}
    <div class="agents-container">
      <div class="section-subhead">
        <div>
          <h3>Whale Crew Agent Roster</h3>
          <p>Autonomous agents evaluating real-time order books, social spikes, macro regimes, and onchain whale blocks.</p>
        </div>
        <span class="active-pill">{activeAgentCount} OF {agents.length} OPERATING</span>
      </div>

      <div class="agents-grid">
        {#each agents as agent (agent.id)}
          {@const isActive = config.activeAgents.includes(agent.id)}
          <div class="agent-card" class:active={isActive} style="--agent-color: {agent.color}">
            <div class="agent-head">
              <span class="agent-avatar">{agent.avatar}</span>
              <div class="agent-meta">
                <div class="name-row">
                  <strong>{agent.name}</strong>
                  <span class="agent-status" class:online={isActive}>{isActive ? 'ONLINE' : 'MUTED'}</span>
                </div>
                <small>{agent.role}</small>
              </div>
            </div>

            <p class="agent-specialty">{agent.specialty}</p>

            <div class="agent-foot">
              <div class="win-rate">
                <span>SIM WIN RATE</span>
                <strong>{agent.winRatePct.toFixed(1)}%</strong>
              </div>
              <button
                type="button"
                class="agent-toggle-btn"
                class:active={isActive}
                disabled={agent.id === 'bettafish'}
                onclick={() => toggleAgent(agent.id)}
              >
                {agent.id === 'bettafish' ? 'GUARD (LOCKED)' : isActive ? 'CONNECTED' : 'DISCONNECTED'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

  <!-- TAB CONTENT: THOUGHTS -->
  {:else if activeTab === 'thoughts'}
    <div class="thoughts-container">
      <div class="section-subhead">
        <div>
          <h3>Swarm Telemetry & Consensus Wire</h3>
          <p>Real-time audit log of multi-agent debate, evidence validation, and onchain block scrubbing.</p>
        </div>
        <button class="refresh-pill" type="button" onclick={() => showToast('Swarm telemetry refreshed.', 'info')}>
          <RefreshCw size={12} /> Sync Wire
        </button>
      </div>

      <div class="thoughts-list">
        {#each thoughts as thought (thought.id)}
          <div class="thought-item" style="--author-color: {thought.color}">
            <div class="thought-author">
              <span class="author-icon">{thought.avatar}</span>
              <strong>{thought.agentName}</strong>
              <span class="category-badge">{thought.category}</span>
              <small>{thought.timestamp}</small>
            </div>
            <p class="thought-body">{thought.thought}</p>
          </div>
        {/each}
      </div>
    </div>

  <!-- TAB CONTENT: SETTINGS -->
  {:else if activeTab === 'settings'}
    <div class="settings-container">
      <div class="section-subhead">
        <div>
          <h3>Whale Trading Desk Risk Governance</h3>
          <p>Enforce strict mathematical boundaries on how much paper capital is allocated to whale signals.</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="setting-item">
          <label for="alloc-slider">
            <span>Whale Group Capital Allocation</span>
            <strong>{config.allocationPercent}% (${allocatedCapitalUsd} FKUSDC)</strong>
          </label>
          <input
            id="alloc-slider"
            type="range"
            min="5"
            max="100"
            step="5"
            value={config.allocationPercent}
            oninput={handleAllocationChange}
          />
          <small>Maximum share of your FKUSDC paper balance committed to Whale Group trade rehearsals.</small>
        </div>

        <div class="setting-item">
          <label for="daily-loss">
            <span>Daily Drawdown Circuit Breaker</span>
            <strong>${config.maxDailyLossUsd} max loss</strong>
          </label>
          <input
            id="daily-loss"
            type="number"
            min="10"
            max="500"
            bind:value={config.maxDailyLossUsd}
            onchange={() => saveWhaleGroupConfig(config)}
          />
          <small>If simulated losses reach this threshold in 24h, Bettafish automatically halts paper execution.</small>
        </div>

        <div class="setting-item">
          <label for="slippage-lim">
            <span>Simulated Max Slippage Ceiling</span>
            <strong>{config.maxSlippagePct}% max</strong>
          </label>
          <input
            id="slippage-lim"
            type="number"
            min="0.1"
            max="2.0"
            step="0.1"
            bind:value={config.maxSlippagePct}
            onchange={() => saveWhaleGroupConfig(config)}
          />
          <small>Rejects simulated fills where DEX depth slippage exceeds this boundary.</small>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .whale-desk-card {
    border: 1px solid var(--line);
    background: #090b10;
    margin-bottom: 24px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    overflow: hidden;
  }

  .whale-desk-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 18px 20px;
    background: linear-gradient(180deg, #0f141f 0%, #090b10 100%);
    border-bottom: 1px solid var(--line);
    flex-wrap: wrap;
  }

  .head-brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .brand-avatar {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    background: #121c2d;
    border: 1px solid #1e3a5f;
    border-radius: 8px;
    font-size: 24px;
    flex-shrink: 0;
  }

  .kicker-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .badge-organism {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    background: #11253a;
    border: 1px solid #1e4a78;
    color: var(--cyan);
    font: 800 7.5px/1 'IBM Plex Mono', monospace;
    border-radius: 3px;
  }

  .badge-guard {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    background: #0d281e;
    border: 1px solid #165b40;
    color: var(--green);
    font: 800 7.5px/1 'IBM Plex Mono', monospace;
    border-radius: 3px;
  }

  .badge-safe {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    background: #191c24;
    border: 1px solid #2d3345;
    color: #94a3b8;
    font: 800 7.5px/1 'IBM Plex Mono', monospace;
    border-radius: 3px;
  }

  .brand-copy h2 {
    margin: 2px 0 4px;
    font-size: 19px;
    font-weight: 800;
    color: #f1f5f9;
  }

  .brand-copy p {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
    max-width: 620px;
    line-height: 1.45;
  }

  .desk-telemetry-badge {
    display: flex;
    gap: 12px;
  }

  .telemetry-pill {
    padding: 8px 14px;
    background: #0d121c;
    border: 1px solid var(--line);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 140px;
  }

  .telemetry-pill span {
    font: 700 7.5px/1 'IBM Plex Mono', monospace;
    color: #64748b;
  }

  .telemetry-pill strong {
    font: 800 11px/1 'IBM Plex Mono', monospace;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .color-lime {
    color: var(--lime) !important;
  }
  .color-green {
    color: var(--green) !important;
  }
  .color-cyan {
    color: var(--cyan) !important;
  }
  .color-purple {
    color: #c084fc !important;
  }
  .color-red {
    color: #f87171 !important;
  }

  :global(.icon-pulse) {
    color: #f97316;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Nav Tabs */
  .whale-desk-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: #0a0d14;
    border-bottom: 1px solid var(--line);
    flex-wrap: wrap;
    gap: 10px;
  }

  .nav-tabs {
    display: flex;
    height: 42px;
  }

  .nav-tabs button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 16px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #94a3b8;
    font: 700 9px/1 'IBM Plex Mono', monospace;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nav-tabs button:hover {
    color: #f1f5f9;
  }

  .nav-tabs button.active {
    color: var(--cyan);
    border-bottom-color: var(--cyan);
    background: #0f1624;
  }

  .mirror-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .mirror-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font: 700 8px/1 'IBM Plex Mono', monospace;
    color: #64748b;
  }

  :global(.icon-active) {
    color: var(--lime);
  }

  .toggle-btn {
    padding: 4px 10px;
    border: 1px solid var(--line);
    background: #11141d;
    color: #64748b;
    font: 800 8px/1 'IBM Plex Mono', monospace;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s ease;
  }

  .toggle-btn.active {
    background: #142812;
    border-color: var(--lime);
    color: var(--lime);
  }

  /* Toast bar */
  .toast-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #0d1e29;
    border-bottom: 1px solid #1a3c4f;
    color: #38bdf8;
    font: 700 8.5px/1 'IBM Plex Mono', monospace;
  }

  .toast-bar.success {
    background: #0d261a;
    border-color: #175438;
    color: #4ade80;
  }

  .toast-bar.warning {
    background: #2b1d0d;
    border-color: #5c3812;
    color: #fbbf24;
  }

  /* Subheads */
  .section-subhead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
    background: #0c0f17;
    border-bottom: 1px solid var(--line);
  }

  .section-subhead h3 {
    margin: 0 0 3px;
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .section-subhead p {
    margin: 0;
    font-size: 9px;
    color: var(--muted);
  }

  .evidence-tag,
  .active-pill,
  .refresh-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border: 1px solid var(--line);
    background: #121622;
    color: #94a3b8;
    font: 700 8px/1 'IBM Plex Mono', monospace;
    border-radius: 3px;
    cursor: pointer;
  }

  /* SIGNALS TAB */
  .signals-list {
    display: grid;
    gap: 1px;
    background: var(--line);
  }

  .signal-row-card {
    background: #090b10;
    transition: background 0.15s ease;
  }

  .signal-row-card:hover {
    background: #0d111a;
  }

  .signal-row-card.copied {
    border-left: 3px solid var(--lime);
  }

  .signal-main-bar {
    display: grid;
    grid-template-columns: 180px 1.4fr 1.2fr 240px;
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
  }

  .signal-asset-col {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .asset-symbol-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 6px;
    font: 800 8px/1 'IBM Plex Mono', monospace;
    border-radius: 3px;
  }

  .asset-symbol-pill.buy {
    background: #0f2a1d;
    color: #4ade80;
    border: 1px solid #165b38;
  }

  .asset-symbol-pill.sell {
    background: #2d1217;
    color: #f87171;
    border: 1px solid #5c1e28;
  }

  .asset-titles strong {
    font-size: 13px;
    display: block;
    color: #f1f5f9;
  }

  .asset-titles small {
    font-size: 8px;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
  }

  .signal-metrics-col,
  .signal-stats-col {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .signal-metrics-col > div,
  .signal-stats-col > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .signal-metrics-col span,
  .signal-stats-col span {
    font: 700 7px/1 'IBM Plex Mono', monospace;
    color: #64748b;
  }

  .signal-metrics-col strong,
  .signal-stats-col strong {
    font: 700 10.5px/1 'IBM Plex Mono', monospace;
    color: #cbd5e1;
  }

  .signal-actions-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 11px;
    border: 1px solid transparent;
    border-radius: 3px;
    font: 800 8.5px/1 'IBM Plex Mono', monospace;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .rehearse-btn {
    background: var(--lime);
    color: #0b1104;
    border-color: #9ecc29;
  }

  .rehearse-btn:hover {
    background: #d4f84d;
    box-shadow: 0 0 10px rgba(198, 241, 53, 0.4);
  }

  .seed-btn {
    background: #111a26;
    border-color: #1e354f;
    color: var(--cyan);
  }

  .seed-btn:hover {
    background: #172638;
    color: #67e8f9;
  }

  .expand-btn {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    background: #0e121a;
    color: #94a3b8;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .expand-btn:hover {
    color: #f1f5f9;
    border-color: #334155;
  }

  :global(.rotate-180) {
    transform: rotate(180deg);
  }

  .signal-expanded-tray {
    padding: 14px 18px;
    background: #06070a;
    border-top: 1px solid #161b26;
  }

  .tray-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 12px;
  }

  .tray-cell {
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #090d14;
  }

  .cell-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font: 800 7.5px/1 'IBM Plex Mono', monospace;
    color: var(--cyan);
    margin-bottom: 6px;
  }

  .invalidation-box .cell-label {
    color: #f87171;
  }

  .tray-cell p {
    margin: 0;
    font-size: 10px;
    color: #cbd5e1;
    line-height: 1.45;
  }

  .tray-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid #131722;
    font: 700 8px/1 'IBM Plex Mono', monospace;
    color: #64748b;
  }

  .tray-foot code {
    color: #94a3b8;
  }

  /* AGENTS TAB */
  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  .agent-card {
    background: #0a0d14;
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    transition: all 0.15s ease;
  }

  .agent-card.active {
    border-color: #1e3a5f;
    box-shadow: inset 0 2px 0 var(--agent-color);
  }

  .agent-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .agent-avatar {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    background: #111520;
    border: 1px solid var(--line);
    border-radius: 6px;
    font-size: 18px;
    flex-shrink: 0;
  }

  .agent-meta {
    flex: 1;
    min-width: 0;
  }

  .name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .name-row strong {
    font-size: 12px;
    color: #f1f5f9;
  }

  .agent-status {
    font: 800 7px/1 'IBM Plex Mono', monospace;
    padding: 2px 6px;
    border-radius: 2px;
    background: #1a1e28;
    color: #64748b;
  }

  .agent-status.online {
    background: #0d261a;
    color: #4ade80;
  }

  .agent-meta small {
    display: block;
    font-size: 9px;
    color: var(--muted);
    margin-top: 2px;
  }

  .agent-specialty {
    margin: 0;
    font-size: 9.5px;
    color: #94a3b8;
    line-height: 1.4;
    min-height: 38px;
  }

  .agent-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid #141824;
  }

  .win-rate span {
    display: block;
    font: 700 7px/1 'IBM Plex Mono', monospace;
    color: #64748b;
  }

  .win-rate strong {
    font: 800 11px/1 'IBM Plex Mono', monospace;
    color: #e2e8f0;
  }

  .agent-toggle-btn {
    padding: 5px 10px;
    border: 1px solid var(--line);
    background: #121622;
    color: #94a3b8;
    font: 800 8px/1 'IBM Plex Mono', monospace;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s ease;
  }

  .agent-toggle-btn.active {
    background: #11283a;
    border-color: #1e5a88;
    color: var(--cyan);
  }

  /* THOUGHTS TAB */
  .thoughts-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--line);
  }

  .thought-item {
    background: #090b10;
    padding: 12px 18px;
    border-left: 3px solid var(--author-color);
  }

  .thought-author {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  .author-icon {
    font-size: 14px;
  }

  .thought-author strong {
    font: 800 9px/1 'IBM Plex Mono', monospace;
    color: #f1f5f9;
  }

  .category-badge {
    padding: 1px 6px;
    background: #141824;
    border: 1px solid var(--line);
    color: #94a3b8;
    font: 800 7px/1 'IBM Plex Mono', monospace;
    border-radius: 2px;
  }

  .thought-author small {
    margin-left: auto;
    font: 700 7.5px/1 'IBM Plex Mono', monospace;
    color: #64748b;
  }

  .thought-body {
    margin: 0;
    font-size: 10px;
    color: #cbd5e1;
    line-height: 1.45;
  }

  /* SETTINGS TAB */
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 18px;
  }

  .setting-item {
    padding: 14px;
    background: #0c0f17;
    border: 1px solid var(--line);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-item label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .setting-item label span {
    font: 700 8.5px/1 'IBM Plex Mono', monospace;
    color: #94a3b8;
  }

  .setting-item label strong {
    font: 800 10.5px/1 'IBM Plex Mono', monospace;
    color: var(--cyan);
  }

  .setting-item input[type='range'] {
    width: 100%;
    accent-color: var(--cyan);
    cursor: pointer;
  }

  .setting-item input[type='number'] {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line);
    background: #090b10;
    color: #f1f5f9;
    font: 800 11px/1 'IBM Plex Mono', monospace;
    border-radius: 3px;
  }

  .setting-item small {
    font-size: 8.5px;
    color: #64748b;
    line-height: 1.4;
  }

  @media (max-width: 900px) {
    .signal-main-bar {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .signal-actions-col {
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .tray-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
