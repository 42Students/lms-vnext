# Work packet (wave 3): edit src/app/api/projects/[projectId]/resources/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-15-017-002  [P1] MISSING  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:839-854 GET /{projectId}/resource-audit?collegeId
- vNext now: src/app/api/projects/[projectId]/resources/route.ts:16-30 GET /api/projects/:id/resources returns current rows, not audit history
- Fix: Add tenant-scoped GET /api/projects/:id/resources/audit
