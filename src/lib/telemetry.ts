export type BetaEventName =
  | 'app_opened'
  | 'miniapp_ready'
  | 'tutorial_opened'
  | 'tutorial_completed'
  | 'tutorial_dismissed'
  | 'identity_verified'
  | 'desk_created'
  | 'wallet_connected'
  | 'wallet_watched'
  | 'wallet_scan_completed'
  | 'wallet_scan_failed'
  | 'paper_plan_created'
  | 'trader_template_seeded'
  | 'paper_order_recorded'
  | 'paper_order_blocked'
  | 'paper_swap_recorded'
  | 'battle_receipt_created'
  | 'tournament_enrolled'
  | 'tournament_invite_created'
  | 'tournament_invite_copied'
  | 'tournament_invite_shared'
  | 'tournament_round_started'
  | 'environment_opened'
  | 'miniapp_added'
  | 'miniapp_shared'

export type BetaEventProperty = string | number | boolean | null

export type BetaEvent = {
  id: string
  name: BetaEventName
  occurredAt: string
  sessionId: string
  release: string
  properties: Record<string, BetaEventProperty>
}

const EVENT_STORAGE_KEY = 'whale-league-beta-events-v1'
const SESSION_STORAGE_KEY = 'whale-league-beta-session-v1'
const MAX_LOCAL_EVENTS = 200
const release = '0.2.0-beta'
const endpoint = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_WHALE_TELEMETRY_ENDPOINT?.trim() ?? ''

const forbiddenProperty = /(address|email|fid|name|username|wallet|secret|token|signature)/i

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `${prefix}:${crypto.randomUUID()}`
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`
}

function getSessionId() {
  if (typeof sessionStorage === 'undefined') return 'server'
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing
  const created = makeId('session')
  sessionStorage.setItem(SESSION_STORAGE_KEY, created)
  return created
}

export function sanitizeTelemetryProperties(properties: Record<string, BetaEventProperty>) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => !forbiddenProperty.test(key))
      .slice(0, 24),
  )
}

function persistLocally(event: BetaEvent) {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) ?? '[]') as BetaEvent[]
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify([...saved, event].slice(-MAX_LOCAL_EVENTS)))
  } catch {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify([event]))
  }
}

function send(event: BetaEvent) {
  if (!endpoint || typeof navigator === 'undefined') return
  const body = JSON.stringify(event)
  if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))) return
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined)
}

function propertyText(
  properties: Record<string, BetaEventProperty>,
  key: string,
  fallback: string,
) {
  const value = properties[key]
  return typeof value === 'string' && value ? value : fallback
}

function forwardProductEvent(
  name: BetaEventName,
  properties: Record<string, BetaEventProperty>,
) {
  switch (name) {
    case 'app_opened':
      trackWhaleEvent('app_opened', { view: 'markets' })
      break
    case 'miniapp_ready':
      setWhaleAnalyticsRuntime(true)
      trackWhaleEvent('miniapp_opened', {
        result: properties.added === true ? 'added' : 'not_added',
      })
      break
    case 'tutorial_opened':
      trackWhaleEvent('tutorial_started', {
        source_type: propertyText(properties, 'source', 'workspace'),
      })
      break
    case 'tutorial_completed':
      trackWhaleEvent('tutorial_completed', { result: 'completed' })
      break
    case 'tutorial_dismissed':
      trackWhaleEvent('tutorial_skipped', { result: 'dismissed' })
      break
    case 'identity_verified':
      trackWhaleEvent('sign_in_succeeded', {
        auth_method: propertyText(properties, 'method', 'unknown'),
      })
      break
    case 'desk_created':
      trackWhaleEvent('desk_created', {
        auth_method: propertyText(properties, 'auth_method', 'unknown'),
        mode: 'paper',
      })
      break
    case 'wallet_connected':
      trackWhaleEvent('wallet_connected', {
        network: propertyText(properties, 'chain', 'unknown'),
        wallet_provider: propertyText(properties, 'connector', 'unknown'),
      })
      break
    case 'wallet_watched':
      trackWhaleEvent('wallet_connected', {
        network: propertyText(properties, 'chain', 'unknown'),
        wallet_provider: 'watch_address',
      })
      break
    case 'wallet_scan_completed':
      trackWhaleEvent('portfolio_scanned', {
        mode: 'read_only',
        result: propertyText(properties, 'supported_value_bucket', 'completed'),
      })
      break
    case 'paper_plan_created':
      trackWhaleEvent('paper_plan_created', { mode: 'paper' })
      break
    case 'trader_template_seeded':
      trackWhaleEvent('trader_followed', { mode: 'paper_copy' })
      break
    case 'paper_order_recorded': {
      const orderType = propertyText(properties, 'order_type', 'market')
      const result = propertyText(properties, 'status', 'recorded')
      trackWhaleEvent('paper_order_submitted', {
        mode: 'paper',
        order_type: orderType,
        result,
      })
      if (result === 'filled') {
        trackWhaleEvent('paper_order_filled', {
          mode: 'paper',
          order_type: orderType,
        })
      }
      break
    }
    case 'paper_order_blocked':
      trackWhaleEvent('paper_order_submitted', {
        mode: 'paper',
        order_type: propertyText(properties, 'order_type', 'unknown'),
        result: 'blocked',
      })
      break
    case 'paper_swap_recorded':
      trackWhaleEvent('paper_order_submitted', {
        mode: 'paper',
        order_type: 'swap',
        result: 'filled',
      })
      trackWhaleEvent('paper_order_filled', {
        mode: 'paper',
        order_type: 'swap',
      })
      break
    case 'tournament_round_started':
      trackWhaleEvent('battle_joined', {
        mode: propertyText(properties, 'mode', 'paper'),
      })
      break
    case 'battle_receipt_created':
      trackWhaleEvent('battle_completed', {
        mode: propertyText(properties, 'mode', 'paper'),
        result: 'receipt_created',
      })
      break
    case 'miniapp_added':
      trackWhaleEvent('miniapp_added', { result: 'succeeded' })
      break
    default:
      break
  }
}

export function trackBetaEvent(name: BetaEventName, properties: Record<string, BetaEventProperty> = {}) {
  const sanitized = sanitizeTelemetryProperties(properties)
  const event: BetaEvent = {
    id: makeId('event'),
    name,
    occurredAt: new Date().toISOString(),
    sessionId: getSessionId(),
    release,
    properties: sanitized,
  }
  persistLocally(event)
  send(event)
  forwardProductEvent(name, sanitized)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('whale:beta-event', { detail: event }))
  return event
}

export function readLocalBetaEvents() {
  if (typeof localStorage === 'undefined') return [] as BetaEvent[]
  try {
    return JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) ?? '[]') as BetaEvent[]
  } catch {
    return [] as BetaEvent[]
  }
}
import { setWhaleAnalyticsRuntime, trackWhaleEvent } from './productAnalytics'
