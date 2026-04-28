# pager-auth

Cloudflare Worker that handles GitHub App OAuth for [PAGER](https://github.com/thatkevin/pager). Exchanges an OAuth authorisation code for a user access token, keeping the `client_secret` server-side.

## How it works

1. User clicks "Login with GitHub" in PAGER
2. Browser redirects to GitHub's OAuth screen — user picks which repos to grant access to
3. GitHub redirects back to `pager.kev.cc/callback.html?code=...`
4. Callback page POSTs the code to this worker's `/exchange` endpoint
5. Worker exchanges code + secret for a token and returns it
6. Token stored in `localStorage`, user is in

## Routes

| Method | Path | Description |
|---|---|---|
| POST | `/exchange` | Exchanges OAuth code for access token |

## Setup

### 1. Create a GitHub App

Go to **github.com/settings/apps → New GitHub App**.

- Homepage URL: `https://pager.kev.cc`
- Callback URL: `https://pager.kev.cc/callback.html`
- Webhooks: uncheck Active
- Permissions: Repository contents (Read & Write), Metadata (Read-only)
- Where can it be installed: Any account

After creating, generate a client secret.

### 2. Deploy to Cloudflare

Connect this repo to a Cloudflare Worker via the dashboard, or:

```bash
npx wrangler deploy
```

### 3. Set environment variables

In the Cloudflare dashboard: **Workers & Pages → pager-auth → Settings → Environment Variables**

| Name | Value |
|---|---|
| `GITHUB_CLIENT_ID` | Client ID from your GitHub App |
| `GITHUB_CLIENT_SECRET` | Client secret from your GitHub App |

### 4. Update PAGER config

In `pager/docs/js/config.js`, set `githubClientId` to your GitHub App's client ID.

### 5. Allow your domain

Update `ALLOWED_ORIGINS` in `index.js` if hosting PAGER somewhere other than `pager.kev.cc`.

## Security

- `client_secret` never leaves the worker
- CORS restricted to allowed origins
- State parameter validated client-side to prevent CSRF
- No data logged or stored
