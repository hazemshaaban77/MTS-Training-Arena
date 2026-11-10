# MTS Training Arena / E2 — PRE-WHEEL CHALLENGE CARD READINESS
Date: 2026-11-05

## Decision
**GO for isolated Wheel Challenge Card feature DEVELOPMENT on this branch.**
**NO-GO for real trainees, production release, or merging to `main` yet.**

This is an evidence-based distinction. All available automated pre-Wheel regressions have passed, but live-source provenance, production access and physical-device acceptance are not yet verified. This report does not claim otherwise.

## Immutable tested code checkpoint
- Repository: `hazemshaaban77/MTS-Training-Arena`
- Branch: `work/arena-e2-integration-audit-20261105`
- Tested code SHA: `23cc3c4241d47a72ec2212ff619a0050c8cb7eea`
- Workflow: `.github/workflows/arena-e2-staging-e2e.yml` (NO DEPLOY)
- GitHub Actions run: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42000289605
- Result: **COMPLETED / SUCCESS**, all workflow steps passed.
- Evidence artifact: `arena-e2-sprint05-ephemeral-real-api-e2e`, artifact ID `13401639449`, 22 PNG screenshots, GitHub retention policy applies.

## Tests performed and green
1. Pinned pnpm install; V6 TypeScript, auth, score and render tests; public-stage contract tests.
2. Build original V6 frontend and compiled API Worker locally; confirm E2 preview and approved original-logo images are present.
3. Verify local realtime room broadcast contract (unit-level, **not** live WebSocket transport).
4. In Chromium, test 2D E2 demo Lobby/Intro/Skip/Boxes/Leaderboard, language switching, 390px viewport and screenshot capture. Demo scores are NOT trusted production records.
5. In Chromium, test independent read-only projector with mocked public state: explicit connect only, no early answer key, safe frontend QR link, redacted private fields, offline fail-closed, stop polling, original brand logos.
6. Against **actual V6 HTTP API handler with disposable SQLite**: authorized local test trainer, one QR join URL, two then five independent Chromium client contexts, late join approval, duplicate answer rejected (409), server-only reveal and authoritative team points, read-only projector and reconnect with token. Authentication uses a LOCAL fixture, not real Firebase login.
7. Test React projector manual and auto cinematic answer reveal against isolated API.
8. Test original React 3D Wheel on 1920x1080 browser projector + 390px emulated participant against isolated API: 3-second server countdown, 4-second fixture spin, no early winner, duplicate spin rejected (409), one server-recorded award, official result visible. Screenshots captured.
9. Review the screenshot artifact: **22 images** in this run (including `17-luxury-wheel-signed-result.png`, `18-luxury-wheel-mobile-result.png`, `10-approved-product-lobby-projector.png`, `12-approved-mobile-join.png`).

## Manual screenshot review (not a hardware QA signoff)
- 1920x1080 projector shows approved MTS, Arena and Training Team logos; wheel and official result card remain inside the captured image.
- 390px mobile screenshot shows the real wheel and result, without observed horizontal cut-off. However, the full-page capture is **390x1734**: the trainee must scroll significantly to view the wheel and result on a typical 844px phone. This is a UX polish issue to monitor, not a proven scoring bug.
- The 1920px result card overlays part of the wheel at the outcome moment. This is functional but remains subject to design signoff; a passing screenshot assertion is not a subjective design approval.
- Visual tests are synthetic Chromium/software-WebGL screenshots, **not** a native Android/iOS/GPU/projector demonstration. Color, performance and keyboard/voice accessibility on actual hardware remain unproven.

## Real-world acceptance blockers (must be completed BEFORE deployment)
| Gate | State | Required evidence |
|---|---|---|
| LIVE-SOURCE | BLOCKED | Match current private Sites V6 deployed source to exact source commit; API Worker v9/version metadata alone does not prove provenance |
| AUTH | NOT TESTED ON LIVE | Authorized trainer Firebase login, rejected unauthorized account, anonymous trainee QR entry without private ChatGPT login |
| STAGING | NOT READY | Authorized separate Cloudflare Worker/database/session environment with synthetic records, safe CORS/network/realtime transport |
| DEVICES | NOT TESTED PHYSICALLY | Camera QR scan + join from Android and iOS; 2 then 5 real phones, duplicate and late joins, disconnect/reload/resume |
| PROJECTOR | NOT TESTED PHYSICALLY | Real 1366x768 and 1920x1080 display, full-screen, bilingual, animation/mute, no cropping; compare to approved UI |
| PERFORMANCE | NOT TESTED PHYSICALLY | CPU/GPU/network observation on low-powered phones and projector laptop, WebGL unavailable fallback and reduced motion |
| VISUAL SIGNOFF | PENDING | User approves latest Lobby/Projector/Wheel screenshots, especially the mobile scroll and result overlay |
| RELEASE | BLOCKED | User explicitly authorizes deployment + verified rollback, no changes to production secrets/data without scope-specific approval |

