<script lang="ts">
  import { AreaSeries, ColorType, CrosshairMode, createChart, type AreaData, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'
  import { onDestroy, onMount } from 'svelte'
  import type { ChartPoint } from './types'

  export let points: ChartPoint[] = []
  export let positive = true

  let container: HTMLDivElement
  let chart: IChartApi | null = null
  let series: ISeriesApi<'Area'> | null = null
  let observer: ResizeObserver | null = null

  function setSeriesData() {
    if (!series || points.length === 0) return
    series.applyOptions({
      lineColor: positive ? '#28d38f' : '#f05b64',
      topColor: positive ? 'rgba(40, 211, 143, 0.24)' : 'rgba(240, 91, 100, 0.22)',
      bottomColor: positive ? 'rgba(40, 211, 143, 0.01)' : 'rgba(240, 91, 100, 0.01)',
    })
    series.setData(points.map((point) => ({ time: point.time as UTCTimestamp, value: point.value }) satisfies AreaData))
    chart?.timeScale().fitContent()
  }

  $: if (series && points) setSeriesData()

  onMount(() => {
    chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: { background: { type: ColorType.Solid, color: '#080b0d' }, textColor: '#77838a', fontFamily: 'Inter, ui-sans-serif, system-ui' },
      grid: { vertLines: { color: 'rgba(255,255,255,.035)' }, horzLines: { color: 'rgba(255,255,255,.045)' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#718089', labelBackgroundColor: '#273038' }, horzLine: { color: '#718089', labelBackgroundColor: '#273038' } },
      rightPriceScale: { borderColor: '#263037' },
      timeScale: { borderColor: '#263037', timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    })
    series = chart.addSeries(AreaSeries, { lineWidth: 2, priceLineVisible: true, crosshairMarkerRadius: 4 })
    setSeriesData()
    observer = new ResizeObserver(() => chart?.applyOptions({ width: container.clientWidth, height: container.clientHeight }))
    observer.observe(container)
  })

  onDestroy(() => {
    observer?.disconnect()
    chart?.remove()
  })
</script>

<div class="chart" bind:this={container} aria-label="Interactive price chart"></div>

<style>
  .chart { width: 100%; height: 100%; min-height: 260px; }
</style>
