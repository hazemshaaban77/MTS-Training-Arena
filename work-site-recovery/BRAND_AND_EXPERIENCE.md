# MTS Training Arena — agreed experience and identity

Recovered from the accepted October 14–15, 2026 plan. Preserve these requirements when extending this edition.

## Entry and roles

- Trainer sees the Hybrid Premium sign-in experience first, then Smart Home.
- Trainees enter through one session QR; they do not use the trainer's entry screen.
- Name and employee ID are required. Show the identity summary and require confirmation before joining.
- Same-device continuation uses the existing device token. A device change requires additional verification; this edition uses a private recovery code, rotates the device token and keeps the existing player/score record.
- Keep one QR and room code throughout all sequential trainer-controlled activities.

## Adaptive Brand System

- Use the original MTS and Training Team images from the source repository, preserving colours and proportions. Do not replace corporate logos with an icon or a wordmark.
- Physical header placement: MTS at top left; Training Team at top right, in both Arabic and English.
- Trainer dashboard/studio: MTS in the header; Training Team also appears in this edition.
- Trainee lobby: both logos. Gameplay: compact. Projector: fixed corner placement. Finale: prominent logos.
- Cairo typeface. Blue gradients and green accents. Cinematic dark gameplay, premium trainer entry, responsive mobile and projector layouts, reduced-motion support.
- Palette derived from the current repository: navy `#0c2545`, blue `#176aa4` / `#1783c5`, green `#218e5b`, gray `#8d969c`. Green text accents are adjusted for contrast on dark backgrounds. These numeric values implement the accepted blue/green direction; they were not separately specified as exact hex values by the user.
- Original logo files include whitespace. CSS viewports frame the supplied marks without changing image pixels, stretching, tinting or applying grayscale.

## Private trial boundary

This Sites edition preserves the platform's private access boundary and now uses real Firebase email/password authentication for the trainer role. It reuses the existing `mts-quiz-64faa` public web configuration and reads `arenaV1/trainerAllowlist/<uid>` with the verified user's ID token. All trainer API operations validate the Google RS256 token and the existing allowlist. Sites identity alone never grants the trainer role. No Firebase settings, allowlist entries or accounts are changed by this integration.

The Site remains owner-private. Opening the class audience, changing production Firebase or pushing changes to the original GitHub repositories requires the user's approval.

## Existing session ownership

Trainer sessions use the verified Firebase UID as their ownership scope. On the first successful connection, the signed-in Site owner’s legacy trial sessions are adopted by that trainer using an idempotent D1 mapping. Other trainers cannot claim those sessions. Existing participant and score records remain intact.

## Validation boundary

API integration tests include mandatory ID/confirmation, employee-ID duplication/privacy, recovery-token rotation and score continuity, plus the existing all-activity and 80-simulated-submission flows. Additional tests cover cryptographic ID token validation, Google key rotation, allowlist denial, trainer isolation, legacy ownership adoption, cross-origin writes and trainee entry without a trainer login. Initial server rendering is checked for login-first and both official logos. Mobile/projector browser visual QA has not been performed because control-browser is unavailable in the environment.

A read-only audit using the previously supplied admin JSON was unavailable: Google rejected that old key with `invalid_grant / Invalid JWT Signature`. The application does not use or require that admin key. No valid trainer password or live account token was available during authoring, so a real trainer-account sign-in is not recorded as tested. The Firebase public project config responded successfully; the current Sites domain is not listed among its authorized domains. Password auth is implemented without popup/redirect dependencies; no domain or provider settings have been changed.
