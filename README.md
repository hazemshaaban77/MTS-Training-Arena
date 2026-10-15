# MTS Training Arena

Independent static pilot hosted in this repository, separate from the existing MTS-Quiz site.

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` prepares and deploys only public client pages, logos and public Firebase web configuration. If GitHub Pages is not yet enabled, in **Settings → Pages**, choose **Build and deployment → Source: GitHub Actions**. Then visit **Actions → Deploy MTS Training Arena to GitHub Pages**, and run **Run workflow** if necessary. Wait for a successful deploy before relying on the URL shown in Pages.

Never change the MTS-Quiz repository's existing Pages settings.

## What is deployed

- `/arena/live.html`: Firebase room pilot, fake participants only, no official grading.
- `/arena/index.html`: local draft Studio preview.
- `/arena/games.html`: local interaction demonstrations for 11 activity types.
- `/arena/projector.html`: trainer-authenticated projector pilot.

Firebase Authentication authorized domains may require adding `hazemshaaban77.github.io` in the Firebase Console. Do not add it unless the GitHub Pages site is confirmed reachable. Existing Realtime Database security rules should not be replaced again.

**Not production ready:** No real scored session backend, no complete reporting or personnel lifecycle. Do not use employee IDs or real participant data yet. Deployment alone does not verify cross-device functionality.
