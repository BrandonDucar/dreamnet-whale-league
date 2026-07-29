<script lang="ts">
  import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
  import { onDestroy, onMount } from 'svelte'
  import { changeFor } from './market'
  import type { BubbleMetric, MarketAsset, MarketWindow } from './types'

  type BubbleNode = SimulationNodeDatum & MarketAsset & {
    anchorX: number
    anchorY: number
    radius: number
  }

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
  let observer: ResizeObserver | null = null
  let lastKey = ''
  let lastWidth = 0
  let lastHeight = 0

  function radiusFor(
    asset: MarketAsset,
    currentAssets: MarketAsset[],
    minRadius: number,
    maxRadius: number,
  ) {
    if (metric === 'performance') {
      const values = currentAssets.map((item) => changeFor(item, window))
      const min = Math.min(...values)
      const max = Math.max(...values)
      const val = changeFor(asset, window)
      const normalized = max === min ? 0.5 : (val - min) / (max - min)
      return Math.round(minRadius + Math.pow(normalized, 1.25) * (maxRadius - minRadius))
    }
    const values = currentAssets
      .map((item) => item[metric])
      .filter((value) => Number.isFinite(value) && value > 0)
    if (values.length === 0) return Math.round((minRadius + maxRadius) / 2)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const value = Math.max(asset[metric], 0)
    const normalized = max === min
      ? 0.5
      : (Math.sqrt(value) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
    return minRadius + normalized * (maxRadius - minRadius)
  }

  function deterministicUnit(value: string, salt: number) {
    let hash = 2166136261 ^ salt
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0) / 4294967295
  }

  function rebuild() {
    if (!container || displayedAssets.length === 0) return
    const rect = container.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    lastWidth = rect.width
    lastHeight = rect.height

    const maxCount = rect.width < 600 ? 38 : rect.width < 900 ? 65 : 100
    const sampleAssets = displayedAssets.slice(0, maxCount)
    const aspectRatio = rect.width / rect.height
    const columns = Math.max(1, Math.ceil(Math.sqrt(sampleAssets.length * aspectRatio)))
    const rows = Math.max(1, Math.ceil(sampleAssets.length / columns))
    const cellWidth = rect.width / columns
    const cellHeight = rect.height / rows
    const cellSize = Math.min(cellWidth, cellHeight)
    const minRadius = Math.max(14, Math.min(25, cellSize * 0.23))
    const maxRadius = Math.max(minRadius + 5, Math.min(48, cellSize * 0.42))

    nodes = sampleAssets.map((asset, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const radius = radiusFor(asset, sampleAssets, minRadius, maxRadius)
      const stagger = row % 2 === 0 ? cellWidth * 0.12 : -cellWidth * 0.12
      const jitterX = (deterministicUnit(asset.id, 17) - 0.5) * cellWidth * 0.42
      const jitterY = (deterministicUnit(asset.id, 29) - 0.5) * cellHeight * 0.38
      const anchorX = Math.max(
        radius,
        Math.min(rect.width - radius, (column + 0.5) * cellWidth + stagger + jitterX),
      )
      const anchorY = Math.max(
        radius,
        Math.min(rect.height - radius, (row + 0.5) * cellHeight + jitterY),
      )

      return {
        ...asset,
        anchorX,
        anchorY,
        radius,
        x: anchorX,
        y: anchorY,
      }
    })

    const settled = forceSimulation(nodes)
      .alpha(1)
      .alphaDecay(0.08)
      .velocityDecay(0.55)
      .force(
        'collision',
        forceCollide<BubbleNode>()
          .radius((node) => node.radius + 2)
          .strength(1)
          .iterations(4),
      )
      .force('x', forceX<BubbleNode>((node) => node.anchorX).strength(0.32))
      .force('y', forceY<BubbleNode>((node) => node.anchorY).strength(0.32))
      .stop()

    for (let step = 0; step < 220; step += 1) {
      settled.tick()
      for (const node of nodes) {
        if (node.x !== undefined && node.y !== undefined) {
          node.x = Math.max(node.radius, Math.min(rect.width - node.radius, node.x ?? rect.width / 2))
          node.y = Math.max(node.radius, Math.min(rect.height - node.radius, node.y ?? rect.height / 2))
        }
      }
    }
    settled.stop()
    nodes = nodes.map((node) => ({ ...node, vx: 0, vy: 0 }))
  }

  $: {
    const dataKey = displayedAssets
      .map((asset) => {
        const change = changeFor(asset, window)
        const metricValue = metric === 'performance' ? change : asset[metric]
        return `${asset.id}:${change.toFixed(3)}:${metricValue}`
      })
      .join(':')
    const key = `${dataKey}:${metric}:${window}:${activeCategory}`
    if (container && key !== lastKey) {
      lastKey = key
      rebuild()
    }
  }

  onMount(() => {
    rebuild()
    observer = new ResizeObserver(([entry]) => {
      if (
        Math.abs(entry.contentRect.width - lastWidth) >= 2
        || Math.abs(entry.contentRect.height - lastHeight) >= 2
      ) {
        rebuild()
      }
    })
    observer.observe(container)
  })

  onDestroy(() => {
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

  function compactSymbol(symbol: string) {
    return symbol.length > 7 ? `${symbol.slice(0, 6)}.` : symbol
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
        <strong class:compact={node.symbol.length > 5}>{compactSymbol(node.symbol)}</strong>
        <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .bubble-widget { display: flex; flex-direction: column; width: 100%; height: 100%; border-bottom: 1px solid var(--line); }
  .bubble-filter-bar { min-height: 40px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 14px; background: #0c0b14; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .filter-group { display: flex; align-items: center; gap: 8px; font: 700 8px/1 'IBM Plex Mono', monospace; color: var(--muted); }
  .filter-group button { padding: 4px 9px; border: 1px solid var(--line); background: #13121c; color: var(--muted); cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; border-radius: 2px; }
  .filter-group button.active { border-color: var(--cyan); background: #1e293b; color: var(--cyan); }
  .legend-strip { display: flex; align-items: center; gap: 10px; font: 600 8px/1 'IBM Plex Mono', monospace; color: var(--muted); }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .legend-dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
  .legend-dot.violet { background: #8b5cf6; box-shadow: 0 0 6px #8b5cf6; }
  .legend-dot.red { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }

  .bubble-field { position: relative; flex: 1 1 auto; width: 100%; min-height: 0; overflow: hidden; background: #07060d; }
  .bubble-grid { position: absolute; inset: 0; pointer-events: none; background-size: 32px 32px; background-image: linear-gradient(rgba(139,109,255,.075) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,.055) 1px, transparent 1px); }

  .market-bubble { position: absolute; container-type: inline-size; transform: translate(-50%, -50%); border-radius: 50%; border: 1.5px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; color: #ffffff; cursor: pointer; transition: filter .16s ease, border-color .16s ease, transform .16s ease; box-shadow: 0 4px 18px rgba(0,0,0,.35); user-select: none; }
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
  .market-bubble strong { max-width: 82%; overflow: hidden; font: 800 clamp(.46rem, 22cqw, .88rem)/1 'IBM Plex Mono', monospace; text-overflow: clip; text-shadow: 0 1px 3px rgba(0,0,0,.6); white-space: nowrap; }
  .market-bubble strong.compact { font-size: clamp(.38rem, 16cqw, .62rem); }
  .market-bubble span { font: 700 clamp(.4rem, 17cqw, .72rem)/1 'IBM Plex Mono', monospace; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,.6); }

  @media (max-width: 760px) {
    .filter-group { width: 100%; justify-content: space-between; }
    .legend-strip { display: none; }
  }
</style>
