/**
 * pager-auth — GitHub App OAuth exchange worker.
 *
 * Required env vars:
 *   GITHUB_CLIENT_ID     — GitHub App client ID
 *   GITHUB_CLIENT_SECRET — GitHub App client secret
 *
 * Routes:
 *   POST /exchange  → exchanges an OAuth code for a user access token
 */

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const ALLOWED_ORIGINS = new Set([
  'https://pager.kev.cc',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return jsonResponse({ error: 'Worker not configured: missing credentials' }, 500, origin);
    }

    const url = new URL(request.url);

    if (url.pathname !== '/exchange') {
      return new Response('Not found', { status: 404 });
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return jsonResponse({ error: 'Bad request' }, 400, origin);
    }

    const params = new URLSearchParams(body);
    const code   = params.get('code');

    if (!code) {
      return jsonResponse({ error: 'Missing code' }, 400, origin);
    }

    let ghRes;
    try {
      ghRes = await fetch(GITHUB_TOKEN_URL, {
        method:  'POST',
        headers: {
          'Accept':       'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':   'pager-auth-worker/1.0',
        },
        body: new URLSearchParams({
          client_id:     env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }).toString(),
      });
    } catch {
      return jsonResponse({ error: 'GitHub unreachable' }, 502, origin);
    }

    const data = await ghRes.json();

    if (data.error) {
      return jsonResponse({ error: data.error_description || data.error }, 400, origin);
    }

    return jsonResponse({ token: data.access_token }, 200, origin);
  },
};
