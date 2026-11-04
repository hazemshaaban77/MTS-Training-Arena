# MTS Training Arena Experience 2.0 — Sprint 05 / Local Full-Stack Integration

**Validated:** 2026-11-04  | **Branch:** `feature/arena-e2-staging-e2e-20261104`  
**GitHub Actions run (PASS):** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41846846579

## What really passed

This is **actual V6 server application logic over HTTP**, not a mocked API. The test starts the existing V6 `handleArenaRequest()` and original `service.ts` + `session-games.ts` in a locally bound Node fixture, backed by a newly created **in-memory SQLite DB with real V6 migrations**.

- One temporary session code, one canonical V6 join URL across all rounds.
- Two separate Chromium browser contexts act as two independent players first, then three more join late.
- Session creation, player registration and `POST /api/answer` use the unchanged V6 endpoint logic.
- Trainer `start`, `close`, `revealkey`, `approve`, `next`, `finish` use unchanged V6 endpoint logic with revision checks.
- An unauthenticated client cannot create or control sessions.
- A duplicate answer is rejected with 409 and does not award duplicate points.
- Late joining players stay pending until trainer approval and cannot participate in the current round.
- Answers stay hidden from public state/projector before the trainer's explicit reveal.
- A separate **real-browser read-only E2 projector** polls the same local HTTP API and displays the authoritative scores.
- Final scores in both V6 server state and projected view: Lightning 3,000 / Wave 1,000.
- An attendee can open another browser context with their saved session player token and recover their previous `mine.id` and points.
- The projector DOM shows no fixture employee IDs, trainer credential token, or participant tokens.

**Evidence:** The GitHub Actions run above includes a downloadable artifact with four synthetic stage screenshots (lobby, locked without key, revealed answer, final team standings).

## Important limits (do not overstate)

- The trainer verifier is **a controlled local stand-in**, not a real Firebase login or employee allowlist; existing V6 auth tests separately exercise Firebase RS256 and workerd.
- Each "mobile" is an independent **Chromium browser context**, not a physical phone. Browser clients use `fetch` to invoke real player APIs, rather than clicking through the actual React participant form.
- The projector is a real Chromium page served over real local HTTP, but not a physical projector.
- Uses **HTTP polling**, not live Durable Object/WebSocket fanout.
- The QR **URL** is stable and verified; camera scanning and image generation are not part of this test.
- No Cloudflare staging deployment was created. No production Worker, Pages, Firebase security rule, database, secrets, or `main` branch was changed.
- The active production Worker (V9, 2026-10-27) is not yet proven byte-identical to the candidate Git source. This remains an explicit release blocker.
- No employee data enters this fixture: fabricated IDs prefixed `QA-ONLY-` and artificial names are used.

## How to re-run locally (Node 24)

Run inside `work-site-recovery-v6` on a **fresh checkout** of this feature branch:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run build:github
mkdir -p .sites-runtime/e2-staging-qa
pnpm exec esbuild e2-staging-qa/staging-local-server.ts --bundle --platform=node --format=esm --target=node24 --outfile=.sites-runtime/e2-staging-qa/staging-local-server.mjs
# Playwright v1.56.1 + Chromium are installed separately by the CI workflow.
node e2-staging-qa/real-session-browser.mjs
```

The fixture refuses to start unless `E2_FIXTURE_EXPLICIT=local-only`, binds **127.0.0.1** only, uses an in-memory database, and returns no real credentials. The browser runner sets that switch automatically for its child process.

## Next stage gates

1. Test the **actual React trainee joining/responding** in two browser contexts and compare to the API-level flow.
2. Verify an authoritative deployment source/commit for the actual V6 site and reconcile parallel fix branches.
3. Create a **separately authorised** external staging environment (own D1, Durable Objects, separate Firebase allowlist) before testing on physical phones.
4. Test signed Firebase trainer login, single QR scan on two real phones then five, true projector hardware, clock drift, dropped connections and reconnect, and real DO event fanout.
5. Confirm wheel, boxes, reveal timing, manual scoring with audit ledger and no duplicate credit on the server.
6. Record measured network-latency metrics and full 60–80-person load with bounded monthly cost. Then seek owner acceptance and an explicit release instruction.

## Source files

- `e2-staging-qa/staging-local-server.ts` — no-deploy actual API/SQLite fixture, no secrets.
- `e2-staging-qa/real-session-browser.mjs` — reproducible five-client, two-round browser/HTTP E2E.
- `work-site-recovery-v6/public/e2-preview/live-projector.html` — independent read-only E2 projector.
- `.github/workflows/arena-e2-staging-e2e.yml` — test-only GitHub workflow.

Master plan: https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
