# MTS Training Arena — Version 6: Complete Experience Improvement Plan

**Owner-approved scope | 2026-10-19 | Status: PLANNED — NOT IMPLEMENTED BY THIS DOCUMENT**

## Non-negotiable product decisions

1. **Keep Version 6 itself**. Do not create a V6.1 or V7 product, change the V6 public URL, replace the app, merge into `main`, touch legacy `/arena/`, or publish unverified changes.
2. **Participant registration UI is LOCKED**: preserve the existing registration form exactly as currently implemented, including the full name, preferred language, employee ID, conditional team selector, confirmation checkbox, and existing participant recovery flow, order, labels and underlying validations. Do not remove, shorten, hide, rename or automatically submit any required field. You may improve surrounding *pre-entry waiting* and *post-entry status/error/recovery feedback* only, without modifying the form itself.
3. Preserve one QR per session, real trainer Firebase auth, role/ownership rules, original logos, Arabic/English and RTL/LTR, existing rooms, scores, player identity, answer immutability and audit, polls' anonymity. Keep real server state authoritative.
4. Use existing dev branch `develop/v6-github-arena` and V6 source under `work-site-recovery-v6/`. Validate every bounded change with current CI. Release to **the existing `/v6/` deployment only** after passing gates.
5. Avoid showing simulated data as real learner results, fake availability, fake readiness, or pretending source/static checks prove actual browser/mobile/projector E2E. Do not modify live Cloudflare/Firebase credentials/rules without a separate authorized and reviewed need.
6. Each game must fulfill its **teaching purpose**, not just visual excitement: appropriate trainer control, mobile interaction, distinct projector reveal and correct data/learning feedback.
7. Keep important content legible and interactions accessible: minimum ~44×44px tap targets where feasible; sensible readable text; reduced-motion/quiet/light effects modes; keyboard/focus support; no lengthy forced animations, no sound without opt-in.

## Priorities / tracking

- **P0**: blocks trustworthy classroom operation, truthful feedback, or an essential interaction.
- **P1**: noticeably improves trainer/learner workflow or flagship game value; implement after P0 gates.
- **P2**: professional finishing and reporting after classroom readiness.
- Each item begins **[ ]** and only changes to **[x]** after implementing, testing and recording evidence. No claim that this list is already implemented.
- Existing features noted here (e.g. V6 local simulator, cinematic activity images, Power Timer, Poll chart, podium) require **audit and enhancement**, not needless rebuild.

## Phase A — Real-world baseline and safety gates (P0)

- [ ] A01 Inventory exact deployed `/v6/` HTML/assets, dev-branch commit, backend environment, and known integration contracts; record no-change snapshot/rollback plan.
- [ ] A02 Create a **controlled disposable test session** using an authorized trainer login, never a real training room, once appropriate interactive access exists. Use 20-role scenario across trainer, projector and trainee; no fabricated claim of QR/mobile browser test.
- [ ] A03 Instrument stage transitions, join approval, answer receipt and failed/retried fetches with safe non-PII diagnostics. Keep admin secrets protected.
- [ ] A04 Run 60-minute classroom checklist: begin with early scan, joined lobby, 10 activities, late joiner, paused round, timeout, reveal, team/individual scoreboard, survey and ceremony; test with actual phones and projector before calling this complete.
- [ ] A05 Run realistic low-end Android/mobile Safari, 320/375/430px, desktop and 1080p projector tests; Arabic and English, RTL/LTR, sound/effects off/light/full. Verify 20-person and 60–80-person load with distinct clients, not only local test clients.
- [ ] A06 Preserve all working integration/permission tests, player tokens, CSRF/CORS expectations, ownership, strict rate limits, no duplicate points and single-QR contracts. Backward compatible schema/UI where needed.

## Phase B — Trainer workflow, from authoring to ceremony (P0/P1)

