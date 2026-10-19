// Alternative entry point for networks that cannot resolve *.workers.dev.
// Deploy on Cloudflare Pages (Free), with the API service binding pointing to
// mts-training-arena-v6-api. No keys, data storage, or impersonation.
const expectedOrigin = 'https://hazemshaaban77.github.io';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/media/')) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const origin = request.headers.get('Origin');
    if (origin && origin !== expectedOrigin) {
      return Response.json({ error: 'ORIGIN' }, { status: 403 });
    }
    const upstream = new URL('https://mts-training-arena-v6-api.hazem-mts-arena.workers.dev');
    upstream.pathname = url.pathname;
    upstream.search = url.search;
    try {
      // Request headers (including Firebase credentials), method and body are preserved.
      // Binding calls the existing Worker internally, retaining its own authorization,
      // CORS, rate limits, data validation and room access controls.
      return await env.API.fetch(new Request(upstream.toString(), request));
    } catch {
      return Response.json({ error: 'API_UNREACHABLE' }, {
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': expectedOrigin,
          'Cache-Control': 'no-store',
        },
      });
    }
  },
};
