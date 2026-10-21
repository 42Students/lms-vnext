# Work packet: edit src/app/api/projects/templates/[templateId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-035  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:399-400,421-422 and docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:95-111,223-243 — GET and PUT /api/v1/admin/project-templates/:id?collegeId.
- vNext now: src/app/api/projects/templates/[templateId]/route.ts:16-41 — PATCH /api/projects/templates/:id with expectedVersion, blueprint.
- Fix: Match edit fields while preserving atomic version control/audit.
