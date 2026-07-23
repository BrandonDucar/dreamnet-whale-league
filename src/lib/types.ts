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
  assetType?: 'crypto' | 'stock'
}

export type MarketWindow = '1h' | '24h' | '7d'
export type BubbleMetric = 'marketCap' | 'volume'
export type TradeDirection = 'long' | 'short'
export type Thesis = 'momentum' | 'mean-reversion' | 'defensive'
export type PaperOrderType = 'market' | 'limit' | 'stop' | 'bracket' | 'twap' | 'swap'
export type PaperOrderSide = 'buy' | 'sell'

export type TraderMarket = 'traditional' | 'crypto'
export type TraderSourceKind = 'sec-13f' | 'official-research' | 'onchain-wallet' | 'leaderboard-profile' | 'user-source'
export type TraderVerification = 'SEC FILED' | 'OFFICIAL SOURCE' | 'ONCHAIN PUBLIC' | 'USER SUPPLIED'
export type TraderFollowMode = 'observe' | 'alerts' | 'paper-copy'

export type TraderPositionItem = {
  assetSymbol: string
  assetName: string
  direction: 'LONG' | 'SHORT' | 'HOLD' | 'ACCUMULATE'
  allocationPct: number
  entryPriceUsd?: number
  currentPriceUsd?: number
  pnlPct?: number
  valueUsd?: number
}

export type TraderPerformancePoint = {
  date: string
  returnPct: number
}

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
  winRatePct?: number
  totalReturn30d?: number
  activePositions?: TraderPositionItem[]
  performanceCurve?: TraderPerformancePoint[]
  assetAllocation?: Array<{ name: string; percentage: number; color: string }>
}

export type Member = {
  authMethod?: 'email' | 'farcaster' | 'local'
  displayName: string
  fid?: number
  teamName: string
  joinedAt: string
  pfpUrl?: string
  username?: string
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
  estimatedFeeUsd?: number
  slippageBps?: number
  settled?: boolean
}

export type WalletHolding = {
  id: string
  chainId: string
  chain: string
  symbol: string
  name: string
  quantity: number
  priceUsd: number
  valueUsd: number
  image?: string
  contractAddress?: string
  isNative: boolean
  tradeable: boolean
  source: 'wallet-rpc' | 'blockscout'
  observedAt: string
}

export type PaperPosition = {
  id: string
  assetId: string
  chainId: string
  chain: string
  symbol: string
  name: string
  initialQuantity: number
  quantity: number
  averageCostUsd: number
  image?: string
  source: 'wallet-snapshot' | 'paper-trade'
}

export type PaperFeeQuote = {
  chainId: string
  gasPriceWei: string
  gasUnits: number
  nativeSymbol: string
  nativePriceUsd: number
  networkFeeUsd: number
  venueFeeUsd: number
  slippageBps: number
  totalEstimatedCostUsd: number
  mode: 'live' | 'fallback'
  quotedAt: string
}

export type BattleReceipt = {
  id: string
  hash: string
  openedAt: string
  closedAt: string
  mode: 'players' | 'practice'
  hostName: string
  hostTeam: string
  opponentName: string
  hostSymbol: string
  opponentSymbol: string
  hostDirection: TradeDirection
  opponentDirection: TradeDirection
  paperStake: number
  hostThesis: Thesis
  opponentThesis: Thesis
  hostReturn: number
  opponentReturn: number
  winningMargin: number
  winnerName: string
  hostHypotheticalPnl: number
  fundsMoved: 0
  dataMode: 'live' | 'fallback'
}
