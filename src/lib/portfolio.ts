import type { MarketAsset, PaperFeeQuote, WalletHolding } from './types'
import type { InjectedWalletProvider } from './wallet'
import { chainName, getInjectedWallet, readNativeBalance } from './wallet'

type BlockscoutTokenBalance = {
  value?: string
  token?: {
    address_hash?: string
    decimals?: string
    exchange_rate?: string
    icon_url?: string
    name?: string
    symbol?: string
    type?: string
  }
}

type BlockscoutAddress = {
  coin_balance?: string
  exchange_rate?: string
}

type CoreToken = {
  address: string
  decimals: number
  symbol: string
  name: string
  marketAssetId?: string
}

type ChainConfig = {
  explorer?: string
  rpc?: string
  nativeSymbol: string
  nativeAssetId: string
  coreTokens?: CoreToken[]
}

const baseCoreTokens: CoreToken[] = [
  { address: '0x4200000000000000000000000000000000000006', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', marketAssetId: 'ethereum' },
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, symbol: 'USDC', name: 'USD Coin', marketAssetId: 'usd-coin' },
  { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfcE933A21F1010', decimals: 18, symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', marketAssetId: 'coinbase-wrapped-staked-eth' },
  { address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', decimals: 8, symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', marketAssetId: 'bitcoin' },
  { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin', marketAssetId: 'dai' },
  { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, symbol: 'AERO', name: 'Aerodrome Finance', marketAssetId: 'aerodrome-finance' },
  { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, symbol: 'DEGEN', name: 'Degen', marketAssetId: 'degen-base' },
  { address: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42', decimals: 6, symbol: 'EURC', name: 'EURC', marketAssetId: 'euro-coin' },
  { address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', decimals: 6, symbol: 'USDbC', name: 'USD Base Coin', marketAssetId: 'usd-base-coin' },
]

const mainnetCoreTokens: CoreToken[] = [
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', marketAssetId: 'ethereum' },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT', name: 'Tether USD', marketAssetId: 'tether' },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC', name: 'USD Coin', marketAssetId: 'usd-coin' },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, symbol: 'WBTC', name: 'Wrapped BTC', marketAssetId: 'bitcoin' },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin', marketAssetId: 'dai' },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, symbol: 'LINK', name: 'Chainlink', marketAssetId: 'chainlink' },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, symbol: 'UNI', name: 'Uniswap', marketAssetId: 'uniswap' },
  { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, symbol: 'SHIB', name: 'Shiba Inu', marketAssetId: 'shiba-inu' },
  { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18, symbol: 'PEPE', name: 'Pepe', marketAssetId: 'pepe' },
]

