# Work packet (wave 2): edit src/modules/placements/college-drive-interviews-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-10-013-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:541-567 — Date is parsePlacementUtcDateTime, conflict tag, role-specific presentation.
- vNext now: src/components/placements/college-interview-appointments.tsx:109-116; src/modules/placements/college-drive-interviews-model.ts:32-35 — Formatted en-IN IST 'date · duration min', no conflict status.
- Fix: Restore conflict indicator and legacy date/time formatting.

## G2-10-013-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-94 — Filter options status: all/upcoming/completed/cancelled; type/mode and sort date asc/desc.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:3-10; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:62-72 — Status ALL/PENDING/SCHEDULED/COMPLETED/CANCELLED, kind ALL/INTERVIEW/GD; no mode or sort.
- Fix: Translate candidate status semantics and restore mode/date order options.

## G2-10-013-023  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1024-1036 — Table local page and size with per-page count and controls.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:3-10; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:85-89 — Server page 25 rounds, fixed size; not candidate-interview pagination.
- Fix: Align 10/25/50/100 page choices and record counts where required.

## G2-10-013-073  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:288-312 — Date sorts compare parsed UTC instants; stable fallback if missing.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:32-35; src/modules/placements/college-drive-interviews-service.ts:39-49 — SQL default order by rounds scheduledAt; server candidate slots separate.
- Fix: Align stable date asc/desc across candidate appointments.

## G2-10-013-074  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:382-395 — Clear filters resets page to 1 and all dimensions.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:12-30; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — GET filter change can retain page param when navigated manually.
- Fix: Reset page to 1 on changed filter and clear all parameters.

## G2-9-012-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1024-1036` — Desktop table pageSize20 and size options 10/20/50/100
- vNext now: `src/modules/placements/college-drive-interviews-model.ts:10-10` — Persisted rounds fixed pageSize25; appointment table unpaged
- Fix: Paginate appointments at 20 default, options 10/20/50/100

## G2-9-012-062  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:307-314` — Filter/sort changes reset currentPage to1
- vNext now: `src/modules/placements/college-drive-interviews-model.ts:23-30` — URL filter links can retain applicationId and old pagination
- Fix: Reset page on filter edits and validate preferred application in matching job