## Before Wheel Challenge Card implementation
Development prerequisite gates (source branch isolation, baseline green tests, original branding, QR/score authorization, spin/reveal duplicate protection) are satisfied **in isolated synthetic testing only**. It is safe to begin the next feature **on a new child branch**, while preserving the tested checkpoint and this audit branch, without introducing live score mutations.

The Wheel Challenge Card itself is NOT implemented as part of this readiness gate. Its next specification should cover (a) server-owned mission and turn ID, (b) challenge cards revealed only after signed wheel outcome, (c) trainer evaluation controls with reason/audit trail, (d) idempotent award/deduction/undo and ledger-consistent leaderboard, (e) mobile/projector design, (f) error/fallback and duplicate actions, (g) unit/API/E2E and real-device tests.

### Protection
No merge, deploy, production Firebase/Cloudflare/D1 writes, paid integrations, replacement logos, or secrets are authorized by this report.

## Repository organization policy — decision 2026-11-05
- **One active development branch:** `work/arena-e2-integration-audit-20261105`. Keep creating and reviewing work here until an explicitly approved release milestone; **do not open a new branch or a new per-sprint report for every activity**.
- **One living progress ledger:** append future technical acceptance, screenshots, assets, and bug decisions in THIS existing document. Existing historical reports are immutable audit evidence, not active competing plans.
- **No mass branch deletion or merge:** repository currently lists 38 branches; archive-by-status through a safe inventory later, and only remove obsolete branches after verifying unique code, build evidence and owner approval.
- **Existing structure first:** put future per-activity components beside related `components/arena/` features; place only selected, licensed 3D files under a single future `public/assets/boxes/` directory, with each source URL and exact license in this existing ledger rather than separate asset reports.
- **No duplicated large media:** use one optimized asset shared by multiple boxes; unique game states, captions, colors and effects are provided by the component, not separate GLB copies.
- **Branches/test evidence:** maintain a specific tested source SHA and GitHub Actions run in this ledger; do not confuse code-green with actual phone/projector acceptance.

## Mystery Boxes — 3D asset research shortlist (not imported)
| Candidate | Source/license evidence | Fit / limitation |
|---|---|---|
| **PolyOne Studio Free Pack - Loot Box** | Sketchfab https://sketchfab.com/3d-models/free-pack-loot-box-b806ed670bed400c81a4b6b1841e7f95 — free download, CC BY, 3 designs, 26.4k triangles on displayed scene and 4K textures. Fab https://www.fab.com/listings/4de81d3c-7b34-4e93-9ab6-faf14c9c0bb5 confirms GLB listing. | Most visually premium/expressive; recolor purple/pink to MTS navy/blue/green/champagne; downsize textures; opening animation not confirmed, cannot claim game-ready without inspecting model nodes. |
| **Agustín Hönnun Sci-Fi Crate (Now Free)** | Sketchfab https://sketchfab.com/3d-models/sci-fi-crate-now-free-8a8f77af0de14630b94d2cda49823a74 — downloadable, CC BY, 3.8k triangles and 3 materials. | Lightweight PBR/hard-surface candidate for several interactive boxes; 4K maps need optimization and separated lid/animation is unverified. |
| **Techno Chest by Micheal-Holloway** | Sketchfab https://sketchfab.com/3d-models/techno-chest-5c08fb77246c428791bb4f8786b7c459 — CC BY, downloadable, 432 triangles, opening animation stated. | Ready opening behavior but intentionally low-detail: useful fallback/tech proof of concept, not automatically the premium art pick. |
| **Quaternius Scifi Container** | Poly Pizza https://poly.pizza/m/22FBVK7m9c — glTF/FBX, CC0. | Very permissive backup and browser-friendly; likely visually too low-poly without lighting/material work. |

