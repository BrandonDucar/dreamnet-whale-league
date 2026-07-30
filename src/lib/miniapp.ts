import type { FarcasterIdentity } from './farcaster'
import type { InjectedWalletProvider } from './wallet'

const SDK_TIMEOUT_MS = 3_000

async function loadSdk() {
  return (await import('@farcaster/miniapp-sdk')).sdk
}

function hasMiniAppLaunchHint() {
  const url = new URL(window.location.href)
  return (
    url.searchParams.get('miniApp') === 'true'
    || window.self !== window.top
    || 'ReactNativeWebView' in window
  )
}

export type FarcasterMiniAppRuntime = {
  added: boolean
  capabilities: string[]
  chains: string[]
  identity: FarcasterIdentity
  inMiniApp: true
  walletProvider?: InjectedWalletProvider
}

export type WebRuntime = {
  added: false
  capabilities: string[]
  chains: string[]
  identity?: never
  inMiniApp: false
  walletProvider?: never
}

export type MiniAppRuntime = FarcasterMiniAppRuntime | WebRuntime

async function within<T>(promise: Promise<T>, fallback: T, timeoutMs = SDK_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } catch {
    return fallback
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function applySafeArea(insets?: { top: number; right: number; bottom: number; left: number }) {
  if (!insets) return
  const root = document.documentElement
  root.style.setProperty('--miniapp-safe-top', `${insets.top}px`)
  root.style.setProperty('--miniapp-safe-right', `${insets.right}px`)
  root.style.setProperty('--miniapp-safe-bottom', `${insets.bottom}px`)
  root.style.setProperty('--miniapp-safe-left', `${insets.left}px`)
}

export async function initializeMiniApp(): Promise<MiniAppRuntime> {
  if (!hasMiniAppLaunchHint()) {
    return { added: false, capabilities: [], chains: [], inMiniApp: false }
  }

  const sdk = await loadSdk()
  const inMiniApp = await within(sdk.isInMiniApp(), false, 1_800)
  if (!inMiniApp) {
    return { added: false, capabilities: [], chains: [], inMiniApp: false }
  }

  const [context, capabilities, chains] = await Promise.all([
    within(sdk.context, null),
    within(sdk.getCapabilities(), [] as string[]),
    within(sdk.getChains(), [] as string[]),
  ])

  try {
    await within(sdk.actions.ready({ disableNativeGestures: false }), undefined)
  } catch {
    // The normal web app still remains usable if a host does not complete ready().
  }

  if (!context?.user?.fid) {
    return { added: false, capabilities: [], chains: [], inMiniApp: false }
  }

  applySafeArea(context.client.safeAreaInsets)
  document.documentElement.dataset.miniapp = 'true'

  const supportsWallet = capabilities.includes('wallet.getEthereumProvider')
  const walletProvider = supportsWallet
    ? await within(sdk.wallet.getEthereumProvider(), undefined)
    : undefined

  return {
    added: context.client.added,
    capabilities,
    chains,
    identity: {
      authMethod: 'farcaster',
      displayName: context.user.displayName ?? context.user.username ?? `FID ${context.user.fid}`,
      fid: context.user.fid,
      pfpUrl: context.user.pfpUrl,
      username: context.user.username ?? `fid-${context.user.fid}`,
      verification: 'miniapp-context',
      verifiedAddresses: [],
    },
    inMiniApp: true,
    walletProvider: walletProvider as InjectedWalletProvider | undefined,
  }
}

export async function addWhaleLeagueMiniApp() {
  const sdk = await loadSdk()
  return within(sdk.actions.addMiniApp(), undefined)
}

export async function shareWhaleLeague(url = window.location.origin) {
  const sdk = await loadSdk()
  return within(
    sdk.actions.composeCast({
      text: 'I opened a paper trading desk in Whale Intelligence League. Live market data, player battles, and receipted simulation. No live funds during beta.',
      embeds: [url],
    }),
    undefined,
  )
}

export async function shareFounderCupInvite(url: string) {
  const sdk = await loadSdk()
  return within(
    sdk.actions.composeCast({
      text: 'Join my paper-trading desk in the Whale League Founder Cup. Live market data, player battles, and receipted simulation. No live funds during beta.',
      embeds: [url],
    }),
    undefined,
  )
}

export async function miniAppSelectionHaptic(capabilities: string[]) {
  if (!capabilities.includes('haptics.selectionChanged')) return
  const sdk = await loadSdk()
  await within(sdk.haptics.selectionChanged(), undefined, 1_200)
}
