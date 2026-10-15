# Current delivery snapshot (October 2026)

The Studio is deployed on GitHub Pages: https://hazemshaaban77.github.io/MTS-Training-Arena/arena/index.html

**Functional without a Firebase connection:** session drafts; bilingual UI; local authoring/validation of eleven activity formats; projector-stage previews; local activity demonstrations; versioned JSON backup/restore (replace after confirmation); session inventory and CSV authoring report; local scenario simulation. Storage is browser-local except exported backups. No official attendee records or scores are produced by these tools.

**Staged but not live:** Cloudflare trusted grading Worker and separate Firebase pilot. The Worker explicitly has `ARENA_ENABLE_TRUSTED_V1=false`. Trusted live play, multi-device scored events, Firebase rules deployment, reissued service-account credential installation, and an actual 80-device concurrent test must occur before accepting real users. Never deploy an exposed service-account key. The QR link is scoped to a room/session, not a separate code per question.

**Legacy safety:** do not overwrite the original Quiz rules or credentials. Proposed Arena scoring rules exist for review and emulator tests only.

The older iteration notes below describe the history of this prototype and may refer to features that have since been expanded.

---

# MTS Training Arena — Foundation Preview

This is an **isolated, locally functional design and authoring prototype**, developed on the `feature/mts-training-arena-foundation` branch of the existing MTS-Quiz repository. Existing production files remain untouched.

## Run
Open `arena/index.html` in a browser (or serve `arena/` with a simple static web server). The **Enter Preview** button is explicitly *not* authentication. Draft sessions are stored in that browser's localStorage only.

## Working now
- Responsive trainer login concept and Smart Dashboard
- Arabic/English interface toggle (author-entered text is not translated)
- Session draft creation, rename, deletion, and automatic local save
- Activity catalog of all eleven approved activity types
- Functional simple Quiz, Live Poll and single Dropdown question authoring
- Questions and options editing with stage preview
- Draft activity reordering and preview-only projection screen

## Not yet implemented
A production-ready Firebase integration, audited and deployed security rules, multiple trainers, teams, authoritative scoring, nested activity orchestration, full game engines, reports, lifecycle automation and production deployment. **Do not use preview for actual participant data or training results.** Reuse of current Firebase project requires a separate security and capacity review before integration.

## Free-tier planning
GitHub Pages can serve these static assets. Realtime Database Spark has a limit of 100 simultaneous connections *including trainers and projector devices*. No assumption is made about the feasibility of supporting 100 trainees. No server secrets should ever be put in this repository.

## Safety
The local Studio and Simulator never touch Firebase. The OPTIONAL live pilot is a different, explicitly gated page that **would write to Firebase if someone opens it and connects after installing the necessary security rules**. No Firebase rules, settings or data have been changed by this commit. Original legacy pages and Firebase configuration remain unmodified.

## Local round simulator (iteration 2)
Open `arena/simulator.html` using a local HTTP static server or the branch preview.
- Uses saved drafts from the Studio if they contain a supported Quiz, Live Poll, or Dropdown activity.
- Otherwise provides three example rounds.
- Simulates two participants on the **same browser**, duplicate-answer prevention, pause/resume, fixed 100-point correct answer, poll counts, competition ranking, and discard of the current activity on session completion.
- There is **no actual Firebase connection**, cross-device joining, registration QR, live scoring authority, session persistence, or authenticated trainer account.
- Run engine tests with `node --test arena/engine.test.mjs`. The branch includes a GitHub Actions syntax/unit-test workflow.

Keep the feature branch unmerged until reviewed. No production deployment has been made.

## Firebase cross-device pilot (iteration 3 — NOT production ready)
Files: `arena/live.html`, `arena/live.mjs`, and `arena/security/arena-rules.reference.json`.

The new **opt-in Firebase pilot** is for carefully controlled **test-only rooms**, and is not active simply because the files exist. It implements:
- A trainer sign-in using existing Firebase email/password authentication **plus a manually provisioned allowlist entry**;
- A room-specific participation link and QR code;
- Anonymous test participant registration using a unique test employee ID, via an atomic claim;
- Public live question broadcast with **no answer key exposed**, participant answer submission once per round, and trainer-only response counts;
- Room closure. **No scoring is computed or written**, and there is no real gameplay fairness guarantee yet.

### Required setup before opening the live pilot
1. Review your existing Firebase project's authentication settings, Realtime Database instance, and **all existing root security rules**; note especially that permissive ancestor `.read`/`.write` rules cannot be restricted by child rules.
2. **Do not upload or replace the entire database rules** with `arena/security/arena-rules.reference.json`. That file is a *reference for the new `arenaV1` namespace only*, which must be carefully integrated with and audited against the existing production rules. Applying it wholesale would risk breaking the old quiz.
3. Provision **one trusted trainer UID** at `arenaV1/trainerAllowlist/<Firebase-Auth-UID> = true` via an authorized admin process. Client-side self-grant is forbidden by the reference rules.
4. Confirm Email/Password and Anonymous Firebase Authentication providers are enabled, and that `../firebase-config.js` points to the intended, reviewed Firebase project; do not copy service-account credentials to the repository.
5. In a **separate staging database/project**, deploy audited rules and use **fake names and fake employee IDs**, not real employee records. Verify unauthenticated, unknown trainer, duplicate ID, repeated answer, late answer, wrong-user read, and public answer-key access are rejected.
6. Serve the `arena/` content through a local static HTTP server with the expected legacy parent assets or a properly configured staging web origin. Only after review should `arena/live.html` be used for test sessions.

