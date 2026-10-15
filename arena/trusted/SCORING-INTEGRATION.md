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
