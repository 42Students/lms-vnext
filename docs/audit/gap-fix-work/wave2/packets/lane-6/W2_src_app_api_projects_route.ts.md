# Work packet (wave 2): edit src/app/api/projects/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-2/admin-project-template-controller.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md

## G2-2-020-001  [P2] GAP  facet F01  effort M
- Legacy: AdminProjectController.java:49-53,173-186 POST /api/v1/admin/projects
- vNext now: src/app/api/projects/route.ts:30-53 POST /api/projects
- Fix: Provide admin-path compatibility mapping and route to same create service.

## G2-2-020-012  [P2] GAP  facet F04  effort M
- Legacy: AdminProjectController.java:273-313 unbounded list plus paged 25 default
- vNext now: src/app/api/projects/route.ts:12-27 unpaged GET; admin-insights-service.ts:86-110 paged summaries
- Fix: Document paged API and use it for large admin lists.

## G2-2-020-072  [P2] GAP  facet F23  effort M
- Legacy: AdminProjectController.java:173-186 Response<DTO> envelope
- vNext now: src/app/api/projects/route.ts:46-49 returns `{project}`
- Fix: Map response envelope to prevent legacy client breaks.

## G2-2-021-005  [P2] GAP  facet F01  effort M
- Legacy: AdminProjectTemplateController.java:269-294 POST /{id}/projects creates a workspace from template
- vNext now: src/app/api/projects/route.ts:30-53 creates project given templateId
- Fix: Provide create-from-template route/deep-link with explicit target college.

## G2-5-028-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy getProjectsByCollege GET `/api/v1/admin/projects?collegeId` loads all. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:136-165`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:273-303`
- vNext now: vNext uses admin snapshot query for page and /api/projects GET for instances. `src/app/(authenticated)/admin/projects/page.tsx:104-133`, `src/app/api/projects/route.ts:12-27`
- Fix: Bridge legacy list response including slug/course/phase/mentor fields.

## G2-2-020-009  [P3] GAP  facet F03  effort M
- Legacy: AdminProjectController.java:173-186 response 201 Project created
- vNext now: src/app/api/projects/route.ts:46-49 returns bare project 201
- Fix: Expose legacy action-specific success copy to UI.
