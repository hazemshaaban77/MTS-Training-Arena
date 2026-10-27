# Arena Real 3D Wheel — isolated prototype

Branch: `feature/v6-real-3d-wheel` from `develop/v6-github-arena`. **No production release** in this branch.

- Opt in by appending `?arena3d=1` to a tested V6 environment's URL. Without the opt-in the exact prior CSS wheel continues to render.
- Uses real WebGL 3D extruded segment meshes, textured numerical glyphs, metal materials, lights, stage pedestal and perspective camera, with lazy-loaded Three.js.
- The exact original trainer/participant `spin` command, server-sourced countdown, outcome/score/round rendering and 0–10 host judging are preserved. The renderer never issues scores or guesses a winner before server release.
- Winning sector arrives only after the trusted Worker reveals `index`. 3D rendering then finishes the final angular alignment in 430ms. This is a deliberate bounded post-reveal settle, not a prediction or a source of scoring. Late joiners settle from their current angle.
- Supports WebGL context loss / unsupported browsers fallback to existing CSS wheel. Respects reduced-motion and lower mobile pixel density.
- Sector labels remain DOM text in the host legend; geometry's labels are numerals for readability.
- Real-device 1366×768 and 1920×1080 projector, Android, physical long-term stability, 60–80 participant load are **not verified** by automated tests.
- Dependency lockfile must be generated with pnpm 11.25.0 before CI can use frozen lockfile.
