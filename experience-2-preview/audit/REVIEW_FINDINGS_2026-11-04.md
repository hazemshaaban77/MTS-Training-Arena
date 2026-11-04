# MTS Training Arena — Source-of-Truth & Regression Safety Review

**Date:** 2026-11-04  |  **Status:** Read-only review complete; production integration BLOCKED

## What was inspected
Repository: https://github.com/hazemshaaban77/MTS-Training-Arena
Automated audit of all 32 remote branch HEAD trees: 15,695 tracked-file appearances, 558 distinct Git blobs, 531 unique source/document blobs inspected for selected key markers (up to 750 KB), and original binary assets inventoried by Git hashes.
Manual review prioritized Session.tsx, GamePlay.tsx, service.ts, session-games.ts, API handler, viewer state mapping, deployment workflows, recovered README/delivery-status, branch differences, and current CI. This is NOT a claim that every source line was manually reviewed or runtime security was fully audited.
Source: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41829461595

## Root problem: parallel versions in one repository
- main /arena/: static GitHub Pages pilot, not the private V6 full app.
- work-site-recovery/: V5 source snapshot.
- work-site-recovery-v6/: recovered V6 private Sites source from Oct 18.
- feature/v6-*: parallel enhancements to V6. Their histories diverge; the newest commit date alone does not establish the latest valid live deployment.
- feature/arena-experience-2-lobby-preview: separate browser demo and read-only adapter, currently not connected to production session, trainer auth, or trusted score database.
- stage-lab-v01-ai-studio: matches old main-level pilot in tracked-file count; not a demonstrated source for November's 3D Site experiment.

## Verified structural differences
- On the Experience 2.0 branch, the V5 and V6 snapshots share 176 same-relative-path files; 170 are byte-identical and only 6 differ: RECOVERY_MANIFEST.json, lib/api-handler.ts, lib/firebase-admin.ts, lib/firebase-verifier.mjs, scripts/verify-arena.mjs, tests/firebase-auth.test.ts.
- Compared with recovery-V6, feature/v6-game-experience-overhaul has 92 added and 19 modified files under work-site-recovery-v6/.
- feature/v6-final-wheel-projector-flashcards has 98 added and 19 modified V6 files.
- feature/v6-importverse-session-and-gameplay-fixes has 95 added and 19 modified V6 files.
- The Experience 2.0 branch currently has ZERO added/changed V6 files relative to work-site-recovery-v6. Its stage source and original product PNG live under experience-2-preview/sprint02/.
- Therefore dropping the visual demo into the recovered V6 snapshot without selecting/reconciling later fixes risks reverting the very defects we want to eliminate.

## P0 blockers before integration
1. LIVE-SOURCE-ID: obtain authoritative deployed private Sites version/build SHA or source export, then compare it to candidate branches. Current GitHub directory names are not reliable production provenance.
2. VERSION-RECONCILIATION: review branch-specific fixes for wheel timing, boxes, Game Show, projector, ImportVerse, registration and media picker, without importing abandoned studio/3D architecture wholesale.
3. TRUST-BOUNDARY: Sprint 02 demo results, wheel prizes, teams and QR visuals must not be accepted as authoritative server state. Reuse verified V6 API/DB/permissions, with controlled adapter and anti-replay tests.
4. ACCESS: the private Site's audience boundary is separate from the single-QR feature. Validate a trainer and invited trainee on distinct devices without giving trainees trainer access.
5. END-TO-END: one trainer, real joined players, a projector, repeated questions, wheel, boxes, scoring and export must be tested across actual browsers and phones using test data.

## P1 quality/safety requirements
- Use original approved Arena PNG and preserve approved MTS/Training Team corporate PNGs. Never recreate the brand mark or add a white circular halo/clipping.
- Screen projection must use public-safe snapshots, and correct answers must remain hidden until the server authorizes reveal.
- Lock answer attempts when server deadline expires; show Pending, Confirmed, Failed/Retry distinctly instead of optimistic success.
- No student-facing developer/GitHub notifications, and no regressions to scroll/focus or pointer/touch interactions.
- Build the 2D Experience 2.0 components as named reusable views, not broad append-only overrides to the large V6 CSS file. The later V6 game branch has a much larger stylesheet and separate 3D packages.
- Keep Word Cloud, video interaction, modes and Power-ups as gated milestones following secure state and scoring; do not blend fun points with formal assessment.

## Credential marker review
- The bounded content scan flagged 9 unique source blobs with textual private-key PEM markers; named files are worker key parsers, test fixtures, and compiled Worker bundles. Spot checks did not find a complete PEM private key block.
- No suspicious .env/private credential file paths were identified at branch HEADs. This is NOT a full Git-history scan and NOT a guarantee that no secret was ever committed.
- Never paste any real credentials into GitHub or chat. Future production tests require authorized secret storage and dedicated security review.

## Verification status
- Experience 2.0 read-only public-stage adapter has synthetic contract tests for one QR URL, safe snapshots, no early answer reveal, and anonymous GET.
- Experience 2.0 Chromium preview tests are green at https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41829461413.
- Repository-wide inventory scan is green at https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41829461595.
- Neither is proof of working real joined/graded V6 sessions, deployed Sites build, a physical projector, or 60-80 live participants.

## Non-negotiable change-control protocol
Gate 0: Verify the live source of truth and retain its exact SHA/artifact.
Gate 1: Branch from the verified source; document which V6 feature/fix branches have been selectively ported.
Gate 2: Integrate approved 2D visuals in a separate preview/staging build only; run syntax, typecheck, unit, API security and browser E2E.
Gate 3: Test authorized trainer + 2 then 5 real device clients, public projector, disconnect/reconnect, idempotent points and tie rules.
Gate 4: User acceptance of screenshots and behavior; release only after explicit permission and proven rollback.
STOP: Any unverified source mismatch, missing API credentials, unsafe public data, new white halo, early reveal, or unstable spin/score blocks release.

## Actual changes made by this review
- Added a read-only Node repository inventory script and GitHub Actions workflow to the separate Experience 2.0 branch.
- No code merges, production deploys, Site audience changes, Firebase rules edits, secret changes or main branch modifications.

Reference inventory: Download the REPOSITORY_AUDIT.md + inventory.json GitHub Actions artifact from run 41829461595.
