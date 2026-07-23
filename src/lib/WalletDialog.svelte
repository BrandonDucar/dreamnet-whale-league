<script lang="ts">
  import { Check, Eye, LoaderCircle, ShieldCheck, WalletCards, X } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { discoverInjectedWallets } from './wallet'
  import type { DiscoveredWallet, InjectedWalletProvider } from './wallet'

  export let open = false
  export let onclose: () => void
  export let onconnect: (provider: InjectedWalletProvider) => Promise<void>
  export let onwatch: (address: string, chainId: string) => void

  let wallets: DiscoveredWallet[] = []
  let discoveryComplete = false
  let connectingId = ''
  let watchAddress = ''
  let watchChainId = '0x2105'
  let error = ''

  $: if (open && !discoveryComplete) void discover()
  $: if (!open) {
    connectingId = ''
    error = ''
  }

  onMount(() => {
    if (open) void discover()
  })

  async function discover() {
    discoveryComplete = false
    wallets = await discoverInjectedWallets()
    discoveryComplete = true
  }

  async function connect(wallet: DiscoveredWallet) {
    connectingId = wallet.id
    error = ''
    try {
      await onconnect(wallet.provider)
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Wallet connection failed.'
    } finally {
      connectingId = ''
    }
  }

  function useWatchAddress() {
    error = ''
    const normalized = watchAddress.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) {
      error = 'Enter a valid 0x EVM wallet address.'
      return
    }
    onwatch(normalized, watchChainId)
  }
</script>

