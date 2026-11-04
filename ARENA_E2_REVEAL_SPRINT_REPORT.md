# Experience 2.0 — Per-Activity Answer Reveal + Cinematic Stage

**Branch:** `feature/arena-e2-per-activity-reveal-20261104`  
**Base:** `feature/arena-e2-staging-e2e-20261104`  
**Last full green CI at time of report:** https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/41853660169  
**Status:** Code integrated into existing V6 candidate; automated tests green at previous CSS commit. Production **NOT** changed or released.

## What was implemented in original V6 files

- Reused the existing `Builder.tsx`, `QuestionStudio.tsx`, `Session.tsx`, `lib/service.ts` and `lib/domain.mjs`; this is **not** a replacement application.
- Per-activity `revealMode`: `manual`, `auto`, or omitted to inherit V6's session-wide default.
- `revealDelay`: 0, 2, 3 or 5 seconds for automatic reveal.
- `revealFx`: light, standard or cinematic. `revealSound`: boolean, still subject to the user's existing browser/audio consent and quiet controls.
- New UI component `AnswerRevealSettings` appears in activity editing and for each actual nested Quiz/Ultimate Game Show knowledge question. Preview is local visual only and never changes a session.
- Server state includes `revealScheduledAt` and `revealMomentAt` as public timing metadata, **without** exposing the answer early.
- Manual close leaves results locked until the trainer calls the existing authenticated `revealkey` action.
- Auto close or server timeout schedules a reveal at the server timestamp; follow-up GETs settle it through compare-and-swap on the V6 database revision. It is *not* driven by local client timers.
- Public answer keys remain hidden until the server's confirmed reveal state; no score ledger or backend grading method was replaced.
- The existing trainer panel shows pending auto countdown and can reveal early. Explicitly configured rounds can't be skipped before reveal.
- After receipt of the **server-confirmed** timestamp, the original V6 React projector can show a cinematic cyan/green broadcast effect with beams, title, controlled light burst and accessible reduced motion.
- A tab-local *visual-only* cue id avoids re-playing the effect on an immediate projector reload.
- Legacy V6 sessions without per-activity configuration keep their existing ArenaMoment/auto/manual reveal behaviour.

## Compatibility

Legacy special activities, including **Meta Plan**, Wheel/Boxes, Flashcards and their custom server reveal flows, are not repurposed into generic quiz reveal. A regression test initially caught Meta Plan's incremental reveal, and that incompatibility was fixed before proceeding. Championship (ladder) remains on its own existing rules.

A question group (Quiz) may inherit a policy from its root activity, while each nested question can override the policy separately. The previous flat deck transformation was corrected so it no longer overwrites the trainer's selected delay.

## Verification

- Added server-side `tests/reveal-policy.test.ts` to the standard V6 TypeScript/test script.
- Tests cover invalid mode/delay/FX types, nested inheritance, explicit manual key lock, delay boundaries, timeout driven auto-reveal, compare-and-swap idempotence, next-round reset, and backwards-compatible legacy settings.
- Existing comprehensive V6 TypeScript/auth/game scoring tests continue to pass.
- Five synthetic Chromium clients, the original V6 service, disposable in-memory SQLite and a real HTTP read-only projector still complete two rounds with authoritative scores (Lightning 3,000; Wave 1,000).
- `e2-staging-qa/reveal-ui-browser.mjs` tests the **original React projector** for manual and automatic reveal, no early answer, animation level selection, non-replay on reload and screenshot QA. Its artifact contains `08-react-projector-manual-cinematic.png` and `09-react-projector-auto-light.png`.
- Latest exact visual/CSS commit should be checked in GitHub Actions before any claim of current-HEAD green status.

## Pending release blockers

1. Actual latest deployed **private Sites** app source SHA and Worker V9 source provenance remain unverified.
2. No physical phones/projector, actual QR camera scan, real Firebase trainer auth or real Durable Object/WebSocket fanout tested for these new controls.
3. Old full V6 projector layout and official-logo placement have **not** been replaced with Experience 2.0's approved stage branding yet; the original product logo remains available in the separate e2-preview assets.
4. No external staging deployment or production data modified.
5. Realistic sound setup, motion preferences, and accessibility validation still need hands-on acceptance.
6. Any later simultaneous trainer actions require real external staging concurrency tests.

**Release gate:** no merge to `main`, no deployment, Firebase/D1/Cloudflare mutation or production traffic until authorized and staging/mobile/projector tests are verified.

Master plan: https://docs.google.com/document/d/1XbQp6FxWk9wFz5clLttyFAjk1cKil4W8ySZBDQiV2CA/edit
