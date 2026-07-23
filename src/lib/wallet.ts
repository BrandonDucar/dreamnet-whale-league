export type InjectedWalletProvider = {
  request: (input: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: 'accountsChanged' | 'chainChanged', listener: (value: unknown) => void) => void
  removeListener?: (event: 'accountsChanged' | 'chainChanged', listener: (value: unknown) => void) => void
}

export type DiscoveredWallet = {
  id: string
  name: string
  icon?: string
  provider: InjectedWalletProvider
}

type Eip6963ProviderDetail = {
  info: {
    icon?: string
    name: string
    rdns: string
    uuid: string
  }
  provider: InjectedWalletProvider
}

function provider() {
  return (window as Window & { ethereum?: InjectedWalletProvider }).ethereum
}

export function getInjectedWallet() {
  return provider()
}

export async function discoverInjectedWallets(waitMs = 180) {
  const wallets = new Map<string, DiscoveredWallet>()

  const announce = (event: Event) => {
    const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail
    if (!detail?.provider || !detail.info?.name) return
    const id = detail.info.rdns || detail.info.uuid
    wallets.set(id, {
      id,
      name: detail.info.name,
      icon: detail.info.icon,
      provider: detail.provider,
    })
  }

  window.addEventListener('eip6963:announceProvider', announce)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  await new Promise((resolve) => window.setTimeout(resolve, waitMs))
  window.removeEventListener('eip6963:announceProvider', announce)

  const legacy = provider()
  if (legacy && ![...wallets.values()].some((wallet) => wallet.provider === legacy)) {
    wallets.set('injected-wallet', {
      id: 'injected-wallet',
      name: 'Browser wallet',
      provider: legacy,
    })
  }

  return [...wallets.values()]
}

export async function readInjectedWallet() {
  const wallet = provider()
  if (!wallet) return { address: '', chainId: '' }

  const [accounts, chainId] = await Promise.all([
    wallet.request({ method: 'eth_accounts' }) as Promise<string[]>,
    wallet.request({ method: 'eth_chainId' }) as Promise<string>,
  ])
  return { address: accounts[0] ?? '', chainId }
}

export async function connectInjectedWallet(selectedProvider?: InjectedWalletProvider) {
  const wallet = selectedProvider ?? provider()
  if (!wallet) throw new Error('No injected EVM wallet was found in this browser.')

  const [accounts, chainId] = await Promise.all([
    wallet.request({ method: 'eth_requestAccounts' }) as Promise<string[]>,
    wallet.request({ method: 'eth_chainId' }) as Promise<string>,
  ])
  if (!accounts[0]) throw new Error('The wallet did not return an account.')
  return { address: accounts[0], chainId }
}

export async function readNativeBalance(address: string) {
  const wallet = provider()
  if (!wallet) throw new Error('No injected EVM wallet was found in this browser.')
  const result = await wallet.request({ method: 'eth_getBalance', params: [address, 'latest'] })
  if (typeof result !== 'string') throw new Error('The wallet returned an invalid balance.')
  return Number(BigInt(result)) / 1e18
}

export function chainName(chainId: string) {
  const names: Record<string, string> = {
    '0x1': 'Ethereum',
    '0x2105': 'Base',
    '0x38': 'BNB Chain',
    '0x89': 'Polygon',
    '0xa4b1': 'Arbitrum',
    '0xa': 'Optimism',
  }
  return names[chainId.toLowerCase()] ?? `Chain ${Number.parseInt(chainId, 16) || chainId}`
}

export function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
}
