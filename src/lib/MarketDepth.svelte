<script lang="ts">
  import type { OrderBookLevel } from './types'

  export let bids: OrderBookLevel[] = []
  export let asks: OrderBookLevel[] = []
  export let live = false

  $: maxTotal = Math.max(1, ...bids.map((level) => level.total), ...asks.map((level) => level.total))

  function displayPrice(value: number) {
    if (value >= 1000) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (value >= 1) return value.toFixed(4)
    return value.toFixed(6)
  }
</script>

<div class="depth-panel">
  <div class="depth-head"><span>PRICE</span><span>SIZE</span><span>TOTAL</span></div>
  <div class="book-side asks">
    {#each [...asks].reverse().slice(-8) as level}
      <div class="depth-row">
        <i style={`width:${Math.max(4, (level.total / maxTotal) * 100)}%`}></i>
        <strong>{displayPrice(level.price)}</strong><span>{level.size.toFixed(4)}</span><span>{level.total.toFixed(3)}</span>
      </div>
    {/each}
  </div>
  <div class="spread-row"><span class:live-dot={live}></span>{live ? 'PUBLIC DEPTH' : 'SIMULATED DEPTH'}</div>
  <div class="book-side bids">
    {#each bids.slice(0, 8) as level}
      <div class="depth-row">
        <i style={`width:${Math.max(4, (level.total / maxTotal) * 100)}%`}></i>
        <strong>{displayPrice(level.price)}</strong><span>{level.size.toFixed(4)}</span><span>{level.total.toFixed(3)}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .depth-panel { height: 100%; min-height: 260px; overflow: hidden; border-left: 1px solid #2a303b; background: #09080f; font-family: 'IBM Plex Mono', monospace; }
  .depth-head, .depth-row { display: grid; grid-template-columns: 1fr .8fr .8fr; align-items: center; }
  .depth-head { height: 25px; padding: 0 8px; color: #6f7484; border-bottom: 1px solid #252936; font-size: 7px; font-weight: 700; }
  .depth-head span:not(:first-child), .depth-row span { text-align: right; }
  .depth-row { position: relative; height: 18px; padding: 0 8px; font-size: 8px; }
  .depth-row i { position: absolute; top: 1px; bottom: 1px; right: 0; opacity: .19; pointer-events: none; }
  .depth-row strong, .depth-row span { position: relative; z-index: 1; font-weight: 600; }
  .depth-row span { color: #9095a4; }
  .asks .depth-row strong { color: #ff4e82; }
  .asks .depth-row i { background: #ff286c; }
  .bids .depth-row strong { color: #53f0c0; }
  .bids .depth-row i { background: #20e3a0; }
  .spread-row { height: 27px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #8a90a1; border-top: 1px solid #252936; border-bottom: 1px solid #252936; font-size: 7px; font-weight: 700; }
  .spread-row span { width: 5px; height: 5px; border-radius: 50%; background: #ffbf3f; }
  .spread-row span.live-dot { background: #53f0c0; box-shadow: 0 0 7px rgba(83,240,192,.75); }
  @media (max-width: 760px) { .depth-panel { border-left: 0; border-top: 1px solid #2a303b; min-height: 318px; } .depth-row { height: 17px; } }
</style>
