# Work packet: edit src/app/(authenticated)/tpo/profile/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-023  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:79-93 — We couldn't load your profile; faculty record missing; Retry without leaving page.
- vNext now: src/app/(authenticated)/tpo/profile/error.tsx:7-10 — Unable to load your profile, membership information unavailable.
- Fix: Restore exact legacy error heading/detail.

## G2-19-030-024  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:109-113 — Couldn't refresh profile; Showing the last profile we loaded.
- vNext now: src/app/(authenticated)/tpo/profile/error.tsx:7-10 — all-or-nothing ErrorState, no stale card warning.
- Fix: Provide stale refresh state and retry.
