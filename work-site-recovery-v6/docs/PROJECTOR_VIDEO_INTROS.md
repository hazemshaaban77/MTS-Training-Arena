# Projector-only MP4 intros — production handoff (pending approved artwork)

## Media pack and mapping
Each activity owns a different **MP4 with soundtrack**, 1280×720 (16:9), H.264 video / AAC audio, approximately 9.5 seconds:
| Game type | File |
|--|--|
| Quiz | quiz.mp4 |
| Ultimate Game Show | championship.mp4 |
| Wheel of Fortune / Spin Wheel | wheel.mp4 |
| Meta Plan / Categorize | meta.mp4 |
| Escape Room | escape.mp4 |
| Live Poll | poll.mp4 |
| Order It | order.mp4 |
| Open the Box | box.mp4 |
| Flashcards | cards.mp4 |
| Scenario Challenge | scenario.mp4 |

**Only projectors** use true video playback. Learner phones and trainer editing screens should not autoplay MP4 introductions. Sound is opt-in and should play on the presentation device only.

## Current safe deployment status
- MP4 outputs currently exist as downloadable conversation artifacts, **not** in GitHub Pages /v6/cinematic-videos. The GitHub connector accepts UTF-8 text, not generated local MP4 files, and connected Cloudinary rejected the local filesystem file path.
- Feature branch `feature/v6-projector-video-intros` prepares a projector-only MP4 player (with video error fallback and skip); it is NOT merged into `develop/v6-github-arena` or published. Do not claim production playback until **all ten** hosted MP4s exist and have been verified.
- After final creative approval and media upload, add ten files to `work-site-recovery-v6/public/cinematic-videos/` on this branch or supply verified public Cloudinary URLs; then test **every clip** on the presentation machine before release.

## Required launch behavior
1. The instructor has queued an activity; the backend remains in an untimed staging state.
2. **Before** the actual Start/Next control advances the round, open its MP4 on the projector. Let it finish or let the trainer skip.
3. Only then transition to the next server-authoritative round and set its timer. Never run a ten-second video over an already-running timed question.
4. Honor Room Quiet/Local Quiet, browser media-autoplay requirements, reduced motion for system fallback, and avoid playback on every learner phone.
5. Check live classroom 1366×768, 1920×1080, 1280×720, actual audio-out device, and slow network. Preload before launch and provide visible escape control.

## Creative scope
The procedural ten-clip set is **round-one creative footage**; it is not guaranteed to meet final cinematic quality expectations. Do not activate it on the production site until the user reviews and approves the result.
