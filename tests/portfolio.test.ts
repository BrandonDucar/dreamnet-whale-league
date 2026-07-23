import assert from 'node:assert/strict'
import { scanConnectedWallet } from '../src/lib/portfolio'
import type { InjectedWalletProvider } from '../src/lib/wallet'

Object.assign(globalThis, { window: globalThis })

const originalFetch = globalThis.fetch
globalThis.fetch = async (input) => {
  throw new Error(`Indexer unavailable during fallback test: ${String(input)}`)
}

const provider: InjectedWalletProvider = {
  async request({ method, params }) {
    if (method === 'eth_getBalance') return '0xde0b6b3a7640000'
    if (method === 'eth_call') {
      const call = params?.[0] as { to?: string }
      return call.to?.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
        ? `0x${123_450_000n.toString(16)}`
        : '0x0'
    }
    throw new Error(`Unexpected wallet method: ${method}`)
  },
}

try {
  const holdings = await scanConnectedWallet(
    '0x1111111111111111111111111111111111111111',
    '0x2105',
    [
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '', price: 2_000, change1h: 0, change24h: 0, change7d: 0, marketCap: 0, volume: 0, rank: 1 },
      { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', image: '', price: 1, change1h: 0, change24h: 0, change7d: 0, marketCap: 0, volume: 0, rank: 2 },
    ],
    provider,
  )

  assert.equal(holdings.length, 2)
  assert.deepEqual(
    holdings.map(({ symbol, quantity, source }) => ({ symbol, quantity, source })),
    [
      { symbol: 'ETH', quantity: 1, source: 'wallet-rpc' },
      { symbol: 'USDC', quantity: 123.45, source: 'wallet-rpc' },
    ],
  )
  console.log('portfolio fallback: imported native ETH and Base USDC from the connected Reown provider')
} finally {
  globalThis.fetch = originalFetch
}
