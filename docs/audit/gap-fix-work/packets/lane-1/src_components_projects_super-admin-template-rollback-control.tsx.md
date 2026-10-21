# Work packet: edit src/components/projects/super-admin-template-rollback-control.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-5-017-024  [P1] GAP  facet F09  effort S
- Legacy: Legacy Popconfirm warns publication state travels with snapshot `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:118-138,205-232`
- vNext now: New confirm explicitly states published version unchanged `src/components/projects/super-admin-template-rollback-control.tsx:16-25`
- Fix: Align warning to actual rollback semantics and explain publication-state difference.

## G2-8-029-017  [P1] GAP  facet F06  effort M
- Legacy: Old rollback disabled until comparedVersionId equals version.id docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:209-216.
- vNext now: New rollback control enabled for noncurrent/nonarchived, after navigation to compare page src/components/projects/super-admin-template-rollback-control.tsx:16-21,32-39.
- Fix: Require explicit compared-content acknowledgment rather than only page visit before rollback.

## G2-8-029-024  [P1] GAP  facet F09  effort M
- Legacy: Old Compare changes Modal width860 on clicked row, I reviewed these changes affirmative docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:238-257.
- vNext now: New full comparison page; no acknowledgment control, rollback confirm alone src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:41-60; src/components/projects/super-admin-template-rollback-control.tsx:19-21.
- Fix: Add explicit reviewed-this-diff confirmation before enabling rollback.

## G2-8-029-025  [P1] GAP  facet F09  effort M
- Legacy: Old Popconfirm title Roll back to this version? with publication warning docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:208-219.
- vNext now: New useConfirmFlow title Roll back to version N? plus claims published version unchanged src/components/projects/super-admin-template-rollback-control.tsx:19-21.
- Fix: Reconcile actual rollback publication semantics; warning cannot contradict persisted status behavior.

## G2-8-029-029  [P1] GAP  facet F10  effort M
- Legacy: Old rollback restores whole legacy snapshot incl lifecycleStatus,publishedAt,archivedAt,isDeleted docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-121.
- vNext now: New confirmation explicitly says published version unchanged until publish again src/components/projects/super-admin-template-rollback-control.tsx:19-21.
- Fix: Verify actual new rollback status/version mutation and explain intentional divergence.

## G2-8-029-032  [P1] GAP  facet F12  effort M
- Legacy: Old rollback warning existing workspaces retain pinned snapshots but publication status travels with snapshot docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-138.
- vNext now: New workspaces pinned; published version unchanged until republish src/components/projects/super-admin-template-rollback-control.tsx:19-21,33-35.
- Fix: Document precise difference and test rollback of pre-publish/pre-archive version.

## G2-8-029-046  [P1] GAP  facet F20  effort M
- Legacy: Old compare modal loaded template before rollback, stale version on edit results server 409 docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-149.
- vNext now: New compare page fetch then mutate with expectedTemplateVersion, no acknowledgment token src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:29-60; src/components/projects/super-admin-template-rollback-control.tsx:24-27.
- Fix: Bind previewed compare hash/current version to explicit review to avoid stale/unreviewed rollback.

## G2-5-017-021  [P2] GAP  facet F08  effort S
- Legacy: Legacy success toast exactly 'Template rolled back' `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:148-155`
- vNext now: New inline notice 'Template rolled back to version X as new version Y.' `src/components/projects/super-admin-template-rollback-control.tsx:23-30`
- Fix: Match toast placement/text or document deliberate richer notification.

## G2-8-029-021  [P2] GAP  facet F07  effort M
- Legacy: Old rollback error Failed to roll back template via projectError modal docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-157.
- vNext now: New inline error cause.message or Template rollback failed src/components/projects/super-admin-template-rollback-control.tsx:23-30,42.
- Fix: Map domain code into friendly stale/forbidden/invalid version errors.

## G2-8-029-022  [P2] GAP  facet F08  effort M
- Legacy: Old success toast exact Template rolled back docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-150.
- vNext now: New inline notice Template rolled back to version N as new version M. src/components/projects/super-admin-template-rollback-control.tsx:24-28,43.
- Fix: Preserve old toast and add version detail to follow-up text.

## G2-8-029-023  [P2] GAP  facet F08  effort M
- Legacy: Old after rollback sets versionPage(0), clears compare and reloads impact/templates docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:149-157.
- vNext now: New router.refresh in comparison page, stays on snapshot src/components/projects/super-admin-template-rollback-control.tsx:24-29.
- Fix: Return to history page1 and highlight newly created version after successful rollback.
