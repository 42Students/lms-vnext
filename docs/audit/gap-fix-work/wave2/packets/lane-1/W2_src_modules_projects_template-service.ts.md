# Work packet (wave 2): edit src/modules/projects/template-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md, docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md, docs/audit/gap2/lane-7/u006-college-admin-project-templates.md

## G2-2-021-037  [P2] GAP  facet F10  effort M
- Legacy: AdminProjectTemplateController.java:392-425 publish/unpublish alters status
- vNext now: src/modules/projects/template-service.ts:380-535 publishes current version and updates college assignments; unpublish resets publishedVersion
- Fix: Audit impact on future vs current workspaces, show published version and effects.

## G2-5-029-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy `POST /api/v1/admin/project-templates` entire fields, 201 `{status,message,data}`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:118-140`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:201-220`
- vNext now: vNext POST `/api/projects/templates` `{template,version}`, 201. `src/app/api/projects/templates/route.ts:32-54`, `src/modules/projects/template-service.ts:241-298`
- Fix: Document exact HTTP path/envelope adapter.

## G2-7-006-026  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:73-74; api/Services/AdminService.js:project templates GET: `GET /api/v1/admin/project-templates?collegeId,search`.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:27-29; modules/projects/template-service.ts:781-843: direct assigned/version DB read.
- Fix: Maintain catalog visibility/filter parity, document endpoint change.
