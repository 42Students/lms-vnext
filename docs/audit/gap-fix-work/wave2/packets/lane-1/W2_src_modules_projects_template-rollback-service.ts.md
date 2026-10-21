# Work packet (wave 2): edit src/modules/projects/template-rollback-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-5-017-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy rollback uses versionId, current templateVersion and college scope `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-149`
- vNext now: New body requires UUID versionId, integer expectedTemplateVersion, confirmed:true `src/modules/projects/template-rollback-service.ts:12-23`
- Fix: Update client payload contract, retain explicit confirmation and CAS.
