export type PolymarketCategory =
  | 'OVERALL'
  | 'POLITICS'
  | 'SPORTS'
  | 'CRYPTO'
  | 'CULTURE'
  | 'WEATHER'
  | 'ECONOMICS'
  | 'TECH'
  | 'FINANCE'

export type PolymarketPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL'
export type PolymarketOrder = 'PNL' | 'VOL'

export type PolymarketTrader = {
  rank: number
  wallet: string
  userName: string
  volume: number
  pnl: number
  profileImage: string
  xUsername: string
  verifiedBadge: boolean
}

export type PolymarketActivity = {
  timestamp: number
  conditionId: string
  type: string
  side: 'BUY' | 'SELL'
  usdcSize: number
  price: number
  title: string
  slug: string
  eventSlug: string
  outcome: string
  transactionHash: string
}

export type WalletDna = {
  sampleSize: number
  behavior: string
  pace: string
  priceBias: string
  buyShare: number
  longshotShare: number
  favoriteShare: number
  averageTicket: number
  medianTicket: number
  uniqueMarkets: number
  tradesPerHour: number
  topMarketShare: number
  sampledHours: number
}

export type MarketGenome = {
  id: string
  title: string
  slug: string
  image: string
  volume24h: number
  liquidity: number
  openInterest: number
  competitive: number
  endDate: string
  resolutionSource: string
  marketCount: number
  restricted: boolean
}

const DATA_API = 'https://data-api.polymarket.com'
const GAMMA_API = 'https://gamma-api.polymarket.com'

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Public data request failed (${response.status})`)
  return response.json() as Promise<T>
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export async function fetchPolymarketLeaderboard(
  category: PolymarketCategory,
  period: PolymarketPeriod,
  orderBy: PolymarketOrder,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    category,
    timePeriod: period,
    orderBy,
    limit: '10',
    offset: '0',
  })
  const raw = await fetchJson<unknown>(`${DATA_API}/v1/leaderboard?${params}`, signal)
  if (!Array.isArray(raw)) throw new Error('Leaderboard returned an unexpected shape')

  return raw.map((item) => {
    const entry = objectValue(item)
    return {
      rank: numberValue(entry.rank),
      wallet: stringValue(entry.proxyWallet),
      userName: stringValue(entry.userName) || 'Anonymous profile',
      volume: numberValue(entry.vol),
      pnl: numberValue(entry.pnl),
      profileImage: stringValue(entry.profileImage),
      xUsername: stringValue(entry.xUsername),
      verifiedBadge: entry.verifiedBadge === true,
    } satisfies PolymarketTrader
  }).filter((entry) => /^0x[a-fA-F0-9]{40}$/.test(entry.wallet))
}

export async function fetchPolymarketActivity(wallet: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    user: wallet,
    limit: '100',
    offset: '0',
    type: 'TRADE',
    sortBy: 'TIMESTAMP',
    sortDirection: 'DESC',
  })
  const raw = await fetchJson<unknown>(`${DATA_API}/activity?${params}`, signal)
  if (!Array.isArray(raw)) throw new Error('Wallet activity returned an unexpected shape')

  return raw.map((item) => {
    const entry = objectValue(item)
    const side = entry.side === 'SELL' ? 'SELL' : 'BUY'
    return {
      timestamp: numberValue(entry.timestamp),
      conditionId: stringValue(entry.conditionId),
      type: stringValue(entry.type),
      side,
      usdcSize: numberValue(entry.usdcSize),
      price: numberValue(entry.price),
      title: stringValue(entry.title),
      slug: stringValue(entry.slug),
      eventSlug: stringValue(entry.eventSlug),
      outcome: stringValue(entry.outcome),
      transactionHash: stringValue(entry.transactionHash),
    } satisfies PolymarketActivity
  }).filter((entry) => entry.timestamp > 0 && entry.title)
}

export async function fetchPolymarketMarketGenomes(signal?: AbortSignal) {
  const params = new URLSearchParams({
    active: 'true',
    closed: 'false',
    order: 'volume24hr',
    ascending: 'false',
    limit: '8',
  })
  const raw = await fetchJson<unknown>(`${GAMMA_API}/events?${params}`, signal)
  if (!Array.isArray(raw)) throw new Error('Market data returned an unexpected shape')

  return raw.map((item) => {
    const event = objectValue(item)
    return {
      id: stringValue(event.id),
      title: stringValue(event.title) || 'Untitled market',
      slug: stringValue(event.slug),
      image: stringValue(event.icon) || stringValue(event.image),
      volume24h: numberValue(event.volume24hr),
      liquidity: numberValue(event.liquidity),
      openInterest: numberValue(event.openInterest),
      competitive: numberValue(event.competitive),
      endDate: stringValue(event.endDate),
      resolutionSource: stringValue(event.resolutionSource),
      marketCount: Array.isArray(event.markets) ? event.markets.length : 0,
      restricted: event.restricted === true,
    } satisfies MarketGenome
  }).filter((event) => event.id && event.slug)
}

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function analyzeWalletActivity(activity: PolymarketActivity[]): WalletDna {
  if (!activity.length) {
    return {
      sampleSize: 0,
      behavior: 'No recent public sample',
      pace: 'Unknown pace',
      priceBias: 'Unknown price bias',
      buyShare: 0,
      longshotShare: 0,
      favoriteShare: 0,
      averageTicket: 0,
      medianTicket: 0,
      uniqueMarkets: 0,
      tradesPerHour: 0,
      topMarketShare: 0,
      sampledHours: 0,
    }
  }

  const tickets = activity.map((trade) => trade.usdcSize).filter((value) => value >= 0)
  const totalNotional = tickets.reduce((sum, value) => sum + value, 0)
  const first = Math.max(...activity.map((trade) => trade.timestamp))
  const last = Math.min(...activity.map((trade) => trade.timestamp))
  const sampledHours = Math.max((first - last) / 3600, 1 / 60)
  const tradesPerHour = activity.length / sampledHours
  const buys = activity.filter((trade) => trade.side === 'BUY').length
  const longshots = activity.filter((trade) => trade.price > 0 && trade.price < 0.35).length
  const favorites = activity.filter((trade) => trade.price > 0.65).length
  const marketTotals = new Map<string, number>()

  for (const trade of activity) {
    marketTotals.set(trade.title, (marketTotals.get(trade.title) ?? 0) + trade.usdcSize)
  }
  const topMarketNotional = [...marketTotals.values()].sort((a, b) => b - a)[0] ?? 0

  const pace = tradesPerHour >= 20
    ? 'Rapid-fire activity'
    : tradesPerHour >= 5
      ? 'Active rotation'
      : tradesPerHour >= 1
        ? 'Measured activity'
        : 'Selective activity'
  const priceBias = longshots / activity.length >= 0.45
    ? 'Longshot leaning'
    : favorites / activity.length >= 0.45
      ? 'Favorite leaning'
      : 'Mixed price bands'

  return {
    sampleSize: activity.length,
    behavior: `${pace} / ${priceBias}`,
    pace,
    priceBias,
    buyShare: buys / activity.length,
    longshotShare: longshots / activity.length,
    favoriteShare: favorites / activity.length,
    averageTicket: totalNotional / Math.max(tickets.length, 1),
    medianTicket: median(tickets),
    uniqueMarkets: marketTotals.size,
    tradesPerHour,
    topMarketShare: totalNotional > 0 ? topMarketNotional / totalNotional : 0,
    sampledHours,
  }
}
