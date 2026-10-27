# Arena Crown Wheel — premium real 3D concept

Model 3 reimagined as a sculpted vertical metallic gameshow wheel with deep brushed bronze/black steel housing, 48 glowing arcade bulbs, precious-gold machined bezels, dark jewel pointer, 3D stage plinth and focused cinematic lights.

**Function**: Opt-in via `?arena3d=1` only on the feature build; previous CSS model remains default and fallback. Shapes are real 3D extruded geometry. The wheel uses **authored** source labels, Arabic glyphs drawn via CanvasTexture on WebGL sprites, and an English/Arabic stage HUD. No imported paid textures, external sound, or new backend services.

**Safety**: The existing server is the only authority for eligible spins, start and stop times, result index, prizes and manual 0–10 judging. The renderer never precomputes, reveals or awards a sector. 380 ms final easing after official reveal is purely visual. The wheel defaults to lite rendering on coarse-pointer mobiles with reduced DPR and lower frame-rate. No changes to main, V5, Firebase, Cloudflare Worker, D1, existing user assets or live results.

**Remaining acceptance**: actual Android GPU/browser session test, 1366×768 + 1920×1080 projector, users reading live Arabic sector labels at distance, cross-device timing and server outcome, failure fallback, 60–80-participant classroom load. Development CI is not substitute for these tests.

## Trainer and projector test integration

Host and projector now show **Try real 3D / Off** button inside Wheel of Fortune (also in the local session simulator). Clicking stores `arena-v6-crown-wheel-3d-preview` only in this browser's localStorage; a URL with `arena3d=1` or `arena3d=0` overrides the preference, which survives internal `pushState` navigation. Browsers sharing the same origin can sync the visual flag through StorageEvent; player identity/points never change. The visual is off by default; participant registration remains unchanged.

This is not hosted as part of the real V6 production URL until review. Existing releases and historic sessions remain unchanged. For actual trainer rehearsal, use the trainer's **Try Activity** simulator once the preview branch has a test build. A live physical projector or synchronized mobile test is still required for acceptance.
