# Work packet: edit src/app/api/projects/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md, docs/audit/gap2/lane-2/admin-project-controller.md

## G2-5-028-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy create POST with class/mentor/learners and full project metadata. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:467-521`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:173-195`
- vNext now: vNext POST requires assigned template and slug, materializes blueprint. `src/app/api/projects/route.ts:30-53`, `src/modules/projects/instance-service.ts:148-167`
- Fix: Provide migration path for ad-hoc workspace creation or seed assigned templates.

## G2-5-028-072  [P1] GAP  facet F21  effort M
- Legacy: Legacy AdminService invokes Spring project/people endpoints. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:5-18`
- vNext now: vNext Next.js handlers and scoped services; template materialization creates related release/sprints. `src/app/api/projects/route.ts:12-52`, `src/modules/projects/instance-service.ts:148-167`
- Fix: Document integration migration and background notifications.

## G2-7-020-055  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:343-345 POST /api/v1/admin/projects AdminProjectCreateDTO
- vNext now: src/app/api/projects/route.ts:30-49 POST /api/projects createProjectInstance
- Fix: Crosswalk create contract including status, slug, class and membership IDs

## G2-2-020-028  [P2] GAP  facet F08  effort M
- Legacy: AdminProjectController.java:186 Project created, 235 Workspaces created, 411 Mentor assigned
- vNext now: src/app/api/projects/route.ts:46-49 `{project}` only, no action message
- Fix: Use legacy action-specific feedback in create/mentor UI.
