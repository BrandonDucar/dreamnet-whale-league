<script lang="ts">
  import { AlertTriangle, Check, Copy, FileCheck2, LoaderCircle, Share2, ShieldCheck, Swords, Target, Ticket, Trophy, UserPlus, Users } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import {
    acceptFounderCupInvitation,
    createFounderCupInvitation,
    FounderCupApiError,
  } from './founderCupApi'
  import { shareFounderCupInvite } from './miniapp'
  import {
    buildTournamentStandings,
    createTournamentInviteCode,
    createTournamentShareUrl,
    FOUNDER_CUP_ID,
    FOUNDER_CUP_TARGET_ROUNDS,
    isTournamentInviteCode,
    TOURNAMENT_ENTRY_STORAGE_KEY,
  } from './tournament'
  import type { TournamentEntry } from './tournament'
  import type { BattleReceipt, Member } from './types'

  export let member: Member | null
  export let receipts: BattleReceipt[]
  export let verifiedEntryEnabled: boolean
  export let onrequirejoin: () => void
  export let onpractice: () => void
  export let onplayers: () => void
  export let onledger: () => void
  export let onenroll: (source: TournamentEntry['source']) => void
  export let oninvite: (action: 'created' | 'copied' | 'shared') => void
  export let onentrychange: (entry: TournamentEntry | null) => void

  let entry: TournamentEntry | null = null
  let pendingInvite = ''
  let copied = false
  let entering = false
  let entryError = ''
  let shareMessage = ''

  $: standings = buildTournamentStandings(receipts)
  $: memberStanding = member
    ? standings.find((standing) => standing.participant.toLowerCase() === member?.displayName.toLowerCase())
    : undefined
  $: completedRounds = memberStanding?.rounds ?? 0
  $: progress = Math.min(100, (completedRounds / FOUNDER_CUP_TARGET_ROUNDS) * 100)
  $: qualified = completedRounds >= FOUNDER_CUP_TARGET_ROUNDS

  onMount(() => {
    const invite = new URLSearchParams(window.location.search).get('invite')
    if (isTournamentInviteCode(invite)) pendingInvite = invite!.trim().toUpperCase()

    const saved = localStorage.getItem(TOURNAMENT_ENTRY_STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as TournamentEntry
      if (parsed.seasonId === FOUNDER_CUP_ID && isTournamentInviteCode(parsed.inviteCode)) {
        entry = {
          ...parsed,
          verification: parsed.verification === 'farcaster' ? 'farcaster' : 'local',
        }
        onentrychange(entry)
      } else {
        localStorage.removeItem(TOURNAMENT_ENTRY_STORAGE_KEY)
        onentrychange(null)
      }
    } catch {
      localStorage.removeItem(TOURNAMENT_ENTRY_STORAGE_KEY)
      onentrychange(null)
    }
  })

  async function enterTournament() {
    if (!member) {
      onrequirejoin()
      return
    }
    entryError = ''
    entering = true
    const source: TournamentEntry['source'] = pendingInvite ? 'invite' : 'founder'
    try {
      let inviteCode = createTournamentInviteCode()
      let verification: TournamentEntry['verification'] = 'local'
      if (verifiedEntryEnabled) {
        if (pendingInvite) await acceptFounderCupInvitation(pendingInvite)
        const invitation = await createFounderCupInvitation()
        inviteCode = invitation.code
        verification = 'farcaster'
      }
      entry = {
        seasonId: FOUNDER_CUP_ID,
        inviteCode,
        enteredAt: new Date().toISOString(),
        source,
        verification,
      }
      localStorage.setItem(TOURNAMENT_ENTRY_STORAGE_KEY, JSON.stringify(entry))
      onentrychange(entry)
      onenroll(source)
      oninvite('created')
    } catch (error) {
      entryError = error instanceof FounderCupApiError
        ? error.message
        : 'Founder Cup entry could not be completed. Try again.'
    } finally {
      entering = false
    }
  }

  async function copyInvite() {
    if (!entry || entry.verification !== 'farcaster') return
    await navigator.clipboard.writeText(createTournamentShareUrl(entry.inviteCode))
    copied = true
    shareMessage = 'Invite link copied'
    oninvite('copied')
    setTimeout(() => {
      copied = false
      shareMessage = ''
    }, 1800)
  }

  async function shareInvite() {
    if (!entry || entry.verification !== 'farcaster') return
    const url = createTournamentShareUrl(entry.inviteCode)
    if (verifiedEntryEnabled) {
      const result = await shareFounderCupInvite(url)
      shareMessage = result?.cast ? 'Launch cast created' : ''
      if (result?.cast) oninvite('shared')
      return
    }
    if (!navigator.share) {
      await copyInvite()
      return
    }
    try {
      await navigator.share({
        title: 'Whale League Founder Cup',
        text: 'Join my paper-trading desk in the Whale League Founder Cup.',
        url,
      })
      shareMessage = 'Invite opened'
      oninvite('shared')
    } catch {
      shareMessage = ''
    }
  }

  function signedPercent(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(3)}%`
  }
</script>

<section class="tournament-hub" aria-labelledby="tournament-title">
  <header class="tournament-header">
    <div class="season-id"><Trophy size={18} /><div><span>SEASON 0</span><h2 id="tournament-title">Founder Cup</h2></div></div>
    <div class="season-status"><i></i><span>INVITE BETA</span><strong>PAPER ONLY</strong></div>
  </header>

  <div class="tournament-grid">
    <section class="mission-panel">
      <div class="mission-copy">
        <span>FIRST PUBLIC PROOF</span>
        <h3>Complete five receipted rounds</h3>
        <p>Compete against another person on the same clock or rehearse against the single disclosed simulation agent. Every result comes from an actual completed round.</p>
      </div>

      <div class="qualification">
        <div class="qualification-head">
          <span>YOUR QUALIFIER</span>
          <strong>{completedRounds} / {FOUNDER_CUP_TARGET_ROUNDS} ROUNDS</strong>
        </div>
        <div class="progress-track" aria-label={`${completedRounds} of ${FOUNDER_CUP_TARGET_ROUNDS} tournament rounds completed`}><i style={`width:${progress}%`}></i></div>
        <div class="qualification-stats">
          <span><small>RECORD</small><strong>{memberStanding ? `${memberStanding.wins}-${memberStanding.losses}-${memberStanding.ties}` : '0-0-0'}</strong></span>
          <span><small>POINTS</small><strong>{memberStanding?.points ?? 0}</strong></span>
          <span><small>NET RETURN</small><strong class:positive={(memberStanding?.totalReturnPct ?? 0) >= 0} class:negative={(memberStanding?.totalReturnPct ?? 0) < 0}>{signedPercent(memberStanding?.totalReturnPct ?? 0)}</strong></span>
          <span><small>STATUS</small><strong>{qualified ? 'QUALIFIED' : entry ? 'ACTIVE' : 'NOT ENTERED'}</strong></span>
        </div>
      </div>

      {#if !member}
        <button class="primary-action" type="button" onclick={onrequirejoin}><UserPlus size={15} /> Create a desk to enter</button>
      {:else if !entry}
        <button class="primary-action" type="button" onclick={() => void enterTournament()} disabled={entering}>
          {#if entering}<LoaderCircle class="spin" size={15} />{:else}<Ticket size={15} />{/if}
          {entering ? 'Verifying entry…' : pendingInvite && verifiedEntryEnabled ? 'Accept verified invite' : verifiedEntryEnabled ? 'Enter Founder Cup' : 'Start local practice'}
        </button>
        <div class="entry-boundary">
          <ShieldCheck size={13} />
          <span>{verifiedEntryEnabled ? 'Farcaster verifies your player identity. No wallet signature or trading permission is requested.' : 'Web practice stays on this device. Open in Farcaster to create and share a verified beta pass.'}</span>
        </div>
        {#if entryError}<div class="entry-error"><AlertTriangle size={13} /><span>{entryError}</span></div>{/if}
      {:else}
        <div class="round-actions">
          <button type="button" onclick={onplayers}><Users size={15} /><span><strong>Player round</strong><small>Two people, one clock</small></span></button>
          <button type="button" onclick={onpractice}><Target size={15} /><span><strong>Practice round</strong><small>Disclosed DOW JONES sim</small></span></button>
          <button type="button" onclick={onledger}><FileCheck2 size={15} /><span><strong>Receipt ledger</strong><small>Verify every result</small></span></button>
        </div>
      {/if}

      {#if entry}
        <div class="invite-strip" class:local-pass={entry.verification === 'local'}>
          <div><span>{entry.verification === 'farcaster' ? 'VERIFIED BETA PASS' : 'LOCAL PRACTICE PASS'}</span><strong>{entry.inviteCode}</strong><small>{entry.verification === 'farcaster' ? entry.source === 'invite' ? 'Invite accepted · fresh share pass issued' : 'Farcaster-verified founder access' : 'Stored on this device · not a shareable beta invite'}</small></div>
          {#if entry.verification === 'farcaster'}
            <button type="button" onclick={() => void copyInvite()} title="Copy tournament invite">{#if copied}<Check size={15} />{:else}<Copy size={15} />{/if}</button>
            <button type="button" onclick={() => void shareInvite()} title="Share tournament invite"><Share2 size={15} /></button>
          {/if}
          {#if shareMessage}<em>{shareMessage}</em>{/if}
        </div>
      {/if}
    </section>

    <section class="standings-panel" aria-labelledby="standings-title">
      <div class="standings-head"><div><span>RECEIPT-BACKED</span><h3 id="standings-title">Current standings</h3></div><strong>{standings.length} PLAYERS</strong></div>
      {#if standings.length}
        <div class="standings-table" role="table" aria-label="Founder Cup standings">
          <div class="standings-row standings-labels" role="row"><span>#</span><span>PLAYER</span><span>W-L-T</span><span>PTS</span><span>RETURN</span></div>
          {#each standings as standing, index}
            <div class="standings-row" role="row">
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <span><b>{standing.participant}</b><small>{standing.isSimulation ? 'DISCLOSED SIMULATION AGENT' : standing.desk || 'PLAYER DESK'}</small></span>
              <span>{standing.wins}-{standing.losses}-{standing.ties}</span>
              <strong>{standing.points}</strong>
              <em class:positive={standing.totalReturnPct >= 0} class:negative={standing.totalReturnPct < 0}>{signedPercent(standing.totalReturnPct)}</em>
            </div>
          {/each}
        </div>
      {:else}
        <div class="standings-empty"><ShieldCheck size={22} /><strong>No manufactured leaderboard</strong><span>The first completed round creates the first real standings row.</span></div>
      {/if}
    </section>
  </div>

  <footer class="rules-strip">
    <span><Swords size={13} /><strong>FORMAT</strong><small>Best directional return</small></span>
    <span><Target size={13} /><strong>QUALIFY</strong><small>Five completed rounds</small></span>
    <span><ShieldCheck size={13} /><strong>SETTLEMENT</strong><small>FKUSDC paper balance</small></span>
    <span><FileCheck2 size={13} /><strong>PROOF</strong><small>SHA-256 local receipts</small></span>
  </footer>
</section>

<style>
  .tournament-hub { border-bottom: 1px solid var(--line); background: #09080e; }
  .tournament-header { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 8px 14px; border-bottom: 1px solid var(--line); background: #100b16; }
  .season-id { display: flex; align-items: center; gap: 10px; }
  .season-id > :global(svg) { color: var(--lime); }
  .season-id div { display: grid; gap: 4px; }
  .season-id span, .mission-copy > span, .qualification-head span, .standings-head span, .invite-strip span { color: var(--hot); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .season-id h2, .mission-copy h3, .standings-head h3 { margin: 0; letter-spacing: 0; }
  .season-id h2 { font-size: 18px; }
  .season-status { display: flex; align-items: center; gap: 7px; color: var(--amber); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .season-status i { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px rgba(40,211,143,.7); }
  .season-status strong { padding: 6px 7px; border: 1px solid #6f5c2f; color: var(--amber); }
  .tournament-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(350px, .85fr); }
  .mission-panel { min-width: 0; border-right: 1px solid var(--line); }
  .mission-copy { padding: 16px 14px 13px; }
  .mission-copy h3, .standings-head h3 { margin-top: 6px; font-size: 16px; }
  .mission-copy p { max-width: 760px; margin: 8px 0 0; color: #9490a0; font-size: 11px; line-height: 1.55; }
  .qualification { padding: 12px 14px; border-top: 1px solid #1c1825; border-bottom: 1px solid #1c1825; background: #0c0a12; }
  .qualification-head { display: flex; justify-content: space-between; gap: 10px; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .progress-track { height: 5px; margin: 10px 0; background: #252030; overflow: hidden; }
  .progress-track i { display: block; height: 100%; background: var(--lime); transition: width .25s ease; }
  .qualification-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); }
  .qualification-stats span { min-width: 0; display: grid; gap: 5px; padding: 8px; background: #09080e; }
  .qualification-stats small { color: var(--muted); font: 700 6px/1 'IBM Plex Mono', monospace; }
  .qualification-stats strong { font: 800 10px/1 'IBM Plex Mono', monospace; }
  .primary-action { width: calc(100% - 28px); min-height: 42px; display: flex; align-items: center; justify-content: center; gap: 7px; margin: 12px 14px; border: 0; background: var(--lime); color: #111503; cursor: pointer; font: 800 9px/1 'IBM Plex Mono', monospace; }
  .primary-action:disabled { cursor: wait; opacity: .72; }
  .entry-boundary, .entry-error { display: flex; align-items: flex-start; gap: 7px; margin: -3px 14px 12px; font: 600 7px/1.45 'IBM Plex Mono', monospace; }
  .entry-boundary { color: #777180; }
  .entry-boundary :global(svg) { flex: 0 0 auto; color: var(--green); }
  .entry-error { padding: 8px; border: 1px solid #6c3139; background: #210d13; color: #ff8c99; }
  .entry-error :global(svg) { flex: 0 0 auto; }
  :global(.spin) { animation: spin .8s linear infinite; }
  .round-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); }
  .round-actions button { min-width: 0; min-height: 58px; display: flex; align-items: center; gap: 8px; padding: 9px; border: 0; background: #0c0a12; color: var(--text); cursor: pointer; text-align: left; }
  .round-actions button:hover { background: #17101c; }
  .round-actions :global(svg) { flex: 0 0 auto; color: var(--cyan); }
  .round-actions span { min-width: 0; display: grid; gap: 4px; }
  .round-actions strong { font: 800 8px/1 'IBM Plex Mono', monospace; }
  .round-actions small { color: var(--muted); font: 600 6px/1.25 'IBM Plex Mono', monospace; }
  .invite-strip { min-height: 50px; position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 34px 34px; align-items: center; gap: 6px; padding: 7px 10px 7px 14px; border-top: 1px solid #3a2d16; background: #151107; }
  .invite-strip.local-pass { grid-template-columns: minmax(0, 1fr); }
  .invite-strip > div { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 4px 10px; }
  .invite-strip strong { min-width: 0; overflow: hidden; color: var(--amber); text-overflow: ellipsis; font: 800 10px/1 'IBM Plex Mono', monospace; }
  .invite-strip small { grid-column: 1 / -1; color: #81765a; font: 600 6px/1 'IBM Plex Mono', monospace; }
  .invite-strip button { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid #594a27; background: #0c0a06; color: var(--amber); cursor: pointer; }
  .invite-strip em { position: absolute; right: 10px; bottom: -18px; z-index: 2; padding: 4px 6px; background: var(--green); color: #04110b; font: normal 700 6px/1 'IBM Plex Mono', monospace; }
  .standings-panel { min-width: 0; background: #090d10; }
  .standings-head { min-height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
  .standings-head > div { display: grid; gap: 1px; }
  .standings-head > strong { color: var(--cyan); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .standings-table { min-width: 0; }
  .standings-row { min-height: 44px; display: grid; grid-template-columns: 26px minmax(100px, 1fr) 50px 32px 62px; align-items: center; gap: 6px; padding: 0 10px; border-bottom: 1px solid #1a2024; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .standings-row > span:nth-child(2) { min-width: 0; display: grid; gap: 4px; }
  .standings-row b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .standings-row small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; font: 600 6px/1 'IBM Plex Mono', monospace; }
  .standings-row em { font-style: normal; text-align: right; }
  .standings-labels { min-height: 28px; color: var(--muted); background: #0d1215; font-size: 6px; }
  .standings-labels span:last-child { text-align: right; }
  .standings-empty { min-height: 195px; display: grid; place-content: center; justify-items: center; gap: 8px; padding: 20px; color: var(--muted); text-align: center; }
  .standings-empty :global(svg) { color: var(--green); }
  .standings-empty strong { color: var(--text); font-size: 12px; }
  .standings-empty span { max-width: 260px; font-size: 9px; line-height: 1.45; }
  .rules-strip { min-height: 48px; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); background: #07090b; }
  .rules-strip span { min-width: 0; display: grid; grid-template-columns: 16px auto; align-content: center; gap: 3px 5px; padding: 7px 12px; border-right: 1px solid var(--line); }
  .rules-strip span:last-child { border-right: 0; }
  .rules-strip :global(svg) { grid-row: 1 / 3; color: var(--hot); }
  .rules-strip strong { font: 800 7px/1 'IBM Plex Mono', monospace; }
  .rules-strip small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; font: 600 6px/1 'IBM Plex Mono', monospace; }
  .positive { color: var(--green) !important; }
  .negative { color: var(--red) !important; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 920px) {
    .tournament-grid { grid-template-columns: 1fr; }
    .mission-panel { border-right: 0; }
    .standings-panel { border-top: 1px solid var(--line); }
  }

  @media (max-width: 620px) {
    .tournament-header { align-items: flex-start; }
    .season-status { display: grid; grid-template-columns: 7px auto; }
    .season-status strong { grid-column: 1 / -1; }
    .qualification-stats { grid-template-columns: repeat(2, 1fr); }
    .round-actions { grid-template-columns: 1fr; }
    .rules-strip { grid-template-columns: repeat(2, 1fr); }
    .rules-strip span:nth-child(2) { border-right: 0; }
    .rules-strip span:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
    .standings-row { grid-template-columns: 22px minmax(88px, 1fr) 43px 26px 55px; gap: 4px; padding: 0 7px; }
  }
</style>
