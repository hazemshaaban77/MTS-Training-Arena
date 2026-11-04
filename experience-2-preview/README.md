# MTS Training Arena — Experience 2.0 / Stage 1 Preview

Branch: feature/arena-experience-2-lobby-preview
Scope: visual browser prototype only; NO production deployment, merge, auth change, database migration, or real user data.
Source baseline: Version 6 recovery at work-site-recovery-v6/ (published on 2026-10-18). The user's November Stage Lab is a separate 3D experiment; its full source was not verified in the current repository.

## How to inspect

1. Check out this branch (not main) so the original logo image paths remain available.
2. From the repository root, start a basic static file server: python -m http.server 8000.
3. Open http://localhost:8000/experience-2-preview/ in a browser. The trainer demo controls are on the right.
4. Click Projector to open a display-only tab; move it to a projector or second display. Both tabs must use the same browser/origin for local preview synchronization.
5. Try lobby → cinematic intro (8s) → demo question (20s) → answer reveal → winners.
6. Try Arabic/English, reduced motion, sound (off by default), 360px mobile viewport, and two browser windows.

When served inside this repository, the preview references the unchanged original MTS and Training Team PNG files from ../work-site-recovery-v6/public/. A fallback points at the same public GitHub originals if the document is opened outside the repository. The images are NOT regenerated.

## What works in this preview

- 2D Premium Broadcast visual language using accepted brand colours, Cairo typeface with local font fallback, and original logos.
- 16:9 stage + separate projector display mode.
- Visible lobby with fictional participants/teams and a clearly non-functional QR placeholder.
- Cinematic 8-second intro. The intro state is synchronized between local tabs via BroadcastChannel / localStorage; the presenter's tab transitions to the sample question after the intro.
- Demo question with 20s timer, reveal, and fictional podium.
- A small control panel, Arabic/English switch, muted sound by default, reduced-motion option.
- Browser-local scene state for isolated demonstration.

## Not done; must not be described as working

- No live join QR, no real participant registration, no cross-device Internet sync.
- No official results, no server-trusted scoring or authentication in this preview.
- No link to existing production rooms, tables, or workers.
- No reliable multi-device or projector hardware test has yet been recorded.
- Browser-local synchronization is same-origin, same-browser only. It is not a backend.
- The QR-pattern tile is intentionally decorative; it is labeled inactive to avoid misrepresenting a real join link.

## Acceptance / QA checklist

- [ ] Browser renders source without JavaScript syntax/runtime errors.
- [ ] MTS is physically top left, Training Team physically top right, both original images loaded.
- [ ] Trainer controls switch to all five demo scenes (lobby, intro, question, reveal, winners).
- [ ] Projector-only tab follows scene changes and the full intro from a trainer tab on the same origin.
- [ ] Timer counts down from 20 and reveal does not expose the correct answer before the demo question closes.
- [ ] Arabic/English affects trainer and projector presentation.
- [ ] Reduced motion / sound off do not prevent controls.
- [ ] Chrome desktop, 360px mobile viewport, fullscreen projector 16:9 visually reviewed.
- [ ] No production routing, backend requests, or real user information used.

Current status: Implemented in isolated branch; browser/device QA pending. Static code readback is not proof of passing these acceptance tests.

## Next milestones

1. Confirm current source of truth (the newest actual work-site, including November changes) before integration.
2. Compare this prototype to Version 6 actual components/arena/Session.tsx, Brand.tsx, app/globals.css, and projector / score APIs.
3. Conduct browser visual QA with screenshots and adjust layout; do not merge prematurely.
4. Integrate approved visual components only into a dedicated staging branch and verify real devices.
5. Continue Stage 2 (wheel, boxes, reveal, leaderboard) after Stage 1 approval.

Master Plan in Google Drive:
https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
