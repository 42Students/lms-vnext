# Work packet (wave 3): edit src/components/admin/super-admin-faculty-schedule-reassign-action.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-054  [P1] MISSING  facet F10  effort L
- Legacy: Old DELETE `/api/v1/faculty/delete/:id` and class schedule transfer POST `docs/legacy-source/frontend/src/api/Services/AdminService.js:254-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:515-529`
- vNext now: New transfer POST `/api/admin/faculty/schedules/reassign`, but no delete action `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx:32-45` `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Implement blocked-if-assigned safe deletion with audit logs; retain transfer API
