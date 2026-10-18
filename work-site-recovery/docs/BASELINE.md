# Continuation baseline — 2026-10-18

Canonical hosted continuation: existing Sites project `appgprj_6ad0d979bf20819189d0f562dd8d47b3`, source commit `a578426a50b4434862382ecc8b34fedaefa6249c` (version 3). This is the only implementation currently combining real Firebase trainer authentication, durable server-owned sessions, one join QR, participant identity/recovery and authoritative scoring. It retains upstream contracts and original logos.

Upstream: `hazemshaaban77/MTS-Training-Arena` main `5b10eb1c9acb3c54a0cec9f90a09e29847b7d003`. Latest foundation Actions and Pages both succeeded. All 68 upstream engine/security/Worker unit tests passed locally. Firebase emulator results are verified by the latest successful upstream Actions run; no live Firebase rules were changed.

`MTS-Quiz` foundation branch exists at `2991ec564b749c1ed9446841f5f616c339d9cd70`; its tree contains the earlier Arena prototype. Other quiz branches and main exist and are preserved. No legacy deployment or data is overwritten.

Connected Cloudflare account contains `mts-training-arena-api`, modified 2026-10-15. Live settings confirm `ARENA_ENABLE_TRUSTED_V1=false`, original GitHub Pages allowed origin, the existing Firebase project, and two secret bindings (names only inspected). It is deliberately not the scored backend for this private continuation. Sites already provides a Worker and D1. This avoids enabling a partially gated production integration or altering shared RTDB rules.

Working baseline: email/password login + allowlist; eleven v1 interactions; editable session deck; one QR; server deadlines/pause; results; employee identity and verified recovery; individual/team CSV; original proportional logos; Arabic/English. Sixteen local integration/security tests passed before this iteration.

Incomplete/missing baseline: ten main engine hierarchy, multiquestion games, future-only live edits, draft lifecycle/autosave/templates/banks, approved late joins, configurable speed/weights/ties, genuine anonymous surveys/polls, RBAC/admin, Escape Room, branching scenarios, wheel rewards/turns, lifelines/betting, reporting/audit and richer projector controls.

Security: Firebase web API configuration is public client configuration, not a privileged secret. A previously supplied admin key failed a read-only OAuth validation (`Invalid JWT Signature`); its temporary local copy was deleted. No key was committed, reset, rotated or installed. Actual trainer credential entry and Admin provisioning cannot be tested without a valid authorized account/privileged server setup. No credentials are requested in chat.

Verification boundary: no supported control-browser skill is available in this environment. Do not claim actual browser/mobile/projector end-to-end or live 80-device load verification. Automated service tests, SSR/build and hosted HTTP checks are available.

After fetching the full available Arena history, 117 commits and 128 text blobs were scanned for embedded PEM private-key material; none was found by that bounded pattern scan. This is not a complete secret-scanning audit or proof that every secret class is absent. No live secret was rotated or removed.