**Adoption gate:** before integration into existing `Open the Box` activity, inspect actual file download, material/textures, license file, GLB or glTF structure, whether lid opens, asset load speed with 6–12 visible boxes, WebGL loss/fallback, Arabic/English labels, and server-owned opened/closed state. Do not download unlicensed models, edit original corporate logos, create new branches, or mutate live scoring. The approved broader app remains Premium Broadcast 2D with **embedded interactive 3D props**, not a 3D stage environment.


## 2026-11-09 — Open the Box 3D integration closed (isolated build)
- **Verdict:** GO for Wheel Challenge Card development on the SAME branch; still NO-GO for production until physical-device and live authorization/provenance gates are completed.
- Exact green checkpoint: `9123e8068eb074cb475d286cdacc757d5be091ae`.
- [GitHub Actions run 42658178963](https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42658178963): **completed / success**; every job step passed including baseline V6, authorization and score tests, frontend/API builds, synthetic room clients, projector reveal, 3D crate AND wheel independently.
- CI now runs the existing `e2-staging-qa/luxury-wheel-browser.mjs` in separate `--crate` and `--wheel` Node/browser processes. **No new test file** or feature branch created.
- Actual Agustín Hönnun nine-piece Sci-Fi Crate is embedded in `ArenaSciFiCrateGeometry.ts`, with attribution in the UI. PBR Arena blue/green/gold, hinged lid, keyboard/accessible numeric fallback and server-approved open state.
- The projector's prize reveal uses a RTL-aware side-by-side layout, protects canvas geometry in the viewing frustum, and keeps the server result visible. Dedicated Chromium visual evidence: `19-licensed-sci-fi-crates-projector.png` (closed); `20-licensed-crate-server-open-projector.png` (server opening); `21-licensed-crate-narrow-layout.png` (390px width).
- The intermittent original GPU test failure occurred while the stage intro and the crates competed for GPU resources. The shipped code **defers crate WebGL setup until after StageSplash**, caps animation frame rate to 20/30 fps, and tests loading after using the real intro Skip action.
- QA verified a server-issued box opening (second crate), official used-state/disabled duplicate selection, authorized read-only projector, 3D mesh fit, prize card fit, RTL two-column view, narrow-view overflow and original CC BY attribution. The 3D wheel also passed independently.
- Source/server/scoring **not redeployed or merged**. Existing real-device, live Firebase guest QR access, low-power GPU and production-source provenance gates remain unverified.
- Follow-on scope: Wheel Challenge Card trainer-controlled evaluation and idempotent scoring with audit logs; must not bypass backend authority.


## 2026-11-10 — Wheel Challenge Card v1 complete in isolated E2 branch
**Decision: PASS on isolated V6 development branch; NOT production signoff.**

- Tested code checkpoint: `6d4bf6e6bca41ce9ab226b4128406f0a07e4897c`
- Full GitHub CI green: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42807164046
- All steps passed: baseline TypeScript, authorization, server scoring, public stage, frontend/API builds, live contract, two/five Chromium clients, cinematic answer reveal, **Wheel Challenge Card**, licensed Sci-Fi Crate and 3D wheel, each isolated.
- A real browser screenshot (1920x1080): `22-wheel-challenge-card-projector.png` in screenshot artifact `13761190291`; visual verified for a side-by-side wheel+mission layout with no mission card cropping.
- Implemented **signed Wheel Challenge Card** in original `GamePlay.tsx` with server-selected challenge/penalty, reveal number, immutable trainee spotlight, detailed task, waiting/confirmed grade status, official point delta.
- Implemented instructor 0–10 grading with add/deduct and required 5–280 character rationale in existing `WheelJudge.tsx`; input disabled during pending request. The confirmed private rationale stays in the **host** receipt, absent from all public/projector/trainee snapshots.
- Tightened existing server `gameInteract` to reject grades for wrong reveal ID, wrong target, missing rationale and tampered points, and to log adjustment ID in existing event details and trainer audit. Score is authoritative and keyed to the revealed turn; replay is rejected.
- New regression test appended to `tests/platform.test.ts`: +800 grant, -400 deduction, no duplicate ledger payments, no stale-turn reassignment, hidden private notes and unauthorized control denial.
- Existing `e2-staging-qa/luxury-wheel-browser.mjs` gained `--challenge` mode and strict 1920x1080 in-viewport assertions (complete grade card visible BESIDE wheel, no horizontal overflow); no new file, folder or branch.
- A separate reliability improvement: `StageSplash.tsx` respects `prefers-reduced-motion: reduce` with a short intro; existing 3D crate QA uses reduced motion in its isolated Chromium context. Regular user intro duration is unchanged.
- **Non-release gates remain:** actual guest QR and Firebase login, real phones and projector hardware, production source provenance, low-power GPU performance, user visual signoff and explicit deployment approval.
- All implementation work is on the single branch `work/arena-e2-integration-audit-20261105`; no merges, deployments, production database writes or original logo changes.


