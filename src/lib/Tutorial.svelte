<script lang="ts">
  import { BarChart3, ChevronLeft, ChevronRight, FileCheck2, LayoutGrid, Radar, ShieldCheck, Swords, WalletCards, X } from '@lucide/svelte'

  export let open = false
  export let onclose: () => void

  const steps = [
    {
      title: 'Read the market',
      label: 'MARKET MAP',
      target: '#market',
      icon: LayoutGrid,
      body: 'Select any bubble to load its price, chart, depth, order ticket, and current AI teaching setup.',
      action: 'Open market map',
    },
    {
      title: 'Set up your desk',
      label: 'PORTFOLIO',
      target: '#portfolio',
      icon: WalletCards,
      body: 'Connect read-only to verify the wallet and its native balance, then set your goal, risk limits, time horizon, and automation preference. Broader token and venue coverage is labeled as it comes online.',
      action: 'Open setup',
    },
    {
      title: 'Choose intelligence',
      label: 'TRADER SOURCES',
      target: '#traders',
      icon: Radar,
      body: 'Follow verified filings, official research, public onchain accounts, or add a trader source you want to study.',
      action: 'View traders',
    },
    {
      title: 'Challenge another trader',
      label: 'PLAYER ARENA',
      target: '#arena',
      icon: Swords,
      body: 'On the local desk, Player 1 and Player 2 each choose a market, direction, and playbook. Both trade the same clock; the stronger directional return wins.',
      action: 'Open arena',
    },
    {
      title: 'Practice before money moves',
      label: 'EXECUTION LAB',
      target: '#signals',
      icon: BarChart3,
      body: 'Place paper market, limit, stop, bracket, and TWAP orders. DOW JONES is the one disclosed simulation opponent and teaching agent.',
      action: 'Open execution lab',
    },
    {
      title: 'Verify the result',
      label: 'RECEIPTS',
      target: '#ledger',
      icon: FileCheck2,
      body: 'Every completed match records both players, their positions, returns, winner, data mode, and a SHA-256 receipt. Live execution will add mandatory alerts.',
      action: 'Open ledger',
    },
  ]

  let stepIndex = 0
  $: step = steps[stepIndex]

  function jumpToStep() {
    window.location.hash = step.target
    onclose()
  }

  function finish() {
    stepIndex = 0
    onclose()
  }
</script>

{#if open}
  <div class="tutorial-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) finish() }}>
    <div class="tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div class="tutorial-top">
        <span><ShieldCheck size={14} /> WHALE DESK WALKTHROUGH</span>
        <button type="button" onclick={finish} title="Close tutorial"><X size={17} /></button>
      </div>
      <div class="tutorial-progress" aria-label={`Tutorial step ${stepIndex + 1} of ${steps.length}`}>
        {#each steps as tutorialStep, index}<button type="button" class:active={index === stepIndex} class:complete={index < stepIndex} onclick={() => (stepIndex = index)} title={tutorialStep.label}>{index + 1}</button>{/each}
      </div>
      <div class="tutorial-body">
        <svelte:component this={step.icon} size={28} />
        <span>{step.label} / {String(stepIndex + 1).padStart(2, '0')}</span>
        <h2 id="tutorial-title">{step.title}</h2>
        <p>{step.body}</p>
        <button class="tutorial-jump" type="button" onclick={jumpToStep}>{step.action}<ChevronRight size={14} /></button>
      </div>
      <div class="tutorial-actions">
        <button type="button" onclick={() => (stepIndex = Math.max(0, stepIndex - 1))} disabled={stepIndex === 0}><ChevronLeft size={14} /> Back</button>
        <span>{stepIndex + 1} / {steps.length}</span>
        {#if stepIndex < steps.length - 1}
          <button class="next-button" type="button" onclick={() => (stepIndex += 1)}>Next <ChevronRight size={14} /></button>
        {:else}
          <button class="next-button" type="button" onclick={finish}>Enter the desk <ChevronRight size={14} /></button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .tutorial-backdrop { position: fixed; inset: 0; z-index: 150; display: grid; place-items: center; padding: 18px; background: rgba(2, 3, 6, .88); }
  .tutorial-modal { width: min(520px, 100%); border: 1px solid #4a435a; border-radius: 6px; background: #0c0a13; box-shadow: 0 28px 90px rgba(0,0,0,.75); }
  .tutorial-top { min-height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 13px; border-bottom: 1px solid var(--line); }
  .tutorial-top > span { display: flex; align-items: center; gap: 6px; color: var(--green); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-top button { width: 29px; height: 29px; display: grid; place-items: center; border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; }
  .tutorial-progress { height: 38px; display: flex; align-items: center; justify-content: center; gap: 7px; border-bottom: 1px solid var(--line); background: #09080e; }
  .tutorial-progress button { width: 23px; height: 23px; padding: 0; border: 1px solid #383342; border-radius: 50%; background: transparent; color: #746d7f; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-progress button.complete { border-color: #2c6b55; color: var(--green); }
  .tutorial-progress button.active { border-color: var(--hot); background: var(--hot); color: #19020d; }
  .tutorial-body { min-height: 280px; display: grid; place-content: center; justify-items: center; padding: 30px 32px; text-align: center; }
  .tutorial-body > :global(svg) { color: var(--cyan); }
  .tutorial-body > span { margin-top: 15px; color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-body h2 { margin: 9px 0; font-size: 24px; }
  .tutorial-body p { max-width: 400px; margin: 0; color: #aaa4b3; font-size: 12px; line-height: 1.6; }
  .tutorial-jump { min-height: 32px; margin-top: 17px; display: inline-flex; align-items: center; gap: 5px; padding: 0 10px; border: 1px solid #315f6b; background: #0b2026; color: var(--cyan); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-actions { min-height: 52px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; padding: 0 12px; border-top: 1px solid var(--line); }
  .tutorial-actions button { min-height: 30px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid var(--line); background: #121019; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .tutorial-actions button:first-child { justify-self: start; min-width: 76px; }
  .tutorial-actions button.next-button { justify-self: end; min-width: 96px; border-color: var(--hot); background: var(--hot); color: #19020d; }
  .tutorial-actions button:disabled { opacity: .35; cursor: not-allowed; }
  .tutorial-actions > span { color: #6f6879; font: 700 8px/1 'IBM Plex Mono', monospace; }

  @media (max-width: 520px) {
    .tutorial-body { min-height: 270px; padding: 24px 20px; }
    .tutorial-body h2 { font-size: 20px; }
  }
</style>
