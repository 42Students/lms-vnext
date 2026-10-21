# Work packet: edit src/app/(authenticated)/college/lessons/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-033  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:460-465 — Partial failed fetch keeps previous list, displays warning and Retry.
- vNext now: src/app/(authenticated)/college/lessons/error.tsx:10-12 — Whole-page `Lessons unavailable` with generic Retry.
- Fix: Keep stale valid rows visible and show partial-scope failure warning where possible.
