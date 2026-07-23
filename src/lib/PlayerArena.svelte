<script lang="ts">
  import { Check, Clock3, Copy, Play, RotateCcw, ShieldCheck, Swords, Target, UserPlus, UserRound } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { formatPrice } from './market'
  import type { BattleReceipt, MarketAsset, Member, Thesis, TradeDirection } from './types'

  export let assets: MarketAsset[]
  export let member: Member | null
  export let dataMode: 'loading' | 'live' | 'fallback'
  export let maxStake = 10_000
  export let practiceAssetId = 'bitcoin'
  export let practiceDirection: TradeDirection = 'long'
  export let onrequirejoin: () => void
  export let onreceipt: (receipt: BattleReceipt) => void

  type BattleMode = 'players' | 'practice'
  type ActiveRound = {
    id: string
    openedAt: string
    closesAt: number
    mode: BattleMode
    hostName: string
    hostTeam: string
    opponentName: string
    hostAssetId: string
    opponentAssetId: string
    hostEntry: number
    opponentEntry: number
    hostDirection: TradeDirection
    opponentDirection: TradeDirection
    hostThesis: Thesis
    opponentThesis: Thesis
    paperStake: number
  }

  let mode: BattleMode = 'players'
  let hostAssetId = 'bitcoin'
  let opponentAssetId = 'ethereum'
  let hostDirection: TradeDirection = 'long'
  let opponentDirection: TradeDirection = 'long'
  let hostThesis: Thesis = 'momentum'
  let opponentThesis: Thesis = 'momentum'
  let opponentName = ''
  let paperStake = 500
  let roundLength = 60
  let challengeCode = ''
  let activeRound: ActiveRound | null = null
  let secondsRemaining = 60
  let lastReceipt: BattleReceipt | null = null
  let copied = false
  let errorMessage = ''
  let timer: ReturnType<typeof setInterval> | null = null

  $: hostAsset = assets.find((asset) => asset.id === hostAssetId) ?? assets[0]
  $: opponentAsset = assets.find((asset) => asset.id === opponentAssetId) ?? assets[1] ?? assets[0]
  $: activeHostAsset = resolveAsset(activeRound?.hostAssetId, hostAsset)
  $: activeOpponentAsset = resolveAsset(activeRound?.opponentAssetId, opponentAsset)
  $: liveHostReturn = activeRound ? directionalReturn(activeRound.hostEntry, activeHostAsset.price, activeRound.hostDirection) : 0
  $: liveOpponentReturn = activeRound ? directionalReturn(activeRound.opponentEntry, activeOpponentAsset.price, activeRound.opponentDirection) : 0

  onMount(() => {
    timer = setInterval(() => {
      if (!activeRound) return
      secondsRemaining = Math.max(0, Math.ceil((activeRound.closesAt - Date.now()) / 1000))
      if (secondsRemaining === 0) void settleRound()
    }, 1000)
    return () => { if (timer) clearInterval(timer) }
  })

  function setMode(nextMode: BattleMode) {
    if (activeRound) return
    mode = nextMode
    errorMessage = ''
    if (nextMode === 'practice') {
      opponentName = 'DOW JONES'
      opponentAssetId = assets.some((asset) => asset.id === practiceAssetId) ? practiceAssetId : assets[0].id
      opponentDirection = practiceDirection
      opponentThesis = 'momentum'
    } else if (opponentName === 'DOW JONES') {
      opponentName = ''
    }
  }

  function createChallenge() {
    if (!member) {
      onrequirejoin()
      return
    }
    challengeCode = `WHLE-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    errorMessage = ''
  }

  function startRound() {
    if (!member) {
      onrequirejoin()
      return
    }
    if (mode === 'players' && opponentName.trim().length < 2) {
      errorMessage = 'Player 2 needs a name before the round can start.'
      return
    }
    if (!challengeCode) createChallenge()
    const stake = Math.max(25, Math.min(maxStake, Number(paperStake) || 25))
    paperStake = stake
    activeRound = {
      id: crypto.randomUUID(),
      openedAt: new Date().toISOString(),
      closesAt: Date.now() + Number(roundLength) * 1000,
      mode,
      hostName: member.displayName,
      hostTeam: member.teamName,
      opponentName: mode === 'practice' ? 'DOW JONES' : opponentName.trim(),
      hostAssetId: hostAsset.id,
      opponentAssetId: opponentAsset.id,
      hostEntry: hostAsset.price,
      opponentEntry: opponentAsset.price,
      hostDirection,
      opponentDirection,
      hostThesis,
      opponentThesis,
      paperStake: stake,
    }
    secondsRemaining = Number(roundLength)
    errorMessage = ''
  }

  function directionalReturn(entry: number, current: number, direction: TradeDirection) {
    const raw = entry ? ((current - entry) / entry) * 100 : 0
    return direction === 'short' ? -raw : raw
  }

  function resolveAsset(assetId: string | undefined, fallback: MarketAsset) {
    return assets.find((asset) => asset.id === assetId) ?? fallback
  }

  async function settleRound() {
    if (!activeRound) return
    const round = activeRound
    const currentHost = assets.find((asset) => asset.id === round.hostAssetId) ?? hostAsset
    const currentOpponent = assets.find((asset) => asset.id === round.opponentAssetId) ?? opponentAsset
    const hostReturn = directionalReturn(round.hostEntry, currentHost.price, round.hostDirection)
    const opponentReturn = directionalReturn(round.opponentEntry, currentOpponent.price, round.opponentDirection)
    const margin = hostReturn - opponentReturn
    const winnerName = Math.abs(margin) < 0.0001 ? 'TIE' : margin > 0 ? round.hostName : round.opponentName
    const hostHypotheticalPnl = Number((round.paperStake * (margin / 100)).toFixed(2))
    const unsigned: Omit<BattleReceipt, 'hash'> = {
      id: round.id,
      openedAt: round.openedAt,
      closedAt: new Date().toISOString(),
      mode: round.mode,
      hostName: round.hostName,
      hostTeam: round.hostTeam,
      opponentName: round.opponentName,
      hostSymbol: currentHost.symbol,
      opponentSymbol: currentOpponent.symbol,
      hostDirection: round.hostDirection,
      opponentDirection: round.opponentDirection,
      paperStake: round.paperStake,
      hostThesis: round.hostThesis,
      opponentThesis: round.opponentThesis,
      hostReturn: Number(hostReturn.toFixed(4)),
      opponentReturn: Number(opponentReturn.toFixed(4)),
      winningMargin: Number(Math.abs(margin).toFixed(4)),
      winnerName,
      hostHypotheticalPnl,
      fundsMoved: 0,
      dataMode: dataMode === 'live' ? 'live' : 'fallback',
    }
    const receipt = { ...unsigned, hash: await sha256(JSON.stringify(unsigned)) }
    lastReceipt = receipt
    activeRound = null
    secondsRemaining = Number(roundLength)
    onreceipt(receipt)
  }

  async function sha256(value: string) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  async function copyCode() {
    if (!challengeCode) createChallenge()
    if (!challengeCode) return
    await navigator.clipboard.writeText(challengeCode)
    copied = true
    setTimeout(() => (copied = false), 1500)
  }

  function newMatch() {
    activeRound = null
    lastReceipt = null
    challengeCode = ''
    secondsRemaining = Number(roundLength)
    if (mode === 'players') opponentName = ''
  }

  function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : name.slice(0, 2)).toUpperCase()
  }

  function formatTimer(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }
</script>

<section class="player-arena" id="arena" aria-labelledby="arena-title">
  <div class="arena-head">
    <div class="arena-title"><Swords size={16} /><div><strong id="arena-title">PLAYER-VS-PLAYER ARENA</strong><span>Same clock. Separate trades. Best directional return wins.</span></div></div>
    <div class="arena-modes">
      <button type="button" class:active={mode === 'players'} onclick={() => setMode('players')} disabled={activeRound !== null}><UserRound size={13} /> LOCAL 2P</button>
      <button type="button" class:active={mode === 'practice'} onclick={() => setMode('practice')} disabled={activeRound !== null}><Target size={13} /> PRACTICE</button>
    </div>
    <div class="round-clock" class:clock-live={activeRound !== null}><Clock3 size={14} />{formatTimer(secondsRemaining)}</div>
  </div>

  <div class="player-grid">
    <section class="player-desk host-desk">
      <div class="desk-header"><span class="player-avatar host-avatar">{initials(member?.displayName ?? 'YOU')}</span><div><small>PLAYER 1</small><strong>{member?.displayName ?? 'YOU'}</strong><span>{member?.teamName ?? 'JOIN TO CREATE A DESK'}</span></div>{#if activeRound}<em>{liveHostReturn >= 0 ? '+' : ''}{liveHostReturn.toFixed(3)}%</em>{/if}</div>
      <div class="trade-choice">
        <label><span>MARKET</span><select bind:value={hostAssetId} disabled={activeRound !== null}>{#each assets as asset}<option value={asset.id}>{asset.symbol} / {asset.name}</option>{/each}</select></label>
        <div class="direction-choice"><span>DIRECTION</span><div><button type="button" class:long-active={hostDirection === 'long'} onclick={() => (hostDirection = 'long')} disabled={activeRound !== null}>LONG</button><button type="button" class:short-active={hostDirection === 'short'} onclick={() => (hostDirection = 'short')} disabled={activeRound !== null}>SHORT</button></div></div>
        <label><span>PLAYBOOK</span><select bind:value={hostThesis} disabled={activeRound !== null}><option value="momentum">Momentum</option><option value="mean-reversion">Mean reversion</option><option value="defensive">Defensive</option></select></label>
      </div>
      <div class="market-readout"><span>{hostAsset.symbol}</span><strong>{formatPrice(hostAsset.price)}</strong><em class:positive={hostAsset.change24h >= 0} class:negative={hostAsset.change24h < 0}>{hostAsset.change24h >= 0 ? '+' : ''}{hostAsset.change24h.toFixed(2)}%</em></div>
    </section>

    <div class="versus-column"><strong>VS</strong><span>RELATIVE<br />RETURN</span></div>

    <section class="player-desk opponent-desk">
      <div class="desk-header"><span class="player-avatar opponent-avatar">{initials(mode === 'practice' ? 'DOW JONES' : opponentName || 'P2')}</span><div><small>{mode === 'practice' ? 'SIMULATION AGENT' : 'PLAYER 2'}</small>{#if mode === 'practice'}<strong>DOW JONES</strong><span>DISCLOSED PRACTICE OPPONENT</span>{:else}<input bind:value={opponentName} disabled={activeRound !== null} aria-label="Player 2 name" placeholder="Enter player 2 name" /><span>SECOND HUMAN DESK</span>{/if}</div>{#if activeRound}<em>{liveOpponentReturn >= 0 ? '+' : ''}{liveOpponentReturn.toFixed(3)}%</em>{/if}</div>
      <div class="trade-choice">
        <label><span>MARKET</span><select bind:value={opponentAssetId} disabled={activeRound !== null || mode === 'practice'}>{#each assets as asset}<option value={asset.id}>{asset.symbol} / {asset.name}</option>{/each}</select></label>
        <div class="direction-choice"><span>DIRECTION</span><div><button type="button" class:long-active={opponentDirection === 'long'} onclick={() => (opponentDirection = 'long')} disabled={activeRound !== null || mode === 'practice'}>LONG</button><button type="button" class:short-active={opponentDirection === 'short'} onclick={() => (opponentDirection = 'short')} disabled={activeRound !== null || mode === 'practice'}>SHORT</button></div></div>
        <label><span>PLAYBOOK</span><select bind:value={opponentThesis} disabled={activeRound !== null || mode === 'practice'}><option value="momentum">Momentum</option><option value="mean-reversion">Mean reversion</option><option value="defensive">Defensive</option></select></label>
      </div>
      <div class="market-readout"><span>{opponentAsset.symbol}</span><strong>{formatPrice(opponentAsset.price)}</strong><em class:positive={opponentAsset.change24h >= 0} class:negative={opponentAsset.change24h < 0}>{opponentAsset.change24h >= 0 ? '+' : ''}{opponentAsset.change24h.toFixed(2)}%</em></div>
    </section>
  </div>

  <div class="match-controls">
    <label><span>PAPER STAKE EACH</span><input type="number" min="25" max={maxStake} step="25" bind:value={paperStake} disabled={activeRound !== null} /></label>
    <label><span>ROUND LENGTH</span><select bind:value={roundLength} disabled={activeRound !== null}><option value={60}>1 minute</option><option value={180}>3 minutes</option><option value={300}>5 minutes</option></select></label>
    <div class="challenge-code"><span>ROUND CODE</span><button type="button" onclick={() => void copyCode()} disabled={activeRound !== null}>{challengeCode || 'CREATE CODE'}{#if copied}<Check size={12} />{:else}<Copy size={12} />{/if}</button></div>
    {#if activeRound}
      <button class="settle-button" type="button" onclick={() => void settleRound()}><Target size={15} /> Settle round now</button>
    {:else}
      <button class="start-button" type="button" onclick={startRound}>
        {#if mode === 'players'}<UserPlus size={15} />{:else}<Play size={15} />{/if}
        Start {mode === 'players' ? 'player match' : 'practice round'}
      </button>
    {/if}
  </div>

  {#if errorMessage}<div class="arena-error">{errorMessage}</div>{/if}
  {#if activeRound}
    <div class="live-match"><span><i></i>MATCH LIVE</span><strong>{activeRound.hostName} {liveHostReturn >= 0 ? '+' : ''}{liveHostReturn.toFixed(3)}%</strong><span>vs</span><strong>{activeRound.opponentName} {liveOpponentReturn >= 0 ? '+' : ''}{liveOpponentReturn.toFixed(3)}%</strong><span>${activeRound.paperStake.toFixed(0)} paper each</span></div>
  {:else if lastReceipt}
    <div class="match-result"><ShieldCheck size={15} /><span>WINNER</span><strong>{lastReceipt.winnerName}</strong><span>by {lastReceipt.winningMargin.toFixed(3)}%</span><button type="button" onclick={newMatch}><RotateCcw size={13} /> New match</button></div>
  {/if}
</section>

<style>
  .player-arena { border-bottom: 1px solid var(--line); background: #090d10; scroll-margin-top: 90px; }
  .arena-head { min-height: 50px; display: flex; align-items: center; gap: 12px; padding: 7px 10px 7px 13px; border-bottom: 1px solid var(--line); background: #0d1215; }
  .arena-title { display: flex; align-items: center; gap: 8px; min-width: 250px; }
  .arena-title > :global(svg) { color: var(--hot); }
  .arena-title > div { display: grid; gap: 4px; }
  .arena-title strong { font: 700 11px/1 'IBM Plex Mono', monospace; }
  .arena-title span { color: var(--muted); font: 600 7px/1 'IBM Plex Mono', monospace; }
  .arena-modes { height: 30px; display: flex; margin-left: auto; border: 1px solid var(--line); }
  .arena-modes button { display: flex; align-items: center; gap: 5px; padding: 0 9px; border: 0; border-right: 1px solid var(--line); background: #080b0d; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .arena-modes button:last-child { border-right: 0; }
  .arena-modes button.active { background: #3b1530; color: #ffc8e4; }
  .arena-modes button:disabled { cursor: not-allowed; }
  .round-clock { min-width: 74px; height: 30px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--line-bright); color: #c5cdd1; font: 700 10px/1 'IBM Plex Mono', monospace; }
  .round-clock.clock-live { color: var(--green); border-color: #2b795b; }
  .player-grid { display: grid; grid-template-columns: 1fr 64px 1fr; }
  .player-desk { min-width: 0; padding: 14px; background: #0b0e12; }
  .host-desk { border-right: 1px solid var(--line); }
  .opponent-desk { border-left: 1px solid var(--line); }
  .desk-header { min-height: 48px; display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: 9px; }
  .player-avatar { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid var(--hot); background: #46132f; color: #ffd0e8; font: 800 11px/1 'IBM Plex Mono', monospace; }
  .opponent-avatar { border-color: var(--cyan); background: #103743; color: #d4f9ff; }
  .desk-header > div { min-width: 0; display: grid; gap: 3px; }
  .desk-header small { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .desk-header strong { font-size: 14px; }
  .desk-header span { color: #777f84; font: 600 7px/1 'IBM Plex Mono', monospace; }
  .desk-header input { min-width: 0; width: 100%; height: 25px; padding: 0 6px; border: 1px solid var(--line); background: #07090b; color: var(--text); outline: 0; font: 700 10px/1 'IBM Plex Mono', monospace; }
  .desk-header input:focus { border-color: var(--cyan); }
  .desk-header > em { color: var(--green); font: normal 800 11px/1 'IBM Plex Mono', monospace; }
  .trade-choice { display: grid; grid-template-columns: minmax(110px, 1.1fr) minmax(90px, .8fr) minmax(105px, 1fr); gap: 8px; margin-top: 12px; }
  .trade-choice label, .direction-choice { min-width: 0; display: grid; gap: 5px; }
  .trade-choice label > span, .direction-choice > span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .trade-choice select { min-width: 0; width: 100%; height: 32px; padding: 0 6px; border: 1px solid var(--line); background: #07090b; color: var(--text); outline: 0; font: 600 8px/1 'IBM Plex Mono', monospace; }
  .direction-choice > div { height: 32px; display: grid; grid-template-columns: 1fr 1fr; }
  .direction-choice button { border: 1px solid var(--line); background: #07090b; color: var(--muted); cursor: pointer; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .direction-choice button.long-active { border-color: var(--green); background: #12372e; color: var(--green); }
  .direction-choice button.short-active { border-color: var(--red); background: #3a1021; color: #ff8fb1; }
  .market-readout { min-height: 38px; display: flex; align-items: center; gap: 9px; margin-top: 10px; padding: 0 9px; border: 1px solid #201d29; background: #08070c; }
  .market-readout span { color: var(--cyan); font: 800 10px/1 'IBM Plex Mono', monospace; }
  .market-readout strong { font: 700 11px/1 'IBM Plex Mono', monospace; }
  .market-readout em { margin-left: auto; font: normal 700 9px/1 'IBM Plex Mono', monospace; }
  .versus-column { display: grid; place-content: center; justify-items: center; gap: 7px; background: #07090b; }
  .versus-column strong { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid #5b5263; border-radius: 50%; color: var(--amber); font: 800 13px/1 'IBM Plex Mono', monospace; }
  .versus-column span { color: #5f666a; text-align: center; font: 700 6px/1.35 'IBM Plex Mono', monospace; }
  .match-controls { min-height: 67px; display: grid; grid-template-columns: 125px 120px minmax(130px, .7fr) minmax(190px, 1fr); align-items: end; gap: 8px; padding: 9px 11px; border-top: 1px solid var(--line); }
  .match-controls label, .challenge-code { display: grid; gap: 5px; }
  .match-controls label > span, .challenge-code > span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .match-controls input, .match-controls select, .challenge-code button { width: 100%; height: 32px; padding: 0 7px; border: 1px solid var(--line); background: #07090b; color: var(--text); outline: 0; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .challenge-code button { display: flex; align-items: center; justify-content: space-between; cursor: pointer; color: var(--cyan); }
  .start-button, .settle-button { height: 34px; display: flex; align-items: center; justify-content: center; gap: 7px; border: 0; background: var(--hot); color: #1a020e; cursor: pointer; font: 800 9px/1 'IBM Plex Mono', monospace; }
  .settle-button { background: var(--amber); color: #181004; }
  .arena-error { padding: 7px 11px; border-top: 1px solid #53223a; background: #25101a; color: #ff9cba; font-size: 9px; }
  .live-match, .match-result { min-height: 38px; display: flex; align-items: center; gap: 11px; padding: 0 11px; border-top: 1px solid #294c3e; background: #0a1712; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .live-match > span:first-child { color: var(--green); }
  .live-match i { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; background: var(--green); }
  .live-match > span:last-child { margin-left: auto; color: var(--muted); }
  .match-result > :global(svg) { color: var(--green); }
  .match-result > span { color: var(--muted); }
  .match-result button { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: var(--cyan); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }

  @media (max-width: 760px) {
    .arena-head { align-items: stretch; flex-wrap: wrap; }
    .arena-title { width: 100%; }
    .arena-modes { margin-left: 0; }
    .round-clock { margin-left: auto; }
    .player-grid { grid-template-columns: 1fr; }
    .host-desk { border-right: 0; border-bottom: 1px solid var(--line); }
    .opponent-desk { border-left: 0; border-top: 1px solid var(--line); }
    .versus-column { min-height: 50px; grid-auto-flow: column; gap: 10px; }
    .versus-column strong { width: 34px; height: 34px; }
    .trade-choice { grid-template-columns: 1fr 1fr; }
    .trade-choice label:last-child { grid-column: 1 / -1; }
    .match-controls { grid-template-columns: 1fr 1fr; }
    .challenge-code { grid-column: 1 / -1; }
    .start-button, .settle-button { grid-column: 1 / -1; }
    .live-match, .match-result { flex-wrap: wrap; padding: 8px 10px; }
    .live-match > span:last-child { width: 100%; margin-left: 0; }
  }
</style>
