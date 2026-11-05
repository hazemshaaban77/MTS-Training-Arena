# MTS Training Arena — Wheel Sprint 07 / Luxury Esports Wheel

**Date:** 2026-11-05  
**Branch:** `feature/arena-e2-luxury-crown-wheel-20261105` (from `feature/arena-e2-approved-brand-stage-20261104`)  
**Verified full green CI after auth, projector fit, static logo and new regression checks:** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41996667260 (tested code commit `5d010568328b34e996225caf81d57ed0f7275fbc`)  
**Previous green viewport-fit checkpoint:** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41996264016

## Executed IN ORIGINAL V6 code — not a new app

- `components/arena/ArenaWheel3D.tsx`: new cohesive dark petrol / Arena green / champagne gold materials, deeper 3D rim and metallic bearing, 60 animated instanced rim bulbs, a reactive pointer glow, natural time-based spin deceleration, and the existing **unchanged exact approved Arena logo PNG** as the hub texture. No text-retyped replacement logo, geometric fake, new audience, or stage clone.
- `components/arena/ArenaWheel3D.css`: stage-appropriate LED floor, suspended truss outline, side light beams, 16:9 projector viewport framing, mobile viewports, result-card overlay, reduced-motion preference.
- `lib/session-games.ts`: pre-spin delay changed from 450ms to an **authoritative server-scheduled 3000ms**. Both mobile and projector use `startsAt`, `stopsAt` and `revealAt`; signed winning sector / unique spin ID / score ledger are kept on the server.
- `components/arena/Session.tsx` and `lib/client.ts`: the public join/read/interact/answer/survey routes no longer wait for Firebase `authStateReady` to resolve the trainer token. **Trainer control, create, private state and authorized admin actions still obtain the trainer Firebase token** and are validated by backend. This avoids indefinite “connecting…” on anonymous projector/client contexts. Decorative second WebGL scene is not mounted alongside the real 3D wheel to preserve GPU headroom.
- `ArenaWheel3D.tsx` also detects software WebGL / coarse pointer devices and reduces resolution/framerate only in those cases, with elapsed-time-corrected wheel rotation (the signed server finish timestamp is unchanged).
- `tests/render.test.tsx` regression coverage updated for the new 3-second countdown, exact approved logo asset path, real WebGL geometry, CSS stage, one-spin ledger, and explicit public-route auth vs host-only auth.

## Testing and evidence

- Original V6 build, TypeScript, authorization, scoring, prior manual/auto question reveal, and isolated two-to-five client sessions remain in CI.
- Additional **real V6 React wheel browser E2E** `e2-staging-qa/luxury-wheel-browser.mjs`: one synthetic player opens the participant React page, a separate 1920×1080 Chromium page acts as projector, and both read the actual V6 HTTP handler with a disposable in-memory SQLite database. Synthetic participant taps the real wheel overlay, verifies server countdown close to 3 seconds, spin duration exactly 4 seconds in the fixture, zero early sector disclosure, 409 for duplicate spin, one signed winner and one ledger-driven prize.
- The final tested code SHA is **green**: https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41996667260. This includes original V6 tests, five synthetic client sessions, manual/auto reveal and actual 3D wheel React browser flows with signed server result and no duplicate spin.
- An earlier browser trace (https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41995104194) proved the API responded 200 and the wheel was mounted, but heavily loaded software WebGL caused some long browser-main-thread delays (one direct state probe took >14 seconds). This is why the public-auth and duplicate-renderer fixes were applied. Those initial failures did NOT prove the real worker was unavailable.
- **Visual QA is not yet equivalent to physical hardware acceptance.** On headless SwiftShader, taking full screenshots can hang even when game-state assertions pass; the screenshot step is optional and failure is reported. Old captured evidence can show viewport clipping because it predates final CSS constraints. Do not treat it as the current final stage look.
- No production Worker/D1/Pages/Firebase rules, live sessions or `main` branch changed. No merge/deploy. Actual private Sites V6 source-to-deployment provenance still awaits verification.

## Next acceptance steps

1. Confirm latest isolated CI run passed at exact branch head.
2. Capture **non-software GPU** 1920×1080 projector + 390px mobile at rest/countdown/spin/reveal, verify original logos and the FULL wheel and result card visible without scrolling. Have user visually approve.
3. Test on actual Android/iOS phone + projector, low-power laptop, denied WebGL fallback, focus/refresh, audio enabled, reduced-motion.
4. Integrate wheel's associated Challenge Card and trainer grading UI visual polish without changing idempotent backend score ledger; repeat 2 + 5 real-device QR session tests.
5. Confirm authoritative private V6 deployment source and grant explicit release/rollback approval before publish.

**Preservation guarantee:** keep the earlier V6 branches and all user-approved logo assets. The wheel feature is isolated in an additive feature branch, not released.

## Final visual QA checkpoint — 2026-11-05

The verified GitHub Action above produced actual Chromium screenshots, including `17-luxury-wheel-signed-result.png` and `18-luxury-wheel-mobile-result.png`. At this checkpoint: the 3D wheel fits inside 1920×1080 without clipping, the correct prize card is visible, the unchanged approved MTS Training Arena hub logo stays upright when the sector wheel stops, and the responsive mobile view shows the official outcome. This is **software-WebGL simulation**, not physical GPU/phone/projector acceptance. Exact Git SHA above applies to functional code; documentation-only updates do not require another binary build.
