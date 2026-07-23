const LATEST_ROUND_DATA_SELECTOR = '0xfeaf968c'
const DECIMALS_SELECTOR = '0x313ce567'

type JsonRpcResponse = {
  result?: string
  error?: { message?: string }
}

async function ethCall(rpcUrl: string, contract: string, data: string, signal?: AbortSignal) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: contract, data }, 'latest'] }),
    signal,
  })
  if (!response.ok) throw new Error(`Polygon oracle RPC failed (${response.status}).`)
  const payload = await response.json() as JsonRpcResponse
  if (payload.error || !payload.result) throw new Error(payload.error?.message ?? 'Polygon oracle RPC returned no result.')
  return payload.result
}

function word(data: string, index: number) {
  const clean = data.startsWith('0x') ? data.slice(2) : data
  return clean.slice(index * 64, (index + 1) * 64)
}

function signedWord(value: string) {
  const unsigned = BigInt(`0x${value}`)
  return unsigned >> 255n ? unsigned - (1n << 256n) : unsigned
}

export async function readChainlinkFeed(input: {
  rpcUrl: string
  feedAddress: string
  subject: string
  evidenceUrl: string
  signal?: AbortSignal
}) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.feedAddress)) throw new Error('Invalid oracle feed address.')
  const [roundData, decimalsData] = await Promise.all([
    ethCall(input.rpcUrl, input.feedAddress, LATEST_ROUND_DATA_SELECTOR, input.signal),
    ethCall(input.rpcUrl, input.feedAddress, DECIMALS_SELECTOR, input.signal),
  ])
  const answer = signedWord(word(roundData, 1))
  const updatedAt = Number(BigInt(`0x${word(roundData, 3)}`)) * 1000
  const decimals = Number(BigInt(decimalsData))
  if (answer <= 0n || !Number.isFinite(updatedAt)) throw new Error('Oracle returned a non-positive or invalid observation.')
  return {
    source: `chainlink:${input.feedAddress.toLowerCase()}`,
    subject: input.subject,
    value: Number(answer) / 10 ** decimals,
    observedAt: updatedAt,
    evidenceUrl: input.evidenceUrl,
  }
}
