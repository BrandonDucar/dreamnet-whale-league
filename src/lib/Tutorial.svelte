<script lang="ts">
  import { BarChart3, ChevronLeft, ChevronRight, FileCheck2, Fingerprint, LayoutGrid, Radar, ShieldCheck, Swords, UserRound, WalletCards, X } from '@lucide/svelte'
  import { onMount, tick } from 'svelte'

  export let open = false
  export let onclose: (completed: boolean) => void
  export let onnavigate: (environment: 'markets' | 'desk' | 'research' | 'arena' | 'execute' | 'ledger', view?: 'sources' | 'whales') => void

  type Spotlight = { top: number; left: number; width: number; height: number; visible: boolean }

  const steps = [
    {
      title: 'Start with the market map',
      label: 'MARKET MAP',
      target: '#market',
      environment: 'markets' as const,
      icon: LayoutGrid,
      body: 'This is the fastest way into the desk. Bubble size shows market cap or volume; color shows the selected performance window.',
      action: 'Tap a bubble. That market becomes the active symbol everywhere else in the app.',
    },
    {
      title: 'Build your trading boundary',
      label: 'YOUR DESK',
      target: '#portfolio',
      environment: 'desk' as const,
      icon: WalletCards,
      body: 'Connect a wallet read-only, copy its current native and indexed token holdings into the paper ledger, then choose your experience, goal, risk, horizon, and limits.',
      action: 'Analyze holdings to create the starting portfolio plus exactly 500 FKUSDC. The wallet stays untouched while the simulated copy moves.',
    },
    {
      title: 'Choose who informs you',
      label: 'INTELLIGENCE',
      target: '#traders',
      environment: 'research' as const,
      view: 'sources' as const,
      icon: Radar,
      body: 'Switch between traditional-market sources, public onchain accounts, and sources you add yourself. These are research inputs, not invented live traders.',
      action: 'Open a source link before following it, then choose Follow only when it belongs in your research desk.',
    },
    {
      title: 'Read the public whale map',
      label: 'WHALE SIGNAL LAB',
      target: '#whale-intelligence',
      environment: 'research' as const,
      view: 'whales' as const,
      icon: Fingerprint,
      body: 'Inspect live public Polymarket rankings, select a wallet to build a sample-based behavior profile, or switch to current market genomes.',
      action: 'Change the market specialty, ranking window, and metric. Watch a wallet for research, then inspect the evidence sample before drawing a conclusion.',
    },
    {
      title: 'Enter a player match',
      label: 'PLAYER ARENA',
      target: '#arena',
      environment: 'arena' as const,
      icon: Swords,
      body: 'Join the league, then choose Local 2P for two people at one desk or Practice for the disclosed DOW JONES simulation opponent.',
      action: 'Each side chooses a market, long or short direction, playbook, stake, and round length. Best directional return wins.',
    },
    {
      title: 'Read price and liquidity',
      label: 'CHART + DEPTH',
      target: '#chart',
      environment: 'markets' as const,
      icon: BarChart3,
      body: 'The selected bubble drives this price chart and public order-book ladder. Change the history range before committing to a thesis.',
      action: 'Compare the chart structure with the bid and ask depth. Teaching data is labeled whenever a live source is unavailable.',
    },
    {
      title: 'Rehearse the execution',
      label: 'PAPER ORDERS',
      target: '#execution',
      environment: 'execute' as const,
      icon: ShieldCheck,
      body: 'Use live prices to rehearse market, limit, stop, bracket, TWAP, and swap workflows against your simulated holdings and FKUSDC balance.',
      action: 'Review the live or fallback fee estimate, then simulate the order. Assets and fees settle only in the paper ledger; real funds moved remains $0.',
    },
    {
      title: 'Verify what happened',
      label: 'RECEIPTS',
      target: '#receipts',
      environment: 'ledger' as const,
      icon: FileCheck2,
      body: 'Completed matches create a SHA-256 receipt with both players, positions, returns, winner, timing, and the market-data mode used.',
      action: 'Use the ledger to confirm the result and copy its hash. A receipt is evidence of the paper run, not a live trade claim.',
    },
  ]

  let stepIndex = 0
  let presentedKey = ''
  let settleTimer: ReturnType<typeof setTimeout> | null = null
  let spotlight: Spotlight = { top: 0, left: 0, width: 0, height: 0, visible: false }

  $: step = steps[stepIndex]
  $: nextStep = steps[stepIndex + 1]
  $: if (open) {
    const key = `${stepIndex}:${step.target}`
    if (key !== presentedKey) {
      presentedKey = key
      void presentStep()
    }
  } else {
    presentedKey = ''
    spotlight = { ...spotlight, visible: false }
  }

  onMount(() => {
    const update = () => { if (open) updateSpotlight() }
    const handleKeydown = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') dismiss()
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('keydown', handleKeydown)
      if (settleTimer) clearTimeout(settleTimer)
    }
  })

  async function presentStep() {
    onnavigate(step.environment, 'view' in step ? step.view : undefined)
    await tick()
    await tick()
    const target = document.querySelector<HTMLElement>(step.target)
    if (!target) {
      spotlight = { ...spotlight, visible: false }
      return
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rect = target.getBoundingClientRect()
    const block = rect.height > window.innerHeight * 0.72 ? 'start' : 'center'
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block })
    updateSpotlight()
    if (settleTimer) clearTimeout(settleTimer)
    settleTimer = setTimeout(updateSpotlight, reducedMotion ? 0 : 420)
  }

  function updateSpotlight() {
    const target = document.querySelector<HTMLElement>(step.target)
    if (!target) return
    const rect = target.getBoundingClientRect()
    const padding = 7
    const left = Math.max(7, rect.left - padding)
    const top = Math.max(7, rect.top - padding)
    spotlight = {
      left,
      top,
      width: Math.max(0, Math.min(window.innerWidth - left - 7, rect.width + padding * 2)),
      height: Math.max(0, Math.min(window.innerHeight - top - 7, rect.height + padding * 2)),
      visible: rect.bottom > 0 && rect.top < window.innerHeight,
    }
  }

  function goTo(index: number) {
    stepIndex = Math.max(0, Math.min(steps.length - 1, index))
  }

  function dismiss() {
    stepIndex = 0
    onclose(false)
  }

  function finish() {
    stepIndex = 0
    onclose(true)
  }