- [ ] B01 **Start session efficiently**: choose blank session vs sample ten-activity deck vs templates; never force deleting 8 unused games for a short workshop (P1).
- [ ] B02 **Estimate total duration**: activity/question countdowns + game reveal intervals + trainer-paced allowances and breaks; flag unrealistic 30/60-minute agenda (P1).
- [ ] B03 **Builder clarity**: readable labels, larger edit/reorder/preview controls, clear saved/unsaved/publishing states, mobile usability, preserve manual edits (P1).
- [ ] B04 **Draft retention**: autosave/manual save recovery, duplicate, undo accidental deletion where safe, and return from simulator to the same draft without data loss (P0).
- [ ] B05 **Simulation fidelity**: upgrade existing browser-only practice into deterministic, transparent dry-run using real game rules/shared pure functions where possible; mock 1–20 learners with configurable correct/wrong/no-response, tied scores, late joiners and deadlines; never create real rooms/QR, award real points or pretend the backend ran (P0).
- [ ] B06 **Activity micro-simulator**: one-click Try Activity on all 10 cards and inside editor; show short purpose/how-to, run/reveal/restart, trainer/learner/projector perspective; cover each distinct game mechanic (P0).
- [ ] B07 **Readiness check**: accessible images/videos; QR target correct; host auth; API connectivity; projector URL; audio opt-in; optional warning for offline media, missing question answers, oversized content. Do not falsely assert hardware connectivity based on a basic HTTP test (P0).
- [ ] B08 **Separate launch states**: name buttons explicitly Open participant lobby and Start first activity; disable premature launch and show a short confirmation of participant count (P0).
- [ ] B09 **Live director dashboard**: concise big response count, ready/pending/connected, current activity, next action and clock; no crowded control grid or accidental actions (P0).
- [ ] B10 **Trainer safeguards**: pause/resume/+10 seconds, late-join approval for next activity, resync/reconnect, intentional close/reveal, next round, confirmation for finish, easy QR access; prevent duplicate host submissions (P0).
- [ ] B11 **Trainer learning cues**: for each game, show instructional objective, best session moment, approximate group size, facilitation instructions and 1-question debrief prompt (P1).
- [ ] B12 **Tools/reporting distinction**: Quiz accuracy vs Live Poll opinion distribution vs Flashcard confidence vs Escape progress; avoid treating unscored games as wrong answers (P1).

## Phase C — Trainee journey after scanning QR (P0/P1)

> **Registration form freeze:** keep existing full registration page/fields/order and confirmation controls unchanged. Specifically do NOT implement earlier suggestions to shorten that form or add guest bypass.

- [ ] C01 **Scan before lobby open**: distinct warm-up/pre-lobby state when the session is in Ready/Draft, with clear trainer not opened yet; avoid showing a form that later fails `NOT_LAUNCHED`. The current registration form appears unchanged once it is permitted (P0).
- [ ] C02 **Connection errors**: if session invalid/not found/API unreachable, stop indefinite spinner, show friendly, actionable Try again / Return to code page without destroying entered data (P0).
- [ ] C03 **Post-registration recovery**: obvious secure Copy recovery code button, saved confirmation, directions for device replacement; no token leakage or weakening verified identity; keep original registration form unchanged (P1).
- [ ] C04 **Participant lobby**: large joined/approved/pending badges, title, trainer start status, next activity if permissible; eliminate redundant waiting banners (P1).
- [ ] C05 **Mobile playing viewport**: prioritize readable question, selection, server-aligned timer and primary answer action; collapse secondary controls/queue and avoid excessive header/chrome (P0).
- [ ] C06 **Typography/accessibility**: replace tiny 5–10px functional labels, improve contrast on trainee light theme, enforce touch size/focus, long text wrapping, RTL/LTR and zoom. Check with actual screens not CSS alone (P0).
- [ ] C07 **Submission state machine**: `selected → sending → acknowledged by server` or `failed (not recorded)`; never show recorded before backend confirms. Disable duplicate sends safely, restore/retry after response failure (P0).
- [ ] C08 **Advance focus**: on question/activity change, restore visible top and sensible focus; do not let a long previous item leave trainee scrolled to a footer, avoid keyboard covering action (P0).
- [ ] C09 **Network resiliency**: current fallback learner poll may be ~12 seconds when no socket; improve consistency during timed questions, show clear reconnecting status, preserve first-confirmed response and prevent false time-up/duplicate submission (P0).
- [ ] C10 **Between rounds**: coherent waiting-for-trainer/scores/next activity; do not flash conflicting result or stale answer when rounds change (P1).
- [ ] C11 **Personal end screen**: my name, own points, rank, progress, proud completion and optional feedback prompt even outside podium; correct tie handling; never reveal anonymous poll identity (P1).
- [ ] C12 **QA form freeze**: enforce regression screenshot/DOM test asserting same trainee registration fields, labels, order, identity acknowledgment and recovery behavior before every release (P0).

