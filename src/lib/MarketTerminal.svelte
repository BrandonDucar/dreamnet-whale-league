<script lang="ts">
  import MarketChart from './MarketChart.svelte'
  import MarketDepth from './MarketDepth.svelte'
  import { formatPrice } from './market'
  import type { ChartPoint, MarketAsset, OrderBookLevel } from './types'

  export let selectedAsset: MarketAsset
  export let marketChange: number
  export let chartDays: number
  export let chartPoints: ChartPoint[]
  export let chartLoading: boolean
  export let chartMode: 'live' | 'fallback'
  export let bids: OrderBookLevel[]
  export let asks: OrderBookLevel[]
  export let bookStatus: 'loading' | 'live' | 'fallback'
  export let ondayschange: (days: number) => void
</script>

<section class="chart-panel" id="chart" aria-labelledby="chart-title">
  <div class="chart-head">
    <div class="instrument-title">
      {#if selectedAsset.image}<img src={selectedAsset.image} alt="" />{/if}
      <div><span>{selectedAsset.name}</span><strong id="chart-title">{selectedAsset.symbol} / U.S. DOLLAR</strong></div>
    </div>
    <div class="instrument-price">
      <strong>{formatPrice(selectedAsset.price)}</strong>
      <span class:positive={marketChange >= 0} class:negative={marketChange < 0}>{marketChange >= 0 ? '+' : ''}{marketChange.toFixed(2)}%</span>
    </div>
    <div class="chart-ranges">
      {#each [1, 7, 30] as days}
        <button type="button" class:active={chartDays === days} onclick={() => ondayschange(days)}>{days === 1 ? '1D' : `${days}D`}</button>
      {/each}
    </div>
    <span class="chart-source">{chartLoading ? 'LOADING' : chartMode === 'live' ? 'LIVE HISTORY' : 'TEACHING SERIES'}</span>
  </div>
  <div class="chart-grid">
    <div class="chart-body"><MarketChart points={chartPoints} positive={marketChange >= 0} /></div>
    <div class="depth-wrap"><MarketDepth {bids} {asks} live={bookStatus === 'live'} /></div>
  </div>
  <div class="chart-foot">
    <span>Interactive price chart</span>
    <span>Powered by <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView Lightweight Charts</a></span>
  </div>
</section>
