# Work packet (wave 2): edit src/components/projects/super-admin-template-rollback-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-5-017-045  [P2] GAP  facet F21  effort M
- Legacy: Legacy UI loads workspace impact separately for rollback warning `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:88-104,118-138`
- vNext now: New rollback states pinned workspaces unchanged without impact query `src/components/projects/super-admin-template-rollback-control.tsx:17-34`
- Fix: If required, show impacted count/sample before irreversible rollback.

## G2-8-029-006  [P2] GAP  facet F03  effort M
- Legacy: Old current version Tag Current and disabled Roll back tooltip on top row docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:183-225.
- vNext now: New labels from templateVersionLabels and comparison always linked, rollback disabled on current src/components/projects/super-admin-template-subview-page.tsx:578-633; src/components/projects/super-admin-template-rollback-control.tsx:16-17,40-42.
- Fix: Add current-row explicit disabled rollback affordance and tooltip copy.

## G2-8-029-028  [P2] GAP  facet F10  effort M
- Legacy: Old rollbackProjectTemplateVersion(templateId,versionId,collegeId,expectedVersion) docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:140-149.
- vNext now: New POST /api/projects/templates/{id}/rollback with versionId/expectedTemplateVersion/confirmed src/components/projects/super-admin-template-rollback-control.tsx:24-27.
- Fix: Document payload/method migration and id/college-scoping.

## G2-8-029-041  [P2] GAP  facet F17  effort M
- Legacy: Old Ant modal auto focuses affirmative I reviewed these changes and Popconfirm links keyboard docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:208-219,238-257.
- vNext now: New changes pre role region tabindex0, keyboard compare links, confirm dialog hook src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:47-55; src/components/projects/super-admin-template-rollback-control.tsx:19-21.
- Fix: Ensure explicit diff review gate and focus return to version row.

## G2-8-029-043  [P2] GAP  facet F18  effort M
- Legacy: Old action Compare changes, Roll back, Current, Template versions docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:177-225.
- vNext now: New Compare changes and inspect snapshot →, Restore this snapshot, Version history src/components/projects/super-admin-template-subview-page.tsx:558-633; src/components/projects/super-admin-template-rollback-control.tsx:32-39.
- Fix: Use familiar action names, new explanation subordinate.

## G2-8-029-047  [P2] GAP  facet F21  effort M
- Legacy: Old Backend AdminService getProjectTemplateImpact used to display attachedWorkspaceCount/sampleWorkspaces warning docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:91-138.
- vNext now: New compare service returns snapshot changes and only generic pinned-workspace warning src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:44-46; src/components/projects/super-admin-template-rollback-control.tsx:34-35.
- Fix: Provide impact estimate and sampled affected project names before rollback.
