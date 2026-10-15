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
