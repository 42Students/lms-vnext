# Work packet: edit src/modules/placements/college-drive-interviews-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-10-013-020  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:232-314 — Client filters interview records by jobId, conflict, company, department, type, mode, search then sorts date.
- vNext now: src/modules/placements/college-drive-interviews-service.ts:25-49 — Server filters rounds by kind/status, not candidate fields.
- Fix: Implement server-side candidate filtering by all old dimensions and stable date sorting.

## G2-10-013-040  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-37 — GET /api/v1/interviews scoped by college; UI filters scheduled interview objects by route jobId.
- vNext now: src/modules/placements/college-drive-interviews-service.ts:13-49; src/modules/placements/college-round-slot-action-service.ts:31-67 — SQL query of placement_job_rounds plus separate candidate-slot appointment joins.
- Fix: Map legacy interview entity fields to round-slot appointments and preserve candidate list.

## G2-10-013-075  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-49; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — InterviewService GET responds interview objects including job, learner, status, schedule, mode.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:31-67; src/modules/placements/college-drive-interviews-service.ts:25-49 — Round slot and round list services expose split entities; key/field mapping differs.
- Fix: Map legacy view model to slots+rounds+candidate identities without losing status.

## G2-10-013-078  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649; docs/legacy-source/frontend/src/api/Services/interviewService.js:20-49 — Legacy interview record individual ID, learner, jobApplication, organization, interviewType, status, scheduledDate.
- vNext now: src/components/placements/college-interview-appointments.tsx:17-20; src/modules/placements/college-drive-interviews-service.ts:25-39 — UUID slot+round model with start/duration/room and immutable outcome events; round distinct from candidate interview.
- Fix: Create field-level migration/read mapping and document statuses/timezone.

## G2-9-012-017  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:89-102` — Sort Date earliest by default, plus Latest/Job/Status options
- vNext now: `src/modules/placements/college-drive-interviews-service.ts:43-47` — Round registry sorted by sequence/id ascending, no sort control
- Fix: Expose configurable appointment date/job/status sort and default earliest

## G2-9-012-067  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:396-640` — Legacy date/type/status/mode fields independently filter original Interview records
- vNext now: `src/modules/placements/college-drive-interviews-service.ts:25-42` — New persisted placementJobRounds name/kind/sequence/time/status are different entity
- Fix: Keep candidate appointment distinct from drive-round registry in schema and UI

## G2-10-013-031  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:159-174 — Invalid data/non-success response produces fetchError; does not silently show no interviews.
- vNext now: src/modules/placements/college-drive-interviews-service.ts:13-49 — Typed DB query errors propagate as route exception.
- Fix: Distinguish empty from failure and keep recovery CTA.
