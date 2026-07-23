<script lang="ts">
  import { Bot, Check, ChevronRight, CircleDollarSign, Gauge, Radar, ShieldCheck, WalletCards } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { scanConnectedWallet } from './portfolio'
  import type { MarketAsset, WalletHolding } from './types'
  import type { InjectedWalletProvider } from './wallet'
  import { chainName, shortAddress } from './wallet'

  export let walletAddress = ''
  export let walletChainId = ''
  export let assets: MarketAsset[] = []
  export let initialHoldings: WalletHolding[] = []
  export let walletProvider: InjectedWalletProvider | undefined = undefined
  export let onconnect: () => void
  export let onholdings: (holdings: WalletHolding[]) => void

  type Experience = 'new' | 'active' | 'advanced'
  type Goal = 'learn' | 'growth' | 'income' | 'preservation'
  type Risk = 'conservative' | 'balanced' | 'aggressive'
  type Horizon = 'intraday' | 'weeks' | 'months' | 'years'
  type Automation = 'alerts' | 'supervised' | 'autopilot'

  let nativeBalance: number | null = null
  let holdings: WalletHolding[] = []
  let scanStatus: 'idle' | 'scanning' | 'complete' | 'error' = 'idle'
  let scanMessage = ''
  let experience: Experience = 'active'
  let goal: Goal = 'growth'
  let risk: Risk = 'balanced'
  let horizon: Horizon = 'months'
  let automation: Automation = 'supervised'
  let maxDailyLoss = 100
  let maxPositionPct = 5
  let leverageCeiling = 1
  let generatedPlan = ''

  $: if (scanStatus !== 'scanning' && initialHoldings !== holdings) {
    holdings = initialHoldings
    nativeBalance = holdings.find((holding) => holding.isNative)?.quantity ?? (holdings.length ? 0 : null)
  }

  onMount(() => {
    holdings = initialHoldings
    nativeBalance = holdings.find((holding) => holding.isNative)?.quantity ?? null
    try {
      const saved = localStorage.getItem('whale-risk-profile')
      if (!saved) return
      const profile = JSON.parse(saved) as Record<string, string | number>
      experience = (profile.experience as Experience) ?? experience
      goal = (profile.goal as Goal) ?? goal
      risk = (profile.risk as Risk) ?? risk
      horizon = (profile.horizon as Horizon) ?? horizon
      automation = (profile.automation as Automation) ?? automation
      maxDailyLoss = Number(profile.maxDailyLoss) || maxDailyLoss
      maxPositionPct = Number(profile.maxPositionPct) || maxPositionPct
      leverageCeiling = Number(profile.leverageCeiling) || leverageCeiling
      generatedPlan = String(profile.generatedPlan ?? '')
    } catch {
      // A corrupt local draft is ignored; the database version will be authoritative.
    }
  })

  async function scanPortfolio() {
    if (!walletAddress) {
      onconnect()
      return
    }
    scanStatus = 'scanning'
    scanMessage = ''
    try {
      holdings = await scanConnectedWallet(walletAddress, walletChainId, assets, walletProvider)
      nativeBalance = holdings.find((holding) => holding.isNative)?.quantity ?? 0
      onholdings(holdings)
      scanStatus = 'complete'
      scanMessage = holdings.length
        ? `${holdings.length} holding${holdings.length === 1 ? '' : 's'} copied beneath FKUSDC in your paper balance sheet. Your wallet remains read-only.`
        : 'No non-zero supported balances were found on this network. Your 500 FKUSDC practice balance is still ready.'
    } catch (error) {
      scanStatus = 'error'
      scanMessage = error instanceof Error ? error.message : 'Portfolio scan failed.'
    }
  }

  function buildPaperPlan() {
    const riskLabel = risk === 'conservative' ? 'capital-preservation' : risk === 'aggressive' ? 'high-variance growth' : 'balanced growth'
    const automationLabel = automation === 'autopilot' ? 'paper autopilot rehearsal' : automation === 'supervised' ? 'approval before every paper order' : 'alerts and observation only'
    const leverageLabel = Number(leverageCeiling) <= 1 ? 'no leverage' : `leverage capped at ${Number(leverageCeiling).toFixed(1)}x`
    generatedPlan = `${riskLabel}; ${horizon} horizon; ${automationLabel}; $${Math.max(1, Number(maxDailyLoss)).toFixed(0)} daily loss stop; ${Math.max(1, Number(maxPositionPct)).toFixed(1)}% maximum position; ${leverageLabel}.`
    localStorage.setItem('whale-risk-profile', JSON.stringify({ experience, goal, risk, horizon, automation, maxDailyLoss, maxPositionPct, leverageCeiling, generatedPlan, updatedAt: new Date().toISOString() }))
  }
