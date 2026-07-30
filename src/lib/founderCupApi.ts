const FOUNDER_CUP_API =
  'https://dreamnet-whale-league-api.dreamnet-intel.workers.dev'

type ApiErrorBody = {
  error?: string
}

export type FounderCupInvitation = {
  code: string
  expiresAt: string
  shareUrl: string
  status: 'pending'
}

export class FounderCupApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'FounderCupApiError'
  }
}

function userMessage(code: string) {
  switch (code) {
    case 'INVITE_NOT_FOUND':
      return 'That invite was not found. Ask the sender for a fresh link.'
    case 'INVITE_ALREADY_RESOLVED':
      return 'That invite has already been used or revoked.'
    case 'INVITE_EXPIRED':
      return 'That invite expired. Ask the sender for a new one.'
    case 'OWN_INVITE':
      return 'Open this link from a different Farcaster account.'
    case 'ACTIVE_INVITE_LIMIT':
      return 'You have reached the active invite limit.'
    case 'INVALID_AUTH_TOKEN':
    case 'AUTH_REQUIRED':
      return 'Farcaster could not verify this session. Reopen the app and try again.'
    case 'AUTH_UNAVAILABLE':
      return 'Farcaster verification is temporarily unavailable.'
    default:
      return 'Founder Cup verification could not be completed. Try again.'
  }
}

async function authenticatedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { sdk } = await import('@farcaster/miniapp-sdk')
  const response = await sdk.quickAuth.fetch(`${FOUNDER_CUP_API}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody
    const code = body.error ?? `HTTP_${response.status}`
    throw new FounderCupApiError(code, userMessage(code))
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function createFounderCupInvitation(expiresInDays = 7) {
  const response = await authenticatedRequest<{
    invitation: FounderCupInvitation
    replayed: boolean
  }>('/v1/invites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({ expiresInDays }),
  })
  return response.invitation
}

export async function acceptFounderCupInvitation(code: string) {
  return authenticatedRequest<{
    invitation: {
      acceptedAt: string
      id: string
      status: 'accepted'
    }
  }>(`/v1/invites/${encodeURIComponent(code)}/accept`, {
    method: 'POST',
  })
}
