import type { ChartPoint, MarketAsset, MarketWindow, OrderBookLevel } from './types'

export const fallbackAssets: MarketAsset[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: '', price: 68240, change1h: 0.42, change24h: 2.81, change7d: 5.64, marketCap: 1_347_000_000_000, volume: 38_400_000_000, rank: 1 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '', price: 3568, change1h: -0.18, change24h: 1.34, change7d: 4.08, marketCap: 429_000_000_000, volume: 19_200_000_000, rank: 2 },
  { id: 'tether', symbol: 'USDT', name: 'Tether', image: '', price: 1, change1h: 0.01, change24h: 0.02, change7d: -0.01, marketCap: 112_000_000_000, volume: 52_700_000_000, rank: 3 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: '', price: 594, change1h: 0.21, change24h: -0.74, change7d: 2.24, marketCap: 87_600_000_000, volume: 1_840_000_000, rank: 4 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: '', price: 151.4, change1h: 0.86, change24h: 5.72, change7d: 9.83, marketCap: 70_100_000_000, volume: 4_920_000_000, rank: 5 },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC', image: '', price: 1, change1h: 0, change24h: 0.01, change7d: 0.02, marketCap: 32_900_000_000, volume: 6_800_000_000, rank: 6 },
  { id: 'xrp', symbol: 'XRP', name: 'XRP', image: '', price: 0.526, change1h: -0.42, change24h: -2.18, change7d: 1.72, marketCap: 29_300_000_000, volume: 1_280_000_000, rank: 7 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: '', price: 0.142, change1h: 0.66, change24h: 3.91, change7d: -1.82, marketCap: 20_500_000_000, volume: 1_410_000_000, rank: 8 },
  { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', image: '', price: 7.18, change1h: -0.12, change24h: 1.08, change7d: 6.21, marketCap: 17_600_000_000, volume: 386_000_000, rank: 9 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: '', price: 0.452, change1h: 0.33, change24h: 2.42, change7d: 3.11, marketCap: 16_100_000_000, volume: 441_000_000, rank: 10 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: '', price: 34.62, change1h: 1.12, change24h: 6.84, change7d: 8.26, marketCap: 13_700_000_000, volume: 612_000_000, rank: 11 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: '', price: 14.88, change1h: -0.31, change24h: -1.64, change7d: 4.52, marketCap: 8_730_000_000, volume: 498_000_000, rank: 12 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: '', price: 6.72, change1h: 0.22, change24h: 1.16, change7d: -2.38, marketCap: 9_650_000_000, volume: 221_000_000, rank: 13 },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', image: '', price: 10.26, change1h: 0.71, change24h: 4.26, change7d: 11.84, marketCap: 6_160_000_000, volume: 388_000_000, rank: 14 },
]

type CoinGeckoAsset = {
  id: string
  symbol: string
  name: string
  image?: string
  current_price?: number
  market_cap?: number
  market_cap_rank?: number
  total_volume?: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h_in_currency?: number
  price_change_percentage_7d_in_currency?: number
}

export async function fetchMarket(): Promise<MarketAsset[]> {
  const endpoint = new URL('https://api.coingecko.com/api/v3/coins/markets')
  endpoint.searchParams.set('vs_currency', 'usd')
  endpoint.searchParams.set('order', 'market_cap_desc')
  endpoint.searchParams.set('per_page', '18')
  endpoint.searchParams.set('page', '1')
  endpoint.searchParams.set('sparkline', 'false')
  endpoint.searchParams.set('price_change_percentage', '1h,24h,7d')

  const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Market feed returned ${response.status}`)
  const data = (await response.json()) as CoinGeckoAsset[]
  if (!Array.isArray(data) || data.length < 8) throw new Error('Market feed returned too few assets')

  return data.map((asset, index) => ({
    id: asset.id,
    symbol: asset.symbol.toUpperCase(),
    name: asset.name,
    image: asset.image ?? '',
    price: asset.current_price ?? 0,
    change1h: asset.price_change_percentage_1h_in_currency ?? 0,
    change24h: asset.price_change_percentage_24h_in_currency ?? 0,
    change7d: asset.price_change_percentage_7d_in_currency ?? 0,
    marketCap: asset.market_cap ?? 0,
    volume: asset.total_volume ?? 0,
    rank: asset.market_cap_rank ?? index + 1,
  }))
}

export function changeFor(asset: MarketAsset, window: MarketWindow) {
  if (window === '1h') return asset.change1h
  if (window === '7d') return asset.change7d
  return asset.change24h
}

export function formatPrice(value: number) {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toLocaleString(undefined, { minimumSignificantDigits: 2, maximumSignificantDigits: 5 })}`
}

