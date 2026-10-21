# Work packet: edit src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-8-029-020  [P1] GAP  facet F07  effort M
- Legacy: Old snapshot JSON parse error says Version snapshot could not be read. Do not roll back without a verified diff. docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:241-246.
- vNext now: New comparison service parses typed blueprint, may throw and show Template history unavailable src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:29-39.
- Fix: Block rollback on unreadable snapshot with exact field-specific explanation.

## G2-8-029-024  [P1] GAP  facet F09  effort M
- Legacy: Old Compare changes Modal width860 on clicked row, I reviewed these changes affirmative docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:238-257.
- vNext now: New full comparison page; no acknowledgment control, rollback confirm alone src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:41-60; src/components/projects/super-admin-template-rollback-control.tsx:19-21.
- Fix: Add explicit reviewed-this-diff confirmation before enabling rollback.

## G2-8-029-046  [P1] GAP  facet F20  effort M
- Legacy: Old compare modal loaded template before rollback, stale version on edit results server 409 docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-149.
- vNext now: New compare page fetch then mutate with expectedTemplateVersion, no acknowledgment token src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:29-60; src/components/projects/super-admin-template-rollback-control.tsx:24-27.
- Fix: Bind previewed compare hash/current version to explicit review to avoid stale/unreviewed rollback.

## G2-8-029-048  [P1] GAP  facet F22  effort M
- Legacy: Old version snapshotJson contains complete template entity fields incl publication/deletion state docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-138,241-254.
- vNext now: New projectTemplateVersions.blueprint + projectTemplates mutable header status/currentVersion src/modules/projects/template-version-history-service.ts:19-27; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:57-63.
- Fix: Version migration must preserve old full snapshot or explicitly drop lifecycle rollback.

## G2-8-029-050  [P1] GAP  facet F23  effort M
- Legacy: Old rollback restores all historical data to new version incl lifecycle state docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-121.
- vNext now: New selectedVersion blueprint snapshot separately editable and publication managed apart src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:46-63.
- Fix: Record owner decision on lifecycle parity, avoid implying matches.
