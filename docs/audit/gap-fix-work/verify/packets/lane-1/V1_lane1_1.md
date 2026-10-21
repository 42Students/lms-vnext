# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-029-053 [P1] GAP facet F20
- Files: src/modules/projects/validation.ts
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:323-345 — dangling sprint links become null in backlog when save.
- Expected fix: Provide explicit backlog recovery for deleted sprints.

## G2-10-028-013 [P1] GAP facet F04
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:244-248; docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:92-108 — ACTIVE/IN_PROGRESS/READY/BLOCKED/ARCHIVED statuses humanized.
- Expected fix: Map status lifecycle and colors.

## G2-19-022-003 [P1] GAP facet F02
- Files: src/app/(authenticated)/tpo/home/page.tsx
- Legacy: Home aggregates summary, needsYou, team asks, calendar, report filters (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:45-95; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:278-418).
- Expected fix: Make legacy section ordering a side-by-side acceptance list; preserve `needsYou` priority, team asks and filtered season scope in page composition.

## G2-18-028-023 [P1] MISSING facet F08
- Files: src/components/projects/workspace-brief-editor.tsx
- Legacy: Old unsaved changes leave confirm: You have unsaved changes. Leave without saving them?; useUnsavedFormGuard.js:21-54
- Expected fix: Use project-editor-discard-guard on Cancel/Close/nav/unload

## G2-16-007-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/semester-courses/page.tsx
- Legacy: `semester-courses.js:18-29`: no college shows warning `Admin not assigned to a college` and contact administrator.
- Expected fix: Render exact missing-college warning with contact instruction when authenticated but unassigned.

## G2-16-028-033 [P1] GAP facet F12
- Files: src/modules/projects/resource-service.ts
- Legacy: ProjectWorkspaceUpdateDTO.java:18-36 omitted sections leave other sections unchanged; resourcesToken only this list.
- Expected fix: Use section-granular atomic transaction; ensure other sections remain untouched.

## G2-2-012-033 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:170 HAVING marked>0 and attendance ratio below threshold
- Expected fix: Use complete denominator of marked sessions and protect zero denominator.

## G2-4-006-033 [P1] GAP facet F10
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Search and counts call Java GET `/api/v1/admin/projects?...view&search&page&size`; selected project fetches by ID. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:164-197`)
- Expected fix: Retain focused workspace link and count/filter semantics.

## G2-4-006-063 [P1] GAP facet F22
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Legacy workspace delivery status/reviewStatus, submittedAt, revisionCount, reviewedByType, feedback, attachmentUrl are JSON-backed. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:33-70;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:403-610`)
- Expected fix: Write migration field-by-field mapping, especially revisionCount/status/reopened history.

## G2-12-024-003 [P1] GAP facet F02
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: Controller includes query, status, triage, export, deploys, digest `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:56-235`
- Expected fix: Map all legacy workbench sections in legacy order.

## G2-4-017-003 [P1] GAP facet F01
- Files: src/modules/projects/instance-service.ts
- Legacy: Legacy controller handles direct /api/v1/projects/me/page and /id routes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:81-109`)
- Expected fix: Map numeric legacy deep links or document intentional migration break.

## G2-4-009-013 [P1] GAP facet F04
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Submitted-by name + submitted timestamp displayed together; reviewedBy reviewer name/date/type ADMIN orange chip. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:415-465`)
- Expected fix: Restore submitted-by, reviewedAt, reviewedByType in row and export.

## G2-14-028-023 [P1] GAP facet F06
- Files: src/components/projects/college-project-summary-editor-full.tsx, src/modules/projects/college-project-summary-model.ts
- Legacy: Legacy patch sends only touched fields, including explicit 0 class detach. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:282-299`
- Expected fix: Avoid overwriting untouched concurrent values.

## G2-5-017-043 [P1] GAP facet F20
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: Legacy rollback confirmation warns whole lifecycle restoration `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:118-138`
- Expected fix: Clarify intended non-equivalence; distinguish rollback of content vs publication.

## G2-5-028-023 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy Learners multi select searches all college learners. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:849-859`
- Expected fix: Preserve ability to assign only selected class learners; clarify intentional stronger constraint.

## G2-5-028-053 [P1] GAP facet F12
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy optional organizationId and classId accepted in payload. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:472-488`
- Expected fix: Map organization resolution and section selection explicitly.

## G2-5-028-073 [P1] GAP facet F22
- Files: src/modules/projects/instance-service.ts, src/db/schema/projects.ts
- Legacy: Legacy ProjectWorkspace fields include courseLabel, phase, progress, blocker,nextAction,dueLabel, classId. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectCreateDTO.java:14-37`
- Expected fix: Record schema field migration and where phase/blockers now live.

## G2-5-029-033 [P1] MISSING facet F09
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy back/cancel prompts discard when dirty via confirmDiscardIfDirty. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:157-164,308-319`
- Expected fix: Implement unsaved-change confirm dialog, including browser history/navigation.

## G2-6-006-013 [P1] MISSING facet F08
- Files: (none, new feature)
- Legacy: Old redirects with `permanent: false`; no confirmation/success toast `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-7`
- Expected fix: Use `permanent: false`, preserving temporary redirect semantics and no toast

## G2-7-008-033 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:42-45: Revisions value is persisted delivery.revisionCount, em dash if unavailable.
- Expected fix: Use actual revisionCount not number of submitted versions; independent edits can occur within one version.

## G2-7-019-013 [P1] GAP facet F03
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: workspaces/index.js:219-236 interactive amber `No template — attach one` Tag
- Expected fix: Make no-template prompt keyboard-clickable to summary template dialog.

## G2-7-020-053 [P1] GAP facet F09
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:404-405 confirmDiscardIfDirty; useUnsavedFormGuard.js:17-56 guards unload and route
- Expected fix: Provide global dirty-form navigation confirmation

## G2-7-021-033 [P1] GAP facet F06
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:225-235 skip counted only if mentor ID AND normalized roleLabel equal
- Expected fix: Use role-label-aware skip calculation so role-change operation is not hidden

## G2-7-028-023 [P1] GAP facet F04
- Files: src/modules/projects/mentor-attention.ts
- Legacy: ProjectsContent.jsx:317-324 Needs review based on submittedAt > reviewedAt
- Expected fix: Prevent self-reopen false review flag and include under-review fresh submissions

## G2-7-035-003 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:472-475 Create workspace action requires selected college
- Expected fix: Restore create-from-template workflow with selected college guard
