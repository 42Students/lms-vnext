# Work packet: edit src/app/(authenticated)/admin/projects/templates/new/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-5-029-040  [P1] GAP  facet F11  effort M
- Legacy: Legacy create requires Super Admin; no college scoped restriction explicit in create handler beyond principal. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:201-212`
- vNext now: vNext `project-template.manage` denies while scoped to org/college. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:8-17`, `src/modules/projects/template-service.ts:245-257`
- Fix: Confirm policy difference and surface scope-switch action.

## G2-5-029-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy module.projects.enabled check via @ModelAttribute feature guard. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:56-60`
- vNext now: vNext permission project-template.manage, no same feature gate at mapped create route. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:8-17`, `src/modules/projects/template-service.ts:245-257`
- Fix: Check effective module access gate before showing create.