export function compactMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function buildFallbackChart(asset: MarketAsset, days: number): ChartPoint[] {
  const pointCount = days === 1 ? 96 : days === 7 ? 168 : 180
  const interval = (days * 24 * 60 * 60) / pointCount
  const now = Math.floor(Date.now() / 1000)
  const totalChange = days === 1 ? asset.change24h : days === 7 ? asset.change7d : asset.change7d * 1.8
  const startPrice = asset.price / (1 + totalChange / 100)
  const seed = asset.symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / Math.max(1, pointCount - 1)
    const wave = Math.sin(index * 0.41 + seed) * 0.008 + Math.sin(index * 0.13 + seed / 2) * 0.005
    const value = startPrice * (1 + (totalChange / 100) * progress + wave)
    return { time: Math.floor(now - (pointCount - 1 - index) * interval), value: Number(value.toFixed(asset.price < 1 ? 6 : 2)) }
  })
}

export async function fetchChart(asset: MarketAsset, days: number): Promise<ChartPoint[]> {
  const endpoint = new URL(`https://api.coingecko.com/api/v3/coins/${asset.id}/market_chart`)
  endpoint.searchParams.set('vs_currency', 'usd')
  endpoint.searchParams.set('days', String(days))
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Chart feed returned ${response.status}`)
  const data = (await response.json()) as { prices?: Array<[number, number]> }
  if (!data.prices || data.prices.length < 10) throw new Error('Chart feed returned too few points')
  return data.prices.map(([time, value]) => ({ time: Math.floor(time / 1000), value }))
}

function accumulate(levels: Array<[string, string]>): OrderBookLevel[] {
  let total = 0
  return levels.slice(0, 12).map(([rawPrice, rawSize]) => {
    const price = Number(rawPrice)
    const size = Number(rawSize)
    total += size
    return { price, size, total }
  })
}

export function buildFallbackBook(asset: MarketAsset): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const precision = asset.price >= 1000 ? 2 : asset.price >= 1 ? 4 : 6
  const step = asset.price * 0.00055
  const make = (direction: -1 | 1) => {
    let total = 0
    return Array.from({ length: 12 }, (_, index) => {
      const size = Number(((1 + ((index * 7 + asset.rank) % 13)) * Math.max(0.01, 240 / Math.max(asset.price, 1))).toFixed(5))
      total += size
      return {
        price: Number((asset.price + direction * step * (index + 1)).toFixed(precision)),
        size,
        total: Number(total.toFixed(5)),
      }
    })
  }
  return { bids: make(-1), asks: make(1) }
}

export async function fetchOrderBook(asset: MarketAsset): Promise<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }> {
  const symbol = `${asset.symbol}USDT`
  const endpoint = new URL('https://data-api.binance.vision/api/v3/depth')
  endpoint.searchParams.set('symbol', symbol)
  endpoint.searchParams.set('limit', '20')
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Depth feed returned ${response.status}`)
  const data = (await response.json()) as { bids?: Array<[string, string]>; asks?: Array<[string, string]> }
  if (!data.bids?.length || !data.asks?.length) throw new Error('Depth feed returned no levels')
  return { bids: accumulate(data.bids), asks: accumulate(data.asks) }
}
