import type { MarketAsset } from './types'

export interface WhaleAgent {
  id: string
  name: string
  avatar: string
  role: string
  specialty: string
  winRatePct: number
  status: 'ONLINE' | 'ANALYZING' | 'VETO_READY'
  color: string
}

export interface AlphaCrystalSignal {
  id: string
  assetSymbol: string
  assetName: string
  assetId: string
  strategyType: 'ETH_BASIS_ARBITRAGE' | 'MOMENTUM_BREAKOUT' | 'WHALE_ACCUMULATION' | 'PREDICTION_DUTCH_BOOK' | 'CROSS_DEX_SPREAD'
  direction: 'buy' | 'sell'
  entryPriceUsd: number
  targetPriceUsd: number
  stopLossUsd: number
  expectedSharpe: number
  maxDrawdownPct: number
  confidenceScore: number // e.g. 0.984
  suggestedAllocationPct: number
  analystAgentId: string
  analystAgentName: string
  quorumStatus: 'APPROVED_BY_BETTAFISH' | 'PENDING_CONSENSUS' | 'REJECTED'
  thesis: string
  invalidation: string
  createdAt: string
  receiptHash: string
}

export interface WhaleGroupThought {
  id: string
  agentId: string
  agentName: string
  avatar: string
  color: string
  thought: string
  category: 'SIGNAL' | 'RISK_VETO' | 'WHALE_TX' | 'CONSENSUS'
  timestamp: string
}

export interface WhaleGroupConfig {
  autoMirrorEnabled: boolean
  allocationPercent: number
  maxDailyLossUsd: number
  maxSlippagePct: number
  activeAgents: string[]
  supervisedRehearsal: boolean
}

export const WHALE_AGENTS: WhaleAgent[] = [
  {
    id: 'belfort',
    name: 'BELFORT',
    avatar: '🐺',
    role: 'Momentum & Social Breakout Scout',
    specialty: 'Farcaster sentiment spikes, DEX volume surges, aggressive entry timing',
    winRatePct: 78.4,
    status: 'ONLINE',
    color: '#06b6d4',
  },
  {
    id: 'whale_scrubber',
    name: 'WHALE SCRUBBER',
    avatar: '🐋',
    role: 'On-Chain Flow & Accumulation Analyst',
    specialty: 'Base L2 / EVM block scanning, whale wallet tracking, smart money clusters',
    winRatePct: 84.2,
    status: 'ONLINE',
    color: '#3b82f6',
  },
  {
    id: 'stitch',
    name: 'STITCH',
    avatar: '👾',
    role: 'Multi-Lens Consensual Monster',
    specialty: 'Evaluates setups across 6 lenses: Simons, Druckenmiller, Belfort, Tartarian, Chanos, Chaos',
    winRatePct: 81.6,
    status: 'ONLINE',
    color: '#a855f7',
  },
  {
    id: 'genie',
    name: 'GENIE',
    avatar: '🧞',
    role: 'Predictive Regime Synthesizer',
    specialty: 'Mirofish behavioral sequences & Tartarian macro cycles, wish escalations',
    winRatePct: 76.5,
    status: 'ONLINE',
    color: '#ec4899',
  },
  {
    id: 'bettafish',
    name: 'BETTAFISH',
    avatar: '🛡️',
    role: 'Defensive Quorum & Risk Veto Gate',
    specialty: 'Zero-risk verification, deduplication of evidence, hard drawdown breaker',
    winRatePct: 99.9,
    status: 'VETO_READY',
    color: '#10b981',
  },
  {
    id: 'dow_jones',
    name: 'DOW JONES',
    avatar: '📈',
    role: 'Macro Strategist & Site Steward',
    specialty: 'Polymarket Fed rates, macroeconomic liquidity, Dutch book probability bounds',
    winRatePct: 74.8,
    status: 'ONLINE',
    color: '#f59e0b',
  },
]

