# Work packet: edit src/app/api/projects/[projectId]/resources/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-15-017-030  [P1] MISSING  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:14-31 super admin selected college scope
- vNext now: src/app/api/projects/[projectId]/resources/route.ts:20-25 no resource-history route with acting college
- Fix: Support explicitly scoped super admin while denying cross-tenant reads

## G2-15-017-022  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:859-861 unexpected read failure Failed to fetch resource audit
- vNext now: src/app/api/projects/[projectId]/resources/route.ts:28-31 no history endpoint error branch
- Fix: Map typed audit failure and expose retryable history error

## G2-15-017-023  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:854 success message Resource audit retrieved
- vNext now: src/app/api/projects/[projectId]/resources/route.ts:23-28 {resources} response for live resources
- Fix: Define history JSON response and old response normalization
