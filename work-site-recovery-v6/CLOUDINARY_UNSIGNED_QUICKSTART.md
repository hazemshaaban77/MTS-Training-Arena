# MTS Training Arena — Cloudinary Free quick unsigned upload

## One-time action in Cloudinary Console
Cloudinary cloud name: `kzez0dlv`.

Open https://console.cloudinary.com/settings/upload and go to **Upload Presets** → **Add Upload Preset**.

Configure these exact settings:
- **Preset name:** `mtsarena_v6_u_7c94f2a1` (must match exactly).
- **Signing mode:** **Unsigned**.
- **Asset folder**: `mts-training-arena/uploads` (create if needed).
- **Allowed formats**: `jpg,png,webp,mp4,webm` (where offered).
- **Disallow custom public ID**: On.
- **Unique filename**: On.
- **Overwrite**: Off (Cloudinary always disables overwriting for unsigned uploads).
- Avoid paid/add-on features.

Save, then load `https://hazemshaaban77.github.io/MTS-Training-Arena/v6/?view=home`, refresh using Ctrl+Shift+R and try an approved trainer's Media Library or Activity Designer.

## What this changes
- Photos (JPG/PNG/WebP) and videos (MP4/WebM) upload **directly from the browser to Cloudinary**, no API key/secret in Cloudflare.
- Cloudinary returns a public HTTPS URL, saved in the existing activity and Media Library fields, and displayed on trainee/projector screens.
- Browser limits are **10 MB/images and 50 MB/videos**; these are client-side convenience limits, **NOT security restrictions**.
- The full URL is public to anyone who holds it. Do not upload employee information, confidential company material or private footage.

## Security limitation
An unsigned preset cannot verify the Firebase trainer token and **can be used outside Arena** by anybody who learns the preset name from its JavaScript. Cloudinary documentation explicitly notes it cannot enforce a maximum file size per unsigned preset, so the local 10/50 MB checks do not prevent attackers from attempting larger uploads by other clients.
Restrict formats and preset behavior, watch your Cloudinary credits, and delete/rotate the preset if abused. If public self-serve uploads become unsuitable, use signed uploads instead.

## Status
The GitHub source code and CI have the unsigned-upload path. Only the account owner can create a preset through the Cloudinary Console: the connected Cloudinary app does not expose an upload-preset creation action. No backend secret, Worker redeploy or payment method is required for this unsigned path.

Official documentation:
- https://cloudinary.com/documentation/upload_presets
- https://cloudinary.com/documentation/client_side_uploading
