<script lang="ts">
  import { ArrowRight, CircleDollarSign, LineChart, WalletCards } from '@lucide/svelte'
  import type { MarketAsset, PaperPosition } from './types'
  import { shortAddress } from './wallet'

  export let walletAddress = ''
  export let positions: PaperPosition[] = []
  export let assets: MarketAsset[] = []
  export let fkUsdcBalance = 500
  export let startingValue = 500
  export let ontrade: () => void

  function livePrice(position: PaperPosition) {
    return assets.find((asset) => asset.id === position.assetId || asset.symbol === position.symbol)?.price ?? position.averageCostUsd
  }

  $: holdingsValue = positions.reduce((sum, position) => sum + position.quantity * livePrice(position), 0)
  $: totalValue = holdingsValue + fkUsdcBalance
  $: totalPnl = totalValue - startingValue
</script>

<section class="paper-portfolio" id="paper-portfolio" aria-labelledby="paper-portfolio-title">
  <div class="portfolio-head">
    <div><span><WalletCards size={14} /> PAPER PORTFOLIO</span><h2 id="paper-portfolio-title">{walletAddress ? shortAddress(walletAddress) : 'Your beta balance sheet'}</h2></div>
    <button type="button" onclick={ontrade}>Open Paper Trade <ArrowRight size={14} /></button>
  </div>

  <div class="portfolio-metrics">
    <div><span>TOTAL PAPER VALUE</span><strong>${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
    <div><span>HOLDINGS</span><strong>${holdingsValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
    <div class="fkusdc"><span>FKUSDC</span><strong>${fkUsdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
    <div><span>LIVE P/L</span><strong class:positive={totalPnl >= 0} class:negative={totalPnl < 0}>{totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
  </div>

  <div class="portfolio-table">
    <div class="portfolio-table-head"><span>ASSET</span><span>QUANTITY</span><span>LIVE PRICE</span><span>VALUE</span><span>P/L</span></div>
    <div class="portfolio-row fkusdc-row">
      <span><i><CircleDollarSign size={16} /></i><strong>FKUSDC<small>SIMULATED CASH</small></strong></span>
      <span>{fkUsdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      <span>$1.00</span>
      <span>${fkUsdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      <span>$0.00</span>
    </div>
    {#if positions.length}
      <div class="wallet-snapshot-label"><WalletCards size={13} /><span>CONNECTED WALLET SNAPSHOT</span><strong>{positions.length} ASSET{positions.length === 1 ? '' : 'S'} · READ ONLY</strong></div>
    {/if}
    {#each positions as position}
      {@const price = livePrice(position)}
      {@const value = position.quantity * price}
      {@const pnl = (price - position.averageCostUsd) * position.quantity}
      <div class="portfolio-row">
        <span>
          <i>{#if position.image}<img src={position.image} alt="" />{:else}<LineChart size={15} />{/if}</i>
          <strong>{position.symbol}<small>{position.chain}</small></strong>
        </span>
        <span>{position.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        <span>${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        <span>${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <span class:positive={pnl >= 0} class:negative={pnl < 0}>{pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </div>
    {/each}
    {#if !positions.length}
      <div class="portfolio-empty"><WalletCards size={22} /><strong>No wallet snapshot yet</strong><span>Connect and analyze a wallet above. Your paper desk still begins with 500 FKUSDC.</span></div>
    {/if}
  </div>

</section>

<style>
  .paper-portfolio { border-top: 1px solid var(--line); background: #09080e; }
  .portfolio-head { min-height: 66px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 15px; border-bottom: 1px solid var(--line); }
  .portfolio-head > div { display: grid; gap: 6px; }
  .portfolio-head span { display: flex; align-items: center; gap: 6px; color: var(--cyan); font: 700 8px/1 'IBM Plex Mono', monospace; }
  .portfolio-head h2 { margin: 0; font-size: 17px; }
  .portfolio-head button { min-height: 32px; display: inline-flex; align-items: center; gap: 7px; padding: 0 11px; border: 1px solid var(--lime); background: #18200a; color: var(--lime); cursor: pointer; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .portfolio-metrics { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--line); }
  .portfolio-metrics > div { min-height: 72px; display: grid; align-content: center; gap: 7px; padding: 0 13px; border-right: 1px solid var(--line); }
  .portfolio-metrics > div:last-child { border-right: 0; }
  .portfolio-metrics > div.fkusdc { background: #11170b; }
  .portfolio-metrics span { color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .portfolio-metrics strong { font: 800 15px/1 'IBM Plex Mono', monospace; }
  .fkusdc strong { color: var(--lime); }
  .portfolio-table { overflow-x: auto; }
  .portfolio-table-head, .portfolio-row { min-width: 670px; display: grid; grid-template-columns: 1.45fr 1fr 1fr 1fr .8fr; align-items: center; }
  .portfolio-table-head { min-height: 34px; padding: 0 12px; border-bottom: 1px solid var(--line); background: #0d1215; color: var(--muted); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .portfolio-row { min-height: 56px; padding: 0 12px; border-bottom: 1px solid var(--line); font: 600 9px/1 'IBM Plex Mono', monospace; }
  .portfolio-row > span:first-child { display: flex; align-items: center; gap: 8px; }
  .portfolio-row i { width: 28px; height: 28px; display: grid; place-items: center; overflow: hidden; border: 1px solid var(--line); border-radius: 50%; color: var(--muted); }
  .portfolio-row img { width: 100%; height: 100%; object-fit: cover; }
  .portfolio-row strong { display: grid; gap: 4px; }
  .portfolio-row small { color: var(--muted); font: 600 7px/1 'IBM Plex Mono', monospace; }
  .fkusdc-row { background: #0f140a; }
  .fkusdc-row i { border-color: #688224; color: var(--lime); }
  .wallet-snapshot-label { min-width: 670px; min-height: 30px; display: flex; align-items: center; gap: 7px; padding: 0 12px; border-bottom: 1px solid #244850; background: #09161a; color: var(--cyan); font: 700 7px/1 'IBM Plex Mono', monospace; }
  .wallet-snapshot-label strong { margin-left: auto; color: var(--muted); font-weight: 700; }
  .portfolio-empty { min-height: 170px; display: grid; place-content: center; justify-items: center; gap: 8px; color: var(--muted); text-align: center; }
  .portfolio-empty strong { color: var(--text); font-size: 12px; }
  .portfolio-empty span { max-width: 360px; font-size: 9px; line-height: 1.45; }

  @media (max-width: 760px) {
    .portfolio-metrics { grid-template-columns: 1fr 1fr; }
    .portfolio-metrics > div:nth-child(2) { border-right: 0; }
    .portfolio-metrics > div:nth-child(-n + 2) { border-bottom: 1px solid var(--line); }
    .portfolio-head h2 { font-size: 15px; }
  }
</style>