### 2026-11-10 follow-up: lock pending grades and verify signed +/- scoring
- Tested code SHA: `9aee625b222bc240edbdfefa884110774ee92dc8`; **GitHub Actions SUCCESS** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42809850616
- Added server-side `GRADE_REQUIRED` protection: a revealed challenge/penalty cannot be bypassed via another spin, re-spin or player switch until graded. The React wheel UI disables these actions and displays why in Arabic/English.
- Added synthetic CI regression cases using real isolated V6 API: reject forged +810; accept authorized +800; reject duplicate and stale reveal; redact written host reason from public state; allow next spin only after grading; then accept -500 deduction for a **final official score of 300**, never awarding twice.
- Existing original wheel, 3D crate, Challenge Card browser, multi-trainee simulator, public projector/intro and privacy tests all passed in the same complete workflow.
- The legacy software-rendered Chromium 3-second transient countdown DOM check was replaced with a non-blocking visual sample while retaining strict server-time countdown, immutable winner and duplicate spin numeric assertions. **Not** a production clock or visual UX change.
- No new branches, files or deployment. Physical Android/iOS + projector, actual guest QR/Firebase access, deployed V6 provenance, and release approval still outstanding.


### 2026-11-10 — Animated live leaderboard score-and-rank feedback
- **Code checkpoint:** `ff67ebeb609eb75f4f5f61dd7d50386def0c16d2`; full GitHub CI **SUCCESS**: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42812383499
- Improved the existing `Session.tsx` `Leaderboard`, no new component/file: stable participant/team row identity, host-verified score delta (+ or −), rank up/down indicators, a short visual pulse after a changed official server snapshot, and a consistent bilingual/RTL display.
- Preserves signed official server `score` with no optimistic local points ledger. Indicators are visual comparisons only, clear after 3.4 seconds, and do not animate with reduced motion or effects-off.
- Stylistic changes appended to existing `ArenaGamePolish.css`, not large new assets or duplicate dashboards. Existing podium and final branding remain unchanged.
- Added real 1920×1080 Chromium projector regression to existing `e2-staging-qa/luxury-wheel-browser.mjs --challenge`. The trainer enables the official board, settles a signed −600 assessment, verifies `data-server-score="-600"` and the visible negative-delta indicator (Western and Arabic-Indic digit support), then restores the original projector layout.
- Evidence screenshot in run 42812383499 artifact `arena-e2-sprint05-ephemeral-real-api-e2e`: `23-server-signed-leaderboard-penalty.png`; original Challenge Card screenshot also preserved as `22-wheel-challenge-card-projector.png`.
- All previous tests pass on the same code SHA: V6 baseline and score authorization, frontend/API build, simulated multi-client session, projector privacy, cinematic reveal, Wheel Challenge Card, Sci-Fi Crate, and actual wheel.
- **Still NO live deployment approval:** need real Android/iOS and projector test, verified real guest QR/Firebase access, production source provenance, and visual signoff. No merge or deploy was performed.


