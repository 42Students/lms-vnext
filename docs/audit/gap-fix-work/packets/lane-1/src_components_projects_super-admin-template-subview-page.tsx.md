# Work packet: edit src/components/projects/super-admin-template-subview-page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-template-versions.md, docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md, docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md, docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-8-029-009  [P1] GAP  facet F04  effort M
- Legacy: Old version ID numeric, templateVersion, actionType, notes, changedAt, snapshotJson docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:182-202,241-247.
- vNext now: New projectTemplateVersions UUID id,version,title,summary,changeNote,createdAt,blueprint src/modules/projects/template-version-history-service.ts:19-27; src/components/projects/super-admin-template-subview-page.tsx:578-644.
- Fix: Migrate old snapshot metadata, actionType and timestamps with exact field mapping.

## G2-12-029-025  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:39-53 — Failed to load template and Template could not be loaded Alert.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:113-132 — Template section unavailable retry ErrorState.
- Fix: Match error text and location.

## G2-10-029-029  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:53-60 — GET failure Failed to load template, with returned error detail.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:113-132 — Template section unavailable, server detail intentionally hidden.
- Fix: Align safe error copy and retry.

## G2-5-017-018  [P2] GAP  facet F07  effort S
- Legacy: Legacy versions page distinguishes template fetch vs history fetch error `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:59-83`
- vNext now: New section maps failures to generic 'Template section unavailable' retry `src/components/projects/super-admin-template-subview-page.tsx:113-135`
- Fix: Keep history-specific error vs template-not-found messages.

## G2-8-029-019  [P2] GAP  facet F07  effort M
- Legacy: Old template detail failure Failed to load template, version list failure separately Failed to load version history docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:49-86.
- vNext now: New one ErrorState Template section unavailable if service fails src/components/projects/super-admin-template-subview-page.tsx:103-132.
- Fix: Differentiate template load from history load failure; keep retry preserving list.
