# Work packet: edit src/app/(authenticated)/admin/placements/interviews/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-012  [P1] GAP  facet F03 Visible elements  effort L
- Legacy: Scheduled/Confirmed/Reschedule/Completed/Cancelled/No Show status badge colors (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:96-103)
- vNext now: Round statuses PENDING/SCHEDULED/COMPLETED/CANCELLED, no per-interview confirmed/reschedule/no-show (src/modules/admin-ui/super-admin-placement-interviews-service.ts:16; src/app/(authenticated)/admin/placements/interviews/page.tsx:4)
- Fix: Use appointment status lifecycle, not round status.

## G2-5-007-028  [P1] GAP  facet F07 Validation/errors  effort L
- Legacy: GET failure shows closable warning, stale rows remain with Retry (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-180; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- vNext now: SSR awaits service; no local stale-state Retry (src/app/(authenticated)/admin/placements/calendar/page.tsx:21-48; src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11)
- Fix: Catch partial failures, retain same-scope rows and show Retry.
