# Experience 2.0 — Stage 3 Read-Only V6 Projector Bridge

**Status:** implemented and under isolated QA, not deployed or scored production.

## Actual Cloudflare V6 deployment inventory (read-only, 2026-11-04)

- Worker: `mts-training-arena-v6-api`, **version 9** (`0bd66ec0-39f5-4eaa-8627-11c5b10b6e13`), last deployed **2026-10-27 12:06 UTC**; 100% traffic. Its API deployment does **not** contain a Git commit hash in its available metadata.
- Worker version script etag: `107afb06369f8502d91ccd52c70d6346e55b041425cb67d48305276b21cc2472`. No access to source content or secrets was required.
- Cloudflare Pages gateway `mts-training-arena-v6-gateway`: latest production deployment `1d6f7e09-732c-4a5d-a768-2a66c9ab5c69` from **2026-10-19 10:20 UTC**, ad hoc and without Git commit_hash. Pages has a service binding to V6 API.
- These identify deployed *Cloudflare infrastructure versions* but **not** an authoritative source SHA for the latest *private Sites app*. Continue to block production integration.
- Optional, read-only `e2-staging-qa/worker-provenance.mjs` checks candidate GitHub bundle SHA-256 values against the deployed Worker etag. This is not a substitute for source attestation; mismatches may arise from bundling and metadata.

## New code

- `public/e2-preview/v6-public-stage.mjs` — strict V6 `/api/state` GET reader, stable `?view=join&code=123456` URLs, protection for GitHub Pages `/MTS-Training-Arena/v6/` path, safe read-only field allowlist, server-confirmed reveal, revision guard, fail-closed errors.
- `public/e2-preview/live-projector.html` + `live-projector.mjs` — independent branded projector, **no auto-connect**, explicit 6-digit test code and HTTPS API URL, the approved original Arena image, local original MTS and Training Team logos, team standings and questions from server data only.
- `e2-staging-qa/public-stage.test.mjs` — 11 Node tests covering link hygiene, player/answer redaction in the **display adapter**, server-only reveal, stale/malformed snapshots, public GET with no tokens, CORS/network errors.
- `e2-staging-qa/live-projector-qa.mjs` — Chromium test using a **mocked** public API (no real user records); explicit connect, correct frontend join base, header images, no answer leak, timer lock/reveal, fail-closed network error, stop polling, mobile and projector presentation.
- Existing Sprint 02 demo and baseline V6 files are preserved.

## Try safely

Build the V6 candidate frontend locally, then serve its static output. Open `/e2-preview/live-projector.html`. It remains idle until a tester explicitly enters:
1. A separate **authorized test API origin** with public CORS access.
2. The **canonical frontend base URL**, not the API URL (GitHub Pages V6 base has a subpath).
3. A **6-digit test session code**.

The stage **never** modifies sessions, joins players, awards points, writes a score, or sends trainer tokens/cookies. It only requests anonymous/public `GET /api/state?code=...`. If the service rejects public access, it displays an error and no invented results. The UI deliberately strips individual names, employee IDs and host settings; the underlying V6 API may already deliver some approved-player metadata to clients, which requires its own server-side privacy review.

Do **not** connect this pilot to the live employee database for demonstration. Use disposable sessions and a separate authorized environment. Do **not** give trainee users the ability to perform trainer actions.

## Acceptance gates and limitations

- CI succeeds: `node --test e2-staging-qa/public-stage.test.mjs`; `node e2-staging-qa/live-projector-qa.mjs` and the baseline V6 checks.
- The browser QA uses a mocked public endpoint and simulated phone/projector viewports, **not** a real live room or physical hardware.
- Real V6 backend **version 9** contract compatibility, private Sites deployment source, frontend/CORS gate, true WebSocket fanout, idempotent grading and room lifecycle need separate integration proof.
- Do not merge or release without the user's explicit approval and rollback.
