export type OracleObservation = {
  source: string
  subject: string
  value: number
  observedAt: number
  evidenceUrl: string
}

export type OracleConsensus = {
  subject: string
  value: number
  observedAt: number
  maxDeviationBps: number
  sources: OracleObservation[]
}

export function buildOracleConsensus(observations: OracleObservation[], policy: {
  minSources?: number
  maxAgeMs?: number
  maxDeviationBps?: number
  now?: number
} = {}): OracleConsensus {
  const minSources = policy.minSources ?? 2
  const maxAgeMs = policy.maxAgeMs ?? 30_000
  const allowedDeviationBps = policy.maxDeviationBps ?? 100
  const now = policy.now ?? Date.now()
  const usable = observations.filter((observation) => Number.isFinite(observation.value) && observation.value > 0 && now - observation.observedAt <= maxAgeMs)

  if (usable.length < minSources) throw new Error(`Oracle quorum requires ${minSources} fresh sources; received ${usable.length}.`)
  if (new Set(usable.map((observation) => observation.subject)).size !== 1) throw new Error('Oracle observations do not describe the same subject.')
  if (new Set(usable.map((observation) => observation.source)).size !== usable.length) throw new Error('Oracle quorum sources must be independent.')

  const sorted = usable.map((observation) => observation.value).sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  const maxDeviationBps = Math.max(...usable.map((observation) => Math.abs(observation.value - median) / median * 10_000))
  if (maxDeviationBps > allowedDeviationBps) throw new Error(`Oracle disagreement ${maxDeviationBps.toFixed(1)} bps exceeds ${allowedDeviationBps} bps.`)

  return {
    subject: usable[0].subject,
    value: median,
    observedAt: Math.min(...usable.map((observation) => observation.observedAt)),
    maxDeviationBps,
    sources: usable,
  }
}
