# Work packet (wave 2): edit src/modules/projects/template-version-comparison-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-5-017-023  [P2] GAP  facet F09  effort M
- Legacy: Legacy modal Compare version N with current + warning, field diffs `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:232-251`
- vNext now: New comparison is separate route returning formatted changes `src/modules/projects/template-version-comparison-service.ts:9-30`
- Fix: Recreate comparable modal or confirm intentional separate accessible page.
