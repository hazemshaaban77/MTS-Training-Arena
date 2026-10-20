# V6 Cinematic Experience — QA & release acceptance

This checklist applies to the isolated `/v6/` Version 6 and preserves the legacy `/arena/`, the original logos, existing QR, identity and confirmed scores.

## Implementation contract

- **Intro:** A trainer taps **Play next game intro** in lobby/results *before* Start/Next. The existing server-authoritative `highlight` cue broadcasts a reserved negative value to the projector. The projector overlays a 5.2-second cinematic introduction, with skip and a 2.8-second Balanced option. Each replay generates a different cue. It never starts the answer deadline or advances a round. Projector must display it without hiding a timed question. **No new backend/schema changes**.
- **Per-game identity:** Quiz, Championship, Wheel, Escape Room, Boxes, Polls, Meta Plan/Categorize, Order It, Flashcards and Scenario each have a localized introduction theme, artwork and caption. Cinema is also available offline in the trainer simulator as a separate preview.
- **Sound:** Audio is **off by default** even if the last session used it. The user must explicitly tap Sound on each page load for AudioContext unlocking. Music and event effects are toggles with adjustable volume; synthesized oscillator notes and filtered noise effects need no remote audio assets or autoplay permissions. Projector can enable sound; mobile learners remain quiet unless they opt in. Local Quiet and host room Quiet always suppress cues. The engine compresses/limits output and disconnects nodes.
- **Events:** Server-confirmed round/stage, answer lock, result reveal, correct/wrong result, 5-to-1-second countdown, leaderboard lead changes, champion celebration, championship level advance, successful wheel/box and lifeline actions. Celebration never awards points or guesses hidden keys.
- **Fallback:** Reduced Motion, Lite/Off effects and mobile Balanced avoid persistent high-GPU visual effects. Losing a live connection does not create fake ranks or outcomes. Original authority remains the Worker.

## Manual acceptance matrix (NOT automatically confirmed)

| Scenario | Viewport | Expectation |
|---|---|---|
| Trainer QR lobby / next game preview | Desktop 1440×900 | Intro button visible, click opens projector cinematic; Start button still controlled by trainer |
| Trainer | Mobile 320×640 | All controls reachable without zoom-out; Settings and Sound toggles reachable |
| Trainer | Mobile 375×812 | Intro, header buttons and settings remain visible and tap-size >= 44px |
| Trainer | Mobile 430×932 | No viewport-wide horizontal scrolling caused by cinema controls |
| Projector | 1920×1080 | Intro art/copy legible, skip available, no clipped animations |
| Projector | 1366×768 | Intro imagery and controls fit short screen |
| Learner | Mobile 375×812 | Intro never overlays a running timed question; answer button remains reachable |
| Slow network / offline | All | Stale snapshots cannot create a new ranking; game logic continues authoritative after reconnect |
| Sound blocked by browser | Mobile and desktop | No autoplay; button reports unavailable audio clearly |
| Quiet mode | Mobile and projector | No sounds on all events |
| Reduced Motion | Mobile and desktop | No ongoing or essential animation; all text/action still readable |
| Keyboard-only | Desktop | Intro skip, Sound toggle/settings and all trainer actions work with focus rings |
| Championship | Trainer/learner/projector | Enter stage, level advancement and award correctly based on backend rule v2 |
| Wheel / Boxes / Escape Room | Trainer/learner/projector | Event effects correspond to actual server actions and never leak hidden answers |

## Automated evidence

CI `V6 GitHub migration checks` runs all app, domain and render tests, TypeScript and frontend bundle; `Release MTS Training Arena V6 on GitHub Pages` repeats tests/build and verifies the isolated Cloudflare Worker + alternate gateway/CORS.

Specific regressions in `tests/render.test.tsx` check:
1. All 10 game-specific intros, alternate languages and original WebP artwork.
2. Replayable pre-round cues, different nonce, status- and index-limited consumption and non-interference with timed question.
3. Sound is off by default; musical and SFX cue calls are safe before unlock; controls have accessible labels.
4. Scoreboard / celebration banners derive only from confirmed transitions.
5. Older V6 identity, session, scoring, champion and regression tests continue to pass.

## Limits

Successful CI and public-page browser tests **do not** prove classroom acceptance with a real authenticated trainer, 20 actual learner devices, projector speaker setup, Safari/Android differences or artificial network interruption. Complete the manual scenarios before marking classroom UAT as accepted.