## Phase D — Projector and group experience (P0/P1)

- [ ] D01 **Stage legibility**: full-screen clear current game/question, high-contrast type readable from back row, big timer and restrained metadata (P0).
- [ ] D02 **Three roles remain different**: participant selects and submits; trainer directs and controls; projector displays stage/results but never exposes secret answers prematurely (P0).
- [ ] D03 **Intro**: keep 10 WebP cinematic images, clear game title and per-game identity; skippable, reasonable duration, don't consume an unfair chunk of timed-answer window (P1).
- [ ] D04 **Stage endings**: deliberate reveal animations tied to confirmed backend results; accurate vote chart, scoreboard, score rewards and meaningful debrief without unnecessary delays (P1).
- [ ] D05 **Celebration**: existing 3D trophy/fireworks/podium checked against desktop/mobile and under reduced-motion; winners/ties and individual results based on server, no fake score, CPU-bounded FX and opt-in sound (P1).
- [ ] D06 **Quiet/low-power mode**: full/light/off settings and keyboard navigation; performance budgets for low-end phones/projector, avoid 80-device fanout regressions (P0).

## Phase E — Game-by-game 10-activity overhaul (P1, with P0 usability where needed)

| Wave | Activity | Educational goal | Changes: interaction / stage / facilitator controls | Proof / acceptance |
| --- | --- | --- | --- | --- |
| 1 | **Wheel of Fortune** | Randomized review & challenge | Rebuild giant polished beveled **3D-feel wheel**, harmonious luminous distinct sectors by question/bonus/penalty/mystery, readable labels and dramatic clear pointer; physical-feel easing, short spin countdown, tick/sound (opt-in), stopping highlight and actual server-selected reward; participant turn indicator, host spin/reveal/control and safe re-spin audit | Wheel stops on the **server-assigned** sector; fairness unchanged; works all sizes, RTL, quiet/reduced motion |
| 1 | **Open the Box** | Curiosity & discovery | Closed 3D locked treasure box grid; premium lid-open transition (not just fade), clear open vs unopened state; reveal question/reward/challenge; highlight who may choose, indicate used box; host controls progression | Each box opens once as rules require; real server box outcome; state persists after reload |
| 1 | **Flashcards** | Retrieval practice & self-reflection | Visible stacked 3D deck, actual front/back flip, next/previous progress, Known/Review later; summary of participant self-ratings (not invented mastery rate), host aggregate only when trustworthy | Flip/assessment/review progress correct on mobile/desktop and persisted per underlying engine semantics |
| 2 | **Ultimate Game Show** | Competitive recall & risk | Original premium TV-studio staging, contestant spotlight, distinct progress ladder, large 50:50/audience/+30s lifelines, betting tension, audible/visual stage win/lose cues | Server controls stakes/lifelines and no unauthorized second use; answers stay hidden until reveal |
| 2 | **Escape Room** | Collaboration & multi-step problem-solving | Distinct thematic rooms, interactive door/map, lock/unlock transition, hint reveal, mission countdown, team progress and final escape win; trainer audited override | Correct room order and permissions, no duplicate clue credit or soft-lock; restore state after reconnect |
| 3 | **Meta Plan** | Categorization/brainstorming | Clearly separated category columns with consistent color, rich digital sticky notes, fluid drop/assign interaction and touch-friendly tap-to-assign alternative; meaningful completed board | Accurate grouping and readable final board on projector; noncompetitive results not scored as Quiz |
| 3 | **Order It** | Sequencing and procedures | Drag and touch-friendly up/down controls, large step numbers, snap feedback, distinct selection/submit/locked/reveal; optionally show partial sequence feedback **only if scoring contract supports it** | Works without drag using mobile buttons; backend grade matches displayed result |
| 3 | **Scenario Challenge** | Judgment/decision-making | Case intro and contextual media, consequential choice cards, branch consequence reveal and path recap, trainer debrief/discussion cue | Only authorized branch presented; no premature future content leakage; clear ending and discussion |
| 3 | **Live Poll** | Opinion gathering, not a scored test | Distinct voting cards for choice/rating/word/priority, live participation counter, **chart-only** results (votes+% for choice/word, 1–5 average for rating, weighted ranking units for priority), prominent winning bar without false correctness | Chart uses **real** tally and zero-response state; no quiz letters/correct badges or scoring, privacy intact |
| 4 | **Quiz** | Knowledge checking | Clear options/confirm answer, confident selection/submit feedback, correct-answer reveal, optional short streak/energy feedback if grounded in score data; responsive A/B/C/D and multiple configured question kinds | 2–4 choices, speed scoring, immutable first accepted response, explanation and timer remain accurate |

