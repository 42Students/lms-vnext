# Work packet: edit src/modules/projects/template-version-history-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-template-versions.md, docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-8-029-009  [P1] GAP  facet F04  effort M
- Legacy: Old version ID numeric, templateVersion, actionType, notes, changedAt, snapshotJson docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:182-202,241-247.
- vNext now: New projectTemplateVersions UUID id,version,title,summary,changeNote,createdAt,blueprint src/modules/projects/template-version-history-service.ts:19-27; src/components/projects/super-admin-template-subview-page.tsx:578-644.
- Fix: Migrate old snapshot metadata, actionType and timestamps with exact field mapping.

## G2-8-029-048  [P1] GAP  facet F22  effort M
- Legacy: Old version snapshotJson contains complete template entity fields incl publication/deletion state docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-138,241-254.
- vNext now: New projectTemplateVersions.blueprint + projectTemplates mutable header status/currentVersion src/modules/projects/template-version-history-service.ts:19-27; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:57-63.
- Fix: Version migration must preserve old full snapshot or explicitly drop lifecycle rollback.

## G2-5-017-022  [P3] GAP  facet F08  effort S
- Legacy: Legacy /versions success envelope 'Project template versions retrieved' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:173-185`
- vNext now: New service returns paging/detail without message `src/modules/projects/template-version-history-service.ts:23-27`
- Fix: Adapter exact legacy success envelope for older clients.
