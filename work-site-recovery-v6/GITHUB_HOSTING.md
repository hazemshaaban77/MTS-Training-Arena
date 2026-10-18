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

1. **Completed:** Provisioned isolated D1 `mts-training-arena-v6` on Workers Free and connected its ID in `wrangler.github.toml`. Its six schema migrations have been applied once and the 12 application tables verified; the original Sites database is unchanged.
2. **Free-only mode (current decision)**: R2 is not enabled, and no R2 binding is configured.
   Uploaded media remains disabled (`MEDIA_UNAVAILABLE`); use direct HTTPS image/video links
   within activities instead. Do not enroll in R2 or enable paid services without separate approval.
3. Apply the six `drizzle/000[0-5]_*.sql` migrations **once and in order** on that new database.
   Confirm it is empty before doing so.
4. Publish a separately bundled `github-api-worker.ts` using that Wrangler file. Configure an optional
   `ARENA_ADMIN_UIDS` value and `FIREBASE_SERVICE_ACCOUNT` **only as a Worker secret**, never in Git.
5. Confirm Firebase Auth Email/Password and the existing `arenaV1/trainerAllowlist/<uid>`
   access rules are valid. Do not weaken RTDB permissions or push Firebase keys to the frontend.
6. Configure `VITE_ARENA_API_ORIGIN` as the exact `https://...` origin (without a trailing slash or path)
   of the new Worker. Builds on GitHub without this value intentionally fail safely with
   `API_NOT_CONFIGURED` when users try server-backed features.
7. Use `pnpm install --frozen-lockfile`, `pnpm run test`, and
   `pnpm run build:github` from `work-site-recovery-v6/` to build the static frontend.
   Inspect `dist-github` without publishing it.
8. For Github Pages, place `dist-github` under a top-level `v6/` directory in the Pages
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

## Development progress (not a deployment claim)

- V6 React routes have GitHub Pages base paths for QR, join, and standalone projector.
- The existing API service was adapted to a strict single trusted GitHub Pages origin.
- In-Session Studio multiquestion surveys can be created and attached without leaving the editor.
- Activities and nested quiz questions can contain HTTPS image/video; authenticated R2 upload is
  available when the new Worker and bucket are deployed.
- Incorrect selected answers are distinguished in red after the correct answer is revealed.
- The timer pulses and optionally sounds during its final five seconds; game entrances are
  1.45-second themed and skippable with a reduced-motion fallback.
- `.github/workflows/v6-github-validation.yml` compiles and tests the source on an isolated
  development branch without updating main or auto-deploying the current GitHub Pages site.

A passing CI build is not a substitute for verifying trainer login, a 60–80-person session,
phone/projector synchronization, guest access, or media playbacks on a deployed domain.

## 2026-10-18 free-only setup verification

The account's subscriptions screenshot explicitly shows **Workers Free — Active**. We created the
isolated D1 database and executed schema migrations successfully through the connected Cloudflare account.
R2 is deliberately disabled. No Workers Paid upgrade was made; no production worker or Pages site was
published by these steps. Under the Free plan, limits are hard caps, not permission to bill.