### 2026-11-10 — Single-QR actual React trainee entry and mobile UX gate
- **Fully tested code SHA:** `481ea3ece0ae09a267f1cf5cb0115511ba2b1f7a`.
- **CI:** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42818476782 — **completed SUCCESS** across all steps, including real V6 API handler, temporary SQLite, 2 and 5 client fixture, private projector, live scoreboard, Challenge Card, Sci-Fi Crate and 3D wheel.
- Extended the EXISTING `e2-staging-qa/real-session-browser.mjs` (no new test/source document). It opens a **real React** mobile 390×844 URL from the official unified QR format `?view=join&code=<six-digit-room>`, performs name/employee-ID self-confirmation, acknowledges the one-time private recovery code, and receives a single session-specific player token without a Firebase trainer login.
- A trainer-controlled **two-quiz** test room advances from activity 1 to activity 2 without issuing another QR or creating a second participant. On browser reload, `view=play` and the same private player token/UID remain, and the original backend marks both submissions once.
- Negative privilege tests: participant player token cannot submit trainer `control` (401) or fetch `role=host` state (401), and cannot impersonate a participant in another room; no private token or recovery code is included in URL/query. Existing cryptographically signed Firebase ID token and trainer allowlist unit tests pass, but a REAL external Firebase/Cloudflare sign-in was **not** performed.
- Updated two misleading join-page notes to clarify a trainee needs a session code and self-confirmed name/employee ID, **not** a trainer account.
- The 390×844 actual React screenshot revealed the original confirmation button below the viewport. Existing `ArenaGamePolish.css` now compacts just the mobile join form, preserves official logos and recovery modal, and clips an oversized background ornament so no horizontal overflow occurs. Strong browser assertion logs **`QR_JOIN_MOBILE_LAYOUT_PASS {"buttonBottom":739.359375,"viewport":844,"horizontalOverflow":0}`**.
- Real CI evidence from the same workflow artifact `arena-e2-sprint05-ephemeral-real-api-e2e`: `05-real-react-unified-qr-join.png` and `06-real-react-qr-second-activity.png`. The second image captures the UI during answer submission; actual API verification confirms the answer after this frame.
- Open limitations: physical QR camera scan, real Android/iOS devices, physical projector, connected live guest access/Firebase provider, low-power mobile GPU performance, exact deployed V6 source provenance and explicit release approval. **NO merge, live deployment, production tokens or production writes.**
- Optional visual polish for next pass: improve contrast of the small session code chip in the mobile brand header; do not modify approved logo assets.


### 2026-11-10 — Single QR real React device-transfer and identity continuity gate
- **Tested exact code SHA:** `ed992dbf6922f58b3e6df1dc67f5b5f6ef43ce26`; complete GitHub CI **SUCCESS**: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42822003960
- Extended existing `e2-staging-qa/real-session-browser.mjs` only; no feature branch, new suite file, production write or deploy.
- Used a second isolated 390×844 browser context and the *same* original QR entry URL for a participant with two existing, officially server-scored activities. Verified wrong recovery code denied and no token issued; valid recovery restores same participant ID/points with a fresh local token; old device token loses identity; no duplicate room player is created; the new token cannot access trainer controls.
- Browser URLs and screenshots were checked to exclude the secret token/recovery code. `QR_DEVICE_TRANSFER_PASS` recorded all safeguards as true. Existing `UNIFIED_QR_REAL_REACT_PASS` and `QR_JOIN_MOBILE_LAYOUT_PASS` also passed, including join CTA bottom 739.36px in 844px viewport and zero horizontal overflow.
- Entire suite passed including baseline Firebase signed ID-token authorization/allowlist tests, live projection privacy, StageSplash reveals, Wheel Challenge Card signed grading, Sci-Fi Crate and 3D wheel. Local test trainer remains a fixture; the test does NOT validate real trainer Firebase sign-in in a deployed staging environment.
- **Release remains NO-GO** without live-site origin/API/CORS verification, real Firebase allowlist flow, actual Android/iOS + projector accessibility/performance review, source-deployment provenance and explicit approval. Avoid deploying or merging as part of this gate.


