# MTS Training Arena — CINEMA 3D experience wave 1
Date: 2026-10-28. Source branch: feature/v6-full-3d-arena-stage.

## Delivered (source, pending deployment)
- The prior CSS wheel is **absent from GamePlay's runtime DOM**. Only Arena Crown WebGL wheel is used. If GPU WebGL fails, a plain accessible action preserves official server spin instead of showing the old wheel. No change to Worker authority.
- Removed legacy stage picture/flat-scene intro runtime: all ten StageSplash identities now use `ArenaWorld3D`, a procedurally modeled WebGL studio, real meshes and theatrical rig, blackout -> synchronized light ignition -> cinematic dolly-in. Skip control stays intact. Native copy stays HTML accessible.
- New WebGL 3D ambient world in home/hero and session trainer/projector, with themed motifs for all ten games (quiz, championship, wheel, escape, box, poll, plan, order, cards, scenario); no fabricated quiz state.
- Home, lobby, stage visuals all adopt one world language. Scene is decoration only and audio stays opt-in. Reduced motion and mobile low-resolution frame fallback, no effect on QR, participant form, countdown or scoring.
- No old `ArenaForgeWheel.css` runtime import. No old `wheel-tap-surface` DOM in GamePlay. File remains in historical git tree and CSS references inside global stylesheet for legacy compatibility; these are not the displayed wheel.

## Critical acceptance gates
- [ ] Real authorized trainer + trainee + projector screen walkthrough.
- [ ] Physical projector 1366x768 and 1920x1080 theatrical intro (no clipping or blank stage).
- [ ] Android low end tests for dropped WebGL/context loss and accessible wheel server spin.
- [ ] 60–80 simultaneous devices and reconnect during spin. CI and local simulator are not a substitute for real equipment tests.
- [ ] Additional true WebGL in-play mechanics for Escape Room, Game Show, Quiz, cards, Scenario, Meta Plan, Order It and Poll. **Only Wheel and Open the Box gameplay are currently genuine WebGL 3D; all ten intros/background worlds are real 3D, while essential HTML forms and controls remain.** Do not misreport all ten games as fully WebGL-native.
- [ ] Trainer review and safe publishing of V6; **do not deploy simply because GitHub CI passed**.

No modification to `main`, V5, Cloudflare secrets, D1 rows or live sessions.
