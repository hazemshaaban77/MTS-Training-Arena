# Approved MTS Training Arena product logo — branding contract
Date: 2026-11-04

The user explicitly selected the logo shown in their 2026-11-04 reference image as the MTS Training Arena product brand mark. DO NOT recreate, redraw, rename, replace, recolour, alter proportions, or substitute a similar concept image.

## Distinct marks
1. Corporate **MTS** logo: unchanged original at the top-left of projector and brand header.
2. **Training Team** corporate logo: unchanged original at the top-right.
3. **MTS Training Arena** selected product logo: prominent in the centre of the Game Lobby, during the 8-second cinematic intro, at Winners Podium, and as a smaller asset in the trainer dashboard.

## Source and verification gate
- Keep the exact supplied product logo as an original local binary asset (e.g. `public/arena-brand-approved.png` in the app source) after its byte-identical source can be obtained and approved.
- Do not silently use a concept-board variation or an older similar logo. Do not use text-only `MTS TRAINING ARENA` as the final replacement.
- The binary from the latest chat image is **not yet included in this GitHub branch**. This repository does not contain a confirmed approved product-logo asset. The current separate visual demo uses a text-only stage brand as a temporary placeholder, **not as the final logo**.
- Validate width, readability, contain sizing, high-contrast background, alt text, and 360/390 px mobile + 1920×1080 projector.
- Preserve both existing corporate logos, and do not alter deployed Site assets or authentication settings.

## No false completion
Current status: **branding decision recorded; binary integration pending**. A future PR is not accepted unless an automated browser check proves the actual approved PNG/SVG is loaded in Lobby, Intro, Trainer, and Podium.

## 2026-11-04 branded local implementation
A separate downloadable artifact includes the exact originally uploaded product logo with validated byte-identical SHA-256:
`d5ea82da1dd359843c9fa5b1c1aef638645bca1302869aa00aba39ae94e4baff` (PNG RGBA, 1619x971).
The standalone prototype includes the logo on Game Lobby, 8-second Intro and Winners Podium, and passed in-memory Chromium visual and interaction checks.
**IMPORTANT:** The logo binary is still NOT checked into this GitHub branch. The separate in-chat ZIP and standalone HTML include it, but the GitHub preview remains the pre-logo development proof. Do not claim this GitHub branch is fully branded or deployed.
Next code gate: copy the original PNG from the vetted artifact to `experience-2-preview/assets/arena-logo-approved.png` or app `public/` source; verify SHA-256 above; port the branded HTML/CSS/JS changes; rerun GitHub Chromium CI and inspect screenshot output.
