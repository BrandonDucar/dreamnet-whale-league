import type { MarketAsset, PaperFeeQuote, WalletHolding } from './types'
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
  exchange_rate?: string
}

const chainConfig: Record<string, { explorer?: string; nativeSymbol: string; nativeAssetId: string }> = {
  '0x1': { explorer: 'https://eth.blockscout.com', nativeSymbol: 'ETH', nativeAssetId: 'ethereum' },
  '0x2105': { explorer: 'https://base.blockscout.com', nativeSymbol: 'ETH', nativeAssetId: 'ethereum' },
  '0xa': { explorer: 'https://optimism.blockscout.com', nativeSymbol: 'ETH', nativeAssetId: 'ethereum' },
  '0xa4b1': { explorer: 'https://arbitrum.blockscout.com', nativeSymbol: 'ETH', nativeAssetId: 'ethereum' },
  '0x89': { explorer: 'https://polygon.blockscout.com', nativeSymbol: 'POL', nativeAssetId: 'matic-network' },
  '0x38': { nativeSymbol: 'BNB', nativeAssetId: 'binancecoin' },
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

export async function scanConnectedWallet(address: string, chainId: string, assets: MarketAsset[]): Promise<WalletHolding[]> {
  const normalizedChainId = chainId.toLowerCase()
  const config = chainConfig[normalizedChainId] ?? { nativeSymbol: 'NATIVE', nativeAssetId: '' }
  const observedAt = new Date().toISOString()
  const nativeBalance = await readNativeBalance(address)
  const nativeAsset = assets.find((asset) => asset.id === config.nativeAssetId || asset.symbol === config.nativeSymbol)
  let nativePrice = nativeAsset?.price ?? 0
  let tokenBalances: BlockscoutTokenBalance[] = []

  if (config.explorer) {
    const [addressResult, tokenResult] = await Promise.allSettled([
      fetch(`${config.explorer}/api/v2/addresses/${address}`).then((response) => {
        if (!response.ok) throw new Error(`Address indexer returned ${response.status}`)
        return response.json() as Promise<BlockscoutAddress>
      }),
      fetch(`${config.explorer}/api/v2/addresses/${address}/token-balances`).then((response) => {
        if (!response.ok) throw new Error(`Token indexer returned ${response.status}`)
        return response.json() as Promise<BlockscoutTokenBalance[]>
      }),
    ])
    if (addressResult.status === 'fulfilled') nativePrice = finiteNumber(addressResult.value.exchange_rate, nativePrice)
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
    source: 'wallet-rpc',
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

  return [nativeHolding, ...erc20Holdings]
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