</script>

<section class="portfolio-setup" id="portfolio" aria-labelledby="portfolio-title">
  <div class="setup-heading">
    <div><span><Radar size={14} /> PERSONAL STRATEGY INTAKE</span><h2 id="portfolio-title">Connect, scan, then build your plan</h2></div>
    <strong>READ-ONLY FIRST</strong>
  </div>

  <div class="setup-grid">
    <section class="scan-step">
      <div class="step-label"><span>01</span><strong>PORTFOLIO DISCOVERY</strong></div>
      {#if walletAddress}
        <div class="connected-wallet"><WalletCards size={18} /><div><strong>{shortAddress(walletAddress)}</strong><span>{chainName(walletChainId)}</span></div><Check size={16} /></div>
        <div class="balance-readout">
          <span>WALLET HOLDINGS</span>
          <strong>{nativeBalance === null ? 'NOT SCANNED' : `$${holdings.reduce((sum, holding) => sum + holding.valueUsd, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</strong>
        </div>
        <button type="button" class="scan-button" onclick={() => void scanPortfolio()} disabled={scanStatus === 'scanning'}><Radar size={15} />{scanStatus === 'scanning' ? 'Scanning...' : nativeBalance === null ? 'Analyze holdings' : 'Refresh holdings'}</button>
      {:else}
        <div class="wallet-empty"><WalletCards size={25} /><strong>Attach your wallet</strong><span>The first scan requests public account and balance data only.</span></div>
        <button type="button" class="scan-button" onclick={onconnect}><WalletCards size={15} /> Connect wallet</button>
      {/if}
      {#if scanMessage}<p class:error-message={scanStatus === 'error'} class="scan-message">{scanMessage}</p>{/if}
      {#if holdings.length}
        <div class="holding-preview">
          {#each holdings.slice(0, 6) as holding}
            <div>
              <span>{#if holding.image}<img src={holding.image} alt="" />{/if}<strong>{holding.symbol}</strong><small>{holding.chain}</small></span>
              <span>{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}<small>${holding.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</small></span>
            </div>
          {/each}
        </div>
      {/if}
      <div class="coverage-line"><span>SCAN COVERAGE</span><span>CURRENT EVM NETWORK / NATIVE + INDEXED ERC-20 + RPC-VERIFIED CORE ASSETS</span><strong>READ ONLY · INDEXER WITH ONCHAIN RPC FALLBACK</strong></div>
    </section>

    <section class="risk-step">
      <div class="step-label"><span>02</span><strong>TRADING PROFILE</strong></div>
      <div class="risk-form">
        <label><span>EXPERIENCE</span><select bind:value={experience}><option value="new">New</option><option value="active">Active</option><option value="advanced">Advanced</option></select></label>
        <label><span>PRIMARY GOAL</span><select bind:value={goal}><option value="learn">Learn</option><option value="growth">Growth</option><option value="income">Income</option><option value="preservation">Preservation</option></select></label>
        <label><span>RISK POSTURE</span><select bind:value={risk}><option value="conservative">Conservative</option><option value="balanced">Balanced</option><option value="aggressive">Aggressive</option></select></label>
        <label><span>TIME HORIZON</span><select bind:value={horizon}><option value="intraday">Intraday</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option></select></label>
        <label><span>DAILY LOSS STOP</span><div class="number-input"><CircleDollarSign size={14} /><input type="number" min="1" step="25" bind:value={maxDailyLoss} /></div></label>
        <label><span>MAX POSITION %</span><div class="number-input"><Gauge size={14} /><input type="number" min="1" max="100" step="1" bind:value={maxPositionPct} /></div></label>
        <label><span>LEVERAGE CEILING</span><select bind:value={leverageCeiling}><option value={1}>No leverage</option><option value={1.5}>1.5x</option><option value={2}>2x</option><option value={3}>3x</option></select></label>
        <label><span>AUTOMATION</span><select bind:value={automation}><option value="alerts">Alerts only</option><option value="supervised">Supervised</option><option value="autopilot">Autopilot rehearsal</option></select></label>
      </div>
      <button class="plan-button" type="button" onclick={buildPaperPlan}><Bot size={15} /> Build paper plan <ChevronRight size={14} /></button>
    </section>
  </div>

  {#if generatedPlan}
    <div class="plan-output"><ShieldCheck size={17} /><div><span>PAPER PLAN DRAFT</span><strong>{generatedPlan}</strong></div><a href="#traders">Choose trader templates <ChevronRight size={13} /></a></div>
  {/if}
</section>

<style>
  .portfolio-setup { border-bottom: 1px solid var(--line); background: #090d10; scroll-margin-top: 90px; }
  .setup-heading { min-height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid var(--line); background: #0e1217; }
  .setup-heading > div > span { display: flex; align-items: center; gap: 6px; color: var(--green); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .setup-heading h2 { margin: 7px 0 0; font-size: 18px; }
  .setup-heading > strong { padding: 6px 8px; border: 1px solid #2c755c; color: var(--green); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .setup-grid { display: grid; grid-template-columns: .85fr 1.15fr; }
  .setup-grid > section { min-width: 0; padding: 14px; }
  .scan-step { border-right: 1px solid var(--line); }
  .step-label { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; color: #9a94a5; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .step-label span { width: 23px; height: 23px; display: grid; place-items: center; background: var(--cyan); color: #041014; }
  .connected-wallet { min-height: 48px; display: grid; grid-template-columns: 24px 1fr 18px; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid #2d5962; background: #0b1b20; }
  .connected-wallet > div { display: grid; gap: 3px; }
  .connected-wallet strong { font: 700 10px/1 'IBM Plex Mono', monospace; }
  .connected-wallet span { color: var(--muted); font: 600 8px/1 'IBM Plex Mono', monospace; }
  .connected-wallet :global(svg:last-child) { color: var(--green); }
  .balance-readout { min-height: 54px; display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding: 0 10px; border: 1px solid var(--line); background: #07090b; }
  .balance-readout span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .balance-readout strong { font: 700 11px/1 'IBM Plex Mono', monospace; }
  .wallet-empty { min-height: 110px; display: grid; place-content: center; justify-items: center; gap: 7px; border: 1px dashed #3b3946; color: #716d79; text-align: center; }
  .wallet-empty strong { color: var(--text); font-size: 11px; }
  .wallet-empty span { max-width: 260px; font-size: 9px; line-height: 1.4; }
  .scan-button, .plan-button { width: 100%; height: 35px; margin-top: 9px; display: flex; align-items: center; justify-content: center; gap: 7px; border: 0; background: var(--cyan); color: #031117; cursor: pointer; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .scan-button:disabled { opacity: .55; cursor: wait; }
  .scan-message { margin: 8px 0 0; color: #8e9a9f; font-size: 8px; line-height: 1.45; }
  .scan-message.error-message { color: var(--red); }
  .coverage-line { min-height: 38px; display: grid; grid-template-columns: 1fr; gap: 4px; margin-top: 9px; padding: 7px 8px; border-left: 2px solid var(--amber); background: #16130c; font: 600 7px/1.25 'IBM Plex Mono', monospace; }
  .coverage-line span:first-child { color: var(--amber); }
  .coverage-line span:nth-child(2) { color: var(--muted); }
  .coverage-line strong { color: var(--text); }
  .holding-preview { max-height: 208px; overflow-y: auto; margin-top: 8px; border: 1px solid var(--line); }
  .holding-preview > div { min-height: 42px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 9px; border-bottom: 1px solid var(--line); }
  .holding-preview > div:last-child { border-bottom: 0; }
  .holding-preview span { display: flex; align-items: center; gap: 6px; font: 700 9px/1 'IBM Plex Mono', monospace; }
  .holding-preview span:last-child { display: grid; justify-items: end; }
  .holding-preview img { width: 20px; height: 20px; border-radius: 50%; }
  .holding-preview small { color: var(--muted); font: 600 7px/1 'IBM Plex Mono', monospace; }
  .risk-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .risk-form label { display: grid; gap: 5px; }
  .risk-form label > span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .risk-form select, .number-input { width: 100%; height: 33px; border: 1px solid var(--line); background: #07090b; color: var(--text); outline: 0; font: 600 9px/1 'IBM Plex Mono', monospace; }
  .risk-form select { padding: 0 7px; }
  .number-input { display: flex; align-items: center; gap: 5px; padding: 0 7px; color: var(--muted); }
  .number-input input { min-width: 0; width: 100%; border: 0; outline: 0; background: transparent; color: var(--text); }
  .plan-button { background: var(--lime); color: #111503; }
  .plan-button :global(svg:last-child) { margin-left: auto; }
  .plan-output { min-height: 55px; display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 9px; padding: 9px 14px; border-top: 1px solid #345748; background: #0b1612; }
  .plan-output > :global(svg) { color: var(--green); }
  .plan-output > div { display: grid; gap: 4px; }
  .plan-output span { color: var(--green); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .plan-output strong { color: #bcc9c2; font: 600 8px/1.4 'IBM Plex Mono', monospace; }
  .plan-output a { display: inline-flex; align-items: center; color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }

  @media (max-width: 760px) {
    .setup-grid { grid-template-columns: 1fr; }
    .scan-step { border-right: 0; border-bottom: 1px solid var(--line); }
    .plan-output { grid-template-columns: 20px 1fr; }
    .plan-output a { grid-column: 2; }
  }
</style>
