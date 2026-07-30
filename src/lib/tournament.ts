import type { BattleReceipt } from './types'

export const FOUNDER_CUP_ID = 'whale-founder-cup-0'
export const FOUNDER_CUP_TARGET_ROUNDS = 5
export const TOURNAMENT_ENTRY_STORAGE_KEY = 'whale-founder-cup-entry-v1'

export type TournamentEntry = {
  seasonId: typeof FOUNDER_CUP_ID
  inviteCode: string
  enteredAt: string
  source: 'founder' | 'invite'
  verification: 'farcaster' | 'local'
}

export type TournamentStanding = {
  participant: string
  desk: string
  rounds: number
  wins: number
  losses: number
  ties: number
  points: number
  totalReturnPct: number
  averageReturnPct: number
  bestReturnPct: number
  isSimulation: boolean
}

type MutableStanding = Omit<TournamentStanding, 'averageReturnPct'>

function normalizedParticipant(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function standingKey(name: string) {
  return normalizedParticipant(name).toLowerCase()
}

function createStanding(participant: string, desk = ''): MutableStanding {
  return {
    participant: normalizedParticipant(participant),
    desk,
    rounds: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    points: 0,
    totalReturnPct: 0,
    bestReturnPct: Number.NEGATIVE_INFINITY,
    isSimulation: normalizedParticipant(participant).toUpperCase() === 'DOW JONES',
  }
}

function addRound(standing: MutableStanding, roundReturn: number, result: 'win' | 'loss' | 'tie') {
  standing.rounds += 1
  standing.totalReturnPct += roundReturn
  standing.bestReturnPct = Math.max(standing.bestReturnPct, roundReturn)
  if (result === 'win') {
    standing.wins += 1
    standing.points += 3
  } else if (result === 'tie') {
    standing.ties += 1
    standing.points += 1
  } else {
    standing.losses += 1
  }
}

export function buildTournamentStandings(receipts: BattleReceipt[]) {
  const standings = new Map<string, MutableStanding>()

  for (const receipt of receipts) {
    if (receipt.seasonId !== FOUNDER_CUP_ID) continue
    const hostKey = standingKey(receipt.hostName)
    const opponentKey = standingKey(receipt.opponentName)
    const host = standings.get(hostKey) ?? createStanding(receipt.hostName, receipt.hostTeam)
    const opponent = standings.get(opponentKey) ?? createStanding(receipt.opponentName)
    const tied = receipt.winnerName === 'TIE'

    addRound(host, receipt.hostReturn, tied ? 'tie' : receipt.winnerName === receipt.hostName ? 'win' : 'loss')
    addRound(opponent, receipt.opponentReturn, tied ? 'tie' : receipt.winnerName === receipt.opponentName ? 'win' : 'loss')

    standings.set(hostKey, host)
    standings.set(opponentKey, opponent)
  }

  return [...standings.values()]
    .map<TournamentStanding>((standing) => ({
      ...standing,
      totalReturnPct: Number(standing.totalReturnPct.toFixed(4)),
      averageReturnPct: standing.rounds ? Number((standing.totalReturnPct / standing.rounds).toFixed(4)) : 0,
      bestReturnPct: Number.isFinite(standing.bestReturnPct) ? Number(standing.bestReturnPct.toFixed(4)) : 0,
    }))
    .sort((a, b) =>
      b.points - a.points
      || b.totalReturnPct - a.totalReturnPct
      || b.wins - a.wins
      || a.participant.localeCompare(b.participant),
    )
}

export function createTournamentInviteCode() {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const suffix = Array.from(bytes)
    .map((byte) => byte.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 8)
    .toUpperCase()
  return `WHLE-BETA-${suffix}`
}

export function isTournamentInviteCode(value: string | null | undefined) {
  return /^WHLE-BETA-(?:[A-Z0-9]{8}|[A-F0-9]{16})$/.test(
    value?.trim().toUpperCase() ?? '',
  )
}

export function createTournamentShareUrl(inviteCode: string) {
  const url = new URL('https://whale.dreamnet.ink/')
  url.searchParams.set('invite', inviteCode)
  url.searchParams.set('miniApp', 'true')
  return url.toString()
}
