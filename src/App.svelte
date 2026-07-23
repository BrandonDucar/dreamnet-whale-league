<script lang="ts">
  import {
    Activity,
    ArrowDownUp,
    BarChart3,
    Bot,
    Check,
    ChevronDown,
    CircleHelp,
    Copy,
    Crosshair,
    FileCheck2,
    Gauge,
    Info,
    Layers3,
    LayoutGrid,
    ListFilter,
    LockKeyhole,
    LogIn,
    Mail,
    Radio,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Swords,
    TrendingDown,
    TrendingUp,
    UserRound,
    WalletCards,
    X,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import MarketBubbles from './lib/MarketBubbles.svelte'
  import MarketTerminal from './lib/MarketTerminal.svelte'
  import PaperPortfolio from './lib/PaperPortfolio.svelte'
  import PortfolioSetup from './lib/PortfolioSetup.svelte'
  import PlayerArena from './lib/PlayerArena.svelte'
  import TraderGallery from './lib/TraderGallery.svelte'
  import Tutorial from './lib/Tutorial.svelte'
  import FarcasterIdentity from './lib/FarcasterIdentity.svelte'
  import WalletDialog from './lib/WalletDialog.svelte'
  import WhaleIntelligence from './lib/WhaleIntelligence.svelte'
  import { hasReownProject, openReown, subscribeReownConnection } from './lib/appkit'
  import type { ReownChoice, ReownConnection } from './lib/appkit'
  import type { FarcasterIdentity as FarcasterIdentityData } from './lib/farcaster'
  import { buildFallbackBook, buildFallbackChart, changeFor, fallbackAssets, fetchChart, fetchMarket, fetchOrderBook, formatPrice } from './lib/market'
  import { estimatePaperFee } from './lib/portfolio'
  import { chainName, connectInjectedWallet, getInjectedWallet, readInjectedWallet, shortAddress } from './lib/wallet'
  import type { InjectedWalletProvider } from './lib/wallet'
  import type { BattleReceipt, BubbleMetric, ChartPoint, MarketAsset, MarketWindow, Member, OrderBookLevel, PaperFeeQuote, PaperOrder, PaperOrderSide, PaperOrderType, PaperPosition, WalletHolding } from './lib/types'

  type DataStatus = 'loading' | 'live' | 'fallback'
  type Environment = 'markets' | 'desk' | 'research' | 'arena' | 'execute' | 'ledger'
  type ResearchView = 'sources' | 'whales'
  type Signal = {
    asset: MarketAsset
    label: 'BREAKOUT' | 'REVERSAL' | 'PRESSURE' | 'RANGE'
    direction: 'LONG BIAS' | 'SHORT BIAS' | 'WAIT'
    score: number
    thesis: string
    invalidation: string
  }

  const environments: Array<{ id: Environment; label: string; task: string; icon: typeof LayoutGrid }> = [
    { id: 'markets', label: 'Markets', task: 'Map + depth', icon: LayoutGrid },
    { id: 'desk', label: 'My Desk', task: 'Wallet + limits', icon: UserRound },
    { id: 'research', label: 'Research', task: 'Sources + whales', icon: Gauge },
    { id: 'arena', label: 'Arena', task: 'Player battles', icon: Swords },
    { id: 'execute', label: 'Paper Trade', task: 'Rehearse orders', icon: BarChart3 },
    { id: 'ledger', label: 'Ledger', task: 'Receipts + history', icon: FileCheck2 },
  ]

  let assets = fallbackAssets
  let dataStatus: DataStatus = 'loading'
  let marketWindow: MarketWindow = '24h'
  let bubbleMetric: BubbleMetric = 'marketCap'
  let selectedAssetId = 'bitcoin'
  let selectedAsset = assets[0]
  let chartDays = 7
  let chartPoints: ChartPoint[] = buildFallbackChart(selectedAsset, chartDays)
  let chartLoading = false
  let chartMode: 'live' | 'fallback' = 'fallback'
  let bids: OrderBookLevel[] = buildFallbackBook(selectedAsset).bids
  let asks: OrderBookLevel[] = buildFallbackBook(selectedAsset).asks
  let bookStatus: 'loading' | 'live' | 'fallback' = 'fallback'
  let member: Member | null = null
  let showJoin = false
  let showWallet = false
  let showTutorial = false
  let farcasterIdentity: FarcasterIdentityData | null = null
  let emailIdentityAddress = ''
  let reownIntent: 'identity-email' | 'wallet' | '' = ''
  let reownUnsubscribe: (() => void) | undefined
  let displayName = ''
  let teamName = ''
  let joinError = ''
  let paperBalance = 500
  let receipts: BattleReceipt[] = []
  let latestReceipt: BattleReceipt | null = null
  let copied = false
  let marketTimer: ReturnType<typeof setInterval> | null = null
  let bookTimer: ReturnType<typeof setInterval> | null = null
  let searchTerm = ''
  let ticketMode: 'trade' | 'swap' = 'trade'
  let orderType: PaperOrderType = 'market'
  let orderSide: PaperOrderSide = 'buy'
  let orderAmountUsd = 250
  let orderLimit = selectedAsset.price
  let orderStop = selectedAsset.price
  let orderTakeProfit = selectedAsset.price * 1.05
  let orderStopLoss = selectedAsset.price * 0.96
  let twapDuration = 30
  let paperOrders: PaperOrder[] = []
  let swapToId = 'usd-coin'
  let swapFromAmount = 0.1
  let swapNetwork = 'Base'
  let swapSlippage = 0.5
  let walletAddress = ''
  let walletChainId = ''
  let walletMode: 'connected' | 'watch' | '' = ''
  let walletNotice = ''
  let walletHoldings: WalletHolding[] = []
  let paperPositions: PaperPosition[] = []
  let paperStartingValue = 500
  let portfolioWalletAddress = ''
  let latestFeeQuote: PaperFeeQuote | null = null
  let activeEnvironment: Environment = 'markets'
  let researchView: ResearchView = 'sources'
  const reownConfigured = hasReownProject()

  $: selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0]
  $: marketChange = changeFor(selectedAsset, marketWindow)
  $: marketBreadth = assets.filter((asset) => changeFor(asset, marketWindow) > 0).length / Math.max(assets.length, 1)
  $: marketMood = marketBreadth >= 0.68 ? 'RISK ON' : marketBreadth <= 0.38 ? 'RISK OFF' : 'MIXED TAPE'
  $: signals = assets
    .filter((asset) => !['USDT', 'USDC'].includes(asset.symbol))
    .map(buildSignal)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
  $: filteredAssets = searchTerm.trim()
    ? assets.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : assets
  $: benchmarkSignal = signals[0]
  $: swapToAsset = assets.find((asset) => asset.id === swapToId) ?? assets.find((asset) => asset.symbol === 'USDC') ?? assets[1]
  $: swapQuote = swapToAsset.price > 0 ? (swapFromAmount * selectedAsset.price * 0.9982) / swapToAsset.price : 0
  $: activeEnvironmentMeta = environments.find((environment) => environment.id === activeEnvironment) ?? environments[0]

  onMount(() => {
    const savedMember = localStorage.getItem('whale-league-member')
    const savedReceipts = localStorage.getItem('whale-player-battle-receipts-v2')
    const savedOrders = localStorage.getItem('whale-league-paper-orders')
    const savedPortfolio = localStorage.getItem('whale-league-paper-portfolio-v1')
    const savedWalletSelection = localStorage.getItem('whale-wallet-selection-v1')
    if (savedMember) member = JSON.parse(savedMember) as Member
    if (savedReceipts) {
      receipts = JSON.parse(savedReceipts) as BattleReceipt[]
      latestReceipt = receipts[0] ?? null
    }
    if (savedOrders) paperOrders = JSON.parse(savedOrders) as PaperOrder[]
    if (savedPortfolio) {
      try {
        const snapshot = JSON.parse(savedPortfolio) as {
          walletAddress?: string
          cash?: number
          startingValue?: number
          holdings?: WalletHolding[]
          positions?: PaperPosition[]
        }
        portfolioWalletAddress = snapshot.walletAddress ?? ''
        paperBalance = Number.isFinite(snapshot.cash) ? Number(snapshot.cash) : 500
        paperStartingValue = Number.isFinite(snapshot.startingValue) ? Number(snapshot.startingValue) : 500
        walletHoldings = snapshot.holdings ?? []
        paperPositions = snapshot.positions ?? []
      } catch {
        localStorage.removeItem('whale-league-paper-portfolio-v1')
      }
    }
    if (savedWalletSelection) {
      try {
        const selection = JSON.parse(savedWalletSelection) as { address?: string; chainId?: string; mode?: 'connected' | 'watch' }
        if (selection.address && selection.chainId && /^0x[a-fA-F0-9]{40}$/.test(selection.address)) {
          walletAddress = selection.address
          walletChainId = selection.chainId
          walletMode = selection.mode ?? 'watch'
        }
      } catch {
        localStorage.removeItem('whale-wallet-selection-v1')
      }
    }
    if (!localStorage.getItem('whale-guided-tour-v3')) showTutorial = true

    const wallet = getInjectedWallet()
    const onAccountsChanged = (value: unknown) => {
      const accounts = Array.isArray(value) ? value as string[] : []
      const nextAddress = accounts[0] ?? ''
      syncPortfolioWallet(nextAddress)
      walletAddress = nextAddress
      walletMode = nextAddress ? 'connected' : ''
      persistWalletSelection()
      walletNotice = walletAddress ? `Wallet connected: ${shortAddress(walletAddress)}` : 'Wallet disconnected.'
    }
    const onChainChanged = (value: unknown) => {
      walletChainId = typeof value === 'string' ? value : ''
      walletNotice = walletChainId ? `Network changed to ${chainName(walletChainId)}.` : ''
    }
    if (walletMode !== 'watch') {
      void readInjectedWallet().then((connection) => {
        if (!connection.address) {
          if (walletMode === 'connected' && walletAddress) {
            walletMode = 'watch'
            persistWalletSelection()
          }
          return
        }
        syncPortfolioWallet(connection.address)
        walletAddress = connection.address
        walletChainId = connection.chainId
        walletMode = 'connected'
        persistWalletSelection()
      }).catch(() => undefined)
    }
    wallet?.on?.('accountsChanged', onAccountsChanged)
    wallet?.on?.('chainChanged', onChainChanged)
    if (reownConfigured) {
      void subscribeReownConnection(handleReownConnection).then((unsubscribe) => {
        reownUnsubscribe = unsubscribe
      }).catch(() => undefined)
    }

    void refreshMarket()
    void loadChart(selectedAsset)
    void loadDepth(selectedAsset)
    marketTimer = setInterval(() => void refreshMarket(), 60_000)
    bookTimer = setInterval(() => void loadDepth(selectedAsset), 12_000)
    return () => {
      if (marketTimer) clearInterval(marketTimer)
      if (bookTimer) clearInterval(bookTimer)
      wallet?.removeListener?.('accountsChanged', onAccountsChanged)
      wallet?.removeListener?.('chainChanged', onChainChanged)
      reownUnsubscribe?.()
    }
  })

  function buildSignal(asset: MarketAsset): Signal {
    const momentum = asset.change1h * 0.2 + asset.change24h * 0.55 + asset.change7d * 0.25
    const liquidityBoost = Math.min(12, Math.log10(Math.max(asset.volume, 1)) * 1.2)
    const score = Math.max(42, Math.min(97, Math.round(58 + Math.abs(momentum) * 3.1 + liquidityBoost)))
    if (momentum > 3) {
      return { asset, label: 'BREAKOUT', direction: 'LONG BIAS', score, thesis: 'Positive multi-window momentum with liquid participation.', invalidation: '24h change loses zero and relative strength fades.' }
    }
    if (momentum < -3) {
      return { asset, label: 'PRESSURE', direction: 'SHORT BIAS', score, thesis: 'Downside momentum is aligned across the active windows.', invalidation: '1h momentum turns positive with expanding volume.' }
    }
    if (asset.change24h < -1.5 && asset.change7d > 1) {
      return { asset, label: 'REVERSAL', direction: 'WAIT', score, thesis: 'Short-term weakness sits inside a positive weekly structure.', invalidation: 'Weekly structure also turns negative.' }
    }
    return { asset, label: 'RANGE', direction: 'WAIT', score: Math.max(44, score - 12), thesis: 'No clean directional alignment yet.', invalidation: 'A decisive move outside the current mixed structure.' }
  }

  async function refreshMarket() {
    dataStatus = dataStatus === 'fallback' ? 'loading' : dataStatus
    try {
      const nextAssets = await fetchMarket()
      assets = nextAssets
      dataStatus = 'live'
      void processPaperOrders(nextAssets)
    } catch {
      assets = fallbackAssets
      dataStatus = 'fallback'
    }
  }

  async function loadChart(asset: MarketAsset, days = chartDays) {
    chartLoading = true
    chartPoints = buildFallbackChart(asset, days)
    chartMode = 'fallback'
    try {
      chartPoints = await fetchChart(asset, days)
      chartMode = 'live'
    } catch {
      chartPoints = buildFallbackChart(asset, days)
      chartMode = 'fallback'
    } finally {
      chartLoading = false
    }
  }

  async function loadDepth(asset: MarketAsset) {
    const fallback = buildFallbackBook(asset)
    bids = fallback.bids
    asks = fallback.asks
    bookStatus = 'loading'
    try {
      const book = await fetchOrderBook(asset)
      bids = book.bids
      asks = book.asks
      bookStatus = 'live'
    } catch {
      bookStatus = 'fallback'
    }
  }

  function selectAsset(asset: MarketAsset) {
    selectedAssetId = asset.id
    orderLimit = asset.price
    orderStop = asset.price
    orderTakeProfit = asset.price * 1.05
    orderStopLoss = asset.price * 0.96
    void loadChart(asset)
    void loadDepth(asset)
  }

  function setChartDays(days: number) {
    chartDays = days
    void loadChart(selectedAsset, days)
  }

  function joinLeague() {
    joinError = ''
    if (!farcasterIdentity && !emailIdentityAddress) {
      joinError = 'Continue with Farcaster or email before creating the desk.'
      return
    }
    if ((!farcasterIdentity && displayName.trim().length < 2) || teamName.trim().length < 2) {
      joinError = 'Enter your name and a paper desk name.'
      return
    }
    const identityName = farcasterIdentity?.displayName ?? displayName.trim()
    member = {
      authMethod: farcasterIdentity ? 'farcaster' : 'email',
      displayName: identityName,
      fid: farcasterIdentity?.fid,
      joinedAt: new Date().toISOString(),
      pfpUrl: farcasterIdentity?.pfpUrl,
      teamName: teamName.trim(),
      username: farcasterIdentity?.username,
    }
    localStorage.setItem('whale-league-member', JSON.stringify(member))
    showJoin = false
    activeEnvironment = 'desk'
    walletNotice = `${member.teamName} is ready with 500 FKUSDC. Attach a wallet or build your paper plan next.`
    window.setTimeout(() => {
      if (!walletAddress) showWallet = true
    }, 180)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function setFarcasterIdentity(identity: FarcasterIdentityData) {
    farcasterIdentity = identity
    emailIdentityAddress = ''
    displayName = identity.displayName
    if (!teamName.trim()) teamName = `${identity.username}'s desk`
    joinError = ''
  }

  async function startEmailIdentity() {
    reownIntent = 'identity-email'
    joinError = ''
    try {
      await openReown('email')
    } catch (error) {
      reownIntent = ''
      joinError = error instanceof Error ? error.message : 'Email login failed to open.'
    }
  }

  function recordBattleReceipt(receipt: BattleReceipt) {
    latestReceipt = receipt
    receipts = [receipt, ...receipts].slice(0, 12)
    paperBalance = Number((paperBalance + receipt.hostHypotheticalPnl).toFixed(2))
    localStorage.setItem('whale-player-battle-receipts-v2', JSON.stringify(receipts))
    persistPaperPortfolio()
  }

  function closeTutorial(completed: boolean) {
    showTutorial = false
    localStorage.setItem('whale-guided-tour-v3', completed ? 'completed' : 'dismissed')
  }

  function navigateEnvironment(environment: Environment) {
    activeEnvironment = environment
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function navigateTutorial(environment: Environment, view?: ResearchView) {
    activeEnvironment = environment
    if (view) researchView = view
  }

  function openTutorial() {
    activeEnvironment = 'markets'
    showTutorial = true
  }

  function persistPaperPortfolio() {
    localStorage.setItem('whale-league-paper-portfolio-v1', JSON.stringify({
      walletAddress: portfolioWalletAddress,
      cash: paperBalance,
      startingValue: paperStartingValue,
      holdings: walletHoldings,
      positions: paperPositions,
      updatedAt: new Date().toISOString(),
    }))
  }

  function persistWalletSelection() {
    if (!walletAddress || !walletChainId || !walletMode) {
      localStorage.removeItem('whale-wallet-selection-v1')
      return
    }
    localStorage.setItem('whale-wallet-selection-v1', JSON.stringify({
      address: walletAddress,
      chainId: walletChainId,
      mode: walletMode,
      updatedAt: new Date().toISOString(),
    }))
  }

  function syncPortfolioWallet(nextAddress: string) {
    if (!nextAddress || !portfolioWalletAddress || nextAddress.toLowerCase() === portfolioWalletAddress.toLowerCase()) return
    portfolioWalletAddress = nextAddress
    walletHoldings = []
    paperPositions = []
    paperBalance = 500
    paperStartingValue = 500
    latestFeeQuote = null
    persistPaperPortfolio()
  }

  function handleHoldings(holdings: WalletHolding[]) {
    walletHoldings = holdings
    portfolioWalletAddress = walletAddress
    paperBalance = 500
    paperPositions = holdings.map((holding) => {
      const marketAsset = assets.find((asset) => asset.symbol.toUpperCase() === holding.symbol.toUpperCase())
      return {
        id: holding.id,
        assetId: marketAsset?.id ?? holding.id,
        chainId: holding.chainId,
        chain: holding.chain,
        symbol: holding.symbol,
        name: holding.name,
        initialQuantity: holding.quantity,
        quantity: holding.quantity,
        averageCostUsd: holding.priceUsd,
        image: holding.image,
        source: 'wallet-snapshot',
      }
    })
    paperStartingValue = Number((500 + holdings.reduce((sum, holding) => sum + holding.valueUsd, 0)).toFixed(2))
    persistPaperPortfolio()
    walletNotice = `Paper portfolio reset from ${holdings.length} read-only holding${holdings.length === 1 ? '' : 's'} plus 500 FKUSDC.`
  }

  function livePositionPrice(position: PaperPosition) {
    return assets.find((asset) => asset.id === position.assetId || asset.symbol === position.symbol)?.price ?? position.averageCostUsd
  }

  async function settlePaperTrade(asset: MarketAsset, side: PaperOrderSide, amountUsd: number) {
    const normalizedChainId = walletChainId.toLowerCase() || '0x2105'
    const nativePosition = paperPositions.find((position) => position.chainId === normalizedChainId && ['ETH', 'POL', 'BNB'].includes(position.symbol.toUpperCase()))
    const nativeMarketAsset = assets.find((candidate) => candidate.symbol.toUpperCase() === nativePosition?.symbol.toUpperCase())
      ?? assets.find((candidate) => candidate.symbol === 'ETH')
    const quote = await estimatePaperFee({
      chainId: normalizedChainId,
      nativePriceUsd: nativeMarketAsset?.price ?? nativePosition?.averageCostUsd ?? 0,
      action: 'trade',
      amountUsd,
    })
    latestFeeQuote = quote

    const slippageUsd = amountUsd * quote.slippageBps / 10_000
    const cashFee = quote.venueFeeUsd + slippageUsd
    const tradedQuantity = amountUsd / Math.max(asset.price, Number.EPSILON)
    const existing = paperPositions.find((position) => position.assetId === asset.id || position.symbol === asset.symbol)
    const gasQuantity = quote.networkFeeUsd > 0 && quote.nativePriceUsd > 0 ? quote.networkFeeUsd / quote.nativePriceUsd : 0

    if (gasQuantity > 0) {
      if (!nativePosition || quote.nativePriceUsd <= 0) {
        walletNotice = `Paper order blocked: the ${chainName(normalizedChainId)} snapshot has no ${quote.nativeSymbol} available for simulated gas.`
        return false
      }
      const requiredNative = gasQuantity + (side === 'sell' && existing?.id === nativePosition.id ? tradedQuantity : 0)
      if (nativePosition.quantity < requiredNative) {
        walletNotice = `Paper order blocked: simulated ${quote.nativeSymbol} is below the live gas estimate.`
        return false
      }
    }

    if (side === 'buy') {
      const totalCash = amountUsd + cashFee
      if (paperBalance < totalCash) {
        walletNotice = `Paper order blocked: ${totalCash.toFixed(2)} FKUSDC is required after fees.`
        return false
      }
      paperBalance = Number((paperBalance - totalCash).toFixed(6))
      if (existing) {
        const quantityAfterGas = existing.quantity - (existing.id === nativePosition?.id ? gasQuantity : 0)
        const combinedQuantity = quantityAfterGas + tradedQuantity
        const averageCostUsd = combinedQuantity > 0
          ? (quantityAfterGas * existing.averageCostUsd + tradedQuantity * asset.price) / combinedQuantity
          : asset.price
        paperPositions = paperPositions.map((position) => {
          if (position.id === existing.id) return { ...position, quantity: combinedQuantity, averageCostUsd }
          if (position.id === nativePosition?.id) return { ...position, quantity: position.quantity - gasQuantity }
          return position
        })
      } else {
        paperPositions = [{
          id: `paper:${asset.id}`,
          assetId: asset.id,
          chainId: normalizedChainId,
          chain: chainName(normalizedChainId),
          symbol: asset.symbol,
          name: asset.name,
          initialQuantity: 0,
          quantity: tradedQuantity,
          averageCostUsd: asset.price,
          image: asset.image,
          source: 'paper-trade',
        }, ...paperPositions.map((position) => position.id === nativePosition?.id ? { ...position, quantity: position.quantity - gasQuantity } : position)]
      }
    } else {
      if (!existing || existing.quantity < tradedQuantity) {
        walletNotice = `Paper order blocked: the simulated portfolio does not hold enough ${asset.symbol}.`
        return false
      }
      paperPositions = paperPositions.map((position) => {
        let quantity = position.quantity
        if (position.id === existing.id) quantity -= tradedQuantity
        if (position.id === nativePosition?.id) quantity -= gasQuantity
        return quantity === position.quantity ? position : { ...position, quantity }
      })
      paperBalance = Number((paperBalance + amountUsd - cashFee).toFixed(6))
    }

    persistPaperPortfolio()
    walletNotice = `${side === 'buy' ? 'Bought' : 'Sold'} ${tradedQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${asset.symbol} in paper mode. Live funds moved: $0.`
    return true
  }

  async function settlePaperSwap() {
    const normalizedChainId = walletChainId.toLowerCase() || '0x2105'
    const amountUsd = swapFromAmount * selectedAsset.price
    const nativePosition = paperPositions.find((position) => position.chainId === normalizedChainId && ['ETH', 'POL', 'BNB'].includes(position.symbol.toUpperCase()))
    const nativeMarketAsset = assets.find((candidate) => candidate.symbol.toUpperCase() === nativePosition?.symbol.toUpperCase())
      ?? assets.find((candidate) => candidate.symbol === 'ETH')
    const quote = await estimatePaperFee({
      chainId: normalizedChainId,
      nativePriceUsd: nativeMarketAsset?.price ?? nativePosition?.averageCostUsd ?? 0,
      action: 'swap',
      amountUsd,
    })
    latestFeeQuote = quote

    const gasQuantity = quote.networkFeeUsd > 0 && quote.nativePriceUsd > 0 ? quote.networkFeeUsd / quote.nativePriceUsd : 0
    const sourceIsCash = selectedAsset.symbol === 'USDC'
    const destinationIsCash = swapToAsset.symbol === 'USDC'
    const sourcePosition = paperPositions.find((position) => position.assetId === selectedAsset.id || position.symbol === selectedAsset.symbol)
    const requiredNative = gasQuantity + (!sourceIsCash && sourcePosition?.id === nativePosition?.id ? swapFromAmount : 0)

    if (gasQuantity > 0 && (!nativePosition || nativePosition.quantity < requiredNative)) {
      walletNotice = `Paper swap blocked: simulated ${quote.nativeSymbol} is below the live gas estimate.`
      return false
    }
    if (sourceIsCash) {
      if (paperBalance < amountUsd) {
        walletNotice = 'Paper swap blocked: insufficient FKUSDC after estimated costs.'
        return false
      }
    } else if (!sourcePosition || sourcePosition.quantity < swapFromAmount) {
      walletNotice = `Paper swap blocked: the simulated portfolio does not hold enough ${selectedAsset.symbol}.`
      return false
    }

    const netDestinationUsd = Math.max(0, amountUsd - quote.venueFeeUsd - amountUsd * quote.slippageBps / 10_000)
    const destinationQuantity = netDestinationUsd / Math.max(swapToAsset.price, Number.EPSILON)
    paperPositions = paperPositions.map((position) => {
      let quantity = position.quantity
      if (!sourceIsCash && position.id === sourcePosition?.id) quantity -= swapFromAmount
      if (position.id === nativePosition?.id) quantity -= gasQuantity
      return quantity === position.quantity ? position : { ...position, quantity }
    })
    if (sourceIsCash) paperBalance = Number((paperBalance - amountUsd).toFixed(6))
    if (destinationIsCash) {
      paperBalance = Number((paperBalance + netDestinationUsd).toFixed(6))
    } else {
      const destination = paperPositions.find((position) => position.assetId === swapToAsset.id || position.symbol === swapToAsset.symbol)
      if (destination) {
        const combinedQuantity = destination.quantity + destinationQuantity
        const averageCostUsd = combinedQuantity > 0
          ? (destination.quantity * destination.averageCostUsd + destinationQuantity * swapToAsset.price) / combinedQuantity
          : swapToAsset.price
        paperPositions = paperPositions.map((position) => position.id === destination.id ? { ...position, quantity: combinedQuantity, averageCostUsd } : position)
      } else {
        paperPositions = [{
          id: `paper:${swapToAsset.id}`,
          assetId: swapToAsset.id,
          chainId: normalizedChainId,
          chain: chainName(normalizedChainId),
          symbol: swapToAsset.symbol,
          name: swapToAsset.name,
          initialQuantity: 0,
          quantity: destinationQuantity,
          averageCostUsd: swapToAsset.price,
          image: swapToAsset.image,
          source: 'paper-trade',
        }, ...paperPositions]
      }
    }

    persistPaperPortfolio()
    walletNotice = `Swapped ${swapFromAmount.toLocaleString()} ${selectedAsset.symbol} into ${destinationQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${swapToAsset.symbol} in paper mode.`
    return true
  }

  async function sha256(value: string) {
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  async function copyReceipt() {
    if (!latestReceipt) return
    await navigator.clipboard.writeText(`sha256:${latestReceipt.hash}`)
    copied = true
    setTimeout(() => (copied = false), 1600)
  }

  async function placePaperOrder() {
    if (!member) {
      showJoin = true
      return
    }
    const status: PaperOrder['status'] = orderType === 'market' || orderType === 'bracket' ? 'filled' : orderType === 'twap' ? 'scheduled' : 'open'
    const amountUsd = Math.max(25, Number(orderAmountUsd) || 25)
    let feeQuote: PaperFeeQuote | null = null
    if (status === 'filled') {
      const settled = await settlePaperTrade(selectedAsset, orderSide, amountUsd)
      if (!settled) return
      feeQuote = latestFeeQuote
    } else {
      const nativeAsset = assets.find((asset) => asset.symbol === 'ETH')
      feeQuote = await estimatePaperFee({
        chainId: walletChainId.toLowerCase() || '0x2105',
        nativePriceUsd: nativeAsset?.price ?? 0,
        action: 'trade',
        amountUsd,
      })
      latestFeeQuote = feeQuote
    }
    const unsigned: Omit<PaperOrder, 'hash'> = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      symbol: selectedAsset.symbol,
      assetId: selectedAsset.id,
      side: orderSide,
      type: orderType,
      amountUsd,
      referencePrice: selectedAsset.price,
      limitPrice: orderType === 'limit' || orderType === 'bracket' || orderType === 'twap' ? Number(orderLimit) : undefined,
      stopPrice: orderType === 'stop' ? Number(orderStop) : undefined,
      takeProfit: orderType === 'bracket' ? Number(orderTakeProfit) : undefined,
      stopLoss: orderType === 'bracket' ? Number(orderStopLoss) : undefined,
      durationMinutes: orderType === 'twap' ? Number(twapDuration) : undefined,
      status,
      fundsMoved: 0,
      estimatedFeeUsd: feeQuote?.totalEstimatedCostUsd,
      slippageBps: feeQuote?.slippageBps,
      settled: status === 'filled',
    }
    const order = { ...unsigned, hash: await sha256(JSON.stringify(unsigned)) }
    paperOrders = [order, ...paperOrders].slice(0, 20)
    localStorage.setItem('whale-league-paper-orders', JSON.stringify(paperOrders))
  }

  async function recordPaperSwap() {
    if (!member) {
      showJoin = true
      return
    }
    const settled = await settlePaperSwap()
    if (!settled) return
    const unsigned: Omit<PaperOrder, 'hash'> = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      symbol: selectedAsset.symbol,
      assetId: selectedAsset.id,
      side: 'sell',
      type: 'swap',
      amountUsd: Number((swapFromAmount * selectedAsset.price).toFixed(2)),
      referencePrice: selectedAsset.price,
      toSymbol: swapToAsset.symbol,
      quoteAmount: Number(swapQuote.toFixed(8)),
      network: swapNetwork,
      status: 'filled',
      fundsMoved: 0,
      estimatedFeeUsd: latestFeeQuote?.totalEstimatedCostUsd,
      slippageBps: latestFeeQuote?.slippageBps,
      settled: true,
    }
    const order = { ...unsigned, hash: await sha256(JSON.stringify(unsigned)) }
    paperOrders = [order, ...paperOrders].slice(0, 20)
    localStorage.setItem('whale-league-paper-orders', JSON.stringify(paperOrders))
  }

  async function processPaperOrders(nextAssets: MarketAsset[]) {
    let changed = false
    const nextOrders: PaperOrder[] = []
    for (const order of paperOrders) {
      if (order.status !== 'open') {
        nextOrders.push(order)
        continue
      }
      const asset = nextAssets.find((candidate) => candidate.id === order.assetId)
      if (!asset) {
        nextOrders.push(order)
        continue
      }
      const limitTriggered = order.type === 'limit' && order.limitPrice !== undefined && (order.side === 'buy' ? asset.price <= order.limitPrice : asset.price >= order.limitPrice)
      const stopTriggered = order.type === 'stop' && order.stopPrice !== undefined && (order.side === 'buy' ? asset.price >= order.stopPrice : asset.price <= order.stopPrice)
      if (!limitTriggered && !stopTriggered) {
        nextOrders.push(order)
        continue
      }
      const settled = await settlePaperTrade(asset, order.side, order.amountUsd)
      if (!settled) {
        nextOrders.push(order)
        continue
      }
      changed = true
      nextOrders.push({
        ...order,
        status: 'filled',
        settled: true,
        estimatedFeeUsd: latestFeeQuote?.totalEstimatedCostUsd ?? order.estimatedFeeUsd,
        slippageBps: latestFeeQuote?.slippageBps ?? order.slippageBps,
      })
    }
    paperOrders = nextOrders
    if (changed) localStorage.setItem('whale-league-paper-orders', JSON.stringify(nextOrders))
  }

  function cancelPaperOrder(id: string) {
    paperOrders = paperOrders.map((order) => order.id === id && (order.status === 'open' || order.status === 'scheduled') ? { ...order, status: 'cancelled' } : order)
    localStorage.setItem('whale-league-paper-orders', JSON.stringify(paperOrders))
  }

  function signOut() {
    member = null
    emailIdentityAddress = ''
    farcasterIdentity = null
    displayName = ''
    teamName = ''
    localStorage.removeItem('whale-league-member')
  }

  function handleReownConnection(connection: ReownConnection) {
    syncPortfolioWallet(connection.address)
    walletAddress = connection.address
    walletChainId = connection.chainId
    walletMode = 'connected'
    persistWalletSelection()

    if (reownIntent === 'identity-email') {
      emailIdentityAddress = connection.address
      farcasterIdentity = null
      if (!displayName.trim()) displayName = 'Email trader'
      if (!teamName.trim()) teamName = 'My trading desk'
      joinError = ''
      walletNotice = `Email identity verified with ${shortAddress(connection.address)}. Name your desk to continue.`
    } else {
      showWallet = false
      activeEnvironment = 'desk'
      walletNotice = `Connected ${shortAddress(connection.address)} on ${chainName(connection.chainId)}. Trading authority has not been granted.`
    }
    reownIntent = ''
  }

  async function connectExternalWallet(choice: ReownChoice) {
    reownIntent = 'wallet'
    try {
      await openReown(choice)
    } catch (error) {
      reownIntent = ''
      walletNotice = error instanceof Error ? error.message : 'Wallet connection failed to open.'
      throw error
    }
  }

  async function connectWallet(selectedProvider: InjectedWalletProvider) {
    try {
      const connection = await connectInjectedWallet(selectedProvider)
      syncPortfolioWallet(connection.address)
      walletAddress = connection.address
      walletChainId = connection.chainId
      walletMode = 'connected'
      persistWalletSelection()
      showWallet = false
      activeEnvironment = 'desk'
      walletNotice = `Connected ${shortAddress(walletAddress)} on ${chainName(walletChainId)}. Trading authority has not been granted.`
    } catch (error) {
      walletNotice = error instanceof Error ? error.message : 'Wallet connection failed.'
      throw error
    }
  }

  function watchWallet(address: string, chainId: string) {
    syncPortfolioWallet(address)
    walletAddress = address
    walletChainId = chainId
    walletMode = 'watch'
    persistWalletSelection()
    showWallet = false
    activeEnvironment = 'desk'
    walletNotice = `Watching ${shortAddress(address)} on ${chainName(chainId)}. No wallet connection or signing permission was requested.`
  }

</script>

<svelte:head>
  <title>Whale Intelligence League | Trading Intelligence Arena</title>
  <meta name="description" content="Explore live markets, follow source-linked traders, connect a wallet, and compete player-versus-player inside a receipted trading intelligence arena." />
</svelte:head>

<div class="terminal-shell">
  <header class="topbar">
    <a class="brand" href="#market" aria-label="Whale Intelligence League market home">
      <span class="brand-mark"><Activity size={18} strokeWidth={2.4} /></span>
      <span class="brand-copy"><strong>WHALE</strong><small>INTELLIGENCE LEAGUE</small></span>
    </a>

    <div class="pair-status desktop-only">
      <span class="pair-symbol">{selectedAsset.symbol} / USD</span>
      <strong>{formatPrice(selectedAsset.price)}</strong>
      <span class:positive={selectedAsset.change24h >= 0} class:negative={selectedAsset.change24h < 0}>
        {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
      </span>
    </div>

    <div class="top-actions">
      <span class="mode-badge"><ShieldCheck size={14} /> PAPER</span>
      <span class="feed-status" class:feed-live={dataStatus === 'live'}>
        <span></span>{dataStatus === 'live' ? 'LIVE FEED' : dataStatus === 'loading' ? 'SYNCING' : 'TEACHING FEED'}
      </span>
      <button class="wallet-button" class:connected={walletAddress} type="button" onclick={() => (showWallet = true)} title={walletAddress ? `${walletMode === 'watch' ? 'Watching' : 'Connected'} ${walletAddress} on ${chainName(walletChainId)}` : 'Attach a wallet to your paper desk'}>
        <WalletCards size={16} /><span>{walletAddress ? shortAddress(walletAddress) : 'Connect wallet'}</span>
      </button>
      {#if member}
        <button class="account-button" type="button" onclick={signOut} title="Sign out of paper league"><UserRound size={16} /><span>{member.username ? `@${member.username}` : member.displayName}</span></button>
      {:else}
        <button class="join-button" type="button" onclick={() => (showJoin = true)}><LogIn size={16} /> Sign in / Create desk</button>
      {/if}
    </div>
  </header>

  <div class="market-ticker" aria-label="Market ticker">
    <div class="ticker-track">
      {#each assets.slice(0, 12) as asset}
        <button type="button" onclick={() => selectAsset(asset)}>
          <strong>{asset.symbol}</strong>
          <span>{formatPrice(asset.price)}</span>
          <span class:positive={asset.change24h >= 0} class:negative={asset.change24h < 0}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
        </button>
      {/each}
    </div>
  </div>

  <nav class="environment-nav" aria-label="Whale League environments">
    {#each environments as environment}
      <button
        type="button"
        class:active={activeEnvironment === environment.id}
        aria-current={activeEnvironment === environment.id ? 'page' : undefined}
        onclick={() => navigateEnvironment(environment.id)}
      >
        <span class="environment-icon"><svelte:component this={environment.icon} size={17} /></span>
        <span><strong>{environment.label}</strong><small>{environment.task}</small></span>
      </button>
    {/each}
  </nav>

  <div class="environment-banner">
    <div>
      <span>{member ? member.teamName : 'ACTIVE ENVIRONMENT'}</span>
      <h1>{activeEnvironmentMeta.label}</h1>
    </div>
    <p>{activeEnvironmentMeta.task}</p>
    <span class="paper-boundary"><ShieldCheck size={13} /> Live prices · simulated execution</span>
    <button type="button" onclick={openTutorial}><CircleHelp size={15} /> Tour this workspace</button>
  </div>

  <div class:with-intelligence={activeEnvironment === 'execute'} class="workspace">

    <main class="market-workspace">
      {#if activeEnvironment === 'markets'}
      <section class="market-panel" id="market" aria-labelledby="market-title">
        <div class="panel-toolbar">
          <div class="panel-title"><Radio size={15} /><strong id="market-title">MARKET PULSE</strong><span>{marketMood}</span></div>
          <div class="search-box"><Search size={14} /><input bind:value={searchTerm} aria-label="Search market" placeholder="Search symbol" /></div>
          <div class="segmented" aria-label="Market change window">
            {#each ['1h', '24h', '7d'] as window}
              <button type="button" class:active={marketWindow === window} onclick={() => (marketWindow = window as MarketWindow)}>{window.toUpperCase()}</button>
            {/each}
          </div>
          <div class="metric-select">
            <ListFilter size={14} />
            <select bind:value={bubbleMetric} aria-label="Size bubbles by"><option value="marketCap">MARKET CAP</option><option value="volume">VOLUME</option></select>
            <ChevronDown size={13} />
          </div>
          <button class="icon-button" type="button" onclick={() => void refreshMarket()} title="Refresh market data"><RefreshCw size={15} class={dataStatus === 'loading' ? 'spinning' : ''} /></button>
        </div>
        <div class="market-canvas">
          <MarketBubbles assets={filteredAssets} selectedId={selectedAssetId} window={marketWindow} metric={bubbleMetric} onselect={selectAsset} />
        </div>
        <div class="market-legend"><span><i class="gain-dot"></i>Advancing</span><span><i class="loss-dot"></i>Declining</span><span>Bubble size: {bubbleMetric === 'marketCap' ? 'market cap' : '24h volume'}</span><span>{assets.length} instruments</span></div>
      </section>
      <MarketTerminal
        {selectedAsset}
        {marketChange}
        {chartDays}
        {chartPoints}
        {chartLoading}
        {chartMode}
        {bids}
        {asks}
        {bookStatus}
        ondayschange={setChartDays}
      />

      {:else if activeEnvironment === 'desk'}
      <section class="desk-home" id="desk-home" aria-labelledby="desk-home-title">
        {#if member}
          <div class="desk-identity">
            <span>YOUR ACTIVE PAPER DESK</span>
            <h2 id="desk-home-title">{member.teamName}</h2>
            <p>Everything for this desk is ready below. Start with your wallet snapshot, set the limits, then rehearse a trade.</p>
          </div>
          <div class="desk-status">
            <div><span>STARTER CASH</span><strong>${paperBalance.toFixed(2)} FKUSDC</strong></div>
            <div><span>WALLET</span><strong>{walletAddress ? `${walletMode === 'watch' ? 'WATCHING' : 'CONNECTED'} · ${shortAddress(walletAddress)}` : 'NOT ATTACHED'}</strong></div>
            <div><span>HOLDINGS</span><strong>{walletHoldings.length ? `${walletHoldings.length} IMPORTED` : 'READY TO SCAN'}</strong></div>
          </div>
          <div class="desk-next">
            <span>NEXT BEST ACTION</span>
            {#if !walletAddress}
              <button type="button" onclick={() => (showWallet = true)}><WalletCards size={15} /> Attach wallet <ChevronDown size={14} /></button>
            {:else if !walletHoldings.length}
              <a href="#portfolio"><Gauge size={15} /> Analyze holdings <ChevronDown size={14} /></a>
            {:else}
              <button type="button" onclick={() => navigateEnvironment('execute')}><BarChart3 size={15} /> Open paper trade <ChevronDown size={14} /></button>
            {/if}
          </div>
        {:else}
          <div class="desk-identity">
            <span>START HERE</span>
            <h2 id="desk-home-title">Create your first paper desk</h2>
            <p>Your desk keeps your practice balance, wallet snapshot, trading limits, orders, battles, and receipts together on this device.</p>
          </div>
          <div class="desk-preview">
            <span><strong>500 FKUSDC</strong><small>starter balance</small></span>
            <span><strong>READ ONLY</strong><small>wallet scan</small></span>
            <span><strong>LIVE DATA</strong><small>paper settlement</small></span>
          </div>
          <button class="create-desk-button" type="button" onclick={() => (showJoin = true)}><UserRound size={16} /> Create paper desk</button>
        {/if}
      </section>
      <PortfolioSetup {walletAddress} {walletChainId} {assets} initialHoldings={walletHoldings} onconnect={() => (showWallet = true)} onholdings={handleHoldings} />
      <PaperPortfolio
        {walletAddress}
        positions={paperPositions}
        {assets}
        fkUsdcBalance={paperBalance}
        startingValue={paperStartingValue}
        ontrade={() => navigateEnvironment('execute')}
      />

      {:else if activeEnvironment === 'research'}
      <div class="research-switcher" role="tablist" aria-label="Research views">
        <button type="button" role="tab" aria-selected={researchView === 'sources'} class:active={researchView === 'sources'} onclick={() => (researchView = 'sources')}><Radio size={14} /> Trader sources</button>
        <button type="button" role="tab" aria-selected={researchView === 'whales'} class:active={researchView === 'whales'} onclick={() => (researchView = 'whales')}><Gauge size={14} /> Whale signal lab</button>
      </div>
      {#if researchView === 'sources'}
        <TraderGallery {walletAddress} />
      {:else}
        <WhaleIntelligence />
      {/if}

      {:else if activeEnvironment === 'arena'}
      <PlayerArena
        {assets}
        {member}
        dataMode={dataStatus}
        maxStake={paperBalance}
        practiceAssetId={benchmarkSignal?.asset.id ?? 'bitcoin'}
        practiceDirection={benchmarkSignal?.direction === 'SHORT BIAS' ? 'short' : 'long'}
        onrequirejoin={() => (showJoin = true)}
        onreceipt={recordBattleReceipt}
      />

      {:else if activeEnvironment === 'execute'}
      <MarketTerminal
        {selectedAsset}
        {marketChange}
        {chartDays}
        {chartPoints}
        {chartLoading}
        {chartMode}
        {bids}
        {asks}
        {bookStatus}
        ondayschange={setChartDays}
      />

      {:else if activeEnvironment === 'ledger'}
      <section class="ledger-workspace" id="receipts" aria-labelledby="ledger-title">
        <div class="ledger-summary">
          <div><span>PAPER BALANCE</span><strong>${paperBalance.toFixed(2)}</strong></div>
          <div><span>BATTLE RECEIPTS</span><strong>{receipts.length}</strong></div>
          <div><span>PAPER ORDERS</span><strong>{paperOrders.length}</strong></div>
          <div><span>LIVE FUNDS MOVED</span><strong>$0.00</strong></div>
        </div>
        <div class="ledger-columns">
          <section>
            <div class="ledger-title"><FileCheck2 size={16} /><div><span>EVIDENCE</span><h2 id="ledger-title">Battle receipts</h2></div></div>
            {#if receipts.length}
              <div class="ledger-list">
                {#each receipts as receipt}
                  <article class="ledger-entry">
                    <div><span>{receipt.hostName} vs {receipt.opponentName}</span><strong>{receipt.winnerName} won</strong></div>
                    <p>{receipt.hostSymbol} {receipt.hostDirection.toUpperCase()} / {receipt.opponentSymbol} {receipt.opponentDirection.toUpperCase()}</p>
                    <code>sha256:{receipt.hash.slice(0, 20)}...{receipt.hash.slice(-10)}</code>
                  </article>
                {/each}
              </div>
            {:else}
              <div class="ledger-empty"><FileCheck2 size={22} /><strong>No completed battles yet</strong><span>Finish an Arena round to create the first local receipt.</span></div>
            {/if}
          </section>
          <section>
            <div class="ledger-title"><Layers3 size={16} /><div><span>ORDER HISTORY</span><h2>Paper orders</h2></div></div>
            {#if paperOrders.length}
              <div class="ledger-list">
                {#each paperOrders as order}
                  <article class="ledger-entry order-entry">
                    <div><span>{order.symbol}{order.toSymbol ? ` → ${order.toSymbol}` : ''}</span><strong class:positive={order.status === 'filled'} class:negative={order.status === 'cancelled'}>{order.status.toUpperCase()}</strong></div>
                    <p>{order.type.toUpperCase()} / {order.side.toUpperCase()} / ${order.amountUsd.toFixed(2)}{order.estimatedFeeUsd !== undefined ? ` / EST. COST $${order.estimatedFeeUsd.toFixed(4)}` : ''}</p>
                    <code>sha256:{order.hash.slice(0, 20)}...{order.hash.slice(-10)}</code>
                    {#if order.status === 'open' || order.status === 'scheduled'}<button type="button" onclick={() => cancelPaperOrder(order.id)}><X size={12} /> Cancel paper order</button>{/if}
                  </article>
                {/each}
              </div>
            {:else}
              <div class="ledger-empty"><Layers3 size={22} /><strong>No paper orders yet</strong><span>Use Paper Trade to rehearse an order without moving funds.</span></div>
            {/if}
          </section>
        </div>
      </section>
      {/if}
    </main>

    {#if activeEnvironment === 'execute'}
    <aside class="intelligence-rail" id="signals" aria-labelledby="signals-title">
      <section class="steward-head">
        <div class="agent-id"><span class="agent-avatar">DJ</span><div><strong id="signals-title">DOW JONES</strong><small>AI PAPER STRATEGIST</small></div></div>
        <span class="agent-state"><i></i>SCANNING</span>
      </section>

      <section class="tape-summary">
        <div><span>MARKET REGIME</span><strong>{marketMood}</strong></div>
        <div><span>ADVANCING</span><strong>{Math.round(marketBreadth * 100)}%</strong></div>
        <div><span>DATA</span><strong>{dataStatus === 'live' ? 'PUBLIC LIVE' : 'DEMO'}</strong></div>
      </section>

      <section class="order-lab" id="execution">
        <div class="rail-heading"><span>EXECUTION LAB</span><span>PAPER ONLY</span></div>
        <div class="ticket-modes">
          <button type="button" class:active={ticketMode === 'trade'} onclick={() => (ticketMode = 'trade')}><BarChart3 size={13} /> TRADE</button>
          <button type="button" class:active={ticketMode === 'swap'} onclick={() => (ticketMode = 'swap')}><ArrowDownUp size={13} /> SWAP</button>
        </div>

        {#if ticketMode === 'trade'}
          <div class="side-toggle">
            <button type="button" class:buy-active={orderSide === 'buy'} onclick={() => (orderSide = 'buy')}>BUY / LONG</button>
            <button type="button" class:sell-active={orderSide === 'sell'} onclick={() => (orderSide = 'sell')}>SELL / SHORT</button>
          </div>
          <div class="order-tabs">
            {#each ['market', 'limit', 'stop', 'bracket', 'twap'] as type}
              <button type="button" class:active={orderType === type} onclick={() => (orderType = type as PaperOrderType)}>{type.toUpperCase()}</button>
            {/each}
          </div>
          <div class="trade-form">
            <label><span>AMOUNT USD</span><div class="trade-input"><strong>$</strong><input type="number" min="25" step="25" bind:value={orderAmountUsd} /></div></label>
            {#if orderType === 'limit' || orderType === 'bracket' || orderType === 'twap'}
              <label><span>LIMIT / BBO</span><div class="trade-input"><strong>$</strong><input type="number" step="any" bind:value={orderLimit} /></div></label>
            {/if}
            {#if orderType === 'stop'}
              <label><span>STOP TRIGGER</span><div class="trade-input"><strong>$</strong><input type="number" step="any" bind:value={orderStop} /></div></label>
            {/if}
            {#if orderType === 'bracket'}
              <div class="split-fields">
                <label><span>TAKE PROFIT</span><input type="number" step="any" bind:value={orderTakeProfit} /></label>
                <label><span>STOP LOSS</span><input type="number" step="any" bind:value={orderStopLoss} /></label>
              </div>
            {/if}
            {#if orderType === 'twap'}
              <label><span>DURATION</span><select bind:value={twapDuration}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={240}>4 hours</option></select></label>
            {/if}
            <div class="order-quote">
              <span>{selectedAsset.symbol} LIVE REF</span><strong>{formatPrice(selectedAsset.price)}</strong>
              <span>FKUSDC AVAILABLE</span><strong>${paperBalance.toFixed(2)}</strong>
              <span>EST. NETWORK + VENUE</span><strong>{latestFeeQuote ? `$${latestFeeQuote.totalEstimatedCostUsd.toFixed(4)}` : 'QUOTED AT REVIEW'}</strong>
              <span>FUNDS MOVED</span><strong>$0</strong>
            </div>
            <button class:paper-sell={orderSide === 'sell'} class="place-order" type="button" onclick={() => void placePaperOrder()}>{orderSide === 'buy' ? 'Simulate buy' : 'Simulate sell'}</button>
            <div class="beta-trade-note"><ShieldCheck size={13} /><span>Live prices, simulated settlement. Live-money trading will be available after beta testing.</span></div>
          </div>
        {:else}
          <div class="swap-form">
            <label><span>YOU PAY</span><div class="asset-input"><input type="number" min="0" step="any" bind:value={swapFromAmount} /><strong>{selectedAsset.symbol}</strong></div></label>
            <div class="swap-arrow"><ArrowDownUp size={15} /></div>
            <label><span>YOU RECEIVE</span><div class="asset-input"><strong>{swapQuote.toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong><select bind:value={swapToId}>{#each assets.filter((asset) => asset.id !== selectedAssetId) as asset}<option value={asset.id}>{asset.symbol}</option>{/each}</select></div></label>
            <div class="swap-settings">
              <label><span>NETWORK</span><select bind:value={swapNetwork}><option>Base</option><option>Ethereum</option><option>Solana</option><option>BNB Chain</option></select></label>
              <label><span>SLIPPAGE</span><select bind:value={swapSlippage}><option value={0.1}>0.1%</option><option value={0.5}>0.5%</option><option value={1}>1.0%</option></select></label>
            </div>
            <div class="route-line"><span>AGGREGATED PAPER ROUTE</span><strong>0.18% fee / 0.04% impact</strong></div>
            <button class="record-swap" type="button" onclick={() => void recordPaperSwap()}><WalletCards size={15} /> Record paper swap</button>
          </div>
        {/if}
      </section>

      <section class="signal-section">
        <div class="rail-heading"><span>AI SETUPS</span><span>SCORE</span></div>
        <div class="signal-list">
          {#each signals as signal, index}
            <button type="button" class:active={selectedAssetId === signal.asset.id} onclick={() => selectAsset(signal.asset)}>
              <span class="signal-rank">{String(index + 1).padStart(2, '0')}</span>
              <span class="signal-symbol"><strong>{signal.asset.symbol}</strong><small>{signal.label}</small></span>
              <span class:long-bias={signal.direction === 'LONG BIAS'} class:short-bias={signal.direction === 'SHORT BIAS'}>{signal.direction}</span>
              <strong class="signal-score">{signal.score}</strong>
            </button>
          {/each}
        </div>
      </section>

      {#if benchmarkSignal}
        <section class="agent-brief">
          <div class="brief-title"><Crosshair size={15} /><span>DOW JONES BENCHMARK</span><strong>SIM 01</strong></div>
          <p><strong>{benchmarkSignal.asset.symbol} / {benchmarkSignal.direction}</strong></p>
          <p>{benchmarkSignal.thesis}</p>
          <div class="invalidation"><span>INVALIDATION</span><p>{benchmarkSignal.invalidation}</p></div>
          <div class="brief-boundary"><Info size={13} />Heuristic teaching setup, not a forecast or order.</div>
        </section>
      {/if}

      <section class="league-section" id="ledger">
        <div class="rail-heading"><span>LEAGUE DESK</span><span>PAPER P/L</span></div>
        <div class="league-row agent-row"><span class="agent-avatar mini">DJ</span><span><strong>DOW JONES</strong><small>DISCLOSED SIM AGENT</small></span><strong>BENCHMARK</strong></div>
        <div class="league-row">
          <span class="user-avatar"><UserRound size={15} /></span>
          <span><strong>{member?.displayName ?? 'YOU'}</strong><small>{member?.teamName ?? 'JOIN TO RECORD ROUNDS'}</small></span>
          <strong>${paperBalance.toFixed(2)}</strong>
        </div>
      </section>

      <section class="receipt-section" id="receipts">
        <div class="rail-heading"><span>RECEIPT LEDGER</span><span>{receipts.length}</span></div>
        {#if latestReceipt}
          <div class="receipt-preview">
            <div><span>{latestReceipt.hostName} vs {latestReceipt.opponentName}</span><strong>{latestReceipt.winnerName}</strong></div>
            <div><span>{latestReceipt.hostSymbol} {latestReceipt.hostDirection.toUpperCase()} / {latestReceipt.opponentSymbol} {latestReceipt.opponentDirection.toUpperCase()}</span><strong class:positive={latestReceipt.hostHypotheticalPnl >= 0} class:negative={latestReceipt.hostHypotheticalPnl < 0}>{latestReceipt.hostHypotheticalPnl >= 0 ? '+' : '-'}${Math.abs(latestReceipt.hostHypotheticalPnl).toFixed(2)}</strong></div>
            <code>sha256:{latestReceipt.hash.slice(0, 16)}...{latestReceipt.hash.slice(-8)}</code>
            <div class="receipt-actions"><span><LockKeyhole size={12} />$0 moved</span><button type="button" onclick={copyReceipt}>{#if copied}<Check size={13} /> Copied{:else}<Copy size={13} /> Copy hash{/if}</button></div>
          </div>
        {:else}
          <div class="empty-ledger"><FileCheck2 size={19} /><span>No completed rounds yet.</span></div>
        {/if}
      </section>

      <section class="orders-section">
        <div class="rail-heading"><span>PAPER ORDERS</span><span>{paperOrders.length}</span></div>
        {#if paperOrders.length}
          {#each paperOrders.slice(0, 4) as order}
            <div class="paper-order-row">
              <span><strong>{order.symbol}{order.toSymbol ? ` → ${order.toSymbol}` : ''}</strong><small>{order.type.toUpperCase()} / {order.side.toUpperCase()}</small></span>
              <span class:positive={order.status === 'filled'} class:negative={order.status === 'cancelled'}>{order.status.toUpperCase()}</span>
              {#if order.status === 'open' || order.status === 'scheduled'}<button type="button" onclick={() => cancelPaperOrder(order.id)} title="Cancel paper order"><X size={12} /></button>{:else}<i></i>{/if}
            </div>
          {/each}
        {:else}
          <div class="empty-ledger"><Layers3 size={19} /><span>No paper orders.</span></div>
        {/if}
      </section>
    </aside>
    {/if}
  </div>

  <footer class="statusbar">
    <span><i class="status-light"></i>WHLE PAPER ENGINE ONLINE</span>
    <span>PUBLIC MARKET DATA / WALLET READ-ONLY</span>
    <span>ORDERS 0 LIVE / FUNDS $0.00</span>
    <span class="desktop-only">Educational simulation. Not financial advice.</span>
  </footer>
</div>

{#if walletNotice}
  <button class="wallet-toast" type="button" onclick={() => (walletNotice = '')} title="Dismiss wallet notice"><ShieldCheck size={14} />{walletNotice}<X size={13} /></button>
{/if}

<Tutorial open={showTutorial} onclose={closeTutorial} onnavigate={navigateTutorial} />
<WalletDialog
  open={showWallet}
  onclose={() => (showWallet = false)}
  onconnect={connectWallet}
  onexternal={connectExternalWallet}
  onwatch={watchWallet}
  {reownConfigured}
/>

{#if showJoin}
  <div class="modal-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) showJoin = false }}>
    <div class="join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <div class="modal-head"><div><span>PLAYER IDENTITY</span><h2 id="join-title">Sign in, then create your desk</h2></div><button class="icon-button" type="button" onclick={() => (showJoin = false)} title="Close"><X size={18} /></button></div>
      <p>Your Farcaster identity owns the desk. Wallets remain optional and are attached afterward for read-only portfolio simulation.</p>
      <div class="identity-entry">
        <FarcasterIdentity identity={farcasterIdentity} oncomplete={setFarcasterIdentity} />
        <div class="identity-divider"><span>OR</span></div>
        {#if emailIdentityAddress}
          <div class="email-identity"><Mail size={17} /><span><strong>Email account connected</strong><small>{shortAddress(emailIdentityAddress)} embedded account</small></span><Check size={16} /></div>
        {:else}
          <button class="email-login" type="button" onclick={() => void startEmailIdentity()}><Mail size={17} /><span><strong>Continue with email</strong><small>Passwordless OTP through Reown</small></span></button>
        {/if}
        {#if !reownConfigured}<div class="email-activation">Email login is integrated but needs the production Reown project ID to activate.</div>{/if}
      </div>
      <form onsubmit={(event) => { event.preventDefault(); joinLeague() }}>
        <div class="desk-step"><span>02</span><div><strong>Name the desk</strong><small>This appears in player battles and receipts.</small></div></div>
        {#if !farcasterIdentity}<label><span>Display name</span><input bind:value={displayName} autocomplete="name" placeholder="Your name" /></label>{/if}
        <label><span>Paper desk</span><input bind:value={teamName} placeholder="Your team or research desk" /></label>
        {#if joinError}<div class="form-error">{joinError}</div>{/if}
        <button class="join-submit" type="submit" disabled={!farcasterIdentity && !emailIdentityAddress}><Gauge size={17} /> Create desk and choose wallet</button>
      </form>
      <div class="modal-boundaries"><span><ShieldCheck size={14} />Verified identity</span><span><LockKeyhole size={14} />Wallet optional</span><span><RotateCcw size={14} />Reset anytime</span></div>
    </div>
  </div>
{/if}
