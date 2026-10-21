# Work packet (wave 2): edit src/modules/projects/template-version-history-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-5-017-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy controller GET /api/v1/admin/project-templates/{id}/versions/page and /versions `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:132-142,173-185`
- vNext now: New version history is server service, no legacy API envelope `src/modules/projects/template-version-history-service.ts:9-27`
- Fix: Migrate callers or expose compatibility redirect.

## G2-5-017-011  [P2] GAP  facet F05  effort S
- Legacy: Legacy query sorts templateVersion DESC, changedAt DESC, id DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTemplateVersionRepository.java:11-23`
- vNext now: New orders version DESC,id DESC, no changedAt tie-break `src/modules/projects/template-version-history-service.ts:18-24`
- Fix: Restore deterministic timestamp ordering for duplicate historical action revisions.

## G2-5-017-028  [P2] GAP  facet F11  effort M
- Legacy: Legacy version/rollback editing concern gated to superadmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:173-185`
- vNext now: New read permission project-template.read, mutations project-template.manage + persisted recheck `src/modules/projects/template-version-history-service.ts:9-13`
- Fix: Verify read-only college roles aren't granted raw global version history unintentionally.

## G2-5-017-040  [P2] GAP  facet F19  effort M
- Legacy: Legacy cap 50 in bounded service overload, 25 paginated; composite descending index `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTemplateVersionRepository.java:13-25`
- vNext now: New count + page of 25, templateId/version index `src/modules/projects/template-version-history-service.ts:16-25`
- Fix: Benchmark version list index descending and tie ordering with JSONB-heavy rows.

## G2-5-017-042  [P2] GAP  facet F20  effort M
- Legacy: Legacy row ordering has three deterministic keys including timestamp `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTemplateVersionRepository.java:11-23`
- vNext now: New stable version/id ordering, loses changedAt tie semantics `src/modules/projects/template-version-history-service.ts:19-24`
- Fix: Migrate multiple same-version history actions with stable chronology.

## G2-8-029-027  [P2] GAP  facet F10  effort M
- Legacy: Old uses getProjectTemplateById,getProjectTemplateVersionsPage,getProjectTemplateImpact on load docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:49-109.
- vNext now: New getSuperAdminTemplateVersionHistory joins current and paged versions, comparison service separate src/modules/projects/template-version-history-service.ts:9-27; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:29-31.
- Fix: Fetch attachment impact and workspace examples before rollback warning.

## G2-8-029-030  [P2] GAP  facet F11  effort M
- Legacy: Old SuperAdminTemplateShell and superadmin college scope limit view docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:7-9,29-32,163-168.
- vNext now: New requirePermission project-template.read and global template ID, no selected college required src/modules/projects/template-version-history-service.ts:9-15; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:19-27.
- Fix: Document switch from college-scoped template history to global catalogue with safe permissions.

## G2-5-017-012  [P3] GAP  facet F05  effort M
- Legacy: Legacy repository supports unpaged, capped list and Page<T> variants `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTemplateVersionRepository.java:10-25`
- vNext now: New history uses count, limit25, offset and clamps page to total pages `src/modules/projects/template-version-history-service.ts:16-27`
- Fix: Document difference between old 50 summary and new 25-page detail; verify expected consumers.
