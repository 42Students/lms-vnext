# Work packet (wave 2): edit src/app/api/admin/hr/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-3-031-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:83-101`
- vNext now: `src/app/api/admin/hr/route.ts:42-84`
- Fix: Legacy creates/updates recruiter via distinct numeric-ID account endpoints; vNext canonical user-backed /api/admin/hr, PATCH by user UUID.
