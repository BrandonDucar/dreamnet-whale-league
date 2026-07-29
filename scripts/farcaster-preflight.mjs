import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const allowUnsigned = process.argv.includes('--allow-unsigned')
const root = process.cwd()
const failures = []
const warnings = []
const checks = []

function record(name, passed, detail) {
  checks.push({ name, passed, detail })
  if (!passed) failures.push(`${name}: ${detail}`)
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') throw new Error('not a PNG')
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

async function checkPng(relativePath, expectedWidth, expectedHeight) {
  const file = path.join(root, relativePath)
  try {
    const dimensions = pngDimensions(await readFile(file))
    record(
      relativePath,
      dimensions.width === expectedWidth && dimensions.height === expectedHeight,
      `${dimensions.width}x${dimensions.height}; expected ${expectedWidth}x${expectedHeight}`,
    )
  } catch (error) {
    record(relativePath, false, error instanceof Error ? error.message : 'unreadable')
  }
}

const indexHtml = await readFile(path.join(root, 'index.html'), 'utf8')
record('fc:miniapp metadata', indexHtml.includes('name="fc:miniapp"'), 'required feed embed metadata')
record('fc:frame compatibility', indexHtml.includes('name="fc:frame"'), 'legacy client compatibility metadata')
record('launch_miniapp action', indexHtml.includes('"type":"launch_miniapp"'), 'current Farcaster launch action')
record('Mini App launch hint', indexHtml.includes('?miniApp=true'), 'required for lazy SDK loading')

await checkPng('public/whale-league-feed.png', 1200, 800)
await checkPng('public/whale-league-icon.png', 1024, 1024)
await checkPng('public/whale-league-splash.png', 200, 200)
await checkPng('public/whale-league-screenshot.png', 1284, 2778)
await checkPng('public/whale-league-wide.png', 1200, 630)

const manifestPath = path.join(root, 'public', '.well-known', 'farcaster.json')
try {
  await access(manifestPath)
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const signed = Boolean(
    manifest.accountAssociation?.header
    && manifest.accountAssociation?.payload
    && manifest.accountAssociation?.signature
  )
  if (signed) {
    record('signed account association', true, 'header, payload, and signature present')
  } else if (allowUnsigned) {
    warnings.push('manifest metadata is valid but accountAssociation is not signed')
    checks.push({
      name: 'signed account association',
      passed: false,
      detail: 'sign dreamnet-whale-league.pages.dev in Farcaster Developer Tools',
    })
  } else {
    record(
      'signed account association',
      false,
      'header, payload, and signature are required',
    )
  }
  record('manifest miniapp metadata', manifest.miniapp?.version === '1', 'miniapp.version must be 1')
  record(
    'manifest canonical domain',
    manifest.miniapp?.canonicalDomain === 'dreamnet-whale-league.pages.dev',
    'canonicalDomain must match the production host',
  )
  record(
    'minimal required capabilities',
    JSON.stringify(manifest.miniapp?.requiredCapabilities) === JSON.stringify(['actions.ready']),
    'optional host features must be capability-detected at runtime',
  )
} catch {
  const detail = 'public/.well-known/farcaster.json is not signed and published'
  if (allowUnsigned) warnings.push(detail)
  else failures.push(`signed manifest: ${detail}`)
  checks.push({ name: 'signed manifest', passed: false, detail })
}

const result = {
  status: failures.length ? 'blocked' : warnings.length ? 'ready_except_manifest' : 'ready',
  checks,
  failures,
  warnings,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exitCode = 1
