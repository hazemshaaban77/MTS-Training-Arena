# V6 Fix Reconciliation & Experience 2.0 Integration Gate

**2026-11-04 | Source candidate:** `develop/v6-github-arena` / `f1be5e9e98a03600eaf48e7c493c1bd90d475199`.

This is a **source comparison and migration guide**. It is **NOT** a claim that the candidate matches the latest deployed private V6 site. No existing V6 code has been overwritten on this candidate branch.

## Work completed without impacting V6

- Added a standalone, client-only `public/e2-preview/` demo to the isolated candidate branch; reused **the exact Git blobs** of Sprint 02, including original approved product logo and padded derivative.
- Repointed the two *corporate* logos to existing local V6 `public/mts.png` and `public/training.png`, avoiding third-party GitHub raw image loads.
- Kept V6 routing, authentication, sessions, scores, database and `main` unchanged.
- Configured branch-specific CI to run V6 type/service/security/rendering, original corporate identity checks, live state unit tests, frontend/backend builds, and Chromium interaction tests against the compiled static build.

## Divergent branches (compared with `develop/v6-github-arena`)

| Source | Ahead / Behind commits | V6 source files changed | Recommendation |
|---|---:|---:|---|
| `feature/v6-game-experience-overhaul` | 50 / 12 | 22 | Review interactions in GamePlay, Session, WheelJudge, backend state, and scripts individually. No blind merge. |
| `feature/v6-importverse-session-and-gameplay-fixes` | 29 / 9 | 15 | Review question content, box scoring, trainer controls and session restore. |
| `feature/v6-final-wheel-projector-flashcards` | 24 / 7 | 8 | Review wheel 2D-feel visuals and ImportVerse bank; don't import 3D scripts without need. |
| `fix/v6-projector-business-question-variants` | 13 / 5 | 6 | Review projector layout fix and question bank; run real 16:9 QA. |
| `fix/v6-legacy-box-judging` | 4 / 10 | 1 | Review isolated `lib/session-games.ts` scoring fix and add regression. |
| `feature/v6-projector-video-intros` | 5 / 14 | 5 | Consider read-only introduction idea but match Experience 2.0 2D specification. |
| `feature/v6-cinematic-b-cairo-dynamic-wheel` | 9 / 0 | 12 | Mostly 3D/stage; exclude from chosen 2D direction. |
| `audit/v6-final-importverse-20261027` | 9 / 5 | 4 | Retain audit scripts as evidence, not runtime app changes. |

## High-risk overlap

| File | Number of these branches touching it | Risk |
|---|---:|---|
| `tests/render.test.tsx` | 6 | Tests describe different game versions; do not concatenate or discard. |
| `components/arena/Session.tsx` | 5 | QR, trainer controls, projector, timers and presentation share one component. |
| `components/arena/GamePlay.tsx` | 3 | Gameplay UI and client/server event transitions; avoid double handlers. |
| `lib/session-games.ts` | 3 | Server wheel, box and scoring operations; no client-side replacement. |
| `lib/importverse-workshop.ts` | 3 | Conflicting templates and bank versions. |
| `lib/service.ts` | 2 | API contracts and session security. |
| `components/arena/WheelJudge.tsx` | 2 | Trainer award/penalty controls and event ledger. |

Counts are based on the relative Git comparison. They do not necessarily signify unresolved textual merge conflicts; each change needs functional review.

## Integration rules

1. **Gate 0:** confirm live private V6 release/source SHA and whether the intended target is private Sites or separate GitHub Pages V6. GitHub branch names are not enough.
2. **Gate 1:** choose one verified source branch. Use a dedicated staging database and separate authorized test accounts; preserve old artifacts/branches.
3. **Gate 2:** inspect and port *the minimal relevant fixes* from diverged V6 branches, with focused regression tests. Never import abandoned 3D stage or generated brand substitutions.
4. **Gate 3:** wrap existing V6 participant/session API; make V6 server state authoritative and only allow trainer actions through authenticated existing endpoints. Do not feed localStorage demo points to real standings.
5. **Gate 4:** real-device acceptance: trainer login; one QR for entire session; 2 then 5 mobile clients; projector updates; late joins; disconnect/reconnect; wheel timer/sector; boxes scored once; answer key withheld until reveal; multilingual.
6. **Gate 5:** explicit owner-approved release with rollback plan. `main` and all currently deployed Sites/Pages/Workers are out of scope until then.

## Verification statements

- V6 preflight build/test status: see the branch-specific GitHub Actions workflow.
- The branded Experience 2.0 demonstration is only a `public/e2-preview/` standalone visual prototype in a **non-deployed feature branch**.
- Browser-tested UI does **not** prove a correct QR, safe scoring, or cross-device synchronization.
- The original Arena logo is committed byte-for-byte and must never get a white halo or cropped edges.

**Master implementation plan:** https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