**Each game's definition of complete:**
- [ ] Identifiable distinctive look on projector within 2 seconds; retains approved brand and source image.
- [ ] Mobile learner can explain goal and submit without trainer help; no tiny controls.
- [ ] Host has obvious next/reveal/restart where rules permit, without unsafe game mutations.
- [ ] Opening → play → result/debrief is educational and visually rewarding; default animation short and skippable.
- [ ] Arabic/English, touch/keyboard, paused/timeout/offline, full/light/off FX, reconnect.
- [ ] 1/20/80 learner stress checks; score, outcomes, poll privacy and server truth consistent.

## Phase F — Reports, security and release readiness (P1/P2)

- [ ] F01 Separate activity-specific learning analytics and consistent breakdown (do not imply Poll, Meta Plan or non-scored activities have a wrong-answer rate) (P1).
- [ ] F02 Branded MTS PDF post-session report in addition to existing CSV/JSON, accurate participant aggregates and no unauthorized personal data (P2).
- [ ] F03 Assess unsigned Cloudinary browser preset quotas/abuse; plan compatible authenticated/signed media route and per-user rules if required, without blindly disrupting existing asset links/Worker (P0 security review).
- [ ] F04 Test accessibility/UX: Android/iOS, 320/375/430px, portrait/landscape, RTL/LTR, network loss, interruption, reload/recovery, screen reader, contrast, keyboard (P0/P1).
- [ ] F05 Every change backed by targeted component/engine tests plus CI and controlled staging verification. No main/legacy merge, V6 Pages publish only with explicit success and rollback path (P0).

## Implementation waves / sequencing

1. **Wave 0 — reliability first**: A baseline + C01/C02/C07/C08/C09/C12, B07/B08, D01/D02; fix high-risk classroom bugs without changing registration form.
2. **Wave 1 — core instructor/participant UX**: B01–B06 and B09–B11; C03–C06/C10; projector legibility; measured trainer dry-run.
3. **Wave 2 — signature WOW games**: Wheel, Open the Box, Flashcards; ship each game independently and check learner/stage/host separately.
4. **Wave 3 — immersive mechanics**: Ultimate Game Show and Escape Room.
5. **Wave 4 — learning activity polish**: Meta Plan, Order It, Scenario, Live Poll, Quiz; final results and ceremony.
6. **Wave 5 — reporting/security/acceptance**: activity-specific analytics, PDF, upload security and 20/80-device full acceptance.

### Test scenario: 60-minute Communication Skills workshop

- 20 attendees, one QR, same unchanged name/language/employee-ID/team/identity-confirmation form.
- 00–10 Live Poll opinions (graphical results).
- 10–25 Quiz knowledge questions (individual scores; pause/+10/timeout).
- 25–40 Scenario Challenge branching.
- 40–50 Order It process sequence.
- 50–60 final reveal, podium, optional feedback survey.
- Additional test run covers **all ten** activities, one individually and in a combined deck; early scan, late join, duplicate login, device recovery, offline at submission, low bandwidth, team game, ties, 80-client fanout, mobile projector.

