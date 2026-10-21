# Work packet (wave 2): edit src/modules/admin-ui/super-admin-placement-interviews-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-049  [P2] MISSING  facet F14 Exports  effort M
- Legacy: Export interviews.csv with full filtered appointment schema (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-896)
- vNext now: Round reader output has no CSV in defined route (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11; src/modules/admin-ui/super-admin-placement-interviews-service.ts:35-39)
- Fix: Build scoped export with legacy header/order.
