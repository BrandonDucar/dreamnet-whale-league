import type { InjectedWalletProvider } from './wallet'
import type { AppKitNetwork } from '@reown/appkit-common'

export type ReownChoice = 'phantom' | 'metamask' | 'base' | 'walletConnect' | 'email'

export type ReownConnection = {
  address: string
  chainId: string
  provider: InjectedWalletProvider
  providerType?: string
}

let appKitPromise: ReturnType<typeof initializeAppKit> | null = null

export function hasReownProject() {
  return Boolean(import.meta.env.VITE_REOWN_PROJECT_ID)
}

async function initializeAppKit() {
  const projectId = import.meta.env.VITE_REOWN_PROJECT_ID
  if (!projectId) {
    throw new Error('WalletConnect and email login need the app Reown project ID before they can open.')
  }

  const [{ createAppKit }, { EthersAdapter }, networks, { createAppKitWalletButton }] = await Promise.all([
    import('@reown/appkit'),
    import('@reown/appkit-adapter-ethers'),
    import('@reown/appkit/networks'),
    import('@reown/appkit-wallet-button'),
  ])

  const supportedNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
    networks.base,
    networks.mainnet,
    networks.polygon,
    networks.arbitrum,
    networks.optimism,
    networks.bsc,
  ]

  const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    defaultNetwork: networks.base,
    features: {
      analytics: true,
      email: true,
      emailShowWallets: true,
      socials: [],
      swaps: false,
      onramp: false,
    },
    metadata: {
      name: 'Whale Intelligence League',
      description: 'Paper trading intelligence and player-versus-player market competition.',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
    networks: supportedNetworks,
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#19d3c5',
      '--w3m-border-radius-master': '2px',
    },
  })

  const walletButton = createAppKitWalletButton({ namespace: 'eip155' })
  return { appKit, walletButton }
}

async function getAppKit() {
  appKitPromise ??= initializeAppKit()
  return appKitPromise
}

export async function openReown(choice: ReownChoice) {
  const { appKit, walletButton } = await getAppKit()
  if (choice === 'email') {
    await appKit.open({ namespace: 'eip155', view: 'Connect' })
    return
  }

  const walletName = choice === 'base' ? 'coinbase' : choice
  if (!walletButton.isReady()) {
    await appKit.open({ namespace: 'eip155', view: choice === 'walletConnect' ? 'Connect' : 'AllWallets' })
    return
  }
  await walletButton.connect(walletName)
}

export async function subscribeReownConnection(listener: (connection: ReownConnection) => void) {
  if (!hasReownProject()) return () => undefined
  const { appKit } = await getAppKit()
  return appKit.subscribeProviders((providers) => {
    const provider = providers.eip155
    const address = appKit.getAddress('eip155')
    const chain = appKit.getChainId()
    if (!provider || !address) return
    const numericChainId = typeof chain === 'number'
      ? chain
      : Number.parseInt(String(chain).replace('eip155:', ''), 10)
    listener({
      address,
      chainId: Number.isFinite(numericChainId) ? `0x${numericChainId.toString(16)}` : '0x2105',
      provider: provider as InjectedWalletProvider,
      providerType: appKit.getWalletProviderType(),
    })
  })
}
