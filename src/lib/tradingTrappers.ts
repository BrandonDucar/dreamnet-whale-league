import type { MarketAsset } from './types'

export const TRADING_TRAPPERS_API =
  'https://dreamnet-trading-trappers.dreamnet-intel.workers.dev'

export type TradingTrapperDirection = 'long' | 'short' | 'neutral'

export type TradingTrapperDraft = {
  title: string
  status: 'draft' | 'ready'
  observation: {
    symbol: string
    displayName: string
    assetClass: 'crypto' | 'equity' | 'other'
    venue?: string
    timeframe: string
    observedAt: string
    referencePrice: number
    priceCurrency: string
    dataMode: 'live' | 'delayed' | 'teaching'
  }
  setup: {
    direction: TradingTrapperDirection
    thesis: string
    invalidation: string
    entryCondition: string
    targetPrices: number[]
    confidence: number
  }
  risk: {
    paperPositionUsd: number
    maxPaperLossUsd: number
    stopPrice?: number
    takeProfitPrice?: number
    maxSlippageBps: number
  }
  evidence: Array<{
    id: string
    provider:
      | 'tradingview-lightweight-charts'
      | 'tradingview-desktop-user-export'
      | 'alpaca-market-data'
      | 'market-api'
      | 'manual'
    title: string
    observedAt: string
    url?: string
    note?: string
  }>
  tags: string[]
  agent: {
    organism: string
    agentId: string
    model: string
  }
}

export type TradingTrapper = TradingTrapperDraft & {
  contractVersion: 'dreamnet-trading-trapper/1'
  id: string
  mode: 'paper'
  createdAt: string
  updatedAt: string
  policy: {
    executionAuthority: 'none'
    walletAuthority: false
    fundsMoved: 0
    humanApprovalRequired: true
  }
  receipt: {
    algorithm: 'sha256'
    hash: string
  }
}

type BuildResponse = {
  ok: boolean
  trapper?: TradingTrapper
  error?: string
  errors?: string[]
}

type WarperResponse = {
  ok: boolean
  bundle?: Record<string, unknown>
  error?: string
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${TRADING_TRAPPERS_API}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || `Trading Trapper API returned ${response.status}`)
  return payload
}

export async function buildTradingTrapper(draft: TradingTrapperDraft) {
  const response = await post<BuildResponse>('/v1/trappers/build', { draft })
  if (!response.ok || !response.trapper) {
    throw new Error(response.error || response.errors?.join('; ') || 'Trading Trapper was not created')
  }
  return response.trapper
}

export async function convertToWarperBundle(trapper: TradingTrapper) {
  const response = await post<WarperResponse>('/v1/trappers/to-warper', { trapper })
  if (!response.ok || !response.bundle) throw new Error(response.error || 'Warper Keeper bundle was not created')
  return response.bundle
}

export function tradingViewUrl(asset: MarketAsset) {
  const symbol = asset.assetType === 'stock' ? asset.symbol : `${asset.symbol}USD`
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`
}

export function downloadJson(fileName: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