### Acceptance / Definition of Done

A task is DONE only after:
1. A reproducible *before* issue or learning goal, exact changed source files, and explicit new behavior;
2. Unit, integration, and rendering tests with **server-authoritative** expectations;
3. Arabic/English and three-role tests, no participant-form regression; media/logo checks;
4. Successful GitHub Actions validation + reviewed deploy of existing `/v6/` only;
5. Actual end-to-end phone/projector/user acceptance (if not performed, mark **pending physical validation**, never claim passed);
6. Verified no change to `main`, legacy, unrelated APIs/rules, databases/secrets, or real-session history.

### Work log template

| Item | Priority | Status | Commit / CI / Evidence | Classroom validation |
| --- | --- | --- | --- | --- |
| Baseline and registration freeze | P0 | Planned | — | Pending |
| QR early-scan state and API errors | P0 | Planned | — | Pending |
| Server-confirmed learner submission | P0 | Planned | — | Pending |
| Live sync fallback | P0 | Planned | — | Pending |
| Trainer controls + full rehearsal | P0 | Planned | — | Pending |
| Wheel/Box/Flashcards WOW | P1 | Planned | — | Pending |
| Game Show/Escape + other five games | P1 | Planned | — | Pending |
| Projector & results/ceremony | P1 | Planned | — | Pending |
| Reports, upload hardening, acceptance | P1/P2 | Planned | — | Pending |

**This document is a plan and audit scope; it does not mean the UI has been changed, real classrooms tested, or any issue reproduced in a mobile browser.**


## Implementation progress — 2026-10-19, checkpoint 2

**Important separation:** implemented-in-development != CI verified != released to the live `/v6/` website. The items below were added to `develop/v6-github-arena`; they are **not marked fully accepted** until the latest branch build passes and is released, then real-device checks are performed. Do not update `main` or legacy `/arena/`.

| Work item | Latest implementation state | Evidence | Not yet verified |
| --- | --- | --- | --- |
| C12 Participant form frozen | **Source and regression guard implemented** (registration form checksum unchanged); TypeScript-incompatible BigInt from earlier guard replaced by compatible numeric hash | `work-site-recovery-v6/tests/render.test.tsx` | Latest CI |
| C01 Early QR / pre-lobby | **Implemented on dev branch**: explicit preparation message until lobby opens, no form change | `SessionEntryFeedback.tsx`, `Session.tsx` | Latest CI; real QR device |
| C02 Invalid code / unavailable state | **Implemented on dev branch**: retry / change session code; no indefinite blocking spinner on failed initial request | `SessionEntryFeedback.tsx` | Network conditions E2E |
| C08 New activity scrolled to top | **Implemented on dev branch**: learner-only scroll reset on round/intro change; join form not covered by intro | `Session.tsx` | iOS/Android keyboard scroll QA |
| C09 Active learner fallback | **Implemented on dev branch**: 5s fallback during active round vs previous 12s, preserving standard socket and lobby slower fallback | `Session.tsx` | Cross-client latency and load test |
| C07 Server-verified answer | **Implemented on dev branch**: acknowledged/varying/uncertain receipt states, read-before-resubmit; Live Poll no longer says recorded on click alone | `Session.tsx`, `LivePoll.tsx`, CSS/tests | CI; actual lost-response simulation |
| B07 Readiness checklist | **Implemented on dev branch (first pass)**: honest API, queue and player state plus manually confirmed projector/audio/media | `TrainerReadiness.tsx`, `Session.tsx` | Automated media probes & real hardware QA |
| B08 Separate trainer launch states | **Implemented on dev branch**: clear lobby opening and first-activity labels, confirmation before starting with zero approved learners | `Session.tsx` | CI; real trainer walkthrough |
| B09 Director metrics | **Partially improved on dev branch**: in pre-launch, shows approved participants rather than meaningless answer count; existing live answer counter remains | `Session.tsx` | Remaining richer telemetry/actions |
| B01 Builder templates | **Partially implemented on dev branch**: choose blank vs ten sample activities with confirm-before-replace; no designed 15/30/60 templates yet | `Builder.tsx` | CI; draft preservation UX |
| B02 Trainer duration planning | **First-pass implemented on dev branch**: explicitly conservative timing estimate + untimed step count; no target budget, breaks or discussion estimator yet | `lib/session-planning.ts`, `Builder.tsx` | Test build; workshop pacing validation |

