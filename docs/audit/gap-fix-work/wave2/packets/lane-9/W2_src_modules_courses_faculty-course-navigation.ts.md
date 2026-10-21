# Work packet (wave 2): edit src/modules/courses/faculty-course-navigation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-109  [P2] GAP  facet F23  effort M
- Legacy: Legacy course identifier is public slug with numeric fallback; vNext intentionally moved to delivery UUID and no migration required per owner. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-115`
- vNext now: vNext delivery UUID is canonical for all course routes. `src/modules/courses/faculty-course-navigation.ts:16-18`, `src/modules/courses/faculty-course-service.ts:204-211`
- Fix: Keep vNext data model; only introduce bounded authorized redirect shim for any preserved legacy bookmarks.
