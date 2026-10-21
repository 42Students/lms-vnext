# Work packet (wave 2): edit src/app/(authenticated)/college/lessons/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-056  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:195-201 — Partial course retrieval announces count/failures; retries are explicit.
- vNext now: src/app/(authenticated)/college/lessons/error.tsx:10-12 — No course-by-course partial failure report; whole server query can error.
- Fix: Add per-filter/source error diagnostics if backend returns partial failures.