### Previously live/released V6 capabilities, subject to true classroom validation

- Existing V6 GitHub Pages site, ten-activity catalog, one room QR, player/host/projector roles.
- Original cinematic 3D images attached to ten activity intros.
- Immersive Live Poll vote cards and chart-only results; victory podium with effects.
- Existing trainer simulator with per-activity trial and session rehearsal **as an offline/local preview only**; it still needs fidelity work against real authoritative game rules.
- These earlier features were released successfully in a previous V6 Pages workflow, **not** evidence that current new fixes were released.

### Current CI/release gate

- Previous GitHub Actions V6 tests failed on the old frozen-form test's unsupported BigInt syntax.
- BigInt test source was subsequently fixed. Latest **combined** branch run must be green; status not presumed until checked.
- No V6 release request for the current wave should be added before that green run. No real-live production data was changed.

### Pending major plan items

- Complete server-authored dry-run simulator with multi-learner/tie/offline scenarios (B05–B06).
- Full trainer playbook/dashboard/late arrivals and projected legibility (B03/B09–B11, D01–D06).
- Remaining learner accessibility, 44px touch targets, clear per-activity result, personal result, and recovery copy (C03–C06/C10–C11).
- Five signature game show / WOW overhauls: Wheel, Open the Box, Flashcards, Game Show, Escape Room; plus the other five games' educational/gameplay polish (E).
- Accurate activity-specific analytics, branded PDF, upload security review and complete 20/80 participant stress and physical room acceptance (F, A).

**Next execution gate:** wait for latest Actions run, fix any failing checks; only then publish reviewed tested V6 to the same /v6/ path and verify asset/route delivery.


## Verified V6 release checkpoint — 2026-10-19

**Latest actual V6 Pages publish completed SUCCESSFULLY:** [GitHub Actions release #39288217789](https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/39288217789), commit `c9b179461c0598eb99b82d1c780e0af14a4ffd22`. It re-ran full V6 tests/build and deployed the existing `/v6/` path. Earlier combined pre-release validation at `045bf036ca58791490fa1f1a922c611ea9330d66` also passed [run #39287859705](https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/39287859705).

**Now implemented, CI-built and deployed in V6 (software-level confirmation):**
- QR early-scan/pre-lobby, invalid-code and API failure retry, no unregistered participant intro splash; current full registration form stays unchanged.
- Explicit server receipt status for answers, safe uncertain POST verification, removal of misleading instant-success Poll click state, mobile question scroll reset, 5s fallback refresh during active disconnected rounds.
- Trainer preflight panel with accurate API/attendance/deck indicators and visibly manual media/projector/sound confirmations; distinct lobby-open vs first-round-start controls and zero-attendee warning.
- Builder blank/sample deck choice with guard against accidental replacement; conservative timed-step/transition estimate.
- Personal trainee results using existing authoritative scoreboard, including team rank when relevant and participation acknowledgment for unscored cases; recovery-code copy button **outside** the unchanged registration form.
- Existing simulator, all ten games, images, finale, one session QR, original branding and legacy routes remain intact.

**Still not complete and not to be misrepresented:** real phone/device scan, simulator/server equivalence, staged disconnection/lost-ack QA, 20/80 participant concurrency, projector visual validation, game-by-game WOW rework (Wheel, Box, Flashcards, etc.), professional PDF and per-activity reports, signed media upload/security review. The latest release demonstrates CI/build/release success, not full in-room UAT.

**Next planned development:** B05 simulator rules/fidelity, B09/B10 richer live trainer director controls, C05/C06 trainee mobile legibility and touch target pass, and Wave 2 signature game redesigns. Preserve registration form, exact V6 URL and the historical released artifacts.
