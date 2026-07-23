const KALSHI_PRODUCTION_API = 'https://external-api.kalshi.com/trade-api/v2'
const KALSHI_DEMO_API = 'https://external-api.demo.kalshi.co/trade-api/v2'

export type KalshiEnvironment = 'production' | 'demo'

export type KalshiMarket = {
  ticker: string
  eventTicker: string
  title: string
  status: string
  yesBid?: string
  yesAsk?: string
  noBid?: string
  noAsk?: string
  volume?: string
  openInterest?: string
  closeTime?: string
  raw: Record<string, unknown>
}

type MarketListResponse = {
  markets?: Array<Record<string, unknown>>
  cursor?: string
}

function baseUrl(environment: KalshiEnvironment) {
  return environment === 'production' ? KALSHI_PRODUCTION_API : KALSHI_DEMO_API
}

function textField(value: unknown) {
  return typeof value === 'string' ? value : value === undefined || value === null ? undefined : String(value)
}

function mapMarket(raw: Record<string, unknown>): KalshiMarket {
  const ticker = textField(raw.ticker)
  const title = textField(raw.title)
  if (!ticker || !title) throw new Error('Kalshi returned a market without a ticker or title.')
  return {
    ticker,
    eventTicker: textField(raw.event_ticker) ?? '',
    title,
    status: textField(raw.status) ?? 'unknown',
    yesBid: textField(raw.yes_bid_dollars ?? raw.yes_bid),
    yesAsk: textField(raw.yes_ask_dollars ?? raw.yes_ask),
    noBid: textField(raw.no_bid_dollars ?? raw.no_bid),
    noAsk: textField(raw.no_ask_dollars ?? raw.no_ask),
    volume: textField(raw.volume_fp ?? raw.volume),
    openInterest: textField(raw.open_interest_fp ?? raw.open_interest),
    closeTime: textField(raw.close_time),
    raw,
  }
}

export async function fetchKalshiMarkets(options: {
  environment?: KalshiEnvironment
  status?: 'open' | 'closed' | 'settled'
  limit?: number
  cursor?: string
  signal?: AbortSignal
} = {}) {
  const environment = options.environment ?? 'production'
  const params = new URLSearchParams({
    limit: String(Math.max(1, Math.min(1000, options.limit ?? 100))),
  })
  if (options.status) params.set('status', options.status)
  if (options.cursor) params.set('cursor', options.cursor)

  const response = await fetch(`${baseUrl(environment)}/markets?${params}`, {
    headers: { accept: 'application/json' },
    signal: options.signal,
  })
  if (!response.ok) throw new Error(`Kalshi market request failed (${response.status}).`)
  const payload = await response.json() as MarketListResponse
  if (!Array.isArray(payload.markets)) throw new Error('Kalshi returned an invalid market list.')
  return { markets: payload.markets.map(mapMarket), cursor: payload.cursor ?? '' }
}

// Authenticated trading belongs in an isolated server-side adapter generated
// from Kalshi's current OpenAPI/AsyncAPI specs. RSA signing keys must never be
// shipped in the browser bundle.
