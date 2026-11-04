# MTS Training Arena Experience 2.0 — Canonical Sprint 02 Preview

**Working branch:** `feature/arena-experience-2-lobby-preview`  
**Scope:** visual proof-of-concept with fictitious data only. No production deployment, no real QR, no trusted scores, no change to `main`/Firebase/Cloudflare.

## Current prototype

The **one current entry point** is:

`experience-2-preview/sprint02/index.html`

Open it with a static server from repository root:

```bash
python3 -m http.server 8000
# http://localhost:8000/experience-2-preview/sprint02/
```

It includes the user-approved original Arena logo, cinematic intro (8 seconds, trainer skip), lobby, sample question/timer/locked/revealed stages, prize wheel, mystery boxes, demo leaderboard, winners podium, trainer-only demo controls, separate same-browser projector view, Arabic/English, sound off by default, and reduced motion.

**Important:** localStorage and BroadcastChannel sync between tabs of the same origin. This is **not** real cross-device server synchronization. QR, participants and points are illustrative; do not use this demo in a real training session or as employee assessment.

## Asset ownership / identity

- `sprint02/assets/arena-logo-approved.png`: unchanged user-approved original PNG; SHA-256 `d5ea82da1dd359843c9fa5b1c1aef638645bca1302869aa00aba39ae94e4baff`.
- `sprint02/assets/arena-logo-safe-margin.png`: **used** padded transparent presentation derivative (no circular white halo); do not delete while referenced by `app.js`.
- Original corporate MTS and Training Team logos live unchanged in recovered V6 `public/`. The preview currently uses GitHub raw URLs for these corporate logo images, so offline preview requires a suitable fallback.
- Branding rules: `APPROVED_LOGO.md`. Both original and safe-margin assets are deliberately retained. No alteration to the product logo's pixels.

## QA

Run the contract test in Node.js:

```bash
node --test experience-2-preview/integration/v6-public-stage.test.mjs
```

Run browser regression QA with Playwright installed and Chromium available:

```bash
node experience-2-preview/sprint02/browser-qa.mjs
```

GitHub Actions runs these checks in `.github/workflows/experience-2-stage1-qa.yml` (historical workflow filename; actual tests target canonical Sprint 02).

**Coverage:** original PNG checksum, no white image background halo, lobby, intro/skip, podium, question/lock/reveal, wheel countdown+landing, boxes, demo scores/leaderboard, language sync, 390px simulated mobile viewport and 1920×1080 projector simulation. Browser QA passing does not certify real phones or live projector hardware.

## Cleanup decision (2026-11-04)

Removed the superseded **standalone Sprint 01 implementation and dedicated duplicate tests** from the active working branch once coverage had been moved to Sprint 02:

- `experience-2-preview/index.html`
- `experience-2-preview/browser-qa.mjs`
- `experience-2-preview/smoke-test.mjs`

These files are recoverable from this Git branch's earlier commits; they were not erased from Git history. The existing V5/V6 snapshots, foundation modules, security tests, all corporate/approved logos, the public-stage adapter, and production `main` are intentionally preserved.

## Blockers to production integration

1. Verify the deployed **private V6 Site source SHA**, not merely the older `work-site-recovery-v6/` snapshot.
2. Reconcile separate V6 fixes for registration, wheel, boxes, projector, player feedback and ImportVerse.
3. Use backend-authoritative scoring/answers and authenticated trainer; do not trust demo localStorage.
4. Test two then five real participant devices and a projector with approved test accounts on a disposable staging environment.
5. Get explicit release approval before deployment, migration, merging or access changes.

Audit report: `experience-2-preview/audit/REVIEW_FINDINGS_2026-11-04.md`.  
Master plan: https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
