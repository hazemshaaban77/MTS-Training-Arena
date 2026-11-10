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
