# Work packet (wave 2): edit src/app/(authenticated)/college/lessons/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-054  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:506-525 — Skeleton eight rows on first load; choose-course empty prompt before data fetch.
- vNext now: src/app/(authenticated)/college/lessons/loading.tsx:3-5 — Route-level graceful directory loading; no per-course choose-first prompt.
- Fix: Match placeholder and partial-loading states for initial filtered view.
