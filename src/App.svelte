<script lang="ts">
  import {
    Activity,
    ArrowDownUp,
    BarChart3,
    Bell,
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
  import MarketChart from './lib/MarketChart.svelte'
  import MarketDepth from './lib/MarketDepth.svelte'
  import PortfolioSetup from './lib/PortfolioSetup.svelte'
  import PlayerArena from './lib/PlayerArena.svelte'
  import TraderGallery from './lib/TraderGallery.svelte'
  import Tutorial from './lib/Tutorial.svelte'
  import { buildFallbackBook, buildFallbackChart, changeFor, fallbackAssets, fetchChart, fetchMarket, fetchOrderBook, formatPrice } from './lib/market'
  import { chainName, connectInjectedWallet, getInjectedWallet, readInjectedWallet, shortAddress } from './lib/wallet'
  import type { BattleReceipt, BubbleMetric, ChartPoint, MarketAsset, MarketWindow, Member, OrderBookLevel, PaperOrder, PaperOrderSide, PaperOrderType } from './lib/types'

  type DataStatus = 'loading' | 'live' | 'fallback'
  type Signal = {
    asset: MarketAsset
    label: 'BREAKOUT' | 'REVERSAL' | 'PRESSURE' | 'RANGE'
    direction: 'LONG BIAS' | 'SHORT BIAS' | 'WAIT'
    score: number
    thesis: string
    invalidation: string
  }

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
  let showTutorial = false
  let displayName = ''
  let teamName = ''
  let joinError = ''
  let paperBalance = 10_000
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
  let walletNotice = ''

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

  onMount(() => {
    const savedMember = localStorage.getItem('whale-league-member')
    const savedReceipts = localStorage.getItem('whale-player-battle-receipts-v2')
    const savedOrders = localStorage.getItem('whale-league-paper-orders')
    if (savedMember) member = JSON.parse(savedMember) as Member
    if (savedReceipts) {
      receipts = JSON.parse(savedReceipts) as BattleReceipt[]
      latestReceipt = receipts[0] ?? null
    }
    if (savedOrders) paperOrders = JSON.parse(savedOrders) as PaperOrder[]
    if (!localStorage.getItem('whale-guided-tour-v2')) showTutorial = true

    const wallet = getInjectedWallet()
    const onAccountsChanged = (value: unknown) => {
      const accounts = Array.isArray(value) ? value as string[] : []
      walletAddress = accounts[0] ?? ''
      walletNotice = walletAddress ? `Wallet connected: ${shortAddress(walletAddress)}` : 'Wallet disconnected.'
    }
    const onChainChanged = (value: unknown) => {
      walletChainId = typeof value === 'string' ? value : ''
      walletNotice = walletChainId ? `Network changed to ${chainName(walletChainId)}.` : ''
    }
    void readInjectedWallet().then((connection) => {
      walletAddress = connection.address
      walletChainId = connection.chainId
    }).catch(() => undefined)
    wallet?.on?.('accountsChanged', onAccountsChanged)
    wallet?.on?.('chainChanged', onChainChanged)

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
      processPaperOrders(nextAssets)
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
    if (displayName.trim().length < 2 || teamName.trim().length < 2) {
      joinError = 'Enter your name and a paper team name.'
      return
    }
    member = { displayName: displayName.trim(), teamName: teamName.trim(), joinedAt: new Date().toISOString() }
    localStorage.setItem('whale-league-member', JSON.stringify(member))
    showJoin = false
  }

  function recordBattleReceipt(receipt: BattleReceipt) {
    latestReceipt = receipt
    receipts = [receipt, ...receipts].slice(0, 12)
    paperBalance = Number((paperBalance + receipt.hostHypotheticalPnl).toFixed(2))
    localStorage.setItem('whale-player-battle-receipts-v2', JSON.stringify(receipts))
  }

  function closeTutorial(completed: boolean) {
    showTutorial = false
    localStorage.setItem('whale-guided-tour-v2', completed ? 'completed' : 'dismissed')
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
    const unsigned: Omit<PaperOrder, 'hash'> = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      symbol: selectedAsset.symbol,
      assetId: selectedAsset.id,
      side: orderSide,
      type: orderType,
      amountUsd: Math.max(25, Number(orderAmountUsd) || 25),
      referencePrice: selectedAsset.price,
      limitPrice: orderType === 'limit' || orderType === 'bracket' || orderType === 'twap' ? Number(orderLimit) : undefined,
      stopPrice: orderType === 'stop' ? Number(orderStop) : undefined,
      takeProfit: orderType === 'bracket' ? Number(orderTakeProfit) : undefined,
      stopLoss: orderType === 'bracket' ? Number(orderStopLoss) : undefined,
      durationMinutes: orderType === 'twap' ? Number(twapDuration) : undefined,
      status,
      fundsMoved: 0,
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
    }
    const order = { ...unsigned, hash: await sha256(JSON.stringify(unsigned)) }
    paperOrders = [order, ...paperOrders].slice(0, 20)
    localStorage.setItem('whale-league-paper-orders', JSON.stringify(paperOrders))
  }

  function processPaperOrders(nextAssets: MarketAsset[]) {
    let changed = false
    paperOrders = paperOrders.map((order) => {
      if (order.status !== 'open') return order
      const asset = nextAssets.find((candidate) => candidate.id === order.assetId)
      if (!asset) return order
      const limitTriggered = order.type === 'limit' && order.limitPrice !== undefined && (order.side === 'buy' ? asset.price <= order.limitPrice : asset.price >= order.limitPrice)
      const stopTriggered = order.type === 'stop' && order.stopPrice !== undefined && (order.side === 'buy' ? asset.price >= order.stopPrice : asset.price <= order.stopPrice)
      if (!limitTriggered && !stopTriggered) return order
      changed = true
      return { ...order, status: 'filled' }
    })
    if (changed) localStorage.setItem('whale-league-paper-orders', JSON.stringify(paperOrders))
  }

  function cancelPaperOrder(id: string) {
    paperOrders = paperOrders.map((order) => order.id === id && (order.status === 'open' || order.status === 'scheduled') ? { ...order, status: 'cancelled' } : order)
    localStorage.setItem('whale-league-paper-orders', JSON.stringify(paperOrders))
  }

  function signOut() {
    member = null
    localStorage.removeItem('whale-league-member')
  }

  async function connectWallet() {
    try {
      const connection = await connectInjectedWallet()
      walletAddress = connection.address
      walletChainId = connection.chainId
      walletNotice = `Connected ${shortAddress(walletAddress)} on ${chainName(walletChainId)}. Trading authority has not been granted.`
    } catch (error) {
      walletNotice = error instanceof Error ? error.message : 'Wallet connection failed.'
    }
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
      <button class="icon-button desktop-only" type="button" title="Alerts"><Bell size={17} /></button>
      <button class="icon-button" type="button" title="Open tutorial" aria-label="Open tutorial" onclick={() => (showTutorial = true)}><CircleHelp size={17} /></button>
      <button class="wallet-button" class:connected={walletAddress} type="button" onclick={() => void connectWallet()} title={walletAddress ? `${walletAddress} on ${chainName(walletChainId)}` : 'Connect an injected EVM wallet'}>
        <WalletCards size={16} /><span>{walletAddress ? shortAddress(walletAddress) : 'Connect wallet'}</span>
      </button>
      {#if member}
        <button class="account-button" type="button" onclick={signOut} title="Sign out of paper league"><UserRound size={16} /><span>{member.displayName}</span></button>
      {:else}
        <button class="join-button" type="button" onclick={() => (showJoin = true)}><LogIn size={16} /> Join league</button>
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

  <div class="workspace">
    <nav class="tool-rail" aria-label="Trading workspace">
      <a class="active" href="#market" title="Market map"><LayoutGrid size={19} /><span>Market</span></a>
      <a href="#portfolio" title="Portfolio and trader setup"><UserRound size={19} /><span>Setup</span></a>
      <a href="#arena" title="Paper arena"><Swords size={19} /><span>Arena</span></a>
      <a href="#chart" title="Chart"><BarChart3 size={19} /><span>Chart</span></a>
      <a href="#signals" title="AI signals"><Bot size={19} /><span>Signals</span></a>
      <a href="#ledger" title="Receipt ledger"><FileCheck2 size={19} /><span>Ledger</span></a>
    </nav>

    <main class="market-workspace">
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

      <PortfolioSetup {walletAddress} {walletChainId} onconnect={() => void connectWallet()} />
      <TraderGallery {walletAddress} />

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

      <section class="chart-panel" id="chart" aria-labelledby="chart-title">
        <div class="chart-head">
          <div class="instrument-title">
            {#if selectedAsset.image}<img src={selectedAsset.image} alt="" />{/if}
            <div><span>{selectedAsset.name}</span><strong id="chart-title">{selectedAsset.symbol} / U.S. DOLLAR</strong></div>
          </div>
          <div class="instrument-price"><strong>{formatPrice(selectedAsset.price)}</strong><span class:positive={marketChange >= 0} class:negative={marketChange < 0}>{marketChange >= 0 ? '+' : ''}{marketChange.toFixed(2)}%</span></div>
          <div class="chart-ranges">{#each [1, 7, 30] as days}<button type="button" class:active={chartDays === days} onclick={() => setChartDays(days)}>{days === 1 ? '1D' : `${days}D`}</button>{/each}</div>
          <span class="chart-source">{chartLoading ? 'LOADING' : chartMode === 'live' ? 'LIVE HISTORY' : 'TEACHING SERIES'}</span>
        </div>
        <div class="chart-grid">
          <div class="chart-body"><MarketChart points={chartPoints} positive={marketChange >= 0} /></div>
          <div class="depth-wrap"><MarketDepth {bids} {asks} live={bookStatus === 'live'} /></div>
        </div>
        <div class="chart-foot"><span>Interactive price chart</span><span>Powered by <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView Lightweight Charts</a></span></div>
      </section>
    </main>

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
            <div class="order-quote"><span>{selectedAsset.symbol} REF</span><strong>{formatPrice(selectedAsset.price)}</strong><span>FUNDS MOVED</span><strong>$0</strong></div>
            <button class:paper-sell={orderSide === 'sell'} class="place-order" type="button" onclick={() => void placePaperOrder()}>{orderSide === 'buy' ? 'Place paper buy' : 'Place paper sell'}</button>
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

<Tutorial open={showTutorial} onclose={closeTutorial} />

{#if showJoin}
  <div class="modal-backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) showJoin = false }}>
    <div class="join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <div class="modal-head"><div><span>PAPER LEAGUE ACCESS</span><h2 id="join-title">Create your desk</h2></div><button class="icon-button" type="button" onclick={() => (showJoin = false)} title="Close"><X size={18} /></button></div>
      <p>Join as yourself. This creates a local paper profile so your rounds and receipts stay attached to you on this device.</p>
      <form onsubmit={(event) => { event.preventDefault(); joinLeague() }}>
        <label><span>Display name</span><input bind:value={displayName} autocomplete="name" placeholder="Your name" /></label>
        <label><span>Paper desk</span><input bind:value={teamName} placeholder="Your team or research desk" /></label>
        {#if joinError}<div class="form-error">{joinError}</div>{/if}
        <button class="join-submit" type="submit"><Gauge size={17} /> Open paper desk</button>
      </form>
      <div class="modal-boundaries"><span><ShieldCheck size={14} />No wallet</span><span><LockKeyhole size={14} />Local profile</span><span><RotateCcw size={14} />Reset anytime</span></div>
    </div>
  </div>
{/if}