{#if open}
  <div class="wallet-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) onclose() }}>
    <div class="wallet-dialog" role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title">
      <header>
        <div><span>READ-ONLY BETA</span><h2 id="wallet-dialog-title">Attach a wallet to your paper desk</h2></div>
        <button type="button" onclick={onclose} title="Close wallet window" aria-label="Close wallet window"><X size={18} /></button>
      </header>

      <div class="wallet-boundary"><ShieldCheck size={16} /><span><strong>No signing or trading permission.</strong> We request an address, read public balances, and copy them into the simulator.</span></div>

      <div class="wallet-options">
        <section>
          <div class="option-title"><span>01</span><div><strong>Connect a browser wallet</strong><small>MetaMask, Coinbase Wallet, Phantom, Rabby, and other EIP-6963 wallets</small></div></div>
          {#if !discoveryComplete}
            <div class="wallet-search"><span class="spin"><LoaderCircle size={18} /></span>Looking for installed wallets...</div>
          {:else if wallets.length}
            <div class="wallet-list">
              {#each wallets as wallet}
                <button type="button" onclick={() => void connect(wallet)} disabled={Boolean(connectingId)}>
                  {#if wallet.icon}<img src={wallet.icon} alt="" />{:else}<span class="wallet-fallback"><WalletCards size={17} /></span>{/if}
                  <span><strong>{wallet.name}</strong><small>Connect read-only account</small></span>
                  {#if connectingId === wallet.id}<span class="spin"><LoaderCircle size={16} /></span>{:else}<Check size={16} />{/if}
                </button>
              {/each}
            </div>
          {:else}
            <div class="wallet-search"><WalletCards size={19} /><span><strong>No browser wallet detected.</strong> Open this page inside your wallet browser, or use a public address below.</span></div>
          {/if}
        </section>

        <section>
          <div class="option-title"><span>02</span><div><strong>Watch a public wallet</strong><small>Works on any device and never connects an extension</small></div></div>
          <label><span>NETWORK</span><select bind:value={watchChainId}><option value="0x2105">Base</option><option value="0x1">Ethereum</option><option value="0x89">Polygon</option><option value="0xa">Optimism</option><option value="0xa4b1">Arbitrum</option></select></label>
          <label><span>PUBLIC ADDRESS</span><input bind:value={watchAddress} inputmode="text" autocomplete="off" placeholder="0x..." /></label>
          <button class="watch-button" type="button" onclick={useWatchAddress}><Eye size={16} /> Add to paper desk</button>
        </section>
      </div>

      {#if error}<div class="wallet-error" role="alert">{error}</div>{/if}
    </div>
  </div>
{/if}

<style>
  .wallet-backdrop { position: fixed; inset: 0; z-index: 180; display: grid; place-items: center; padding: 18px; background: rgba(2, 3, 6, .86); }
  .wallet-dialog { width: min(720px, 100%); max-height: calc(100vh - 36px); overflow-y: auto; border: 1px solid var(--line-bright); border-radius: 6px; background: #0b0a11; box-shadow: 0 26px 90px rgba(0,0,0,.72); }
  header { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
  header > div { min-width: 0; }
  header span { color: var(--cyan); font: 800 8px/1 'IBM Plex Mono', monospace; }
  h2 { margin: 7px 0 0; font-size: 19px; }
  header button { width: 32px; height: 32px; flex: 0 0 auto; display: grid; place-items: center; border: 1px solid var(--line); background: #111019; color: var(--muted); cursor: pointer; }
  .wallet-boundary { min-height: 48px; display: flex; align-items: center; gap: 9px; padding: 9px 16px; border-bottom: 1px solid #294b3e; background: #0b1713; color: #9fb4aa; font-size: 10px; line-height: 1.45; }
  .wallet-boundary :global(svg) { flex: 0 0 auto; color: var(--green); }
  .wallet-boundary strong { color: var(--green); }
  .wallet-options { display: grid; grid-template-columns: 1fr 1fr; }
  .wallet-options > section { min-width: 0; padding: 16px; }
  .wallet-options > section:first-child { border-right: 1px solid var(--line); }
  .option-title { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 9px; align-items: start; margin-bottom: 13px; }
  .option-title > span { width: 26px; height: 26px; display: grid; place-items: center; background: var(--hot); color: #19020d; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .option-title > div { display: grid; gap: 4px; }
  .option-title strong { font-size: 11px; }
  .option-title small { color: var(--muted); font-size: 8px; line-height: 1.4; }
  .wallet-search { min-height: 72px; display: flex; align-items: center; justify-content: center; gap: 9px; padding: 12px; border: 1px dashed #3c3948; color: #85808e; text-align: left; font-size: 9px; line-height: 1.45; }
  .wallet-search span { display: grid; gap: 3px; }
  .wallet-search strong { color: var(--text); }
  .wallet-list { display: grid; gap: 7px; }
  .wallet-list button { min-height: 48px; display: grid; grid-template-columns: 27px minmax(0, 1fr) 18px; align-items: center; gap: 9px; padding: 0 10px; border: 1px solid var(--line); background: #0d1115; color: var(--text); cursor: pointer; text-align: left; }
  .wallet-list button:hover { border-color: var(--cyan); background: #0b1b21; }
  .wallet-list button:disabled { cursor: wait; opacity: .7; }
  .wallet-list img, .wallet-fallback { width: 25px; height: 25px; display: grid; place-items: center; border-radius: 4px; }
  .wallet-list img { object-fit: contain; }
  .wallet-fallback { background: #1d1730; color: #cdbbff; }
  .wallet-list button > span:nth-child(2) { min-width: 0; display: grid; gap: 3px; }
  .wallet-list small { color: var(--muted); font: 600 7px/1 'IBM Plex Mono', monospace; }
  .wallet-list button > :global(svg:last-child) { color: var(--green); }
  label { display: grid; gap: 5px; margin-top: 9px; }
  label > span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  input, select { width: 100%; height: 38px; padding: 0 9px; border: 1px solid var(--line); outline: 0; background: #07090b; color: var(--text); }
  input:focus, select:focus { border-color: var(--cyan); }
  .watch-button { width: 100%; height: 38px; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 7px; border: 0; background: var(--cyan); color: #031117; cursor: pointer; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .wallet-error { margin: 0 16px 16px; padding: 10px; border-left: 3px solid var(--red); background: #1b0c12; color: #ff9ab8; font-size: 10px; }
  .spin { animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 680px) {
    .wallet-options { grid-template-columns: 1fr; }
    .wallet-options > section:first-child { border-right: 0; border-bottom: 1px solid var(--line); }
    h2 { font-size: 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin { animation: none; }
  }
</style>
