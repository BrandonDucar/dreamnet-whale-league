<script lang="ts">
  import { BarChart3, Check, ChevronRight, FileCheck2, Gauge, Swords, UserRound, WalletCards } from '@lucide/svelte'

  export let deskReady = false
  export let walletReady = false
  export let planReady = false
  export let tradeReady = false
  export let battleReady = false
  export let ondesk: () => void
  export let onwallet: () => void
  export let onplan: () => void
  export let ontrade: () => void
  export let onbattle: () => void
  export let onledger: () => void

  $: steps = [
    { label: 'Desk', ready: deskReady, icon: UserRound, action: ondesk },
    { label: 'Wallet', ready: walletReady, icon: WalletCards, action: onwallet },
    { label: 'Plan', ready: planReady, icon: Gauge, action: onplan },
    { label: 'Trade', ready: tradeReady, icon: BarChart3, action: ontrade },
    { label: 'Battle', ready: battleReady, icon: Swords, action: onbattle },
  ]
  $: completed = steps.filter((step) => step.ready).length
  $: nextStep = steps.find((step) => !step.ready) ?? steps[4]
  $: nextAction = completed === steps.length ? onledger : nextStep.action
</script>

<section class="beta-runway" aria-labelledby="beta-runway-title">
  <div class="runway-heading">
    <div>
      <span>YOUR FIRST RUN</span>
      <strong id="beta-runway-title">{completed === steps.length ? 'Run complete' : `${completed} of ${steps.length} complete`}</strong>
    </div>
    <div class="runway-meter" aria-label={`${completed} of ${steps.length} onboarding steps complete`}>
      <i style={`width: ${(completed / steps.length) * 100}%`}></i>
    </div>
  </div>

  <div class="runway-steps">
    {#each steps as step, index}
      <button type="button" class:complete={step.ready} onclick={step.action}>
        <span>{#if step.ready}<Check size={14} />{:else}<svelte:component this={step.icon} size={14} />{/if}</span>
        <small>{String(index + 1).padStart(2, '0')}</small>
        <strong>{step.label}</strong>
      </button>
    {/each}
  </div>

  <button class="runway-next" type="button" onclick={nextAction}>
    {#if completed === steps.length}
      <FileCheck2 size={15} />
    {:else}
      <svelte:component this={nextStep.icon} size={15} />
    {/if}
    <span>{completed === steps.length ? 'Open your receipt ledger' : `Next: ${nextStep.label}`}</span>
    <ChevronRight size={14} />
  </button>
</section>

<style>
  .beta-runway { display: grid; grid-template-columns: minmax(160px, .7fr) minmax(360px, 1.8fr) minmax(150px, .65fr); align-items: stretch; border-bottom: 1px solid var(--line); background: #09080e; }
  .runway-heading { display: grid; align-content: center; gap: 9px; padding: 12px 14px; border-right: 1px solid var(--line); }
  .runway-heading > div:first-child { display: grid; gap: 4px; }
  .runway-heading span { color: var(--cyan); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .runway-heading strong { font-size: 12px; }
  .runway-meter { height: 3px; overflow: hidden; background: #24202d; }
  .runway-meter i { display: block; height: 100%; background: var(--lime); transition: width 220ms ease; }
  .runway-steps { display: grid; grid-template-columns: repeat(5, minmax(64px, 1fr)); }
  .runway-steps button { min-width: 0; min-height: 68px; display: grid; grid-template-columns: 24px 1fr; grid-template-rows: auto auto; align-content: center; align-items: center; column-gap: 7px; padding: 8px; border: 0; border-right: 1px solid var(--line); background: transparent; color: #8b8595; cursor: pointer; text-align: left; }
  .runway-steps button:hover { background: #12101a; color: var(--text); }
  .runway-steps button.complete { color: var(--green); background: #0a1410; }
  .runway-steps button > span { grid-row: 1 / 3; width: 24px; height: 24px; display: grid; place-items: center; border: 1px solid #383242; }
  .runway-steps button.complete > span { border-color: #2c755c; }
  .runway-steps small { color: var(--muted); font: 700 6px/1 'IBM Plex Mono', monospace; }
  .runway-steps strong { overflow: hidden; text-overflow: ellipsis; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .runway-next { min-width: 0; display: grid; grid-template-columns: 18px 1fr 14px; align-items: center; gap: 6px; padding: 0 11px; border: 0; background: var(--cyan); color: #031117; cursor: pointer; font: 800 8px/1.25 'IBM Plex Mono', monospace; }
  .runway-next span { min-width: 0; }

  @media (max-width: 900px) {
    .beta-runway { grid-template-columns: 1fr; }
    .runway-heading { border-right: 0; border-bottom: 1px solid var(--line); }
    .runway-steps button:last-child { border-right: 0; }
    .runway-next { min-height: 42px; }
  }

  @media (max-width: 560px) {
    .runway-steps { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .runway-steps button { min-height: 58px; grid-template-columns: 1fr; grid-template-rows: 24px auto; justify-items: center; padding: 6px 2px; text-align: center; }
    .runway-steps button > span { grid-row: auto; }
    .runway-steps small { display: none; }
    .runway-steps strong { width: 100%; font-size: 7px; }
  }
</style>