**Important limitations:** Testing against the actual Firebase project, deploying rules, verifying realtime behavior between physical devices, authenticating existing trainers, and collecting real employee records are **not done**. The existing pilot does not satisfy production security or gameplay requirements. It assumes a separate audit and staging validation.

### Why not connect the local scoring engine directly?
The local scorer trusts the browser. A trainee can manipulate browser code or write attempts. Reliable official points, outcomes, audit trails, anti-cheat, and cross-device conflict resolution need server-trusted enforcement (and a design that fits free-tier resources). Until that exists, the live pilot deliberately does not award points.

## Iteration 4 — Late join protection & projector pilot
- Participant registration now captures an immutable `joinedRound` from the live room. Client controls and reference Firebase security rules reject submissions to the round active when the participant joined. Admission is confirmed against the current server round; participants who join a running question wait until the next one.
- `arena/projector.html` is a **read-only, trainer-authenticated projector pilot**. It displays live question/options with existing MTS and Training Team logos, without showing answer keys, names, employee IDs, scores or trainer analytics.
- The trainer pilot now offers a separate projector URL. Only authenticated trainer accounts on the allowlist can use it.
- Test workflow includes projector syntax checks and added regression assertions for late-join rules.

These additions **have not been tested against an actual Firebase Emulator or cloud database**, and reference rules must undergo emulator testing, existing rules compatibility review and staging verification before any real employee data or live deployment. The security tests perform structural assertions, not proof of enforcement. No Firebase configuration or production branch was altered.

## Iteration 5 — Actual Firebase emulator checks and trusted grading contract

- `security.emulator.test.mjs` uses the Firebase Realtime Database emulator to assert that anonymous users cannot read private trainer data, ordinary users cannot self-appoint as trainers, claims are immutable, participant identities are private, late arrivals must wait a round, and answers are one-time and deadline-checked.
- `firebase.emulator.json` and `package.json` configure a **local test-only emulator** for the isolated reference rules; the tests do not require or modify the real Firebase account.
- `trusted/scoring.mjs` and `trusted/scoring.test.mjs` supply a standalone scoring contract for grading sealed rounds using private answer keys, rejecting duplicate submissions and replayed scoring events, and recomputing totals when an activity is discarded.
- GitHub Actions now runs JavaScript tests and an actual database emulator policy suite. Check the workflow status; code checked in **does not imply all tests passed**.
- **CRITICAL:** Trusted grading is *not deployed and not wired into the Firebase room pilot*. Browser scoring is not authoritative. A trusted server execution service or an equivalent secure design still needs selection, with clear review of free-tier limits.
- The existing Firebase project configuration, database rules and legacy quiz remain unchanged. The reference rules **must never be merged over existing production rules without an audit**.

## Iteration 7 — All eleven activity types and team rules (local-only)
- `activity-contract.mjs` validates and locally evaluates all **11 approved activity types**. Live Poll has no correct answer; Spin Wheel, Open the Box and Flashcards are ungraded presentation activities until an explicit activity reward is defined.
- `games.html` + `activity-lab.mjs` provide a **one-device interactive gallery** for every game type, accessible from the preview Dashboard. This is not a live multi-user engine and does not include complete cinematic animations or game-specific team workflows.
- `activity-contract.test.mjs` exercises correct/incorrect answers, input validation, outcome reveals, 3-level nesting, and competition ranking (1,1,3).
- `team-engine.mjs` and `team-engine.test.mjs` introduce immutable sum/average team standings; transfers during an active question are pending until closure and can be cancelled before execution. Individual earned points move with the trainee. Fixed-preset team scoring is not implemented in this module.
- **Still outstanding:** complete trainer editors for all game types, full activity-specific live UX, encrypted/private grading authority and backend integration, QR-stable authenticated joins, team changes inside actual Firebase sessions, results permissions and projection, reports/export, templates, saved library, session archival and organization-based retention, and end-to-end tests with actual devices.
- No production site has been deployed. The existing Firebase project is unchanged.

## Iteration 8 — Saved activity queue (local-only)
- `queue-engine.mjs` stores a versioned, immutable upcoming activity queue; enforces max three activity levels, supports nested depth-first progression, inserting previously saved activity trees at next/end/selected position, discarding the active activity, and skipping an entire unstarted parent tree.
- Queue operations reject stale version numbers or attempts to skip a parent that already started; skipped items remain in history and cannot be restored directly.
- `queue-engine.test.mjs` covers ordering, nested skips, immutable active items, saved insertions and version conflicts.
- **Not yet connected to Firebase, trainer controls or live multi-trainer concurrency.** These are business-logic building blocks and not a working production session queue.
