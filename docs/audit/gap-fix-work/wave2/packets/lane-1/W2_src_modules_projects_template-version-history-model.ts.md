# Work packet (wave 2): edit src/modules/projects/template-version-history-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-5-017-013  [P2] GAP  facet F05  effort S
- Legacy: Legacy paged endpoint page0, size25; UI disables page-size changer `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:132-141`
- vNext now: New query 1-based page and fixed25; clamps 1..1000 `src/modules/projects/template-version-history-model.ts:1-17`
- Fix: Convert legacy page index and bounds in any migrated deep links.

## G2-5-017-015  [P2] GAP  facet F06  effort S
- Legacy: Legacy page calls API with page=0 and size=25 `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:51-59`
- vNext now: New query requires positive page and has no size override `src/modules/projects/template-version-history-model.ts:2-12`
- Fix: Translate query defaults to 1-based when using new route.
