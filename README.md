# pager-auth

Cloudflare Worker that acts as a CORS proxy for the [GitHub OAuth device flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow). Used by [PAGER](https://github.com/thatkevin/pager).

The browser can't talk directly to `github.com/login/oauth` (no CORS headers). This worker sits in the middle, adds the `client_id`, and forwards the request.

## Routes

| Method | Path | Proxies to |
|---|---|---|
| POST | `/device/code` | `github.com/login/device/code` |
| POST | `/token` | `github.com/login/oauth/access_token` |

## Setup

### 1. Create a GitHub OAuth App

Go to **github.com/settings/developers → OAuth Apps → New OAuth App**.

- Homepage URL: your PAGER URL
- Authorization callback URL: your PAGER URL (not used by device flow, but required)
- Tick **Enable Device Flow**

Copy the **Client ID**.

### 2. Deploy to Cloudflare

Connect this repo to a Cloudflare Worker via the dashboard, or use Wrangler:

```bash
npx wrangler deploy
```

### 3. Set the environment variable

In the Cloudflare dashboard: **Workers & Pages → pager-auth → Settings → Environment Variables**

| Name | Value |
|---|---|
| `GITHUB_CLIENT_ID` | your Client ID from step 1 |

### 4. Allow your domain

The worker restricts CORS to specific origins. Update `ALLOWED_ORIGINS` in `index.js` if you're hosting PAGER somewhere other than `pager.kev.cc`.

## Security

- `client_id` is injected server-side — the client never supplies it
- Any `client_secret` in the request body is stripped before forwarding
- CORS is restricted to the allowed origins list
- No data is logged or stored