export const INITIAL_ALPHA_CRYSTALS: AlphaCrystalSignal[] = [
  {
    id: 'crys-eth-01',
    assetSymbol: 'ETH',
    assetName: 'Ethereum',
    assetId: 'ethereum',
    strategyType: 'ETH_BASIS_ARBITRAGE',
    direction: 'buy',
    entryPriceUsd: 3450.0,
    targetPriceUsd: 3620.0,
    stopLossUsd: 3340.0,
    expectedSharpe: 2.82,
    maxDrawdownPct: 2.4,
    confidenceScore: 0.984,
    suggestedAllocationPct: 25,
    analystAgentId: 'whale_scrubber',
    analystAgentName: 'WHALE SCRUBBER',
    quorumStatus: 'APPROVED_BY_BETTAFISH',
    thesis: 'Smart money wallets accumulated 14,800 ETH on Base across last 6 hours with negative net exchange inflows. High basis spread captures positive funding yield.',
    invalidation: 'Break below $3,340 on 4-hour candle close invalidates spot-perp convergence thesis.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    receiptHash: '7c89f2a4e9b1103c8479e0a2df41289c4f7a63d9021e89b4f2c903a74ef1a25d',
  },
  {
    id: 'crys-btc-02',
    assetSymbol: 'BTC',
    assetName: 'Bitcoin',
    assetId: 'bitcoin',
    strategyType: 'CROSS_DEX_SPREAD',
    direction: 'buy',
    entryPriceUsd: 89400.0,
    targetPriceUsd: 93800.0,
    stopLossUsd: 87500.0,
    expectedSharpe: 2.54,
    maxDrawdownPct: 3.1,
    confidenceScore: 0.972,
    suggestedAllocationPct: 30,
    analystAgentId: 'stitch',
    analystAgentName: 'STITCH',
    quorumStatus: 'APPROVED_BY_BETTAFISH',
    thesis: 'Simons statistical mean-reversion model aligned with Druckenmiller macro liquidity tailwind. Order book depth shows 2.4x bid support across Binance/Coinbase.',
    invalidation: 'Loss of $87,500 volume shelf triggers automatic Bettafish risk veto.',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    receiptHash: 'a12e87c09341b590e82c73d9401bf5781a932ecb047a91823dcf49021b8a53e1',
  },
  {
    id: 'crys-sol-03',
    assetSymbol: 'SOL',
    assetName: 'Solana',
    assetId: 'solana',
    strategyType: 'MOMENTUM_BREAKOUT',
    direction: 'buy',
    entryPriceUsd: 198.5,
    targetPriceUsd: 218.0,
    stopLossUsd: 189.0,
    expectedSharpe: 2.15,
    maxDrawdownPct: 4.2,
    confidenceScore: 0.958,
    suggestedAllocationPct: 15,
    analystAgentId: 'belfort',
    analystAgentName: 'BELFORT',
    quorumStatus: 'APPROVED_BY_BETTAFISH',
    thesis: 'Social momentum score 94/100 on Farcaster/X, 24h DEX volume up +38%. Ascending triangle breakout confirmed on 1h volume profile.',
    invalidation: 'Slipping below $189.00 local swing low cancels momentum thesis.',
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    receiptHash: '39bc071d4a8e291f82c40a761e938bf54a0293ecbf781a0293b8417cde021a84',
  },
]

export const INITIAL_WHALE_THOUGHTS: WhaleGroupThought[] = [
  {
    id: 'th-1',
    agentId: 'bettafish',
    agentName: 'BETTAFISH',
    avatar: '🛡️',
    color: '#10b981',
    thought: 'QUORUM AUDIT: All active signals verified against paper execution invariant. Zero live funds permitted. No wallet keys exposed.',
    category: 'RISK_VETO',
    timestamp: 'Just now',
  },
  {
    id: 'th-2',
    agentId: 'belfort',
    agentName: 'BELFORT',
    avatar: '🐺',
    color: '#06b6d4',
    thought: 'Volume expansion on Base Aerodrome pools! +$4.2M 1-hour net liquidity flow. Recommending +15% paper allocation to SOL & ETH basis spread.',
    category: 'SIGNAL',
    timestamp: '3m ago',
  },
  {
    id: 'th-3',
    agentId: 'whale_scrubber',
    agentName: 'WHALE SCRUBBER',
    avatar: '🐋',
    color: '#3b82f6',
    thought: 'Detected 3 institutional whale clusters moving 850,000 USDC into Base DeFi vaults. Smart money divergence detected vs retail selling.',
    category: 'WHALE_TX',
    timestamp: '8m ago',
  },
  {
    id: 'th-4',
    agentId: 'stitch',
    agentName: 'STITCH',
    avatar: '👾',
    color: '#a855f7',
    thought: 'Multi-Lens Consensus: 5 of 6 analyst models agree on ETH upward continuation. Simons filter passed. Chanos short interest declining.',
    category: 'CONSENSUS',
    timestamp: '14m ago',
  },
]

const STORAGE_KEY_CONFIG = 'whale-group-desk-config'
const STORAGE_KEY_COPIED_SIGNALS = 'whale-group-copied-signals'

export function buildLiveAlphaCrystals(assets: MarketAsset[]): AlphaCrystalSignal[] {
  return INITIAL_ALPHA_CRYSTALS.map((crystal) => {
    const liveAsset = assets.find((a) => a.symbol.toUpperCase() === crystal.assetSymbol.toUpperCase())
    if (!liveAsset || liveAsset.price <= 0) return crystal

    const currentPrice = liveAsset.price
    const targetPriceUsd = Number((crystal.direction === 'buy' ? currentPrice * 1.055 : currentPrice * 0.945).toFixed(2))
    const stopLossUsd = Number((crystal.direction === 'buy' ? currentPrice * 0.965 : currentPrice * 1.035).toFixed(2))

    return {
      ...crystal,
      entryPriceUsd: currentPrice,
      targetPriceUsd,
      stopLossUsd,
    }
  })
}

export function getWhaleGroupConfig(): WhaleGroupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (raw) return JSON.parse(raw) as WhaleGroupConfig
  } catch {
    // fallback
  }
  return {
    autoMirrorEnabled: false,
    allocationPercent: 30,
    maxDailyLossUsd: 100,
    maxSlippagePct: 0.5,
    activeAgents: ['belfort', 'whale_scrubber', 'stitch', 'bettafish'],
    supervisedRehearsal: true,
  }
}

export function saveWhaleGroupConfig(config: WhaleGroupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export function getCopiedSignalIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COPIED_SIGNALS)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    // fallback
  }
  return []
}

export function recordCopiedSignal(signalId: string): void {
  try {
    const existing = getCopiedSignalIds()
    if (!existing.includes(signalId)) {
      localStorage.setItem(STORAGE_KEY_COPIED_SIGNALS, JSON.stringify([...existing, signalId]))
    }
  } catch {
    // ignore
  }
}
