# Work packet (wave 2): edit src/modules/projects/template-subview-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-037  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:229-235 — updates require Super Admin.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:209-218 — editor only for project-template.manage and non-ARCHIVED; read permission service in src/modules/projects/template-subview-service.ts:28-42.
- Fix: Document read vs edit gate and archived disabled behavior.
