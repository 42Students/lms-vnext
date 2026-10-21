# Work packet (wave 2): edit src/app/api/projects/templates/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md, docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-2-021-001  [P2] GAP  facet F01  effort M
- Legacy: AdminProjectTemplateController.java:33-37 route /api/v1/admin/project-templates
- vNext now: src/app/api/projects/templates/route.ts:13-55 route /api/projects/templates
- Fix: Add compatibility routing/document endpoint migration.

## G2-5-029-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy `POST /api/v1/admin/project-templates` entire fields, 201 `{status,message,data}`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:118-140`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:201-220`
- vNext now: vNext POST `/api/projects/templates` `{template,version}`, 201. `src/app/api/projects/templates/route.ts:32-54`, `src/modules/projects/template-service.ts:241-298`
- Fix: Document exact HTTP path/envelope adapter.

## G2-5-029-065  [P2] GAP  facet F21  effort M
- Legacy: Legacy AdminService POST to Spring templates controller then route Next.js legacy ID page. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:7-19,133-140`
- vNext now: vNext POST Next app router and UUID detail. `src/app/api/projects/templates/route.ts:32-54`
- Fix: Verify deep-link migration and service error parsing.

## G2-2-021-057  [P3] GAP  facet F18  effort S
- Legacy: AdminProjectTemplateController.java:84 Project templates retrieved,113 Project template retrieved
- vNext now: src/app/api/projects/templates/route.ts:26 `{templates}`
- Fix: Use legacy title and screen-reader result-count feedback.
