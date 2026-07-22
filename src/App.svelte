<script lang="ts">
  import {
    Activity,
    ArrowRight,
    BadgeCheck,
    BookOpen,
    Check,
    ChevronRight,
    CircleDollarSign,
    Copy,
    FileCheck2,
    GraduationCap,
    Info,
    LockKeyhole,
    Play,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    UserRound,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'

  type Strategy = 'hold' | 'balanced' | 'concentrated'
  type Outcome = 'down' | 'flat' | 'up'
  type Member = { displayName: string; teamName: string; joinedAt: string }
  type Receipt = {
    id: string
    hash: string
    createdAt: string
    member: string
    team: string
    paperStake: number
    strategy: Strategy
    outcome: Outcome
    hypotheticalPnl: number
    endingPaperBalance: number
  }

  const outcomeMoves: Record<Outcome, number> = { down: -0.04, flat: 0, up: 0.04 }
  const strategyExposure: Record<Strategy, number> = { hold: 0, balanced: 0.5, concentrated: 1 }
  const strategyLabels: Record<Strategy, string> = {
    hold: 'Preserve paper capital',
    balanced: 'Use 50% exposure',
    concentrated: 'Use 100% exposure',
  }
  const outcomeLabels: Record<Outcome, string> = {
    down: 'Scenario falls 4%',
    flat: 'Scenario stays flat',
    up: 'Scenario rises 4%',
  }

  let member: Member | null = null
  let displayName = ''
  let teamName = ''
  let paperBalance = 1000
  let paperStake = 100
  let strategy: Strategy = 'balanced'
  let outcome: Outcome = 'flat'
  let receipt: Receipt | null = null
  let copied = false
  let joinError = ''
  let showEvidence = false

  onMount(() => {
    const savedMember = localStorage.getItem('dreamnet-whale-member')
    const savedReceipt = localStorage.getItem('dreamnet-whale-receipt')
    if (savedMember) member = JSON.parse(savedMember) as Member
    if (savedReceipt) receipt = JSON.parse(savedReceipt) as Receipt
  })

  function joinLeague() {
    joinError = ''
    if (displayName.trim().length < 2 || teamName.trim().length < 2) {
      joinError = 'Add your name and a team name to enter the paper league.'
      return
    }
    member = { displayName: displayName.trim(), teamName: teamName.trim(), joinedAt: new Date().toISOString() }
    localStorage.setItem('dreamnet-whale-member', JSON.stringify(member))
  }

  function canonicalReceipt(input: Omit<Receipt, 'hash'>) {
    return JSON.stringify({
      createdAt: input.createdAt,
      endingPaperBalance: input.endingPaperBalance,
      hypotheticalPnl: input.hypotheticalPnl,
      id: input.id,
      member: input.member,
      outcome: input.outcome,
      paperStake: input.paperStake,
      strategy: input.strategy,
      team: input.team,
    })
  }

  async function sha256(value: string) {
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  async function runWorkout() {
    if (!member) return
    const boundedStake = Math.max(10, Math.min(paperBalance, paperStake))
    paperStake = boundedStake
    const hypotheticalPnl = Number((boundedStake * strategyExposure[strategy] * outcomeMoves[outcome]).toFixed(2))
    const unsignedReceipt: Omit<Receipt, 'hash'> = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      member: member.displayName,
      team: member.teamName,
      paperStake: boundedStake,
      strategy,
      outcome,
      hypotheticalPnl,
      endingPaperBalance: Number((paperBalance + hypotheticalPnl).toFixed(2)),
    }
    receipt = { ...unsignedReceipt, hash: await sha256(canonicalReceipt(unsignedReceipt)) }
    localStorage.setItem('dreamnet-whale-receipt', JSON.stringify(receipt))
  }

  async function copyReceipt() {
    if (!receipt) return
    await navigator.clipboard.writeText(`sha256:${receipt.hash}`)
    copied = true
    window.setTimeout(() => (copied = false), 1800)
  }

  function resetWorkout() {
    receipt = null
    localStorage.removeItem('dreamnet-whale-receipt')
  }
</script>

<svelte:head>
  <title>Whale Intelligence League | DreamNet</title>
  <meta name="description" content="Learn market decision-making through evidence-bounded paper scenarios with a verifiable receipt for every workout." />
</svelte:head>

<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#top" aria-label="Whale Intelligence League home">
      <span class="brand-mark"><Activity size={19} strokeWidth={2.2} /></span>
      <span>WHALE INTELLIGENCE LEAGUE</span>
    </a>
    <div class="status-cluster" aria-label="Application status">
      <span><span class="status-dot"></span>Paper mode</span>
      <span class="desktop-status"><LockKeyhole size={14} /> No funds connected</span>
    </div>
  </header>

  <main id="top">
    <section class="intro-band">
      <div class="intro-copy">
        <p class="eyebrow">DreamNet learning lab / cohort 01</p>
        <h1>Train your market judgment without risking your money.</h1>
        <p class="lede">Work through evidence-bounded market scenarios with DOW JONES, the league's teaching agent. Every completed workout produces a receipt showing your inputs, assumptions, and hypothetical result.</p>
        <div class="trust-row">
          <span><ShieldCheck size={17} /> Paper-only</span>
          <span><FileCheck2 size={17} /> Receipted</span>
          <span><BadgeCheck size={17} /> One disclosed agent</span>
        </div>
      </div>

      <aside class="agent-console" aria-label="DOW JONES teaching agent">
        <div class="agent-header">
          <div class="agent-avatar">DJ</div>
          <div><p class="agent-name">DOW JONES</p><p class="agent-role">Teaching agent / simulation only</p></div>
          <span class="agent-live">READY</span>
        </div>
        <div class="agent-message">
          <Sparkles size={18} />
          <p>Today's lesson is not about guessing the market. It is about seeing how exposure changes the same hypothetical outcome.</p>
        </div>
        <button class="evidence-toggle" type="button" onclick={() => (showEvidence = !showEvidence)}>
          <Info size={16} />
          {showEvidence ? 'Hide lesson boundaries' : 'See lesson boundaries'}
          <ChevronRight size={16} class={showEvidence ? 'rotated' : ''} />
        </button>
        {#if showEvidence}
          <div class="evidence-note">
            <p><strong>No live quote:</strong> the 4% move is a selectable teaching input.</p>
            <p><strong>No prediction:</strong> the agent does not claim which outcome will occur.</p>
            <p><strong>No execution:</strong> the app cannot place an order or move funds.</p>
          </div>
        {/if}
      </aside>
    </section>

    {#if !member}
      <section class="join-band" aria-labelledby="join-title">
        <div class="section-heading">
          <span class="step-number">01</span>
          <div><p class="eyebrow">Enter the league</p><h2 id="join-title">Join as yourself.</h2><p>No wallet, exchange account, or payment method is needed.</p></div>
        </div>
        <form class="join-form" onsubmit={(event) => { event.preventDefault(); joinLeague() }}>
          <label>Your display name<input bind:value={displayName} autocomplete="name" placeholder="Brandon" /></label>
          <label>Paper team name<input bind:value={teamName} placeholder="Ghostmint Research" /></label>
          <button class="primary-button" type="submit">Join paper league <ArrowRight size={18} /></button>
          {#if joinError}<p class="form-error">{joinError}</p>{/if}
        </form>
      </section>
    {:else}
      <section class="workout-band" aria-labelledby="workout-title">
        <div class="member-strip">
          <div class="member-identity"><span class="member-icon"><UserRound size={18} /></span><div><strong>{member.displayName}</strong><span>{member.teamName}</span></div></div>
          <div class="cohort-position"><span>League roster</span><strong>YOU + DOW JONES</strong></div>
        </div>
        <div class="section-heading workout-heading">
          <span class="step-number">02</span>
          <div><p class="eyebrow">Workout 001 / exposure</p><h2 id="workout-title">See the cost of conviction.</h2><p>Choose a strategy, then test it against one hypothetical market outcome.</p></div>
        </div>

        <div class="workout-grid">
          <div class="control-panel">
            <div class="control-group"><label for="balance">Starting paper balance</label><div class="money-input"><span>$</span><input id="balance" type="number" min="100" step="100" bind:value={paperBalance} /></div></div>
            <div class="control-group"><label for="stake">Paper amount for this workout</label><div class="money-input"><span>$</span><input id="stake" type="number" min="10" max={paperBalance} step="10" bind:value={paperStake} /></div></div>
            <fieldset>
              <legend>Choose your exposure</legend>
              <div class="option-list">
                {#each Object.entries(strategyLabels) as [value, label]}
                  <label class:active-option={strategy === value}>
                    <input type="radio" bind:group={strategy} value={value} />
                    <span class="radio-mark"></span>
                    <span><strong>{label}</strong><small>{Math.round(strategyExposure[value as Strategy] * 100)}% of the paper amount exposed</small></span>
                  </label>
                {/each}
              </div>
            </fieldset>
            <div class="control-group">
              <label for="outcome">Test an outcome</label>
              <select id="outcome" bind:value={outcome}>{#each Object.entries(outcomeLabels) as [value, label]}<option value={value}>{label}</option>{/each}</select>
              <p class="input-help">This is a user-selected input, not a forecast or live market move.</p>
            </div>
            <button class="primary-button run-button" type="button" onclick={runWorkout}><Play size={17} fill="currentColor" /> Run paper workout</button>
          </div>

          <div class="lesson-panel">
            <div class="lesson-header"><div><p class="eyebrow">Teaching objective</p><h3>Exposure amplifies direction.</h3></div><GraduationCap size={28} /></div>
            <div class="comparison-table">
              <div class="comparison-row table-head"><span>Strategy</span><span>Exposure</span><span>Result at {outcomeMoves[outcome] * 100}%</span></div>
              {#each Object.entries(strategyLabels) as [value, label]}
                {@const result = paperStake * strategyExposure[value as Strategy] * outcomeMoves[outcome]}
                <div class="comparison-row" class:selected-row={strategy === value}>
                  <span>{label}</span><span>{strategyExposure[value as Strategy] * 100}%</span><strong class:negative={result < 0} class:positive={result > 0}>{result >= 0 ? '+' : '-'}${Math.abs(result).toFixed(2)}</strong>
                </div>
              {/each}
            </div>
            <div class="teaching-callout"><BookOpen size={18} /><p>A receipt proves which scenario you tested. It does not prove future market performance or certify investment skill.</p></div>
          </div>
        </div>
      </section>

      {#if receipt}
        <section class="receipt-band" aria-labelledby="receipt-title">
          <div class="receipt-title-row">
            <div class="section-heading compact-heading"><span class="step-number completed"><Check size={18} /></span><div><p class="eyebrow">Workout recorded</p><h2 id="receipt-title">Your paper receipt</h2></div></div>
            <button class="icon-button" type="button" onclick={resetWorkout} title="Reset workout"><RotateCcw size={18} /></button>
          </div>
          <div class="receipt-card">
            <div class="receipt-summary">
              <div><span>Hypothetical P/L</span><strong class:negative={receipt.hypotheticalPnl < 0} class:positive={receipt.hypotheticalPnl > 0}>{receipt.hypotheticalPnl >= 0 ? '+' : '-'}${Math.abs(receipt.hypotheticalPnl).toFixed(2)}</strong></div>
              <div><span>Ending paper balance</span><strong>${receipt.endingPaperBalance.toFixed(2)}</strong></div>
              <div><span>Funds moved</span><strong>$0.00</strong></div>
            </div>
            <dl class="receipt-details">
              <div><dt>Member</dt><dd>{receipt.member} / {receipt.team}</dd></div>
              <div><dt>Strategy</dt><dd>{strategyLabels[receipt.strategy]}</dd></div>
              <div><dt>Outcome input</dt><dd>{outcomeLabels[receipt.outcome]}</dd></div>
              <div><dt>Recorded</dt><dd>{new Date(receipt.createdAt).toLocaleString()}</dd></div>
            </dl>
            <div class="receipt-hash">
              <div><span>SHA-256 receipt</span><code>sha256:{receipt.hash}</code></div>
              <button class="copy-button" type="button" onclick={copyReceipt}>{#if copied}<Check size={16} /> Copied{:else}<Copy size={16} /> Copy{/if}</button>
            </div>
          </div>
        </section>
      {/if}
    {/if}

    <section class="principles-band" aria-label="League principles">
      <article><CircleDollarSign size={23} /><h3>No capital at risk</h3><p>The first release has no exchange, wallet, signing, order, or settlement capability.</p></article>
      <article><FileCheck2 size={23} /><h3>Proof over performance theater</h3><p>Receipts preserve the actual inputs. We do not seed fake traders, rankings, or returns.</p></article>
      <article><GraduationCap size={23} /><h3>Teach before testing</h3><p>DOW JONES is disclosed as a simulation agent and explains the lesson's limits.</p></article>
    </section>
  </main>

  <footer><span>DreamNet / Whale Intelligence League</span><span>Educational paper simulation. Not financial advice.</span></footer>
</div>
