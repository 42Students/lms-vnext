# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-8-029-002  [P2] GAP  facet F01  effort M
- Legacy: Old compare changes opens modal in same version list, no route navigation docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:203-214,238-257.
- vNext now: New Compare link opens /versions/{versionId} dedicated page src/components/projects/super-admin-template-subview-page.tsx:629-633; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:15-18.
- Fix: Preserve return scroll/page and compare context after navigation.

## G2-8-029-005  [P2] GAP  facet F02  effort M
- Legacy: Old diff Modal 860px with warning then one Card per changed field docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:238-256.
- vNext now: New standalone page displays warning Banner, changes section and full selected snapshot src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:41-63.
- Fix: Restore in-list compare modal or add equivalent on-page review/confirmation hierarchy.

## G2-8-029-008  [P2] GAP  facet F03  effort M
- Legacy: Old Compare changes and Roll back adjacent buttons in each old version row docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:203-224.
- vNext now: New Compare changes and inspect snapshot link on row, rollback only on comparison page src/components/projects/super-admin-template-subview-page.tsx:629-633; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:57-60.
- Fix: Make rollback discoverable without requiring deep link detour, while retaining review gate.

## G2-8-029-027  [P2] GAP  facet F10  effort M
- Legacy: Old uses getProjectTemplateById,getProjectTemplateVersionsPage,getProjectTemplateImpact on load docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:49-109.
- vNext now: New getSuperAdminTemplateVersionHistory joins current and paged versions, comparison service separate src/modules/projects/template-version-history-service.ts:9-27; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:29-31.
- Fix: Fetch attachment impact and workspace examples before rollback warning.

## G2-8-029-030  [P2] GAP  facet F11  effort M
- Legacy: Old SuperAdminTemplateShell and superadmin college scope limit view docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:7-9,29-32,163-168.
- vNext now: New requirePermission project-template.read and global template ID, no selected college required src/modules/projects/template-version-history-service.ts:9-15; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:19-27.
- Fix: Document switch from college-scoped template history to global catalogue with safe permissions.

## G2-8-029-040  [P2] GAP  facet F16  effort M
- Legacy: Old modal fixed width860, nested cards maxHeight220 and Ant pagination docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:238-255,230-231.
- vNext now: New comparison grid stacks until lg, pre maxHeight80 and mobile scroll src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:47-54.
- Fix: Compare visual diff at 375/768/1280 and width/scroll behavior.

## G2-8-029-041  [P2] GAP  facet F17  effort M
- Legacy: Old Ant modal auto focuses affirmative I reviewed these changes and Popconfirm links keyboard docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:208-219,238-257.
- vNext now: New changes pre role region tabindex0, keyboard compare links, confirm dialog hook src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:47-55; src/components/projects/super-admin-template-rollback-control.tsx:19-21.
- Fix: Ensure explicit diff review gate and focus return to version row.

## G2-8-029-047  [P2] GAP  facet F21  effort M
- Legacy: Old Backend AdminService getProjectTemplateImpact used to display attachedWorkspaceCount/sampleWorkspaces warning docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:91-138.
- vNext now: New compare service returns snapshot changes and only generic pinned-workspace warning src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:44-46; src/components/projects/super-admin-template-rollback-control.tsx:34-35.
- Fix: Provide impact estimate and sampled affected project names before rollback.
