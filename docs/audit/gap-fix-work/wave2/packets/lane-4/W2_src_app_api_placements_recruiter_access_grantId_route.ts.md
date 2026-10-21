# Work packet (wave 2): edit src/app/api/placements/recruiter/access/[grantId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-14-016-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy TPO manage endpoint /api/v1/tpo/recruiter-access `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:33-35` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:58-60`
- vNext now: New separate app access services and own-leave DELETE route `src/modules/placements/tpo-recruiter-access-service.ts:54-82` `src/app/api/placements/recruiter/access/[grantId]/route.ts:10-19`
- Fix: Map old TPO extend/revoke paths to new scoped actions
