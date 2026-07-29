import assert from 'node:assert/strict'
import { buildTournamentStandings, createTournamentShareUrl, isTournamentInviteCode } from '../src/lib/tournament'
import type { BattleReceipt } from '../src/lib/types'

function receipt(overrides: Partial<BattleReceipt>): BattleReceipt {
  return {
    id: crypto.randomUUID(),
    hash: 'a'.repeat(64),
    seasonId: 'whale-founder-cup-0',
    openedAt: '2026-07-29T12:00:00.000Z',
    closedAt: '2026-07-29T12:01:00.000Z',
    mode: 'players',
    hostName: 'Brandon',
    hostTeam: 'Ghostmint Research',
    opponentName: 'Alice',
    hostSymbol: 'BTC',
    opponentSymbol: 'ETH',
    hostDirection: 'long',
    opponentDirection: 'long',
    paperStake: 100,
    hostThesis: 'momentum',
    opponentThesis: 'defensive',
    hostReturn: 2,
    opponentReturn: 1,
    winningMargin: 1,
    winnerName: 'Brandon',
    hostHypotheticalPnl: 1,
    fundsMoved: 0,
    dataMode: 'live',
    ...overrides,
  }
}

assert.deepEqual(buildTournamentStandings([]), [])
assert.deepEqual(buildTournamentStandings([receipt({ seasonId: undefined })]), [])

const standings = buildTournamentStandings([
  receipt({}),
  receipt({
    id: crypto.randomUUID(),
    mode: 'practice',
    opponentName: 'DOW JONES',
    hostReturn: -1,
    opponentReturn: 0.5,
    winningMargin: 1.5,
    winnerName: 'DOW JONES',
    hostHypotheticalPnl: -1.5,
  }),
])

assert.equal(standings.length, 3)
assert.equal(standings[0].participant, 'Brandon')
assert.deepEqual(
  { rounds: standings[0].rounds, wins: standings[0].wins, losses: standings[0].losses, points: standings[0].points },
  { rounds: 2, wins: 1, losses: 1, points: 3 },
)
assert.equal(standings.find((standing) => standing.participant === 'DOW JONES')?.isSimulation, true)
assert.equal(standings.find((standing) => standing.participant === 'Alice')?.isSimulation, false)

assert.equal(isTournamentInviteCode('WHLE-BETA-A1B2C3D4'), true)
assert.equal(isTournamentInviteCode('WHLE-BETA-FAKE'), false)
assert.equal(
  createTournamentShareUrl('WHLE-BETA-A1B2C3D4'),
  'https://whale.dreamnet.ink/?invite=WHLE-BETA-A1B2C3D4&miniApp=true',
)

console.log('tournament engine: standings derive only from completed receipts and the disclosed simulation agent is labeled')
