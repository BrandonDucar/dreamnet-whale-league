<script lang="ts">
  import { Check, ExternalLink, LoaderCircle, Radio, RotateCcw, ShieldCheck } from '@lucide/svelte'
  import { signInWithFarcaster } from './farcaster'
  import type { FarcasterChannel, FarcasterIdentity as Identity } from './farcaster'

  export let identity: Identity | null = null
  export let oncomplete: (identity: Identity) => void

  let channel: FarcasterChannel | null = null
  let error = ''
  let loading = false
  let attempt = 0

  async function start() {
    const currentAttempt = ++attempt
    loading = true
    error = ''
    channel = null
    try {
      const result = await signInWithFarcaster((nextChannel) => {
        if (currentAttempt === attempt) channel = nextChannel
      })
      if (currentAttempt === attempt) oncomplete(result)
    } catch (cause) {
      if (currentAttempt === attempt) {
        error = cause instanceof Error ? cause.message : 'Farcaster sign-in failed.'
      }
    } finally {
      if (currentAttempt === attempt) loading = false
    }
  }
</script>

<section class="farcaster-auth" aria-label="Farcaster identity">
  <div class="auth-heading">
    <span>01</span>
    <div>
      <strong>Start with your Farcaster identity</strong>
      <small>Your verified FID becomes the owner of this paper desk.</small>
    </div>
  </div>

  {#if identity}
    <div class="identity-card">
      {#if identity.pfpUrl}<img src={identity.pfpUrl} alt="" />{:else}<span class="identity-icon"><Radio size={19} /></span>{/if}
      <span><strong>{identity.displayName}</strong><small>@{identity.username} · FID {identity.fid}</small></span>
      <Check size={18} />
    </div>
  {:else if channel}
    <div class="farcaster-channel">
      <img src={channel.qrDataUrl} alt="QR code for Sign in with Farcaster" />
      <div>
        <strong>Approve in Farcaster</strong>
        <small>Scan the code on desktop, or open Farcaster on this device. The request expires automatically.</small>
        <a href={channel.url}><ExternalLink size={15} /> Open Farcaster</a>
        <button type="button" onclick={() => void start()}><RotateCcw size={14} /> New code</button>
      </div>
    </div>
  {:else}
    <button class="farcaster-button" type="button" onclick={() => void start()} disabled={loading}>
      {#if loading}<span class="spin"><LoaderCircle size={18} /></span>{:else}<Radio size={18} />{/if}
      {loading ? 'Creating secure request…' : 'Continue with Farcaster'}
    </button>
  {/if}

  <div class="verification-note"><ShieldCheck size={14} />The Farcaster signature and FID are verified before the desk is created.</div>
  {#if error}<div class="auth-error" role="alert">{error}</div>{/if}
</section>

<style>
  .farcaster-auth { display: grid; gap: 11px; }
  .auth-heading { display: grid; grid-template-columns: 27px minmax(0, 1fr); gap: 9px; align-items: center; }
  .auth-heading > span { width: 27px; height: 27px; display: grid; place-items: center; background: #8b5cf6; color: #fff; font: 800 8px/1 'IBM Plex Mono', monospace; }
  .auth-heading > div { display: grid; gap: 3px; }
  .auth-heading strong { font-size: 11px; }
  .auth-heading small { color: var(--muted); font-size: 8px; line-height: 1.4; }
  .farcaster-button { width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #a78bfa; background: #6d28d9; color: #fff; cursor: pointer; font: 800 9px/1 'IBM Plex Mono', monospace; }
  .farcaster-button:hover { background: #7c3aed; }
  .farcaster-button:disabled { cursor: wait; opacity: .75; }
  .identity-card { min-height: 54px; display: grid; grid-template-columns: 35px minmax(0, 1fr) 20px; gap: 10px; align-items: center; padding: 8px 10px; border: 1px solid #4c8b6f; background: #0b1713; }
  .identity-card img, .identity-icon { width: 35px; height: 35px; border-radius: 4px; }
  .identity-card img { object-fit: cover; }
  .identity-icon { display: grid; place-items: center; background: #4c1d95; color: #fff; }
  .identity-card > span:nth-child(2) { display: grid; gap: 4px; }
  .identity-card small { color: #94a99e; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .identity-card > :global(svg) { color: var(--green); }
  .farcaster-channel { display: grid; grid-template-columns: 124px minmax(0, 1fr); gap: 13px; padding: 11px; border: 1px solid #4c3977; background: #100c19; }
  .farcaster-channel > img { width: 124px; height: 124px; background: #fff; }
  .farcaster-channel > div { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding-top: 3px; }
  .farcaster-channel strong { font-size: 12px; }
  .farcaster-channel small { color: #a59bb6; font-size: 9px; line-height: 1.45; }
  .farcaster-channel a, .farcaster-channel button { min-height: 30px; display: inline-flex; align-items: center; gap: 6px; padding: 0 9px; border: 1px solid #8064bb; background: #281c42; color: #fff; text-decoration: none; cursor: pointer; font: 700 8px/1 'IBM Plex Mono', monospace; }
  .farcaster-channel button { border-color: var(--line); background: transparent; color: var(--muted); }
  .verification-note { display: flex; align-items: center; gap: 6px; color: #79857f; font-size: 8px; line-height: 1.4; }
  .verification-note :global(svg) { flex: 0 0 auto; color: var(--green); }
  .auth-error { padding: 9px; border-left: 3px solid var(--red); background: #1b0c12; color: #ff9ab8; font-size: 9px; }
  .spin { animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 520px) {
    .farcaster-channel { grid-template-columns: 94px minmax(0, 1fr); }
    .farcaster-channel > img { width: 94px; height: 94px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin { animation: none; }
  }
</style>
