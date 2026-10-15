# Cloudflare Workers Free — MTS Training Arena (staging source only)

**Decision:** GitHub Pages for static client; Firebase RTDB Spark for real-time room/answer state; Cloudflare Workers Free for occasional trainer-only trusted operations.

Cloudflare Workers Free currently has **100,000 requests/day, 10 ms CPU/request, and 50 external subrequests per request**. These are limits, not guaranteed sufficient performance. Spark Realtime Database has a **hard 100 simultaneous connection limit across the Firebase database**, including trainers, projectors, all participants and any other apps sharing the same RTDB. For stable load testing, aim **60–80 trainees** at first with headroom; **100 active trainees is not guaranteed** on Spark.

## What is already implemented

- `index.mjs`: CORS origin restriction; Bearer Firebase ID token; create/open/close/settle API routes; **fail-closed launch flag**.
- `firebase-auth.mjs`: RS256 signature verification against Google Secure Token JWK and checks for expected issuer/audience/sub/expiration.
- `firebase-rest.mjs`: short Firebase REST calls using service-account OAuth2 and conditional ETag writes for basic database transactions.
- `wrangler.toml`: Worker config (no secrets), initially **ARENA_ENABLE_TRUSTED_V1=false**.
- `worker.test.mjs`: fail-closed request tests.

No Worker is deployed by these commits. Never add a Firebase service-account private key, ID token, or any sensitive credential to GitHub.

## Safe deployment checklist — BLOCKERS

1. Complete emulator tests for REST ETag compare-and-swap **under concurrent requests**, checking deadlines, immutable roster, and ownership. Current ETag adapter is a staging implementation only.
2. Correct and verify immutable per-round participant eligibility and team snapshots, so a malicious trainer cannot rewrite participants or alter scores after closure.
3. Close the room lifecycle race between saving a closed-round snapshot and changing the public round; ensure failed close cannot yield a credited round.
4. Ensure the scored UI exclusively uses backend-owned sessions; publish reviewed `security/scoring-rules.proposal.json` in Firebase; **do not accidentally use current unscored rooms for scored sessions**.
5. Test true Worker CPU time, Google OAuth service-account signing, Google JWK token validation, and latency against a disposable **separate test Firebase project**. Free Workers may exceed 10ms CPU on RSA token work or ledger processing.
6. Create Cloudflare Free account (Cloudflare says no credit card required), then deploy explicitly with Wrangler and add service-account credentials as **Cloudflare secrets only**. The configured `ARENA_ENABLE_TRUSTED_V1` remains `false` until all security tests are signed off.
7. Configure a fixed reviewed Worker URL in the trusted console; never accept arbitrary backend origins or send Firebase tokens to an unknown host.

### Scaling without paid plans

- Use direct RTDB realtime listeners only for participants who truly require instant updates, with a low number of tabs per participant.
- Start a load test with 20 clients; then 40, 60, 80. Check actual connected clients, trainer and projector before raising the limit.
- Do not plan for **100 concurrent participants plus trainer and projector** on Spark. It exceeds Spark's published cap.
- If that exact load is mandatory, redesign the connection transport, using a short-polling HTTP bridge and authorization, or revisit the paid-tier decision **after explicit consent**.

### Source references
- https://developers.cloudflare.com/workers/platform/limits/
- https://www.cloudflare.com/products/workers/
- https://firebase.google.com/docs/database/faq-and-troubleshooting
