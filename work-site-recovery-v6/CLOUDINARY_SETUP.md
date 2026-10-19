# MTS Training Arena V6 — Cloudinary Free secure upload setup

## Current state
- Version 6's React client has a signed, direct browser upload implementation.
- The Cloudflare Worker source includes the Firebase allowlist-protected `POST /api/media-sign` signer.
- **Uploads are not live until a Cloudinary account exists and the V6 Worker is deployed with its account settings.** The original V6 server, Firebase, D1 database, and routes remain unaffected.
- Current limits are **10 MB per image** (JPEG/PNG/WebP) and **50 MB per video** (MP4/WebM). This is a conservative project limit, not a promise of unlimited free storage.
- Uploaded Cloudinary default `upload` assets are **public to anyone who has the asset URL**, and should not contain confidential company or learner information.

## Account owner actions (do not paste secrets in a chat or commit)
1. Register/login: https://console.cloudinary.com/
2. Open the product environment dashboard and note **Cloud name** and **API Key**.
3. In the **Cloudflare Dashboard → Workers & Pages → mts-training-arena-v6-api → Settings → Variables and Secrets**, add:
   - `CLOUDINARY_CLOUD_NAME` — plain text Cloud name.
   - `CLOUDINARY_API_KEY` — plain text API Key.
   - `CLOUDINARY_API_SECRET` — **Encrypted Secret**. Keep it in Cloudflare only.
4. Publish the reviewed V6 Worker bundle from the development branch without changing the existing D1 or Durable Object bindings. The current separate GitHub Pages site cannot create signatures by itself.
5. Test with a trainer account already approved in the Firebase trainer allowlist. Do not use an unsigned preset.
6. Test a JPEG, PNG, WebP, MP4, WebM. Verify the saved Cloudinary HTTPS URL displays for trainer, trainee and projector.
7. Verify unapproved users and invalid Firebase tokens cannot obtain a signature. Check that Cloudinary API Secret never appears in network responses or the GitHub bundle.

## Safe flow
1. Existing Firebase trainer signs into Arena.
2. Browser sends `POST /api/media-sign` with Firebase token and image/video type+size.
3. Worker verifies signed Firebase identity and trainer allowlist and enforces D1-backed rate limit.
4. Worker signs fixed folder `mts-training-arena/uploads` with SHA-256; returns Cloud name, public API key, folder, timestamp and signature only.
5. Browser POSTs file to `https://api.cloudinary.com/v1_1/<cloudName>/<image|video>/upload`.
6. Client verifies returned `secure_url` belongs to the matching Cloudinary cloud and resource type. The URL is saved in the existing media field.
7. Trainee/projector display the same media using the Cloudinary CDN. Existing HTTPS-linked media continue to work.

Cloudinary documentation:
- https://cloudinary.com/documentation/authentication_signatures
- https://cloudinary.com/documentation/client_side_uploading
- https://cloudinary.com/pricing/compare-plans

## Important security note
Signed uploads gate the creation of files, **not public playback access to already uploaded URLs**. For confidential training assets, use access-controlled delivery and re-evaluate the free tier before uploading. Do not expose Cloudinary API Secret in a front-end environment variable, README, or screenshot.

## Visual direction and asset delivery
Ten preview images were generated in the approved 3D Cinematic style; the PNG composite has been split into individual 16:9 WebP cards without baked-in titles. The reviewed GitHub repo still includes the previous flat SVG fallback art. Replace the ten `public/activity-art/*.svg` image references after the new binary WebP files are imported into `public/activity-art/`, mapping the same kebab-case names. This intentionally avoids claiming the 3D binary assets are already in GitHub while the generated images have not yet been transferred to the repository.
