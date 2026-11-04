# Approved Arena product logo — source of truth (2026-11-04)

The user selected the blue-green MTS TRAINING ARENA product mark. Keep the approved image unchanged; **no white circle/halo, cropped edges, recoloring, recreation, or altered proportions**.

## Verified assets (present in this GitHub branch)

| File | Purpose | Status |
| --- | --- | --- |
| `sprint02/assets/arena-logo-approved.png` | Original approved 1619×971 RGBA PNG | **Present**; SHA-256: `d5ea82da1dd359843c9fa5b1c1aef638645bca1302869aa00aba39ae94e4baff` |
| `sprint02/assets/arena-logo-safe-margin.png` | Transparent padded derivative for visual display; retains original picture | **Present and in use** by `sprint02/app.js`; not disposable |
| `work-site-recovery-v6/public/mts.png` | Original corporate MTS mark | Present; preserve |
| `work-site-recovery-v6/public/training.png` | Original Training Team mark | Present; preserve |

## Placement

The approved product mark is shown in the central Game Lobby, cinematic Intro, winners Podium and appropriate trainer identity element. Keep **MTS corporate at physical upper left** and **Training Team at physical upper right** of the projector. The product mark should be large, proportional and naturally integrated into the dark stage.

Use `object-fit: contain`, generous transparent padding/safe area, responsive maximum dimensions, and a modest optional shadow. **No circular white badge, no cropped image and no generated replacement.**

## Verification and boundaries

The Sprint 02 Chromium test verifies the original asset checksum and renders the padded mark on the lobby, Intro and Podium. The **binary files are committed to the feature branch**. This corrects the earlier (now superseded) note claiming they were not uploaded.

The private production V6 Site has **not** been changed. Verify with a physical projector and mobile before any integration or release; do not assume browser tests prove live accessibility.
