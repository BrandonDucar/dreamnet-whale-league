import assert from 'node:assert/strict'
import {
  WHALE_AGENTS,
  INITIAL_ALPHA_CRYSTALS,
  INITIAL_WHALE_THOUGHTS,
  buildLiveAlphaCrystals,
  getWhaleGroupConfig,
  saveWhaleGroupConfig,
  getCopiedSignalIds,
  recordCopiedSignal,
} from '../src/lib/whaleGroup'

// Mock localStorage for node test environment
const storage: Record<string, string> = {}
globalThis.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]) },
  key: (index: number) => Object.keys(storage)[index] ?? null,
  length: 0,
}

// 1. Verify Whale Agents Roster
assert.ok(WHALE_AGENTS.length >= 6, 'Should have at least 6 whale swarm agents')
const bettafish = WHALE_AGENTS.find((a) => a.id === 'bettafish')
assert.ok(bettafish, 'BETTAFISH risk veto agent must exist')
assert.equal(bettafish?.status, 'VETO_READY', 'Bettafish must be VETO_READY')

const belfort = WHALE_AGENTS.find((a) => a.id === 'belfort')
assert.ok(belfort, 'BELFORT momentum agent must exist')

const scrubber = WHALE_AGENTS.find((a) => a.id === 'whale_scrubber')
assert.ok(scrubber, 'WHALE SCRUBBER flow agent must exist')

const stitch = WHALE_AGENTS.find((a) => a.id === 'stitch')
assert.ok(stitch, 'STITCH multi-lens consensus agent must exist')

// 2. Verify Alpha Crystal Signals
assert.ok(INITIAL_ALPHA_CRYSTALS.length >= 3, 'Should have initial high-conviction Alpha Crystals')
for (const crystal of INITIAL_ALPHA_CRYSTALS) {
  assert.ok(crystal.expectedSharpe > 2.0, `Expected Sharpe ratio must be > 2.0: ${crystal.expectedSharpe}`)
  assert.ok(crystal.confidenceScore >= 0.95, `Confidence score must be >= 95%: ${crystal.confidenceScore}`)
  assert.equal(crystal.quorumStatus, 'APPROVED_BY_BETTAFISH', 'Signal must be approved by Bettafish')
  assert.ok(crystal.receiptHash && crystal.receiptHash.length === 64, 'Must have 64-char SHA-256 receipt')
  assert.ok(crystal.thesis.length > 20, 'Must have detailed thesis')
  assert.ok(crystal.invalidation.length > 10, 'Must have clear invalidation rule')
}

// 2b. Test dynamic live price synchronization
const liveSignals = buildLiveAlphaCrystals([
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '', price: 3500, change1h: 0, change24h: 2, change7d: 5, marketCap: 400000000000, volume: 15000000000, rank: 2 },
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: '', price: 92000, change1h: 0, change24h: 3, change7d: 8, marketCap: 1800000000000, volume: 30000000000, rank: 1 },
])
const ethSignal = liveSignals.find((s) => s.assetSymbol === 'ETH')
assert.equal(ethSignal?.entryPriceUsd, 3500)
assert.equal(ethSignal?.targetPriceUsd, Number((3500 * 1.055).toFixed(2)))
assert.equal(ethSignal?.stopLossUsd, Number((3500 * 0.965).toFixed(2)))

// 3. Verify Configuration Management
const defaultConfig = getWhaleGroupConfig()
assert.equal(defaultConfig.allocationPercent, 30)
assert.equal(defaultConfig.maxDailyLossUsd, 100)
assert.equal(defaultConfig.supervisedRehearsal, true)

saveWhaleGroupConfig({
  ...defaultConfig,
  allocationPercent: 45,
  maxDailyLossUsd: 150,
})

const updatedConfig = getWhaleGroupConfig()
assert.equal(updatedConfig.allocationPercent, 45)
assert.equal(updatedConfig.maxDailyLossUsd, 150)

// 4. Verify Copied Signals State
assert.deepEqual(getCopiedSignalIds(), [])
recordCopiedSignal('crys-eth-01')
assert.deepEqual(getCopiedSignalIds(), ['crys-eth-01'])
recordCopiedSignal('crys-eth-01') // duplicate test
assert.deepEqual(getCopiedSignalIds(), ['crys-eth-01'])
recordCopiedSignal('crys-btc-02')
assert.deepEqual(getCopiedSignalIds(), ['crys-eth-01', 'crys-btc-02'])

console.log('Whale Trading Group Desk verification: all assertions passed successfully.')