const arbitrumCoreTokens: CoreToken[] = [
  { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', marketAssetId: 'ethereum' },
  { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, symbol: 'ARB', name: 'Arbitrum', marketAssetId: 'arbitrum' },
  { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, symbol: 'USDC', name: 'USD Coin', marketAssetId: 'usd-coin' },
  { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, symbol: 'USDT', name: 'Tether USD', marketAssetId: 'tether' },
  { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, symbol: 'WBTC', name: 'Wrapped BTC', marketAssetId: 'bitcoin' },
]

const optimismCoreTokens: CoreToken[] = [
  { address: '0x4200000000000000000000000000000000000006', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', marketAssetId: 'ethereum' },
  { address: '0x4200000000000000000000000000000000000042', decimals: 18, symbol: 'OP', name: 'Optimism', marketAssetId: 'optimism' },
  { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, symbol: 'USDC', name: 'USD Coin', marketAssetId: 'usd-coin' },
  { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6, symbol: 'USDT', name: 'Tether USD', marketAssetId: 'tether' },
]

const polygonCoreTokens: CoreToken[] = [
  { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', marketAssetId: 'ethereum' },
  { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, symbol: 'WPOL', name: 'Wrapped POL', marketAssetId: 'matic-network' },
  { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, symbol: 'USDC', name: 'USD Coin', marketAssetId: 'usd-coin' },
  { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, symbol: 'USDT', name: 'Tether USD', marketAssetId: 'tether' },
]

const bscCoreTokens: CoreToken[] = [
  { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, symbol: 'WBNB', name: 'Wrapped BNB', marketAssetId: 'binancecoin' },
  { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, symbol: 'USDT', name: 'Tether USD', marketAssetId: 'tether' },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, symbol: 'USDC', name: 'USD Coin', marketAssetId: 'usd-coin' },
]

const chainConfig: Record<string, ChainConfig> = {
  '0x1': { explorer: 'https://eth.blockscout.com', rpc: 'https://ethereum-rpc.publicnode.com', nativeSymbol: 'ETH', nativeAssetId: 'ethereum', coreTokens: mainnetCoreTokens },
  '0x2105': { explorer: 'https://base.blockscout.com', rpc: 'https://mainnet.base.org', nativeSymbol: 'ETH', nativeAssetId: 'ethereum', coreTokens: baseCoreTokens },
  '0xa': { explorer: 'https://optimism.blockscout.com', rpc: 'https://mainnet.optimism.io', nativeSymbol: 'ETH', nativeAssetId: 'ethereum', coreTokens: optimismCoreTokens },
  '0xa4b1': { explorer: 'https://arbitrum.blockscout.com', rpc: 'https://arb1.arbitrum.io/rpc', nativeSymbol: 'ETH', nativeAssetId: 'ethereum', coreTokens: arbitrumCoreTokens },
  '0x89': { explorer: 'https://polygon.blockscout.com', rpc: 'https://polygon-bor-rpc.publicnode.com', nativeSymbol: 'POL', nativeAssetId: 'matic-network', coreTokens: polygonCoreTokens },
  '0x38': { rpc: 'https://bsc-rpc.publicnode.com', nativeSymbol: 'BNB', nativeAssetId: 'binancecoin', coreTokens: bscCoreTokens },
}

function finiteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function decimalQuantity(value: string, decimals: string) {
  const places = Math.max(0, Math.min(36, Number.parseInt(decimals || '0', 10) || 0))
  const raw = BigInt(value || '0')
  const divisor = 10n ** BigInt(places)
  const whole = raw / divisor
  const remainder = raw % divisor
  return Number(whole) + Number(remainder) / Number(divisor)
}

async function fetchJson<T>(url: string, timeoutMs = 4_500) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Indexer returned ${response.status}`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timer)
  }
}

async function rpcRequest(
  config: ChainConfig,
  provider: InjectedWalletProvider | undefined,
  method: string,
  params: unknown[],
) {
  if (provider) {
    try {
      return await provider.request({ method, params })
    } catch {
      // Public RPC keeps read-only scans working when a connected provider rejects a read.
    }
  }
  if (!config.rpc) throw new Error('No read-only RPC is configured for this network.')
  const response = await fetch(config.rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!response.ok) throw new Error(`Network RPC returned ${response.status}`)
  const result = await response.json() as { error?: { message?: string }; result?: unknown }
  if (result.error) throw new Error(result.error.message ?? 'Network RPC rejected the read.')
  return result.result
}

function balanceOfData(address: string) {
  return `0x70a08231${address.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`
}

async function scanCoreTokens(
  address: string,
  normalizedChainId: string,
  config: ChainConfig,
  assets: MarketAsset[],
  provider?: InjectedWalletProvider,
) {
  const observedAt = new Date().toISOString()
  const results = await Promise.allSettled((config.coreTokens ?? []).map(async (token): Promise<WalletHolding | null> => {
    const value = await rpcRequest(config, provider, 'eth_call', [{ to: token.address, data: balanceOfData(address) }, 'latest'])
    if (typeof value !== 'string' || value === '0x') return null
    const quantity = decimalQuantity(value, String(token.decimals))
    if (quantity <= 0) return null
    const marketAsset = assets.find((asset) => asset.id === token.marketAssetId)
      ?? assets.find((asset) => asset.symbol.toUpperCase() === token.symbol.toUpperCase())
    const priceUsd = marketAsset?.price ?? 0
    return {
      id: `${normalizedChainId}:${token.address.toLowerCase()}`,
      chainId: normalizedChainId,
      chain: chainName(normalizedChainId),
      symbol: token.symbol,
      name: token.name,
      quantity,
      priceUsd,
      valueUsd: quantity * priceUsd,
      image: marketAsset?.image,
      contractAddress: token.address,
      isNative: false,
      tradeable: Boolean(marketAsset),
      source: 'wallet-rpc',
      observedAt,
    }
  }))
  return results.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : [])
}

export async function scanConnectedWallet(
  address: string,
  chainId: string,
  assets: MarketAsset[],
  connectedProvider?: InjectedWalletProvider,
): Promise<WalletHolding[]> {
  const normalizedChainId = chainId.toLowerCase()
  const config = chainConfig[normalizedChainId] ?? { nativeSymbol: 'NATIVE', nativeAssetId: '' }
  const observedAt = new Date().toISOString()
  let nativeBalance = 0
  let nativeBalanceSource: WalletHolding['source'] = 'wallet-rpc'
  const nativeAsset = assets.find((asset) => asset.id === config.nativeAssetId || asset.symbol === config.nativeSymbol)
  let nativePrice = nativeAsset?.price ?? 0
  let tokenBalances: BlockscoutTokenBalance[] = []

  const provider = connectedProvider ?? getInjectedWallet()
  const nativeRpcResult = await Promise.allSettled([
    provider
      ? readNativeBalance(address, provider)
      : rpcRequest(config, undefined, 'eth_getBalance', [address, 'latest']).then((value) => {
          if (typeof value !== 'string') throw new Error('Network RPC returned an invalid balance.')
          return decimalQuantity(value, '18')
        }),
  ])
  if (nativeRpcResult[0]?.status === 'fulfilled') nativeBalance = nativeRpcResult[0].value

  if (config.explorer) {
    const [addressResult, tokenResult] = await Promise.allSettled([
      fetchJson<BlockscoutAddress>(`${config.explorer}/api/v2/addresses/${address}`),
      fetchJson<BlockscoutTokenBalance[]>(`${config.explorer}/api/v2/addresses/${address}/token-balances`),
    ])
    if (addressResult.status === 'fulfilled') {
      nativePrice = finiteNumber(addressResult.value.exchange_rate, nativePrice)
      if (addressResult.value.coin_balance) {
        nativeBalance = decimalQuantity(addressResult.value.coin_balance, '18')
        nativeBalanceSource = 'blockscout'
      }
    }
    if (tokenResult.status === 'fulfilled') tokenBalances = tokenResult.value
  }

  const nativeHolding: WalletHolding = {
    id: `${normalizedChainId}:native`,
    chainId: normalizedChainId,
    chain: chainName(normalizedChainId),
    symbol: config.nativeSymbol,
    name: nativeAsset?.name ?? `${chainName(normalizedChainId)} native asset`,
    quantity: nativeBalance,
    priceUsd: nativePrice,
    valueUsd: nativeBalance * nativePrice,
    image: nativeAsset?.image,
    isNative: true,
    tradeable: Boolean(nativeAsset),
    source: nativeBalanceSource,
    observedAt,
  }

  const erc20Holdings = tokenBalances
    .filter((entry) => entry.token?.type === 'ERC-20' && entry.token.symbol && entry.token.decimals && entry.value)
    .map((entry): WalletHolding | null => {
      const token = entry.token!
      const quantity = decimalQuantity(entry.value!, token.decimals!)
      if (quantity <= 0) return null
      const marketAsset = assets.find((asset) => asset.symbol.toUpperCase() === token.symbol!.toUpperCase())
      const priceUsd = finiteNumber(token.exchange_rate, marketAsset?.price ?? 0)
      return {
        id: `${normalizedChainId}:${token.address_hash ?? token.symbol}`,
        chainId: normalizedChainId,
        chain: chainName(normalizedChainId),
        symbol: token.symbol!,
        name: token.name ?? token.symbol!,
        quantity,
        priceUsd,
        valueUsd: quantity * priceUsd,
        image: token.icon_url ?? marketAsset?.image,
        contractAddress: token.address_hash,
        isNative: false,
        tradeable: Boolean(marketAsset),
        source: 'blockscout',
        observedAt,
      }
    })
    .filter((holding): holding is WalletHolding => Boolean(holding))

  const rpcHoldings = await scanCoreTokens(address, normalizedChainId, config, assets, provider)

  const existingKeys = new Set(erc20Holdings.map((h) => (h.contractAddress ? h.contractAddress.toLowerCase() : h.symbol.toUpperCase())))
  const newRpcHoldings = rpcHoldings.filter((h) => !existingKeys.has(h.contractAddress ? h.contractAddress.toLowerCase() : h.symbol.toUpperCase()))

  return [nativeHolding, ...erc20Holdings, ...newRpcHoldings]
    .filter((holding) => holding.quantity > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd)
}

export async function estimatePaperFee(input: {
  chainId: string
  nativePriceUsd: number
  action: 'swap' | 'transfer' | 'trade'
  amountUsd: number
}): Promise<PaperFeeQuote> {
  const wallet = getInjectedWallet()
  const gasUnits = input.action === 'transfer' ? 21_000 : input.action === 'swap' ? 185_000 : 145_000
  let gasPriceWei = 2_000_000_000n
  let mode: PaperFeeQuote['mode'] = 'fallback'

  if (wallet) {
    try {
      const value = await wallet.request({ method: 'eth_gasPrice' })
      if (typeof value === 'string') {
        gasPriceWei = BigInt(value)
        mode = 'live'
      }
    } catch {
      // The clearly labeled fallback is intentionally conservative.
    }
  }

  const nativeUnits = Number(gasPriceWei * BigInt(gasUnits)) / 1e18
  const networkFeeUsd = nativeUnits * Math.max(0, input.nativePriceUsd)
  const venueFeeUsd = input.amountUsd * 0.0018
  const slippageBps = input.action === 'transfer' ? 0 : 8
  return {
    chainId: input.chainId,
    gasPriceWei: gasPriceWei.toString(),
    gasUnits,
    nativeSymbol: chainConfig[input.chainId.toLowerCase()]?.nativeSymbol ?? 'NATIVE',
    nativePriceUsd: input.nativePriceUsd,
    networkFeeUsd,
    venueFeeUsd,
    slippageBps,
    totalEstimatedCostUsd: networkFeeUsd + venueFeeUsd + input.amountUsd * slippageBps / 10_000,
    mode,
    quotedAt: new Date().toISOString(),
  }
}