</script>

{#if open}
  {#if spotlight.visible}
    <div class="tour-shade shade-top" style={`height:${spotlight.top}px`} aria-hidden="true"></div>
    <div class="tour-shade shade-left" style={`top:${spotlight.top}px;width:${spotlight.left}px;height:${spotlight.height}px`} aria-hidden="true"></div>
    <div class="tour-shade shade-right" style={`top:${spotlight.top}px;left:${spotlight.left + spotlight.width}px;height:${spotlight.height}px`} aria-hidden="true"></div>
    <div class="tour-shade shade-bottom" style={`top:${spotlight.top + spotlight.height}px`} aria-hidden="true"></div>
    <div
      class="spotlight-frame"
      style={`top:${spotlight.top}px;left:${spotlight.left}px;width:${spotlight.width}px;height:${spotlight.height}px`}
      aria-hidden="true"
    ><span>{String(stepIndex + 1).padStart(2, '0')} / {step.label}</span></div>
  {/if}

  <div
    class="tutorial-modal"
    role="dialog"
    aria-labelledby="tutorial-title"
    aria-describedby="tutorial-description"
    aria-live="polite"
    data-step-index={stepIndex}
  >
    <div class="tutorial-top">
      <span><ShieldCheck size={14} /> GUIDED TOUR <strong>{stepIndex + 1} / {steps.length}</strong></span>
      <button type="button" onclick={dismiss} title="End tour" aria-label="End tour" data-testid="tutorial-close"><X size={17} /></button>
    </div>

    <div class="tutorial-progress" aria-label={`Tutorial step ${stepIndex + 1} of ${steps.length}`}>
      {#each steps as tutorialStep, index}
        <button
          type="button"
          class:active={index === stepIndex}
          class:complete={index < stepIndex}
          onclick={() => goTo(index)}
          title={tutorialStep.label}
          aria-label={`Go to step ${index + 1}: ${tutorialStep.label}`}
        >{index + 1}</button>
      {/each}
    </div>

    <div class="tutorial-body">
      <div class="step-identity"><span class="step-icon"><svelte:component this={step.icon} size={20} /></span><span>{step.label}<small>{stepIndex + 1} OF {steps.length}</small></span></div>
      <h2 id="tutorial-title">{step.title}</h2>
      <p id="tutorial-description">{step.body}</p>
      <div class="step-action"><UserRound size={15} /><span><strong>WHAT TO DO</strong>{step.action}</span></div>
    </div>

    <div class="tutorial-actions">
      <button type="button" onclick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0} data-testid="tutorial-back"><ChevronLeft size={14} /> Back</button>
      {#if nextStep}
        <button class="next-button" type="button" onclick={() => goTo(stepIndex + 1)} data-testid="tutorial-next">Next: {nextStep.label} <ChevronRight size={14} /></button>
      {:else}
        <button class="next-button" type="button" onclick={finish} data-testid="tutorial-finish">Finish tour <ChevronRight size={14} /></button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tour-shade { position: fixed; z-index: 139; background: rgba(2, 3, 6, .78); pointer-events: none; }
  .shade-top { inset: 0 0 auto; }
  .shade-left { left: 0; }
  .shade-right { right: 0; }
  .shade-bottom { right: 0; bottom: 0; left: 0; }
  .spotlight-frame { position: fixed; z-index: 140; border: 2px solid var(--hot); border-radius: 5px; box-shadow: 0 0 24px rgba(255, 47, 146, .3); pointer-events: none; transition: top .3s ease, left .3s ease, width .3s ease, height .3s ease; }
  .spotlight-frame span { position: absolute; top: -23px; left: -2px; height: 21px; display: flex; align-items: center; padding: 0 7px; border: 1px solid var(--hot); background: var(--hot); color: #19020d; white-space: nowrap; font: 800 7px/1 'IBM Plex Mono', monospace; }
  .tutorial-modal { position: fixed; top: 104px; left: 50%; z-index: 150; width: min(460px, calc(100vw - 36px)); transform: translateX(-50%); border: 2px solid var(--hot); border-radius: 6px; background: #0c0a13; box-shadow: 0 24px 90px rgba(0,0,0,.84), 0 0 34px rgba(255,47,146,.22); }
  .tutorial-top { min-height: 43px; display: flex; align-items: center; justify-content: space-between; padding: 0 11px; border-bottom: 1px solid var(--line); }
  .tutorial-top > span { display: flex; align-items: center; gap: 6px; color: var(--green); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-top > span strong { padding: 5px 7px; background: var(--hot); color: #19020d; font-size: 9px; }
  .tutorial-top button { width: 29px; height: 29px; display: grid; place-items: center; border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; }
  .tutorial-progress { min-height: 36px; display: flex; align-items: center; justify-content: center; gap: 7px; border-bottom: 1px solid var(--line); background: #09080e; }
  .tutorial-progress button { width: 23px; height: 23px; padding: 0; border: 1px solid #383342; border-radius: 50%; background: transparent; color: #746d7f; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-progress button.complete { border-color: #2c6b55; color: var(--green); }
  .tutorial-progress button.active { border-color: var(--hot); background: var(--hot); color: #19020d; }
  .tutorial-body { min-height: 230px; padding: 22px 23px 19px; }
  .step-identity { display: flex; align-items: center; gap: 9px; }
  .step-icon { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid #285f6b; background: #0b2026; color: var(--cyan); }
  .step-identity > span:last-child { display: grid; gap: 4px; color: var(--cyan); font: 800 8px/1 'IBM Plex Mono', monospace; }
  .step-identity small { color: #6f6879; font: 700 7px/1 'IBM Plex Mono', monospace; }
  .tutorial-body h2 { margin: 15px 0 8px; font-size: 21px; }
  .tutorial-body > p { margin: 0; color: #aaa4b3; font-size: 11px; line-height: 1.55; }
  .step-action { min-height: 53px; margin-top: 15px; display: grid; grid-template-columns: 20px 1fr; align-items: center; gap: 7px; padding: 8px 10px; border-left: 2px solid var(--lime); background: #11150c; color: #b8c0a4; }
  .step-action > :global(svg) { color: var(--lime); }
  .step-action span { display: grid; gap: 5px; font-size: 9px; line-height: 1.4; }
  .step-action strong { color: var(--lime); font: 800 7px/1 'IBM Plex Mono', monospace; }
  .tutorial-actions { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 11px; border-top: 1px solid var(--line); }
  .tutorial-actions button { min-height: 31px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 0 9px; border: 1px solid var(--line); background: #121019; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-actions button.next-button { min-width: 150px; border-color: var(--hot); background: var(--hot); color: #19020d; }
  .tutorial-actions button:disabled { opacity: .35; cursor: not-allowed; }

  @media (max-width: 760px) {
    .tutorial-modal { top: 92px; right: 9px; left: 9px; width: auto; transform: none; }
    .tutorial-body { min-height: 215px; padding: 18px 18px 16px; }
    .tutorial-body h2 { font-size: 18px; }
    .spotlight-frame span { top: 0; left: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .spotlight-frame { transition: none; }
  }
</style>
