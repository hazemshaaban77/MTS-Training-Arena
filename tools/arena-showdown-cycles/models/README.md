# Arena Showdown 3D model staging

Place **only** the authentic owner-reviewed file `Arena_Showdown_Stage1_v3.glb` in
this folder on branch `tools/arena-showdown-blender-cycles` (NOT main).

The model is already available as a 2.7 MB conversation download.
When uploaded with the exact filename above, the existing GitHub Actions workflow
runs real Blender 4.0/Cycles on CPU and creates PNG views + an editable .blend.
No tokens, paid subscription, production deployment or Worker changes.

Do not commit secrets, training user data, passwords or production config here.
This repository is **PUBLIC**: uploading this branded model will make it visible
to anyone who can access the repository. If the user requires the 3D model to
stay private, do not upload it here; instead use a local installation of Blender
or a private dedicated rendering repository with an appropriate free-minute quota.

The first successful run with only diagnostic calibration is:
https://github.com/hazemshaaban77/MTS-Training-Arena/actions/runs/40660459402

Never label the calibration screenshot as a render of Showdown.


## 2026-10-28 render integrity and art acceptance
Expected V3 GLB SHA-256:
`c5104ded9cfb0714bf74a89fcaf59adf4d905e3a8952560c96c9accb0f8873ba`
Expected size: 2,787,288 bytes. The runner checks SHA-256 before rendering and
refuses substituted or modified models. The owner need only upload this **one**
file through GitHub's Add file → Upload files UI on this tools branch.

In **real-model mode**, Cycles renders three 1280×720 PNGs (front, crane, wheel detail)
at 48 CPU samples, six ray bounces and genuine studio reflection cards; plus an
editable Blender .blend scene. Exact scene camera/lights are editable later.
Ubuntu's Blender 4.0.2 package lacks OpenImageDenoiser, so denoising is disabled;
expect some grain. Successful calibration does not imply the real model meets
the photorealism gate.

**Public-repository warning**: anyone can see a GLB committed here.
No change to `main`, `develop/v6-github-arena` or running V6 site.
