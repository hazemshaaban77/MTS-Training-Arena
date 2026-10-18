# MTS Training Arena — integrated private continuation

Continues [hazemshaaban77/MTS-Training-Arena](https://github.com/hazemshaaban77/MTS-Training-Arena), reviewed at `5b10eb1c9acb3c54a0cec9f90a09e29847b7d003`, and the existing Work/Sites source at `a578426a50b4434862382ecc8b34fedaefa6249c`. Original logos and portable v1 modules remain retained under `public/` and `lib/upstream/`.

The canonical hosted continuation uses React/Vinext, a Sites-managed Worker and isolated D1. It reuses the existing Firebase email/password trainer authentication and `arenaV1/trainerAllowlist/<uid>` authorization. Legacy quiz/Pages, RTDB rules/data and the separately deployed Cloudflare Worker remain unchanged.

## Try it

1. Open the private Site and sign in with an existing authorized Firebase trainer account.
2. Use Session Studio to create/edit a draft, choose individual/teams, weights/ties, activities/sections and optional end survey. Review and create a Ready session.
3. Open the lobby. Share the **single session QR**. Participants enter their name, employee ID and language once, save their private recovery code, and stay in the same room through all activities.
4. Launch, pause/resume, add 10 seconds, close/reveal and advance. Approve late requests for the next activity. Open the projector in its own tab; control leaderboard, Quiet Mode and effects.
5. Finish with survey/ceremony and authorized reports. A standalone needs/impact survey can also be launched from Surveys.

Media currently uses HTTPS references. Runtime Admin setup and real-device release gates are documented in [delivery status](docs/DELIVERY_STATUS.md). Do not mark these gates passed without evidence.

## Code

- `components/arena/`: bilingual workspace/studio, trainer/participant/projector, ten game views, surveys/reports.
- `lib/domain.mjs`: portable validation, public redaction, grading/ranking and lifecycle.
- `lib/service.ts`, `lib/session-games.ts`: authoritative D1 state, approved roster, immutable answer/event ledger, per-actor version checks, safe device recovery.
- `lib/workspace.ts`, `lib/roles.ts`: libraries, authorized reports, role/profile policy, admin-only branding and account operations.
- `lib/firebase-verifier.mjs`, `lib/firebase-client.ts`: real password authentication, signed ID-token verification and live allowlist check.
- `lib/firebase-admin.ts`: optional server-only provisioning adapter. It activates only with a valid server runtime secret. No credential is included in source.
- `lib/request-security.ts`: bounded JSON parsing and hashed rate buckets.
- `db/schema.ts`, `drizzle/`: append-only migrations; existing session/player/answer rows preserved.

## Verify

Use Node 24 and install the pinned package-manager dependencies. Then run:

```
node scripts/verify-arena.mjs
```

The verification script compiles fresh test bundles, stops on any failure, and runs type checking plus service/security/rendering tests. Local SQLite/D1 service simulations are not hosted load tests or browser E2E tests. Packaging uses the supported Sites source/build workflow and preserves the existing private project ID/audience.

See [baseline](docs/BASELINE.md), [master directive](docs/MASTER_IMPLEMENTATION_DIRECTIVE.md) and [delivery status](docs/DELIVERY_STATUS.md).
