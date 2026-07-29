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

export function trackBetaEvent(name: BetaEventName, properties: Record<string, BetaEventProperty> = {}) {
  const event: BetaEvent = {
    id: makeId('event'),
    name,
    occurredAt: new Date().toISOString(),
    sessionId: getSessionId(),
    release,
    properties: sanitizeTelemetryProperties(properties),
  }
  persistLocally(event)
  send(event)
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
