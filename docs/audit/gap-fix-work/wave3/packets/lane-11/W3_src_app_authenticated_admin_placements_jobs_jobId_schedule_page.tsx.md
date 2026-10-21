# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md

## G2-10-013-006  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:781-918 — Desktop filter/tool area with status/type/mode, department/company, search, sort, CSV, conflicts-only toggle.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — Only Round kind and Status selects plus Filter submit; no full toolbar.
- Fix: Restore all filter/sort/export/conflict controls using scoped server query or bounded aggregation.
