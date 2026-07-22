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

  let container: HTMLDivElement
  let nodes: BubbleNode[] = []
  let simulation: Simulation<BubbleNode, undefined> | null = null
  let observer: ResizeObserver | null = null
  let lastKey = ''

  function radiusFor(asset: MarketAsset) {
    const values = assets.map((item) => item[metric]).filter(Boolean)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const normalized = max === min ? 0.5 : (Math.sqrt(asset[metric]) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
    return 29 + normalized * 35
  }

  function rebuild() {
    if (!container || assets.length === 0) return
    const rect = container.getBoundingClientRect()
    simulation?.stop()
    nodes = assets.slice(0, rect.width < 600 ? 12 : 18).map((asset, index) => ({
      ...asset,
      radius: radiusFor(asset),
      x: rect.width * (0.18 + ((index * 37) % 70) / 100),
      y: rect.height * (0.18 + ((index * 53) % 68) / 100),
    }))
    simulation = forceSimulation(nodes)
      .velocityDecay(0.24)
      .alphaDecay(0.018)
      .force('charge', forceManyBody<BubbleNode>().strength(-14))
      .force('collision', forceCollide<BubbleNode>().radius((node) => node.radius + 3).strength(1))
      .force('center', forceCenter(rect.width / 2, rect.height / 2))
      .force('x', forceX<BubbleNode>(rect.width / 2).strength(0.025))
      .force('y', forceY<BubbleNode>(rect.height / 2).strength(0.025))
      .on('tick', () => {
        for (const node of nodes) {
          node.x = Math.max(node.radius, Math.min(rect.width - node.radius, node.x ?? rect.width / 2))
          node.y = Math.max(node.radius, Math.min(rect.height - node.radius, node.y ?? rect.height / 2))
        }
        nodes = [...nodes]
      })
  }

  $: {
    const key = `${assets.map((asset) => asset.id).join(':')}:${metric}`
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
</script>

<div class="bubble-field" bind:this={container} aria-label="Interactive market bubble map">
  <div class="bubble-grid"></div>
  {#each nodes as node (node.id)}
    {@const change = changeFor(node, window)}
    <button
      class="market-bubble"
      class:gain={change > 0.15}
      class:loss={change < -0.15}
      class:flat={change >= -0.15 && change <= 0.15}
      class:selected={selectedId === node.id}
      style={`width:${node.radius * 2}px;height:${node.radius * 2}px;left:${node.x ?? 0}px;top:${node.y ?? 0}px`}
      title={`Select ${node.name}`}
      aria-label={`${node.name}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)} percent`}
      onclick={() => onselect(node)}
    >
      {#if node.image}<img src={node.image} alt="" />{/if}
      <strong>{node.symbol}</strong>
      <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
    </button>
  {/each}
</div>

<style>
  .bubble-field { position: relative; width: 100%; height: 100%; min-height: 320px; overflow: hidden; background: #08060e; }
  .bubble-grid { position: absolute; inset: 0; pointer-events: none; background-size: 32px 32px; background-image: linear-gradient(rgba(139,109,255,.075) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,.055) 1px, transparent 1px); }
  .market-bubble { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; border: 1px solid; display: grid; place-content: center; gap: 2px; color: #f5f7f8; cursor: pointer; transition: filter .16s ease, border-color .16s ease, box-shadow .16s ease; box-shadow: inset 0 0 22px rgba(255,255,255,.06), 0 4px 18px rgba(0,0,0,.32); }
  .market-bubble:hover, .market-bubble:focus-visible { filter: brightness(1.2); z-index: 4; outline: none; }
  .market-bubble.selected { z-index: 3; border-color: #c7ff3d; box-shadow: 0 0 0 2px #08060e, 0 0 0 5px #c7ff3d, 0 0 24px rgba(199,255,61,.34), inset 0 0 20px rgba(255,255,255,.12); }
  .market-bubble.gain { background: #104b3b; border-color: #53f0c0; box-shadow: inset 0 0 22px rgba(83,240,192,.12), 0 0 14px rgba(83,240,192,.12); }
  .market-bubble.loss { background: #54122e; border-color: #ff4e82; box-shadow: inset 0 0 22px rgba(255,78,130,.13), 0 0 14px rgba(255,78,130,.12); }
  .market-bubble.flat { background: #302052; border-color: #8b6dff; box-shadow: inset 0 0 22px rgba(139,109,255,.16); }
  .market-bubble img { width: 18px; height: 18px; margin: 0 auto 1px; border-radius: 50%; }
  .market-bubble strong { font-size: clamp(.66rem, 1.5cqw, .9rem); line-height: 1; letter-spacing: 0; }
  .market-bubble span { font: 700 clamp(.58rem, 1.35cqw, .75rem)/1 ui-monospace, SFMono-Regular, Consolas, monospace; }
  @media (prefers-reduced-motion: reduce) { .market-bubble { transition: none; } }
</style>
