# MTS Training Arena — Experience 2 integration baseline / 2026-11-05

Status: **INTEGRATION CANDIDATE / NOT RELEASED**. Branch created from `feature/arena-e2-luxury-crown-wheel-20261105` at commit `a07d0ff836063edcd8ab7e4b2bafb84d0ef280ba`. The baseline includes ancestor work from E2 staging E2E, per-activity reveal, and approved brand stage; these branches were not cherry-picked or merged separately.

## Verified by read-only repository inspection
- E2 staging branch is an ancestor of wheel: +68 commits, behind 0.
- Approved brand branch is an ancestor of wheel: +25 commits, behind 0.
- Changed wheel files versus approved branding include `ArenaWheel3D.tsx/.css`, `Session.tsx`, `lib/client.ts`, `lib/session-games.ts`, test scripts and workflow.
- E2 reports document a **successful** isolated workflow for code commit `5d010568328b34e996225caf81d57ed0f7275fbc`: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41996667260 . This is documentary evidence; the workflow result was not independently retrieved during this audit. Current branch head `a07d0ff` includes documentation-only changes relative to that code checkpoint per commit description, but new full HEAD CI status is not confirmed.
- CI workflow `.github/workflows/arena-e2-staging-e2e.yml` includes `pnpm test`, GitHub frontend build, SQLite-backed synthetic API, multiple Chromium clients, reveal browser QA, wheel browser QA and screenshot artifact. This integration branch is **not yet added to automatic workflow push triggers**.
- Source provenance of current live private Sites deployment is still unproven; Cloudflare Worker and Pages version IDs do not establish a source Git SHA. This is a release blocker.

## Feature register — confirmed code vs acceptance
| Area | Evidence | State / next gate |
|---|---|---|
| Existing V6 QR/session foundation | V6 integration work and synthetic multi-client tests recorded | Implemented; physical phones, anonymous guest access and real Firebase login pending |
| E2 lobby/intro | experience-2-preview, V6 stage and visual reports | Prototype/integration in candidate; final branded real-session acceptance pending |
| Approved MTS/Arena/Training Team brand | Sprint07 branding report, component and binary hash test | Implemented; final physical screen approval pending |
| Question reveal per activity | server policy, React UI and isolated tests | Implemented; live concurrency acceptance pending |
| Premium wheel | 3D component, server-scheduled 3-sec countdown, server signed result, duplicate rejection, browser tests | Implemented; physical GPU, mobile, fallback and challenge-card trainer grading pending |
| Projector | V6 display bridge and isolated Chromium test | Implemented pilot; live connectivity/privacy and real projector acceptance pending |
| Mystery boxes and manual grade | Legacy functionality referenced | Audit feature inventory before changing; do not claim E2 final |
| Leaderboard / podium | Legacy scoreboard and branded victory | Visually and functionally revalidate, 2/5 actual phones |
| Power-ups, Redemption, alternate modes, Word Cloud, interactive video, confidence, smart repetition, advanced reports | Master plan | Pending, unless independently demonstrated by feature inventory and tests |

## Gate 0 and next execution order
1. Freeze this branch as auditable integration baseline. Preserve `main` and all earlier feature branches; do not publish, merge or touch live Firebase, Workers, D1, or Pages.
2. Confirm the code SHA of live private Sites V6 and match to source, otherwise keep E2 in isolated demo/staging only.
3. Obtain and verify latest successful CI at **this exact branch head** (or demonstrate documentation-only delta against green code SHA); inspect logs and artifact evidence; run full automated suite against immutable commit.
4. Perform non-mocked staging acceptance: trainer permitted account, anonymous trainee entry, QR camera scan, two then five physical phones, real projector 1366 and 1920, duplicate answers, wheel countdown, no early answer reveal, reload/disconnect, score ledger and privacy.
5. Finish wheel challenge card and trainer manual score award/deduction with logged reason and server ledger. Run regression tests, then boxes/leaderboard. 
6. Only after Gates 0–3, implement the ten Experience 2 planned innovations in priority order and document each test.
7. Before any release require explicit owner approval, rollback and verified source/deployment mapping.

## Current execution record
- 2026-11-05: created **a separate candidate branch** from latest identified wheel branch; no feature-code changes, merge to main, release or production configuration changes.
- Direct inspection of GitHub workflows, V6 package scripts, wheel/reveal/branding reports, E2 master plan and branch ancestry performed. **No new automated test suite was executed in this audit**.

## 2026-11-05 follow-up — CI evidence and automatic trigger
- Independently read workflow run `41996667260` via GitHub Actions jobs endpoint. The `ephemeral-v6-real-api` job (ID `127141410322`) concluded **success**, and all reported steps concluded success: dependencies, baseline V6 authorization and scoring, public-stage contract, local build, temporary SQLite HTTP API, Chromium 2/5 clients, manual/auto reveal, wheel mobile/projector, and screenshot artifact.
- Artifact `13401155746` / `arena-e2-sprint05-ephemeral-real-api-e2e` exists, was not expired at inspection, and belongs to tested source SHA `5d010568328b34e996225caf81d57ed0f7275fbc`. This is synthetic CI evidence only, not evidence of real devices or live backend.
- Added `work/arena-e2-integration-audit-20261105` to `.github/workflows/arena-e2-staging-e2e.yml` push branch filter, retaining `workflow_dispatch`; workflow remains no-deploy, temporary SQLite, read-only repository permissions, and no production credentials.
- Workflow configuration update commit: `e5b517ca2b19d4d251f52b4993baac60d1123433`. This update itself matches the workflow path filter, but **a new run has not yet been independently confirmed**. GitHub may suppress workflow triggers for pushes originating from certain automation tokens. Do not claim new full-head green until a matching completed run is found.
- At audit time, GitHub commit combined-status endpoint for this new commit returned no legacy statuses; absence of statuses is not equivalent to failure or success.
- Release remains BLOCKED for exact live Sites source mapping, current-head CI verification, authorized isolated staging and physical mobile/projector tests.