### 2026-11-10 — Read-only Cloudflare production provenance inspection
- Checked the connected Cloudflare account without changing resources, secrets, traffic routing or production data.
- Worker `mts-training-arena-v6-api`: currently deployed version `0bd66ec0-39f5-4eaa-8627-11c5b10b6e13` receives 100% of deployment traffic. Most recent deployment **2026-10-27 12:06:28 UTC**. Worker bindings present by name/type: `DB` (D1), `LIVE` (Durable Object namespace), and `ARENA_PUBLIC_ORIGIN` (plain text). No binding values or secrets recorded.
- Cloudflare Pages project `mts-training-arena-v6-gateway`: latest production deployment **2026-10-19 10:20:07 UTC** on `main`. Project source is not linked to a GitHub repository in returned metadata (`source_type=null`, no build command/destination). Latest deployment metadata has an empty source commit hash. This means there is **no confirmed source-to-live commit mapping** using these inspection endpoints; a direct-upload or separately managed deployment is possible.
- Independently verified E2 branch SHA `ed992dbf6922f58b3e6df1dc67f5b5f6ef43ce26` passed the complete isolated test workflow [42822003960](https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42822003960). Its new QR device-transfer test passed, preserving identity and score while revoking old player token; other games and checks remained green.
- The GitHub E2 branch was **NOT** deployed to either the Pages gateway or the V6 Worker. Therefore don't claim the live site runs the new QR recovery, premium wheel, 3D crate, or live leaderboard code.
- Required next release audit: map the exact live frontend bundle and Worker version back to a reproducible source commit; verify real trainer Firebase allowlist, public QR-to-API origin/CORS, real phone and projector behavior using non-sensitive test accounts. Do not change production routing or connect deployment until explicitly approved.

- **Security follow-up:** the current server rotates the *player session token* on device recovery but preserves the recovery-code hash, so a copy of the recovery code can still be used again. Do not call the recovery code single-use. Before a public rollout, decide whether to implement safely rotated recovery credentials with an answer-loss/retry strategy and clear user messaging; tests above intentionally validated token revocation, not recovery-code one-time consumption.


### 2026-11-10 — Rotating QR recovery credentials: lost-response-safe security gate
- **Tested code SHA:** `498ea3200b3b982f580340baa25b3c6cbe84e2bd`. Full isolated workflow **SUCCESS**: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42832490378
- Old behavior kept `players.recovery_hash` unchanged when moving a trainee to another device, allowing the old recovery code to be reused with a fresh request. **Fixed on the E2 branch only; production Worker is untouched.**
- `lib/service.ts` now atomically updates BOTH `players.token` and `players.recovery_hash` in one compare-and-swap conditional on the original hashed code. No database migrations, existing signed points, player ID or trainer control rights changed.
- A per-session server-secret HMAC derives a distinct 256-bit session token and 80-bit replacement recovery code from the **original recovery code plus an independently generated client attempt ID**. Only the same exact attempt ID can safely retry after an uncertain success; a fresh attempt using a consumed code is rejected. After a further successful transfer, earlier retries are also rejected. No HMAC key or recovery token is exposed in public state. Legacy rooms missing the per-session secret fail closed.
- `components/arena/Session.tsx` stores only the random attempt ID and SHA-256 input fingerprint in tab sessionStorage while the attempt is unresolved, so the same interrupted tab can retry after a reload without resetting the attempt. The actual replacement code is held temporarily in sessionStorage **until acknowledged**, never in URL/query or persistent localStorage. The new player token continues to be stored as before. A lost response without that surviving attempt ID cannot be reconstructed from the old recovery code alone; do not claim otherwise.
- `tests/session.test.ts` checks missing attempt IDs, incorrect/consumed codes, code rotation, byte-for-byte identical retry receipt, old/new token revocation, signed score preservation, and two concurrent devices racing to consume a code (exactly one success). All baseline score and authorization tests passed.
- `e2-staging-qa/real-session-browser.mjs` uses actual React QR entry and recovery UI: deliberately lets the Worker commit a successful recovery while dropping the HTTP response, checks no token is manufactured locally, retries from the same browser attempt ID, confirms a new recovery code, rejects reuse of the old code, reloads and displays the new code until the user acknowledges it. Official point ledger remains authoritative; privacy and multi-activity QR identity checks remain green.
- **Operational caveat:** the retry credential is the pair (old recovery code, same attempt ID), so that pair must remain private until the next transfer; it is intentionally a bounded-by-current-state idempotency capability, not a blanket guarantee that all historical codes are physically unreplayable. Once the next recovery succeeds, the earlier pair fails.
- **Deployment coupling:** the new frontend expects `recoveryCode` in the recovery response and supplies `attemptId` to the new backend. Deploy/release BOTH together on isolated staging; do not serve the new frontend against the old Worker or new Worker against a cached older frontend. Production still uses the previous unrevised recovery behavior.
- **No merge or deploy**. `main`, Cloudflare Pages, production Worker, D1 and Firebase accounts remained unchanged.

