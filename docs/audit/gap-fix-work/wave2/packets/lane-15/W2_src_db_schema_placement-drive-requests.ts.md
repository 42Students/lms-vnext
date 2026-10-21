# Work packet (wave 2): edit src/db/schema/placement-drive-requests.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-12-025-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy list includes roleTitle, group createdAt, collegeName/status, hides other-college copies. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:131-160`
- vNext now: vNext request row contains createdAt, college and draft; no drive group. `src/db/schema/placement-drive-requests.ts:19-44`
- Fix: Derive per-college grouped list without exposing other-tenants.
