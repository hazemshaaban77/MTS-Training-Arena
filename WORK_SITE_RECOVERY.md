# Current Work/Sites source recovery

The complete source snapshot of MTS Training Arena Site version 5 is preserved under `work-site-recovery/`.

- Source commit: `33f1d0c9ae3540c8915db90d46786bb9c7e23567`.
- Source Site: https://mts-training-arena-private.rarehinny9.chatgpt.site
- Original root/arena files are preserved unchanged.
- Frontend: `work-site-recovery/components/arena/`, `app/`, `public/`.
- Backend: `work-site-recovery/lib/`, `app/api/`, `db/`, `drizzle/`.
- Runtime configuration and dependency lockfile are included. See the recovered README and delivery status for setup requirements.
- `RECOVERY_MANIFEST.json` records all 175 original source files and their exact hashes.
- Firebase browser configuration is public client configuration; no service-account key, password, environment secret or live database content is included.

This is a source recovery branch only. No merge, pull request or new deployment was requested or performed. The nested workflow files are preserved as source and are not installed into the root GitHub Actions directory.

For verification after installing dependencies: `cd work-site-recovery && node scripts/verify-arena.mjs` (Node 24). Hosting still uses the existing Sites project; the snapshot does not turn GitHub Pages into a server runtime.
