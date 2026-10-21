# Work packet: edit src/modules/projects/template-rollback-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md, docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-2-021-014  [P1] GAP  facet F04  effort M
- Legacy: AdminProjectTemplateController.java:436-459 `impact` returns blast-radius map for rollback
- vNext now: src/modules/projects/template-rollback-service.ts:55-62 returns existingWorkspaces unchanged but no preflight impact shown
- Fix: Provide trustworthy pre-rollback impact including affected project counts before confirmation.

## G2-2-021-031  [P1] GAP  facet F09  effort M
- Legacy: AdminProjectTemplateController.java:436-459 impact preview before rollback
- vNext now: src/modules/projects/template-rollback-service.ts:18-63 rollback command no separate impact read
- Fix: Require blast-radius review/impact dialog prior to rollback.

## G2-2-021-036  [P1] GAP  facet F10  effort M
- Legacy: AdminProjectTemplateController.java:470-483 rollback rewrites legacy virtual sections for attached workspaces (comments:436-443)
- vNext now: src/modules/projects/template-rollback-service.ts:18-62 creates new version; existing workspaces unchanged
- Fix: Decide target parity explicitly: attach/materialize snapshot vs legacy dynamic virtual sections; disclose before rollback.

## G2-2-021-044  [P1] GAP  facet F12  effort M
- Legacy: AdminProjectTemplateController.java:436-483 rollback preflight and restore old version affecting virtual sections
- vNext now: src/modules/projects/template-rollback-service.ts:18-62 new current version but publishedVersion unchanged
- Fix: Clearly state no immediate attached-workspace updates and audit difference.

## G2-2-021-070  [P1] GAP  facet F23  effort M
- Legacy: AdminProjectTemplateController.java:436-443 attached cohorts resolve virtual sections dynamically
- vNext now: src/modules/projects/template-rollback-service.ts:18-62 existing workspaces unchanged
- Fix: Document and review intentional snapshot divergence before fixes.

## G2-5-017-026  [P1] GAP  facet F10  effort L
- Legacy: Legacy rollback restores full snapshot including lifecycle, publishedAt, archivedAt, deletion `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:114-121`
- vNext now: New rollback inserts new content version; publishedVersion/current status untouched `src/modules/projects/template-rollback-service.ts:17-54`
- Fix: Document accepted intentional safer semantics and update legacy warning/rollback tests.

## G2-5-017-027  [P1] GAP  facet F10  effort L
- Legacy: Legacy changes generate history actions independent of version numbering `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`
- vNext now: New rollback creates new uniquely numbered version and activity event `src/modules/projects/template-rollback-service.ts:36-61`
- Fix: Preserve all legacy action events in audit/event migration.

## G2-5-017-043  [P1] GAP  facet F20  effort M
- Legacy: Legacy rollback confirmation warns whole lifecycle restoration `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:118-138`
- vNext now: New CAS ignores archived templates, preserves published pointer `src/modules/projects/template-rollback-service.ts:30-54`
- Fix: Clarify intended non-equivalence; distinguish rollback of content vs publication.
