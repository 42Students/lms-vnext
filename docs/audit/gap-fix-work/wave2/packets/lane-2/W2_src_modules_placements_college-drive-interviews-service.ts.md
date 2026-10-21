# Work packet (wave 2): edit src/modules/placements/college-drive-interviews-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-10-013-041  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-160; docs/legacy-source/frontend/src/api/Services/interviewService.js:32-49 — Fetch all interviews for organization and filter list by job route.
- vNext now: src/modules/placements/college-drive-interviews-service.ts:20-48 — Reads only given job's persisted rounds with LIMIT 25.
- Fix: Use scoped SQL to fetch candidate interviews, not just rounds.

## G2-10-013-069  [P2] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184,232-313 — One college-wide fetch plus client filtering/sorting all interviews.
- vNext now: src/modules/placements/college-drive-interviews-service.ts:20-49 — Server count+page rounds and separate appointments service; bounded payload.
- Fix: Server-paginate candidate appointments with stable cross-page filters.

## G2-10-013-073  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:288-312 — Date sorts compare parsed UTC instants; stable fallback if missing.
- vNext now: src/modules/placements/college-drive-interviews-model.ts:32-35; src/modules/placements/college-drive-interviews-service.ts:39-49 — SQL default order by rounds scheduledAt; server candidate slots separate.
- Fix: Align stable date asc/desc across candidate appointments.

## G2-9-012-060  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1024-1036` — 20 per page with client-side sort and filters
- vNext now: `src/modules/placements/college-drive-interviews-service.ts:43-47` — DB sort by round sequence not schedule and page25
- Fix: Match time-sorted 20 appointment rows/page
