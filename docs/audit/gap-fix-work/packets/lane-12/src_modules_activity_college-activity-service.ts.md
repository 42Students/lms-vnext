# Work packet: edit src/modules/activity/college-activity-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-036  [P1] GAP  facet F10  effort M
- Legacy: GET /api/v1/superadmin/audit with collegeId/category/since/page/size (`docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-5`)
- vNext now: Server listCollegeActivity resolves Drizzle events with Zod query (`src/modules/activity/college-activity-service.ts:25-41`)
- Fix: Map legacy action coverage to new typed events and restore query defaults.

## G2-9-001-040  [P1] GAP  facet F11  effort M
- Legacy: College Admin only own college; scoped Super Admin allowed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:122-163`)
- vNext now: Requires college membership COLLEGE_ADMIN and activity.read (`src/modules/activity/college-activity-service.ts:10-23`)
- Fix: Check scoped Super Admin ability, enforce acting college where approved.

## G2-9-001-043  [P1] GAP  facet F12  effort M
- Legacy: Category filters based on action key patterns (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:124-150`)
- vNext now: Important HIGH/CRITICAL; category maps broad module (`src/modules/activity/college-activity-service.ts:28-40`)
- Fix: Reconcile important/setup/people/teaching/projects action classification.

## G2-9-001-068  [P1] GAP  facet F21  effort M
- Legacy: Axios service to Java controller (`docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-5`)
- vNext now: Server-side Drizzle service (`src/modules/activity/college-activity-service.ts:25-47`)
- Fix: Map legacy audit action producers and integrations to vNext writer calls.
