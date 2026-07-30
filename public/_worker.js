export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const response = await env.ASSETS.fetch(request)

    if (url.pathname !== '/.well-known/farcaster.json') {
      return response
    }

    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Content-Type', 'application/json; charset=utf-8')
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  },
}
