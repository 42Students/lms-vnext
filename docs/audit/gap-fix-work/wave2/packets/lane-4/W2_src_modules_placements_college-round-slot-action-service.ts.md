# Work packet (wave 2): edit src/modules/placements/college-round-slot-action-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-12-030-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:17-23 — POST /api/v1/interviews with job, jobApplication, learner
- vNext now: src/modules/placements/college-round-slot-action-service.ts:68-83 — college job-scoped appointment action with roundId/applicationId
- Fix: Map legacy new interview entity to required vNext round and preserve caller route.

## G2-12-030-021  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:113-124 — future time and HTTPS link errors on time/location fields
- vNext now: src/modules/placements/college-round-slot-action-service.ts:84-91 — server throws Schedule an upcoming interview on past date
- Fix: Present errors on the offending field with exact copy, preserving typed draft.

## G2-12-030-030  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:17-23 — legacy POST /api/v1/interviews returns entity wrapper
- vNext now: src/modules/placements/college-round-slot-action-service.ts:68-83,181-184 — action command SCHEDULE returns id/status/version
- Fix: Document API payload response mapping, update old integration expectations.

## G2-12-030-037  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:403-408 — OFFERED/HIRED remains unchanged but new round notify
- vNext now: src/modules/placements/college-round-slot-action-service.ts:92-101 — only SUBMITTED and shortlisted eligible
- Fix: Clarify offered candidate additional-round exception and expected state.

## G2-12-030-038  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:59-71 — organization interviews fetch silently fails; conflict preview simply omitted
- vNext now: src/modules/placements/college-round-slot-action-service.ts:103-109 — server conflicting booking causes explicit error
- Fix: Provide readable preview-load warning when conflict source unavailable; server remains authoritative.

## G2-10-013-048  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:225-231,536-567 — Conflict detection computes overlap among scheduled interviews, color/tag surfaces collisions.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:103-110; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:46-54 — Write path guards overlapping slots but listing omits conflict badges for existing records.
- Fix: Project historical collision flags and warn; keep strong booking validation.

## G2-10-013-071  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:225-231 — Conflict computation memoized in client on full interview set.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:103-110 — Conflict detection during writes, not derived at list read.
- Fix: Compute authoritative conflict flags in query or bounded service.

## G2-10-013-077  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:225-231 — interviewConflicts util used for duplicate/same-time candidate collisions.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:103-110 — Write-time transaction overlap guard, no display util.
- Fix: Map conflict reason kinds and indicator semantics.

## G2-10-013-079  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:96-105 — Legacy status labels derived from string flags (Scheduled, Completed, Cancelled and no-show).
- vNext now: src/modules/placements/college-round-slot-action-service.ts:21-26,61-67 — Slot status plus event outcome mapping yields Scheduled/Completed/No Show.
- Fix: Normalize case and ensure no-show/CANCELLED seen in same filters.

## G2-9-012-050  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:17-23` — Legacy scheduling service can notify candidate on schedule
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:170-181` — New appointment mutation emits inAppNotifications Interview update and activityEvents
- Fix: Verify actual recipient and channel parity; avoid claiming email if only in-app