### 2026-11-10 — Staging isolation requirements (read-only Cloudflare account audit)
- Cloudflare account inventory currently shows a single D1 named `mts-training-arena-v6`, two Workers (`mts-training-arena-api`, `mts-training-arena-v6-api`), and one Pages project `mts-training-arena-v6-gateway`. None of these is an independently isolated E2 staging environment.
- The tracked `work-site-recovery-v6/wrangler.github.toml` explicitly targets the PRODUCTION Worker name `mts-training-arena-v6-api`, production D1 `mts-training-arena-v6` and live `ArenaLiveRoom` class/migration. **Never run it unchanged for E2 staging.**
- A safe staging deployment needs: (1) a NEW isolated D1, seeded only from checked-in schema with synthetic data; (2) a separate Worker script and Durable Object namespace/class migration, not the live `LIVE` binding; (3) a separate frontend preview origin bound only to staging API via `VITE_ARENA_API_ORIGIN` and correct `ARENA_PUBLIC_ORIGIN`/CORS; (4) non-production media access or uploads disabled; (5) dedicated restricted trainer login/allowlist or an explicit non-production test identity project.
- Current `lib/firebase-config.ts` is hard-coded to the existing Firebase project, so the trainer login cannot be claimed fully isolated without staging-specific configuration or a separate test Firebase project. Do not copy production trainer credentials, service-account secrets or allowlist into staging.
- Before exposing real QR or live accounts, verify deployable source provenance, restrict staging domain/credentials, run API/QR/trainer-login/CORS/WebSocket/rollback checks, then request explicit user approval for a release. This audit performed NO Cloudflare creation or mutation.


### 2026-11-10 — E2 staging: isolated Cloudflare resources and locked source configuration
- **Created actual empty D1**: `mts-training-arena-e2-staging` with UUID `becba428-cc2d-45c3-9930-438726906d79`. Applied all six checked-in migrations `0000`–`0005` to this NEW database only. Verified 12 business tables and **zero sessions, players, answers and audits**. No copying or migration from production D1.
- **Created separate Cloudflare Pages project** `mts-training-arena-e2-staging` with default staging origin `https://mts-training-arena-e2-staging.pages.dev`. Cloudflare returned no Git source and **no deployments**; the project currently hosts no Arena application. Its Pages production-branch label `e2-staging` does not create another Git branch.
- **No staging Worker deployed.** Added a single dedicated `work-site-recovery-v6/wrangler.e2-staging.toml` with separate script `mts-training-arena-e2-staging-api`, newly created staging D1, staging-only CORS origin and own Durable Object class namespace. Do not run the production `wrangler.github.toml` for staging.
- In `github-api-worker.ts`, `ARENA_DEPLOYMENT=e2-staging` plus `ARENA_STAGING_LOCK=locked` fails closed on all non-health endpoints. `GET /api/staging-health` alone can report whether the bound **staging** DB has the schema; any mutation, Firebase login, media upload or production-origin mismatch gets an error. The Worker is intentionally **not usable for real sessions** until the test Firebase project is configured and its authorization reviewed.
- `vite.github.config.ts` creates `dist-e2-staging` separately from production `dist-github`, requires a staging-only API origin, and emits root-based assets suitable for a new Pages project. `lib/client.ts` rejects an API origin other than the independently named staging Worker; `lib/firebase-client.ts` explicitly blocks inherited production Firebase login and `lib/client.ts` disables inherited production Cloudinary unsigned media uploads in staging.
- Added static staging isolation tests in the existing `e2-staging-qa/public-stage.test.mjs`, and CI builds the two variants separately and invokes the bundled Worker under a locked staging environment to assert **health-only** readiness and denial of sessions, trainer login, media and production CORS. All build and staging-guard steps passed in GitHub Actions run [42840004936](https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/42840004936); the full browser workflow outcome must be checked before marking the entire run green.
- **Account quotas caveat:** D1 and Workers Free usage/read/write limits are account-wide. Even separate staging data shares account limits with production, so do not load-test publicly using the current account and assume fully independent quota.
- **Pending before deploy/unlock:** connect/create an isolated Firebase testing project and allowlist, configure the frontend+Worker with it, verify script and DB binding provenance, then deploy ONLY the staging Worker and staging Pages bundle via explicit reviewed staging-only steps. Validate QR, trainer access, signed scoring, WebSocket, CORS and mobile/projector on real devices. Do not deploy to `main` or live Cloudflare resources.
