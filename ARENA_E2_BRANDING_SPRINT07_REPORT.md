# MTS Training Arena — Approved Product Logo Integration, Sprint 07
**Date:** 2026-11-04  
**Implementation branch:** `feature/arena-e2-approved-brand-stage-20261104`  
**Based on:** `feature/arena-e2-per-activity-reveal-20261104` (last previously green V6 candidate)  
**Verified no-deploy CI:** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41857275606  
**State:** Implemented & passing isolated tests. **No production deploy, merge, or Firebase/D1/Worker changes.**

## Product branding decision — original artwork only

- Reuse the already-existing `public/e2-preview/assets/arena-logo-safe-margin.png` from Sprint 02; no redraw, recolor, regenerate, replacing, or Photoshop-style counterfeit.
- Exact pinned **Git blob SHA-1**: `5dcc72c9dadf7f01f7ca4b69f5afc62b38fca180`. The standard render unit suite now verifies the full binary hash on every run.
- The file is centralized in `components/arena/ApprovedArenaLogo.tsx` and used via `siteAsset()` for correct GitHub Pages `/MTS-Training-Arena/v6/` prefix and private-site root.
- `ApprovedArenaLogo.css` explicitly uses transparent, unframed, nonrounded `object-fit:contain`, visible overflow and correct margins. **No white circular disc, white border or cropped logo edges.**
- Original MTS and Training Team corporate logo components remain separate, and **their original image files and colors remain unchanged**.

## Existing V6 components extended (not rewritten)

- `Brand.tsx`: original V6 branding header now includes the approved Arena mark.
- `Session.tsx`: original single-QR lobby carries the larger approved Arena logo, with no changes to signup, timers, participant state, scoring, or QR URL.
- `StageSplash.tsx`: original game intro includes the approved original logo without replacing the existing cinematic stage logic.
- `ArenaVictory.tsx`: existing authoritative winners podium presents the Arena product mark; podium/points are still server-derived.
- `ArenaProjectorRepair.css`: fixed the pre-existing projector header flex alignment where corporate logos were crowded on the left of a 1920px screen. The projector now lays out **MTS on the left, Arena in the center and Training Team on the right**, in a 3-column grid. This is scoped to projector mode only; the mobile learner header retains its V6 layout.

## Tests & evidence

Full GitHub Actions run **41857275606 — SUCCESS**, including:
- V6 TypeScript, security/auth, scoring, rendered components, branded PNG binary hash, and previous reveal policy tests;
- Real original V6 API handler against a temporary SQLite DB, two then five simulated independent Chromium clients, same session QR URL, leaderboards & trusted score checks;
- React 1920×1080 projector image load/visible bounds, MTS-left/product-center/Training-right position assertions, no white logo background, preserved single QR, cinematic manual and delayed auto reveal, winner-stage image;
- 390px learner view with approved logo still visible and within viewport.

The uploaded CI artifact includes:
- `10-approved-product-lobby-projector.png` — original project lobby at 1920×1080;
- `11-approved-original-logo-winners.png` — original winners stage (the image is checked as loaded; animation may be captured mid-transition);
- `12-approved-mobile-join.png` — join screen at 390×844 viewport, full-page screenshot;
- original reveal and QR security screenshots.
Artifacts contain only disposable synthetic test data. A test-only session code shown in screenshots must never be interpreted as an active production reservation or session.

## Constraints & next gates

1. The approved source logo is now implemented in the **existing V6 code candidate**, but this candidate is **not** the confirmed latest live private Sites source SHA.
2. The staging browser tests run locally on loopback using fake trainer authorization, not a real Firebase trainer login; test "mobiles" are browser emulations.
3. Verify QR camera scanning and usability on physical phones, and projector 1365×768 and 1920×1080 hardware before release.
4. Finish a separate authenticated staging environment with isolated Worker/D1/DO and explicit service-owner approval.
5. Then return to V6 Wheel/Boxes server actions, late-join, and Gamification power-up/score features without replacing old source.
6. Never merge, deploy, delete existing branches or modify live databases until source provenance and acceptance are confirmed.

**Master plan:** https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
