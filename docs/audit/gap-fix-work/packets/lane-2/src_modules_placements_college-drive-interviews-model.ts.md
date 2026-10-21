# Work packet: edit src/modules/placements/college-drive-interviews-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-10-013-047  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:251-275 — Legacy upcoming/completed/cancelled filtering depends on interviewStatus and scheduled time.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:4-10 — New status enumerates round states, not per-candidate interview statuses.
- Fix: Filter appointment status from slot/outcome rather than round status.

## G2-9-012-018  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:136-146` — Filters status/type/mode/department/company/search/conflicts
- vNext now: `src/modules/placements/college-drive-interviews-model.ts:3-8` — Only round kind/status/page/applicationId parameters
- Fix: Add filters to candidate appointments rather than treating round kind as interview type

## G2-9-012-028  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:11-14` — Invalid ID gives name is required and must be a valid value
- vNext now: `src/modules/placements/college-drive-interviews-model.ts:3-8` — UUID parsing/range errors show Invalid interview filters for query, other errors boundary
- Fix: Display mapped field-level ID/date errors where used
