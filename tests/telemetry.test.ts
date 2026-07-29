import assert from 'node:assert/strict'
import { sanitizeTelemetryProperties } from '../src/lib/telemetry'

const sanitized = sanitizeTelemetryProperties({
  auth_method: 'farcaster',
  wallet_address: '0x1111111111111111111111111111111111111111',
  email: 'trader@example.com',
  fid: 123,
  display_name: 'Trader',
  holding_count: 4,
  funds_moved: 0,
})

assert.deepEqual(sanitized, {
  auth_method: 'farcaster',
  holding_count: 4,
  funds_moved: 0,
})

console.log('telemetry privacy: sensitive identity and wallet properties are rejected')
