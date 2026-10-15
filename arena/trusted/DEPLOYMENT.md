# MTS Training Arena — trusted settlement backend

This is a **server-side prototype** and is NOT currently deployed. The public GitHub Pages pilot is **not scored**.

## Service

- Runtime: Node.js 22+, `npm install` in `arena/trusted`, then `npm start`.
- Endpoint: `POST /v1/settle`, JSON body `{"roomId":"<24 hex>","roundId":"r1"}`.
- Header: `Authorization: Bearer <Firebase Auth ID token>`.
- `ARENA_ALLOWED_ORIGIN` must exactly match the HTTPS Arena website origin.
- `FIREBASE_DATABASE_URL` selects the intended RTDB instance.
- Firebase Admin Application Default Credentials **only on the backend**. Never place service account JSON or tokens in GitHub Pages, GitHub source, or browser JavaScript.
- A trusted worker invokes an RTDB transaction at `arenaTrusted/ledgers/<roomId>` to prevent duplicate settlement, then publishes a scoreboard at `arenaV1/scoreboards/<roomId>` with a monotonic round count.
- Answer keys come from `arenaTrusted/roundKeys/<roomId>/<roundId>`. No answer keys should be in the public `arenaV1/rooms/.../public` tree.

## Release blockers — MUST FIX BEFORE real employees or scored sessions

1. Current pilot permits any allowlisted trainer to change `arenaV1/rooms/{id}/private/createdBy` and room states; the backend verifies ownership against that mutable field, which is **not secure ownership yet**. Create server-owned immutable room ownership, reject nonowner room mutations, and emulator-test multi-trainer attacks.
2. **Server-side room creation and question publishing** must create immutable answer keys and a signed/immutable round snapshot. The current browser pilot does not create `arenaTrusted/roundKeys`, so settlement endpoint cannot score it.
3. Current RTDB answer records only have `choice`, not trusted response timestamps. Add server-verifiable timing/eligibility invariants before production scoring.
4. Participant records are mutable by allowlisted trainers. Freeze per-round roster/team membership server-side before grading.
5. Protect all `arenaTrusted` paths by default client-deny rules and audit scoreboard client read/write rules. Client Admin SDK access bypasses those rules by design; secure backend credentials and API are mandatory.
6. Run real Firebase Emulator Suite tests, concurrency, retries, cross-room access, and end-to-end browser tests; only then deploy the backend and approved rules together.
7. Choose hosting with a supported Firebase Admin SDK service identity, check Spark/Blaze/billing and hosting costs before provisioning, rate-limit the endpoint, and configure operator logging.

**Do not** copy this directory under an exposed static web folder, deploy before these gates, or claim points are live.

## Backend-owned session lifecycle (new code, NOT deployed)

Four authenticated API routes are now implemented in `server.mjs`:

| Method | Endpoint | Body |
|---|---|---|
| POST | `/v1/rooms/create` | `{"title":"ACI Training"}` |
| POST | `/v1/rounds/open` | `{"roomId":"<24 hex>","activity":{"kind":"Quiz","question":"Example?","options":["A","B"],"correctIndex":0,"durationSeconds":30}}` |
| POST | `/v1/rounds/close` | `{"roomId":"<24 hex>"}` |
| POST | `/v1/settle` | `{"roomId":"<24 hex>","roundId":"r1"}` |

All four require a Firebase ID token in the Authorization bearer header, a matching browser origin, and an allowlisted trainer. Each round's answer key lives only at `arenaTrusted/roundKeys/{roomId}/{roundId}`; room ownership at `arenaTrusted/roomOwners/{roomId}` is written by the backend and checked on subsequent operations. The closed-round settlement reads this backend-owned identity rather than the mutable pilot `private.createdBy`.

`security/scoring-rules.proposal.json` now also denies any browser write to backend-owned rooms and all browser reads/writes to `arenaTrusted`. **It is a proposal; current published Firebase rules have not been updated**. Those rules and backend service must be released together after emulator CI passes.

Current lifecycle closes a question only once the server deadline has elapsed. Support for manually ending a round early will require an explicit trusted cutoff timestamp and matching answer eligibility verification.

**Still blocked for real scored sessions:** live UI wiring; immutable participant/round snapshots and timing records; trusted service deployment with credentials; full end-to-end and race-condition tests; cost/plan decision. Do not use actual employee data or treat the public pilot as scored.
