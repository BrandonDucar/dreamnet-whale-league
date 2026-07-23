<script lang="ts">
  import {
    Activity,
    BarChart3,
    BellPlus,
    Clock3,
    ExternalLink,
    Fingerprint,
    Gauge,
    RefreshCw,
    ShieldCheck,
    Target,
    UsersRound,
    Waves,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import {
    analyzeWalletActivity,
    fetchPolymarketActivity,
    fetchPolymarketLeaderboard,
    fetchPolymarketMarketGenomes,
    type MarketGenome,
    type PolymarketActivity,
    type PolymarketCategory,
    type PolymarketOrder,
    type PolymarketPeriod,
    type PolymarketTrader,
    type WalletDna,
  } from './polymarket'

  type LabView = 'wallets' | 'markets'

  const categories: Array<{ value: PolymarketCategory; label: string }> = [
    { value: 'OVERALL', label: 'All markets' },
    { value: 'CRYPTO', label: 'Crypto' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'ECONOMICS', label: 'Economics' },
    { value: 'POLITICS', label: 'Politics' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'TECH', label: 'Tech' },
    { value: 'WEATHER', label: 'Weather' },
    { value: 'CULTURE', label: 'Culture' },
  ]
  const periods: PolymarketPeriod[] = ['DAY', 'WEEK', 'MONTH', 'ALL']

  let activeView: LabView = 'wallets'
  let category: PolymarketCategory = 'OVERALL'
  let period: PolymarketPeriod = 'MONTH'
  let orderBy: PolymarketOrder = 'PNL'
  let leaderboard: PolymarketTrader[] = []
  let selectedTrader: PolymarketTrader | null = null
  let activity: PolymarketActivity[] = []
  let dna: WalletDna = analyzeWalletActivity([])
  let genomes: MarketGenome[] = []
  let watchedWallets: string[] = []
  let leaderboardLoading = true
  let activityLoading = false
  let genomesLoading = true
  let leaderboardError = ''
  let activityError = ''
  let genomesError = ''
  let lastUpdated = ''
  let leaderboardController: AbortController | null = null
  let activityController: AbortController | null = null

  onMount(() => {
    watchedWallets = readJson<string[]>('whale-signal-lab-watchlist', [])
    void loadLeaderboard()
    void loadGenomes()
    return () => {
      leaderboardController?.abort()
      activityController?.abort()
    }
  })

  function readJson<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) as T : fallback
    } catch {
      return fallback
    }
  }

  async function loadLeaderboard() {
    leaderboardController?.abort()
    leaderboardController = new AbortController()
    leaderboardLoading = true
    leaderboardError = ''
    try {
      const next = await fetchPolymarketLeaderboard(category, period, orderBy, leaderboardController.signal)
      leaderboard = next
      lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const preserved = selectedTrader && next.find((entry) => entry.wallet === selectedTrader?.wallet)
      await selectTrader(preserved ?? next[0] ?? null)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') leaderboardError = (error as Error).message
    } finally {
      leaderboardLoading = false
    }
  }

  async function loadGenomes() {
    genomesLoading = true
    genomesError = ''
    try {
      genomes = await fetchPolymarketMarketGenomes()
    } catch (error) {
      genomesError = (error as Error).message
    } finally {
      genomesLoading = false
    }
  }

  async function selectTrader(trader: PolymarketTrader | null) {
    selectedTrader = trader
    activity = []
    dna = analyzeWalletActivity([])
    activityError = ''
    activityController?.abort()
    if (!trader) return

    activityController = new AbortController()
    activityLoading = true
    try {
      activity = await fetchPolymarketActivity(trader.wallet, activityController.signal)
      dna = analyzeWalletActivity(activity)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') activityError = (error as Error).message
    } finally {
      activityLoading = false
    }
  }

  function setCategory(value: PolymarketCategory) {
    category = value
    void loadLeaderboard()
  }

  function setPeriod(value: PolymarketPeriod) {
    period = value
    void loadLeaderboard()
  }

  function setOrder(value: PolymarketOrder) {
    orderBy = value
    void loadLeaderboard()
  }

  function toggleWatch(wallet: string) {
    watchedWallets = watchedWallets.includes(wallet)
      ? watchedWallets.filter((entry) => entry !== wallet)
      : [...watchedWallets, wallet]
    localStorage.setItem('whale-signal-lab-watchlist', JSON.stringify(watchedWallets))
  }

  function money(value: number, compact = false) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 0,
    }).format(value)
  }

  function percent(value: number) {
    return `${Math.round(value * 100)}%`
  }

  function shortWallet(wallet: string) {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  function relativeTime(timestamp: number) {
    const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp))
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  function horizon(endDate: string) {
    if (!endDate) return 'No end date'
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
    if (days < 0) return 'Past listed end'
    if (days === 0) return 'Resolves today'
    return `${days}d horizon`
  }

  function liquiditySupport(event: MarketGenome) {
    if (!event.volume24h) return 0
    return Math.min(event.liquidity / event.volume24h, 9.99)
  }
