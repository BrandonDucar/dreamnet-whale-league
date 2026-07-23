export type MarketAsset = {
  id: string
  symbol: string
  name: string
  image: string
  price: number
  change1h: number
  change24h: number
  change7d: number
  marketCap: number
  volume: number
  rank: number
}

export type MarketWindow = '1h' | '24h' | '7d'
export type BubbleMetric = 'marketCap' | 'volume'
export type PositionSide = 'left' | 'right'
export type Thesis = 'momentum' | 'mean-reversion' | 'defensive'
export type PaperOrderType = 'market' | 'limit' | 'stop' | 'bracket' | 'twap' | 'swap'
export type PaperOrderSide = 'buy' | 'sell'

export type TraderMarket = 'traditional' | 'crypto'
export type TraderSourceKind = 'sec-13f' | 'official-research' | 'onchain-wallet' | 'leaderboard-profile' | 'user-source'
export type TraderVerification = 'SEC FILED' | 'OFFICIAL SOURCE' | 'ONCHAIN PUBLIC' | 'USER SUPPLIED'
export type TraderFollowMode = 'observe' | 'alerts' | 'paper-copy'

export type TraderTemplate = {
  id: string
  name: string
  operator: string
  market: TraderMarket
  sourceKind: TraderSourceKind
  verification: TraderVerification
  strategy: string
  cadence: string
  delay: string
  description: string
  sourceUrl: string
  sourceLabel: string
  identity?: string
  snapshot?: string
  userAdded?: boolean
  visibility?: 'private' | 'public' | 'paid'
  monthlyPriceUsd?: number
}

export type Member = {
  displayName: string
  teamName: string
  joinedAt: string
}

export type ChartPoint = {
  time: number
  value: number
}

export type OrderBookLevel = {
  price: number
  size: number
  total: number
}

export type PaperOrder = {
  id: string
  hash: string
  createdAt: string
  symbol: string
  assetId: string
  side: PaperOrderSide
  type: PaperOrderType
  amountUsd: number
  referencePrice: number
  limitPrice?: number
  stopPrice?: number
  takeProfit?: number
  stopLoss?: number
  durationMinutes?: number
  toSymbol?: string
  quoteAmount?: number
  network?: string
  status: 'filled' | 'open' | 'scheduled' | 'cancelled'
  fundsMoved: 0
}

export type OpenPosition = {
  id: string
  openedAt: string
  closesAt: number
  side: PositionSide
  leftId: string
  rightId: string
  leftEntry: number
  rightEntry: number
  paperStake: number
  thesis: Thesis
}

export type BattleReceipt = {
  id: string
  hash: string
  openedAt: string
  closedAt: string
  member: string
  team: string
  leftSymbol: string
  rightSymbol: string
  selectedSide: PositionSide
  selectedSymbol: string
  paperStake: number
  thesis: Thesis
  leftReturn: number
  rightReturn: number
  relativeEdge: number
  hypotheticalPnl: number
  fundsMoved: 0
  dataMode: 'live' | 'fallback'
}
