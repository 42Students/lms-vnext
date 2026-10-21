# Work packet (wave 2): edit src/app/(authenticated)/teacher/layout.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-index.md

## G2-6-007-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy unauthenticated without lms_authenticated cookie redirects to `/` `docs/legacy-source/frontend/src/pages/teacher/index.js:2-5`
- vNext now: New TeacherLayout uses request context/canAccessFacultyRoute and routes unauthorized to `/dashboard` `src/app/(authenticated)/teacher/layout.tsx:8-11`
- Fix: Reconcile unauthenticated destination `/` vs authenticated wrong-role `/dashboard`

## G2-6-007-020  [P2] MISSING  facet F13  effort S
- Legacy: Old no loading/error/empty state, only redirect `docs/legacy-source/frontend/src/pages/teacher/index.js:1-11`
- vNext now: New missing index route would show not-found; teacher layout exists `src/app/(authenticated)/teacher/layout.tsx:5-11` `next.config.ts:7-17`
- Fix: Add instant redirect and avoid 404 flicker

## G2-6-007-021  [P2] GAP  facet F13  effort S
- Legacy: Old unauthenticated state returns redirect to `/`, not login embedded `docs/legacy-source/frontend/src/pages/teacher/index.js:2-5`
- vNext now: New redirect unauthorized to `/dashboard` `src/app/(authenticated)/teacher/layout.tsx:8-11`
- Fix: Verify unauthenticated handling by shared auth middleware; do not leak dashboard
