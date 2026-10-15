# Arena scoring integration boundary

The **live GitHub Pages pilot remains unscored**. The files in this folder are trusted-side *pure functions*, not a deployed scoring service.

## Flow required before launching a scored live event

1. Authorize a trainer on the server and securely store each round's correct answer outside any readable trainee path.
2. Freeze the round configuration and close the round under a server-enforced state transition.
3. Obtain authenticated participant registrations and immutable answer records from RTDB, verify every record belongs to the correct room and round, and enforce the server deadline.
4. Invoke `gradeClosedRound` with server-verified inputs and append **one** immutable ledger event per round using an atomic idempotency guard.
5. Recompute totals via `totalFromLedger` and projections via `rankPlayers` / `rankTeams`.
6. Publish only the verified score projection to an RTDB path whose write permission is restricted to a trusted service principal. Trainees may read only the intended public projection.
7. Emulator-test permissions, replay prevention, simultaneous closes, reconnection, and malicious clients before publishing scoring UI.

**Do not** calculate authoritative points in `live.mjs`, let trainers or anonymous clients set scores, or put correct answers in the public room.

### Infrastructure decision pending

Static GitHub Pages cannot run trusted grading. An appropriate server-side worker / Firebase backend with secure credentials and correct operating costs must be chosen before enabling authoritative scores. The current Spark RTDB project is not itself a trusted computation environment.

## Current state

- Pure scoring engine: `scoring.mjs`
- Pure ranked projections: `leaderboard.mjs`
- Regression tests: `scoring.test.mjs`, `leaderboard.test.mjs`
- Live deployment: **no points and no published leaderboard**

## Round settlement implementation (not deployed)

- `round-settlement.mjs` exports `prepareClosedRound`, `addSettlementToLedger`, and `prepareLeaderboard`.
- The settlement candidate validates the closed state, round identity, submitted option range and member IDs, then delegates to `gradeClosedRound`.
- The ledger helper rejects a previously credited round. **It is only a synchronous pure helper**, not concurrency control. In production, use a server-side atomic RTDB transaction (or equivalent compare-and-swap) so two workers cannot both settle.
- The projection recomputes standings from the whole authoritative ledger, not client-uploaded totals.
- `round-settlement.test.mjs` exercises successful settlement, unknown participant, invalid answers, poll and discard semantics, replay guard and mismatched ledger keys.

## Hard launch blockers

1. An authenticated **trusted backend** and deployment plan. GitHub Pages is static and cannot safely grade questions.
2. `privateRound` answer keys must be created and kept in server-only storage. Existing Arena room creation does **not** populate them.
3. Server-side authoritative immutable start/end time and closure snapshots. The pilot answer record currently stores `choice` but no trusted submission timestamp, so this settlement helper must not be used to infer timing fairness.
4. A tamper-resistant record of every eligible participant and assigned team for each round; no client-controlled score or round ownership changes.
5. Tightened Firebase rules for immutable settlements and read-only leaderboard projection, plus emulator tests and concurrency/retry tests.
6. End-to-end validation on a disposable test room before connecting the live UI.

**Status:** this is a testable offline trusted-domain implementation, not a live scoring endpoint, and it does not alter existing Firebase rules.
