# Approved concept B — Cairo + trainer-authored dynamic 3D wheel (review build)
- Style is silver/chrome rings and a blue/green/white competition stage, consistent with the approved MTS Training Arena circular logo; no gold/purple Crown branding.
- Wheel labels use the **locally bundled Cairo** fonts (loaded before CanvasTexture creation), Arabic RTL or English LTR; 11–20 sectors use numbers on the wheel to protect readability, with full authored sector names in the host DOM legend and result.
- The StageSplash pre-round wheel shot is generated using `sectors` from the real activity in session state, not eight invented static sectors. Both preview and active intro take the same dynamic sectors.
- Trainer can add/delete/reorder through existing Builder fields (2–20 validated sectors), update label, outcome kind, points, detail, question/challenge and repeatable flags. Renderer changes from the saved activity on next scene render; no back-end rules were changed.
- Existing Worker remains authoritative for winner, start timing, reveal and scores. The renderer is only display.
- Scope is an isolated **draft PR**. Do not merge, publish, or alter existing V6 live traffic until owner approves the visual, fonts, transitions and real authenticated projector/mobility UAT.