</script>

<section class="signal-lab" id="whale-intelligence" aria-labelledby="signal-lab-title">
  <div class="lab-head">
    <div>
      <span class="lab-kicker"><Fingerprint size={15} /> PUBLIC MARKET FORENSICS</span>
      <h2 id="signal-lab-title">Whale Signal Lab</h2>
      <p>Study what public wallets and markets are doing now. Profiles are derived from visible activity samples, never from invented identities or promised returns.</p>
    </div>
    <div class="lab-status">
      <span><i></i>POLYMARKET PUBLIC API</span>
      <strong>{lastUpdated ? `UPDATED ${lastUpdated}` : 'CONNECTING'}</strong>
    </div>
  </div>

  <div class="lab-toolbar">
    <div class="lab-tabs" aria-label="Signal lab view">
      <button type="button" class:active={activeView === 'wallets'} onclick={() => (activeView = 'wallets')}><UsersRound size={14} /> WALLET DNA</button>
      <button type="button" class:active={activeView === 'markets'} onclick={() => (activeView = 'markets')}><Waves size={14} /> MARKET GENOME</button>
    </div>
    <div class="evidence-boundary"><ShieldCheck size={13} /> RESEARCH + PAPER STUDY ONLY</div>
  </div>

  {#if activeView === 'wallets'}
    <div class="wallet-controls">
      <label><span>MARKET SPECIALTY</span><select value={category} onchange={(event) => setCategory(event.currentTarget.value as PolymarketCategory)}>{#each categories as option}<option value={option.value}>{option.label}</option>{/each}</select></label>
      <div><span>WINDOW</span><div class="period-control">{#each periods as value}<button type="button" class:active={period === value} onclick={() => setPeriod(value)}>{value}</button>{/each}</div></div>
      <div><span>RANK BY</span><div class="period-control"><button type="button" class:active={orderBy === 'PNL'} onclick={() => setOrder('PNL')}>P&amp;L</button><button type="button" class:active={orderBy === 'VOL'} onclick={() => setOrder('VOL')}>VOLUME</button></div></div>
      <button class="refresh-lab" type="button" onclick={() => void loadLeaderboard()} title="Refresh public wallet data"><RefreshCw size={15} class={leaderboardLoading ? 'spinning' : ''} /></button>
    </div>

    <div class="wallet-grid">
      <div class="leaderboard-panel">
        <div class="panel-label"><span>PUBLIC LEADERBOARD</span><strong>{leaderboard.length} PROFILES</strong></div>
        <div class="leaderboard-columns"><span># / TRADER</span><span>P&amp;L</span><span>VOLUME</span></div>
        {#if leaderboardLoading && !leaderboard.length}
          <div class="loading-state"><Activity size={20} /> Loading public rankings...</div>
        {:else if leaderboardError}
          <div class="error-state"><strong>Leaderboard unavailable</strong><span>{leaderboardError}</span><button type="button" onclick={() => void loadLeaderboard()}>Retry</button></div>
        {:else}
          <div class="leaderboard-list">
            {#each leaderboard as trader}
              <button type="button" class:selected={selectedTrader?.wallet === trader.wallet} onclick={() => void selectTrader(trader)}>
                <span class="rank">{trader.rank}</span>
                <span class="trader-name">
                  {#if trader.profileImage}<img src={trader.profileImage} alt="" />{:else}<i>{trader.userName.slice(0, 2).toUpperCase()}</i>{/if}
                  <span><strong>{trader.userName}</strong><small>{shortWallet(trader.wallet)}</small></span>
                </span>
                <strong class:negative={trader.pnl < 0}>{money(trader.pnl, true)}</strong>
                <span>{money(trader.volume, true)}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="dna-panel">
        {#if selectedTrader}
          <div class="dna-head">
            <div><span>OBSERVED WALLET PROFILE</span><h3>{selectedTrader.userName}</h3><a href={`https://polymarket.com/profile/${selectedTrader.wallet}`} target="_blank" rel="noreferrer">{shortWallet(selectedTrader.wallet)}<ExternalLink size={11} /></a></div>
            <button type="button" class:watching={watchedWallets.includes(selectedTrader.wallet)} onclick={() => toggleWatch(selectedTrader!.wallet)}><BellPlus size={14} />{watchedWallets.includes(selectedTrader.wallet) ? 'Watching' : 'Watch wallet'}</button>
          </div>

          {#if activityLoading}
            <div class="loading-state"><Activity size={20} /> Building profile from the latest public activity...</div>
          {:else if activityError}
            <div class="error-state"><strong>Activity sample unavailable</strong><span>{activityError}</span><button type="button" onclick={() => void selectTrader(selectedTrader)}>Retry</button></div>
          {:else}
            <div class="behavior-readout"><Fingerprint size={18} /><div><span>SAMPLE-DERIVED BEHAVIOR</span><strong>{dna.behavior}</strong></div></div>
            <div class="dna-metrics">
              <div><span>ACTIVITY SAMPLE</span><strong>{dna.sampleSize}</strong><small>latest public rows</small></div>
              <div><span>MARKET BREADTH</span><strong>{dna.uniqueMarkets}</strong><small>unique titles</small></div>
              <div><span>AVG TICKET</span><strong>{money(dna.averageTicket, true)}</strong><small>median {money(dna.medianTicket, true)}</small></div>
              <div><span>TRADE PACE</span><strong>{dna.tradesPerHour.toFixed(1)}/h</strong><small>{dna.sampledHours.toFixed(1)}h sample</small></div>
            </div>
            <div class="dna-bars">
              <div><span>Buy share <strong>{percent(dna.buyShare)}</strong></span><i><b style={`width:${dna.buyShare * 100}%`}></b></i></div>
              <div><span>Longshot price band <strong>{percent(dna.longshotShare)}</strong></span><i><b style={`width:${dna.longshotShare * 100}%`}></b></i></div>
              <div><span>Favorite price band <strong>{percent(dna.favoriteShare)}</strong></span><i><b style={`width:${dna.favoriteShare * 100}%`}></b></i></div>
              <div><span>Top-market concentration <strong>{percent(dna.topMarketShare)}</strong></span><i><b style={`width:${dna.topMarketShare * 100}%`}></b></i></div>
            </div>
            <div class="activity-tape">
              <div class="panel-label"><span>RECENT PUBLIC ACTIVITY</span><strong>{activity.length ? 'LIVE SAMPLE' : 'NO ROWS'}</strong></div>
              {#each activity.slice(0, 5) as trade}
                <a href={`https://polymarket.com/event/${trade.eventSlug || trade.slug}`} target="_blank" rel="noreferrer">
                  <span class:trade-sell={trade.side === 'SELL'}>{trade.side}</span>
                  <span><strong>{trade.outcome || 'Position'}</strong><small>{trade.title}</small></span>
                  <span><strong>{money(trade.usdcSize, true)}</strong><small>{relativeTime(trade.timestamp)}</small></span>
                </a>
              {/each}
            </div>
            <div class="method-note"><ShieldCheck size={13} />Behavior labels describe this visible sample only. They do not establish identity, intent, insider status, win rate, or future performance.</div>
          {/if}
        {:else}
          <div class="loading-state"><Target size={20} /> Select a public profile to inspect.</div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="genome-heading">
      <div><span>TOP ACTIVE EVENTS BY 24H VOLUME</span><strong>{genomes.length} MARKET GENOMES</strong></div>
      <button class="refresh-lab" type="button" onclick={() => void loadGenomes()} title="Refresh public market data"><RefreshCw size={15} class={genomesLoading ? 'spinning' : ''} /></button>
    </div>
    {#if genomesLoading && !genomes.length}
      <div class="loading-state market-loading"><Waves size={22} /> Reading current market structure...</div>
    {:else if genomesError}
      <div class="error-state market-error"><strong>Market genomes unavailable</strong><span>{genomesError}</span><button type="button" onclick={() => void loadGenomes()}>Retry</button></div>
    {:else}
      <div class="genome-grid">
        {#each genomes as genome, index}
          <article>
            <div class="genome-rank"><span>{String(index + 1).padStart(2, '0')}</span>{#if genome.image}<img src={genome.image} alt="" />{/if}<strong>{genome.marketCount} OUTCOMES</strong></div>
            <h3>{genome.title}</h3>
            <div class="genome-stats">
              <div><BarChart3 size={13} /><span>24H VOLUME</span><strong>{money(genome.volume24h, true)}</strong></div>
              <div><Waves size={13} /><span>LIQUIDITY</span><strong>{money(genome.liquidity, true)}</strong></div>
              <div><Target size={13} /><span>OPEN INTEREST</span><strong>{money(genome.openInterest, true)}</strong></div>
              <div><Gauge size={13} /><span>COMPETITION</span><strong>{Math.round(genome.competitive * 100)}</strong></div>
            </div>
            <div class="genome-signals">
              <span><Clock3 size={12} />{horizon(genome.endDate)}</span>
              <span>LIQ / 24H VOL {liquiditySupport(genome).toFixed(2)}x</span>
              {#if genome.restricted}<span>REGION RESTRICTED</span>{/if}
            </div>
            <div class="resolution-line"><span>RESOLUTION SOURCE</span><strong>{genome.resolutionSource || 'See market rules'}</strong></div>
            <a href={`https://polymarket.com/event/${genome.slug}`} target="_blank" rel="noreferrer">Inspect live market <ExternalLink size={12} /></a>
          </article>
        {/each}
      </div>
      <div class="method-note genome-note"><ShieldCheck size={13} />Market genomes expose current structure, not a recommendation. Volume, liquidity, open interest, competition, horizon, and resolution source should be evaluated together.</div>
    {/if}
  {/if}
</section>

<style>
  .signal-lab { border-bottom: 1px solid var(--line); background: #07090d; scroll-margin-top: 90px; }
  .lab-head { min-height: 116px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 22px; border-bottom: 1px solid var(--line); background: #0b1115; }
  .lab-kicker { display: flex; align-items: center; gap: 7px; color: var(--lime); font: 800 8px/1 'IBM Plex Mono', monospace; }
  .lab-head h2 { margin: 9px 0 6px; font-size: 23px; }
  .lab-head p { max-width: 680px; margin: 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
  .lab-status { min-width: 170px; display: grid; justify-items: end; gap: 7px; }
  .lab-status span { display: flex; align-items: center; gap: 6px; color: var(--green); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .lab-status i { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); }
  .lab-status strong { color: #777f84; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .lab-toolbar { min-height: 47px; display: flex; align-items: center; gap: 12px; padding: 7px 11px; border-bottom: 1px solid var(--line); background: #0d0c12; }
  .lab-tabs { height: 32px; display: flex; border: 1px solid var(--line); }
  .lab-tabs button { min-width: 132px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-right: 1px solid var(--line); background: #09080d; color: var(--muted); cursor: pointer; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .lab-tabs button:last-child { border-right: 0; }
  .lab-tabs button.active { background: var(--cyan); color: #021418; }
  .evidence-boundary { margin-left: auto; display: flex; align-items: center; gap: 5px; color: #7b8790; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .evidence-boundary :global(svg) { color: var(--green); }
  .wallet-controls { min-height: 58px; display: flex; align-items: end; gap: 10px; padding: 8px 11px; border-bottom: 1px solid var(--line); background: #080b0e; }
  .wallet-controls label, .wallet-controls > div { display: grid; gap: 5px; }
  .wallet-controls label > span, .wallet-controls > div > span { color: #737b82; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .wallet-controls select { width: 145px; height: 30px; padding: 0 7px; border: 1px solid var(--line); background: #111319; color: var(--text); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .period-control { height: 30px; display: flex; border: 1px solid var(--line); }
  .period-control button { min-width: 51px; border: 0; border-right: 1px solid var(--line); background: #0c0d12; color: #7c8189; cursor: pointer; font: 800 7px/1 'IBM Plex Mono', monospace; }
  .period-control button:last-child { border-right: 0; }
  .period-control button.active { background: var(--lime); color: #101503; }
  .refresh-lab { width: 31px; height: 31px; margin-left: auto; display: grid; place-items: center; border: 1px solid #365661; background: #0d1c21; color: var(--cyan); cursor: pointer; }
  .wallet-grid { display: grid; grid-template-columns: minmax(380px, .92fr) minmax(0, 1.35fr); min-height: 596px; }
  .leaderboard-panel { border-right: 1px solid var(--line); background: #08090d; }
  .panel-label { min-height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 11px; border-bottom: 1px solid var(--line); background: #101117; }
  .panel-label span, .panel-label strong { font: 800 7px/1 'IBM Plex Mono', monospace; }
  .panel-label span { color: var(--cyan); }
  .panel-label strong { color: #747985; }
  .leaderboard-columns { min-height: 31px; display: grid; grid-template-columns: 1fr 80px 80px; align-items: center; padding: 0 11px; color: #626873; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .leaderboard-columns span:not(:first-child) { text-align: right; }
  .leaderboard-list > button { width: 100%; min-height: 51px; display: grid; grid-template-columns: 24px minmax(0, 1fr) 80px 80px; align-items: center; gap: 6px; padding: 5px 11px; border: 0; border-top: 1px solid #1d1e26; background: #090a0f; color: var(--text); text-align: left; cursor: pointer; }
  .leaderboard-list > button:hover, .leaderboard-list > button.selected { background: #101820; box-shadow: inset 3px 0 0 var(--cyan); }
  .leaderboard-list > button > strong, .leaderboard-list > button > span:last-child { text-align: right; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .leaderboard-list > button > strong { color: var(--green); }
  .leaderboard-list > button > strong.negative { color: var(--red); }
  .leaderboard-list > button > span:last-child { color: #858b94; }
  .rank { color: #66717a; font: 800 9px/1 'IBM Plex Mono', monospace; }
  .trader-name { min-width: 0; display: flex; align-items: center; gap: 8px; }
  .trader-name img, .trader-name > i { width: 29px; height: 29px; flex: 0 0 auto; border: 1px solid #355967; object-fit: cover; }
  .trader-name > i { display: grid; place-items: center; background: #11242c; color: var(--cyan); font: normal 800 8px/1 'IBM Plex Mono', monospace; }
  .trader-name > span { min-width: 0; display: grid; gap: 4px; }
  .trader-name strong, .trader-name small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .trader-name strong { font-size: 10px; }
  .trader-name small { color: #69707a; font: 600 7px/1 'IBM Plex Mono', monospace; }
  .dna-panel { min-width: 0; background: #0b0b10; }
  .dna-head { min-height: 74px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--line); }
  .dna-head > div { min-width: 0; }
  .dna-head span { color: var(--hot); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .dna-head h3 { margin: 6px 0 4px; font-size: 18px; }
  .dna-head a { display: inline-flex; align-items: center; gap: 4px; color: var(--cyan); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .dna-head button { height: 31px; display: flex; align-items: center; gap: 5px; padding: 0 9px; border: 1px solid #6c526f; background: #1d1422; color: #d9c6df; cursor: pointer; font: 800 7px/1 'IBM Plex Mono', monospace; }
  .dna-head button.watching { border-color: var(--hot); background: #42112d; color: #ffc7e2; }
  .behavior-readout { min-height: 61px; display: flex; align-items: center; gap: 11px; padding: 10px 14px; border-bottom: 1px solid var(--line); background: #0a1719; color: var(--cyan); }
  .behavior-readout div { display: grid; gap: 5px; }
  .behavior-readout span { color: #6d7c80; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .behavior-readout strong { font: 800 11px/1.2 'IBM Plex Mono', monospace; }
  .dna-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-bottom: 1px solid var(--line); }
  .dna-metrics > div { min-height: 75px; display: grid; align-content: center; gap: 6px; padding: 9px 11px; border-right: 1px solid var(--line); }
  .dna-metrics > div:last-child { border-right: 0; }
  .dna-metrics span, .dna-metrics small { color: #6e737d; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .dna-metrics strong { color: var(--lime); font: 800 15px/1 'IBM Plex Mono', monospace; }
  .dna-metrics small { font-weight: 600; }
  .dna-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; padding: 14px; border-bottom: 1px solid var(--line); }
  .dna-bars > div { display: grid; gap: 6px; }
  .dna-bars span { display: flex; justify-content: space-between; color: #858994; font: 600 7px/1 'IBM Plex Mono', monospace; }
  .dna-bars strong { color: var(--text); }
  .dna-bars i { height: 5px; overflow: hidden; background: #242630; }
  .dna-bars b { display: block; height: 100%; background: var(--hot); }
  .activity-tape .panel-label { min-height: 31px; }
  .activity-tape > a { min-height: 43px; display: grid; grid-template-columns: 36px minmax(0, 1fr) 70px; align-items: center; gap: 8px; padding: 5px 12px; border-bottom: 1px solid #1d1e25; color: var(--text); }
  .activity-tape > a > span:first-child { color: var(--green); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .activity-tape > a > span:first-child.trade-sell { color: var(--red); }
  .activity-tape > a > span:nth-child(2), .activity-tape > a > span:last-child { min-width: 0; display: grid; gap: 4px; }
  .activity-tape > a > span:last-child { text-align: right; }
  .activity-tape strong, .activity-tape small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .activity-tape strong { font-size: 8px; }
  .activity-tape small { color: #686d77; font: 600 7px/1 'IBM Plex Mono', monospace; }
  .method-note { min-height: 39px; display: flex; align-items: center; gap: 6px; padding: 7px 12px; color: #777d86; font: 600 7px/1.4 'IBM Plex Mono', monospace; }
  .method-note :global(svg) { flex: 0 0 auto; color: var(--green); }
  .loading-state, .error-state { min-height: 180px; display: grid; place-content: center; justify-items: center; gap: 8px; padding: 20px; color: #747b83; text-align: center; font-size: 10px; }
  .loading-state :global(svg) { color: var(--cyan); }
  .error-state strong { color: #ff9ebd; }
  .error-state span { max-width: 320px; line-height: 1.5; }
  .error-state button { height: 29px; padding: 0 10px; border: 1px solid var(--hot); background: #42112d; color: #ffd0e6; cursor: pointer; }
  .genome-heading { min-height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid var(--line); background: #080b0e; }
  .genome-heading > div { display: grid; gap: 5px; }
  .genome-heading span { color: var(--cyan); font: 800 8px/1 'IBM Plex Mono', monospace; }
  .genome-heading strong { color: #737984; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .genome-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .genome-grid article { min-width: 0; padding: 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #0a0b10; }
  .genome-grid article:nth-child(even) { border-right: 0; }
  .genome-rank { min-height: 30px; display: flex; align-items: center; gap: 8px; }
  .genome-rank > span { color: var(--hot); font: 800 10px/1 'IBM Plex Mono', monospace; }
  .genome-rank img { width: 28px; height: 28px; border: 1px solid #3c444b; object-fit: cover; }
  .genome-rank strong { margin-left: auto; padding: 4px 5px; border: 1px solid #31545e; color: var(--cyan); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .genome-grid h3 { min-height: 34px; margin: 10px 0; font-size: 14px; line-height: 1.25; }
  .genome-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line); }
  .genome-stats > div { min-width: 0; min-height: 61px; display: grid; align-content: center; gap: 5px; padding: 7px; border-right: 1px solid var(--line); }
  .genome-stats > div:last-child { border-right: 0; }
  .genome-stats :global(svg) { color: var(--lime); }
  .genome-stats span { color: #686f78; font: 700 6px/1 'IBM Plex Mono', monospace; }
  .genome-stats strong { overflow: hidden; color: var(--text); text-overflow: ellipsis; font: 800 9px/1 'IBM Plex Mono', monospace; }
  .genome-signals { min-height: 39px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 7px 0; }
  .genome-signals span { display: inline-flex; align-items: center; gap: 4px; padding: 5px 6px; background: #15171d; color: #8b9097; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .resolution-line { min-height: 42px; display: grid; gap: 4px; padding: 7px 9px; border-left: 2px solid var(--amber); background: #17130b; }
  .resolution-line span { color: var(--amber); font: 800 6px/1 'IBM Plex Mono', monospace; }
  .resolution-line strong { overflow: hidden; color: #aaa18e; text-overflow: ellipsis; white-space: nowrap; font-size: 8px; }
  .genome-grid article > a { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; color: var(--cyan); font: 800 8px/1 'IBM Plex Mono', monospace; }
  .genome-note { border-top: 1px solid var(--line); }
  .market-loading, .market-error { min-height: 360px; }
  .refresh-lab :global(.spinning) { animation: spin .9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 980px) {
    .wallet-grid { grid-template-columns: 1fr; }
    .leaderboard-panel { border-right: 0; border-bottom: 1px solid var(--line); }
  }

  @media (max-width: 760px) {
    .lab-head { min-height: 105px; align-items: flex-start; padding: 15px 13px; }
    .lab-head h2 { font-size: 19px; }
    .lab-status { min-width: 112px; padding-top: 3px; }
    .lab-status span { text-align: right; }
    .lab-toolbar { align-items: stretch; flex-direction: column; }
    .lab-tabs { width: 100%; }
    .lab-tabs button { min-width: 0; flex: 1; }
    .evidence-boundary { margin-left: 0; }
    .wallet-controls { align-items: stretch; flex-wrap: wrap; }
    .wallet-controls label { width: 100%; }
    .wallet-controls select { width: 100%; }
    .wallet-controls > div { flex: 1; }
    .period-control button { min-width: 0; flex: 1; }
    .refresh-lab { align-self: end; }
    .wallet-grid { min-height: 0; }
    .leaderboard-columns { grid-template-columns: 1fr 66px 66px; }
    .leaderboard-list > button { grid-template-columns: 21px minmax(0, 1fr) 66px 66px; padding-inline: 8px; }
    .dna-head { align-items: flex-start; }
    .dna-metrics { grid-template-columns: 1fr 1fr; }
    .dna-metrics > div:nth-child(2) { border-right: 0; }
    .dna-metrics > div:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
    .dna-bars { grid-template-columns: 1fr; }
    .genome-grid { grid-template-columns: 1fr; }
    .genome-grid article, .genome-grid article:nth-child(even) { border-right: 0; }
    .genome-stats { grid-template-columns: 1fr 1fr; }
    .genome-stats > div:nth-child(2) { border-right: 0; }
    .genome-stats > div:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
  }
</style>
