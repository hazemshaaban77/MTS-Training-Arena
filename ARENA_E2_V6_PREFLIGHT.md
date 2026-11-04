# MTS Training Arena — Experience 2.0 / V6 integration preflight

Date: 2026-11-04  
Branch: `feature/arena-e2-v6-preflight-20261104`  
Candidate base: `develop/v6-github-arena` at commit `f1be5e9e98a03600eaf48e7c493c1bd90d475199`

## Purpose and safety

This branch is a **read-only source candidate** for testing Version 6 code. It is **not** the verified latest live private Sites build, and it does **not** replace the GitHub Pages V6 or static `main` deployment. A separate published Site version may differ.

This preflight does not merge source changes, add staged game code to V6, alter database schema, change Firebase security rules, change runtime secrets, or deploy anything.

The user's approved Arena 2.0 visual work remains on:
`feature/arena-experience-2-lobby-preview/experience-2-preview/sprint02/`.

## Branch divergence found

Relative to `develop/v6-github-arena` (first pass Git comparison, not cumulative):
- `feature/v6-cinematic-b-cairo-dynamic-wheel`: ahead 9, behind 0; contains 3D work outside Experience 2.0 scope.
- `feature/v6-final-wheel-projector-flashcards`: ahead 24, behind 7; focused Wheel/Projector/Flashcard changes.
- `feature/v6-importverse-session-and-gameplay-fixes`: ahead 29, behind 9; ImportVerse and gameplay.
- `feature/v6-game-experience-overhaul`: ahead 50, behind 12; major game overhaul.
- `fix/v6-legacy-box-judging`: ahead 4, behind 10; Box grading fix.
- `fix/v6-projector-business-question-variants`: ahead 13, behind 5; Projector and mixed question type work.

**Never merge all divergent branches blindly.** Review relevant files in isolation after the **deployed** V6 source/version SHA is independently verified.

## What counts as passing

1. Repo dependencies install from lockfile in a clean Ubuntu/Node 24 environment.
2. Existing TypeScript + service/auth/security/render tests pass.
3. Creative identity verification passes without replacing approved logos.
4. Build of GitHub frontend and API bundle succeeds without uploading/deploying them.
5. Source validation logs are attached as GitHub Actions artifacts. Tests do not substitute for real site login, mobile/projector hardware QA or score load tests.

## Hard gate before integration

The actual live V6 deployment's build/source identity remains **unknown**. There is no authority to republish. Do not port or overwrite actual V6 source yet. Once source of truth is verified, reconcile branch fixes, then make an isolated staging change and test with a real trainer and two then five devices.

## Reference

- Master Experience 2.0 plan: https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
- Repository audit: https://github.com/hazemshaaban77/MTS-Training-Arena/blob/feature/arena-experience-2-lobby-preview/experience-2-preview/audit/REVIEW_FINDINGS_2026-11-04.md
