# GitHub Pages migration of the **existing Version 6** — development branch

Status: **Not deployed, not verified in live browsers.** This folder contains the same v6 game and session logic,
with a static React/Vite entry and a separate Cloudflare Worker entry. The original Sites project and its D1,
the earlier v5 recovery and the GitHub Pages legacy /arena/ demo are unchanged.

## Why the backend must stay separate

GitHub Pages is static hosting. The existing v6 uses a D1 SQL database, authenticated API calls,
server-owned scoring, player recovery, and secrets kept off the client. Publishing these as browser code
would expose the trainer/player authorization system. The Pages frontend is at
`https://hazemshaaban77.github.io/MTS-Training-Arena/v6/` once approved for deployment.
The backend stays on a new **isolated Cloudflare Worker + D1**; it is not the old
`mts-training-arena-api` Worker.

## Before any production deploy

1. Provision a **new** D1 database named `mts-training-arena-v6`; replace the all-zero UUID in
   `wrangler.github.toml` with that new database UUID (not the Sites production DB).
2. Apply the six `drizzle/000[0-5]_*.sql` migrations **once and in order** on that new database.
   Confirm it is empty before doing so.
3. Publish a separately bundled `github-api-worker.ts` using that Wrangler file. Configure an optional
   `ARENA_ADMIN_UIDS` value and `FIREBASE_SERVICE_ACCOUNT` **only as a Worker secret**, never in Git.
4. Confirm Firebase Auth Email/Password and the existing `arenaV1/trainerAllowlist/<uid>`
   access rules are valid. Do not weaken RTDB permissions or push Firebase keys to the frontend.
5. Configure `VITE_ARENA_API_ORIGIN` as the exact `https://...` origin (without a trailing slash or path)
   of the new Worker. Builds on GitHub without this value intentionally fail safely with
   `API_NOT_CONFIGURED` when users try server-backed features.
6. Use `pnpm install --frozen-lockfile`, `pnpm run test`, and
   `pnpm run build:github` from `work-site-recovery-v6/` to build the static frontend.
   Inspect `dist-github` without publishing it.
7. For Github Pages, place `dist-github` under a top-level `v6/` directory in the Pages
   artifact *alongside the existing index.html and arena/ demo*. Never replace the legacy
   Pages artifact wholesale. Avoid auto-deployment while tests are failing.

The private `chatgpt.site` D1 user data is **not** in this repository. To preserve sessions,
results or existing surveys, authorized operators must export/restore that data privately into
the isolated target database. Deploying a new empty D1 database will NOT show old sessions.

## Guest and projector routing

Each session has one QR generated with `siteUrl('join',code)`. The URL goes to the GitHub Pages frontend,
not to Firebase or ChatGPT. Player joins remain API-managed guest sessions; trainer authentication
continues to use Firebase JWT validation/allowlist and owner checks. The standalone display lives at
`?view=display&code=NNNNNN`. The API checks an exact allowed `Origin` and does not enable
credential-bearing CORS wildcard access.

## Safety gates

No Cloudflare production worker/database is overwritten. No merge to `main`.
All pages and backend migrations require separate browser/real-device verification before public use;
employee IDs, scores and tokens must not appear in the GitHub public source or build artifacts.
