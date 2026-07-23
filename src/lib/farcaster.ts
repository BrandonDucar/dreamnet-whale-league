export type FarcasterIdentity = {
  authMethod: 'farcaster'
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  custodyAddress?: string
  verifiedAddresses: string[]
}

export type FarcasterChannel = {
  qrDataUrl: string
  url: string
}

export async function signInWithFarcaster(
  onChannel: (channel: FarcasterChannel) => void,
  timeout = 180_000,
): Promise<FarcasterIdentity> {
  const [{ createAppClient, viemConnector }, { default: QRCode }] = await Promise.all([
    import('@farcaster/auth-client'),
    import('qrcode'),
  ])
  const appClient = createAppClient({
    relay: 'https://relay.farcaster.xyz',
    ethereum: viemConnector(),
  })
  const domain = window.location.host
  const siweUri = `${window.location.origin}${window.location.pathname}`
  const nonce = window.crypto.randomUUID().replaceAll('-', '').slice(0, 24)
  const channel = await appClient.createChannel({ domain, nonce, siweUri })

  if (channel.isError || !channel.data?.channelToken || !channel.data.url) {
    throw channel.error ?? new Error('Farcaster could not create a secure sign-in request.')
  }

  onChannel({
    url: channel.data.url,
    qrDataUrl: await QRCode.toDataURL(channel.data.url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
    }),
  })

  const status = await appClient.watchStatus({
    channelToken: channel.data.channelToken,
    interval: 1_000,
    timeout,
  })

  if (status.isError || !status.data?.message || !status.data.signature || !status.data.fid) {
    throw status.error ?? new Error('Farcaster sign-in expired before it was approved.')
  }

  const verification = await appClient.verifySignInMessage({
    domain,
    nonce: status.data.nonce,
    message: status.data.message,
    signature: status.data.signature,
  })

  if (verification.isError || !verification.success || verification.fid !== status.data.fid) {
    throw verification.error ?? new Error('The Farcaster identity proof could not be verified.')
  }

  return {
    authMethod: 'farcaster',
    fid: status.data.fid,
    username: status.data.username ?? `fid-${status.data.fid}`,
    displayName: status.data.displayName ?? status.data.username ?? `FID ${status.data.fid}`,
    pfpUrl: status.data.pfpUrl,
    custodyAddress: status.data.custody,
    verifiedAddresses: status.data.verifications ?? [],
  }
}
