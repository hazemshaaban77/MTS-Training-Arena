# Arena Showdown / REAL Blender Cycles render gate

## Purpose
An isolated, free-use CPU rendering environment on GitHub Actions (a public repository).
No local PC installation; no paid service; zero changes to production Arena V6, main,
legacy V5, Cloudflare Worker, D1 or any trainer session.

## What works now
On branch `tools/arena-showdown-blender-cycles`, a push triggers a real Linux machine,
installs Blender and renders a physically-based *calibration* with Cycles. A successful
green GitHub Action proves only Blender ran, not that the Showdown art direction is approved.

## The next necessary file
Put the **existing authentic** `Arena_Showdown_Stage1_v3.glb` at
`tools/arena-showdown-cycles/models/Arena_Showdown_Stage1_v3.glb` in this branch.
It is approximately 2.7 MB, already supplied by ChatGPT as a downloadable artifact.
Do not upload to `main` or the V6 development/release branch. **Do not upload a fake logo.**
Once present, a new push automatically renders the original GLB in real CPU Cycles
from two angles and saves an editable `.blend` for art direction.
The GLB embeds the approved Arena logo image. The CI upload-artifact URL appears under
the Actions run after rendering; artifacts expire after 14 days.

## Operational limits
- Standard GitHub hosted Actions usage in **public repos** is free, subject to fair use
  and provider policy; if this repository becomes private, billing differs.
- Stock runner has CPU, not a dedicated NVIDIA GPU. 720p/16-sample previews first;
  no full 144-frame render at 1080p until quality and budget are verified.
- Cycles provides real raytraced reflections and indirect light, but cannot create
  missing architectural detail or transform low-quality meshes into photorealistic art.
- Human judgment against the owner's final Showdown reference is the only art signoff.
- `models/` intentionally has no fake GLB. CI calibrates until the actual art model
  has been explicitly staged.

## Reproducing on any laptop with Blender installed (optional)
`blender -b -t 2 --python tools/arena-showdown-cycles/scripts/render_cycles.py`
No other dependencies, backend secrets or API keys required.
