export type WhaleAnalyticsEvent =
  | 'app_opened'
  | 'miniapp_opened'
  | 'sign_in_started'
  | 'sign_in_succeeded'
  | 'wallet_connect_started'
  | 'wallet_connected'
  | 'desk_created'
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'tutorial_skipped'
  | 'portfolio_scanned'
  | 'paper_plan_created'
  | 'paper_order_submitted'
  | 'paper_order_filled'
  | 'paper_order_cancelled'
  | 'battle_joined'
  | 'battle_completed'
  | 'trader_followed'
  | 'miniapp_added'

type AnalyticsMetadata = Partial<Record<
  | 'auth_method'
  | 'market_kind'
  | 'mode'
  | 'network'
  | 'order_type'
  | 'result'
  | 'runtime'
  | 'source_type'
  | 'step'
  | 'view'
  | 'wallet_provider',
  string | number | boolean
>>

const env = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>
}).env

const endpoint = (
  env?.VITE_PRODUCT_ANALYTICS_URL
  ?? 'https://dreamnet-product-analytics.dreamnet-intel.workers.dev'
).replace(/\/+$/, '')

let runtime = 'web'

function sessionId(): string {
  const key = 'dreamnet-whale-analytics-session'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem(key, created)
  return created
}

export function setWhaleAnalyticsRuntime(inMiniApp: boolean): void {
  runtime = inMiniApp ? 'farcaster-miniapp' : 'web'
}

export function trackWhaleEvent(
  eventName: WhaleAnalyticsEvent,
  metadata: AnalyticsMetadata = {},
): void {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return

  const payload = {
    appId: 'whale_league',
    eventName,
    sessionId: sessionId(),
    path: window.location.pathname,
    runtime,
    source: 'product',
    metadata: { ...metadata, runtime },
  }

  void fetch(`${endpoint}/v1/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined)
}
