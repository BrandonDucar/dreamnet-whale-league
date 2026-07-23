<script lang="ts">
  import { forceCenter, forceCollide, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationNodeDatum } from 'd3-force'
  import { onDestroy, onMount } from 'svelte'
  import { changeFor } from './market'
  import type { BubbleMetric, MarketAsset, MarketWindow } from './types'

  type BubbleNode = SimulationNodeDatum & MarketAsset & { radius: number }

  export let assets: MarketAsset[] = []
  export let selectedId = ''
  export let window: MarketWindow = '24h'
  export let metric: BubbleMetric = 'marketCap'
  export let onselect: (asset: MarketAsset) => void

  let activeCategory: 'all' | 'crypto' | 'stock' = 'all'

  $: displayedAssets = activeCategory === 'all'
    ? assets
    : assets.filter((asset) => (asset.assetType ?? 'crypto') === activeCategory)

  let container: HTMLDivElement
  let nodes: BubbleNode[] = []
  let simulation: Simulation<BubbleNode, undefined> | null = null
  let observer: ResizeObserver | null = null
  let lastKey = ''

  function radiusFor(asset: MarketAsset, currentAssets: MarketAsset[]) {
    if (metric === 'performance') {
      const values = currentAssets.map((item) => changeFor(item, window))
      const min = Math.min(...values)
      const max = Math.max(...values)
      const val = changeFor(asset, window)
      const normalized = max === min ? 0.5 : (val - min) / (max - min)
      return Math.round(18 + Math.pow(normalized, 1.3) * 36)
    }
    const values = currentAssets.map((item) => item[metric]).filter(Boolean)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const normalized = max === min ? 0.5 : (Math.sqrt(asset[metric]) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
    const nodeCount = currentAssets.length
    const baseRadius = nodeCount > 60 ? 19 : nodeCount > 35 ? 24 : 28
    const scaleFactor = nodeCount > 60 ? 22 : nodeCount > 35 ? 28 : 34
    return baseRadius + normalized * scaleFactor
  }

  function rebuild() {
    if (!container || displayedAssets.length === 0) return
    const rect = container.getBoundingClientRect()
    simulation?.stop()

    const maxCount = rect.width < 600 ? 38 : rect.width < 900 ? 65 : 100
    const sampleAssets = displayedAssets.slice(0, maxCount)

    nodes = sampleAssets.map((asset, index) => ({
      ...asset,
      radius: radiusFor(asset, sampleAssets),
      x: rect.width * (0.1 + ((index * 43) % 80) / 100),
      y: rect.height * (0.1 + ((index * 61) % 80) / 100),
    }))

    const strengthCharge = nodes.length > 60 ? -12 : -18

    simulation = forceSimulation(nodes)
      .velocityDecay(0.22)
      .alphaDecay(0.015)
      .force('charge', forceManyBody<BubbleNode>().strength(strengthCharge))
      .force('collision', forceCollide<BubbleNode>().radius((node) => node.radius + 2).strength(1))
      .force('center', forceCenter(rect.width / 2, rect.height / 2))
      .force('x', forceX<BubbleNode>(rect.width / 2).strength(0.03))
      .force('y', forceY<BubbleNode>(rect.height / 2).strength(0.03))
      .on('tick', () => {
        for (const node of nodes) {
          node.x = Math.max(node.radius, Math.min(rect.width - node.radius, node.x ?? rect.width / 2))
          node.y = Math.max(node.radius, Math.min(rect.height - node.radius, node.y ?? rect.height / 2))
        }
        nodes = [...nodes]
      })
  }

  $: {
    const key = `${displayedAssets.map((asset) => asset.id).join(':')}:${metric}:${activeCategory}`
    if (container && key !== lastKey) {
      lastKey = key
      rebuild()
    }
  }

  onMount(() => {
    rebuild()
    observer = new ResizeObserver(rebuild)
    observer.observe(container)
  })

  onDestroy(() => {
    simulation?.stop()
    observer?.disconnect()
  })

  function getBubbleColorClass(asset: MarketAsset, change: number): string {
    const isStock = asset.assetType === 'stock'
    if (change > 4.0) return isStock ? 'stock-gain-big' : 'crypto-gain-big'
    if (change > 0.1) return isStock ? 'stock-gain' : 'crypto-gain'
    if (change < -4.0) return isStock ? 'stock-loss-big' : 'crypto-loss-big'
    if (change < -0.1) return isStock ? 'stock-loss' : 'crypto-loss'
    return 'flat'
  }
</script>

<div class="bubble-widget">
  <div class="bubble-filter-bar">
    <div class="filter-group">
      <span>SHOWING ({displayedAssets.length} ASSETS):</span>
      <button class:active={activeCategory === 'all'} onclick={() => (activeCategory = 'all')}>ALL (100)</button>
      <button class:active={activeCategory === 'crypto'} onclick={() => (activeCategory = 'crypto')}>TOP 50 CRYPTO</button>
      <button class:active={activeCategory === 'stock'} onclick={() => (activeCategory = 'stock')}>TOP 50 STOCKS</button>
    </div>
    <div class="legend-strip">
      <span class="legend-dot green"></span> Crypto Gain
      <span class="legend-dot violet"></span> Stock Gain
      <span class="legend-dot red"></span> Heavy Loss
    </div>
  </div>

  <div class="bubble-field" bind:this={container} aria-label="Interactive market bubble map">
    <div class="bubble-grid"></div>
    {#each nodes as node (node.id)}
      {@const change = changeFor(node, window)}
      {@const colorClass = getBubbleColorClass(node, change)}
      <button
        class={`market-bubble ${colorClass}`}
        class:selected={selectedId === node.id}
        style={`width:${node.radius * 2}px;height:${node.radius * 2}px;left:${node.x ?? 0}px;top:${node.y ?? 0}px`}
        title={`Select ${node.name} (${node.assetType ? node.assetType.toUpperCase() : 'CRYPTO'})`}
        aria-label={`${node.name}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)} percent`}
        onclick={() => onselect(node)}
      >
        <span class="asset-type-badge">{node.assetType === 'stock' ? 'STK' : 'TOK'}</span>
        <strong>{node.symbol}</strong>
        <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .bubble-widget { display: flex; flex-direction: column; width: 100%; border-bottom: 1px solid var(--line); }
  .bubble-filter-bar { min-height: 40px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 14px; background: #0c0b14; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .filter-group { display: flex; align-items: center; gap: 8px; font: 700 8px/1 'IBM Plex Mono', monospace; color: var(--muted); }
  .filter-group button { padding: 4px 9px; border: 1px solid var(--line); background: #13121c; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; border-radius: 2px; }
  .filter-group button.active { border-color: var(--cyan); background: #1e293b; color: var(--cyan); }
  .legend-strip { display: flex; align-items: center; gap: 10px; font: 600 8px/1 'IBM Plex Mono', monospace; color: var(--muted); }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .legend-dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
  .legend-dot.violet { background: #8b5cf6; box-shadow: 0 0 6px #8b5cf6; }
  .legend-dot.red { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }

  .bubble-field { position: relative; width: 100%; height: 580px; overflow: hidden; background: #07060d; }
  .bubble-grid { position: absolute; inset: 0; pointer-events: none; background-size: 32px 32px; background-image: linear-gradient(rgba(139,109,255,.075) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,.055) 1px, transparent 1px); }

  .market-bubble { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; border: 1.5px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; color: #ffffff; cursor: pointer; transition: filter .16s ease, border-color .16s ease, transform .16s ease; box-shadow: 0 4px 18px rgba(0,0,0,.35); user-select: none; }
  .market-bubble:hover, .market-bubble:focus-visible { filter: brightness(1.25); z-index: 10; outline: none; transform: translate(-50%, -50%) scale(1.08); }
  .market-bubble.selected { z-index: 9; border-color: #c7ff3d; box-shadow: 0 0 0 2px #08060e, 0 0 0 5px #c7ff3d, 0 0 24px rgba(199,255,61,.4); }

  /* VIBRANT GRADIENT COLOR VARIATIONS */
  .market-bubble.crypto-gain-big { background: linear-gradient(135deg, #047857 0%, #10b981 100%); border-color: #34d399; box-shadow: inset 0 0 16px rgba(52,211,153,.3), 0 0 14px rgba(16,185,129,.25); }
  .market-bubble.crypto-gain { background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%); border-color: #38bdf8; box-shadow: inset 0 0 16px rgba(56,189,248,.25), 0 0 12px rgba(6,182,212,.2); }
  .market-bubble.stock-gain-big { background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%); border-color: #c084fc; box-shadow: inset 0 0 16px rgba(192,132,252,.3), 0 0 14px rgba(139,92,246,.25); }
  .market-bubble.stock-gain { background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); border-color: #818cf8; box-shadow: inset 0 0 16px rgba(129,140,248,.25), 0 0 12px rgba(99,102,241,.2); }
  .market-bubble.crypto-loss-big, .market-bubble.stock-loss-big { background: linear-gradient(135deg, #9f1239 0%, #f43f5e 100%); border-color: #fda4af; box-shadow: inset 0 0 16px rgba(244,63,94,.3), 0 0 14px rgba(244,63,94,.25); }
  .market-bubble.crypto-loss { background: linear-gradient(135deg, #be123c 0%, #fb7185 100%); border-color: #fca5a5; box-shadow: inset 0 0 14px rgba(251,113,133,.2); }
  .market-bubble.stock-loss { background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%); border-color: #fb923c; box-shadow: inset 0 0 14px rgba(251,146,60,.2); }
  .market-bubble.flat { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-color: #818cf8; box-shadow: inset 0 0 14px rgba(129,140,248,.15); }

  .asset-type-badge { font: 800 6px/1 'IBM Plex Mono', monospace; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
  .market-bubble strong { font: 800 clamp(.62rem, 1.2cqw, .88rem)/1 'IBM Plex Mono', monospace; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
  .market-bubble span { font: 700 clamp(.55rem, 1.1cqw, .72rem)/1 'IBM Plex Mono', monospace; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,.6); }

  @media (max-width: 760px) {
    .bubble-field { height: 440px; }
    .filter-group { width: 100%; justify-content: space-between; }
    .legend-strip { display: none; }
  }
</style>
