# Work packet: edit src/components/projects/college-project-summary-editor-full.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md

## G2-4-017-026  [P1] GAP  facet F06  effort L
- Legacy: Legacy classId integer optional editable in update DTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:73-74`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:44-48`)
- vNext now: New sectionId UUID optional selection from scoped classes. (`src/components/projects/college-project-summary-editor-full.tsx:81-86`; `src/db/schema/projects.ts:202-202`)
- Fix: Map classId to Section and account for multiple Sections per legacy Class.

## G2-4-017-029  [P1] GAP  facet F06  effort L
- Legacy: Legacy resources/sprints/tasks/meetings arrays have distinct concurrency tokens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:26-36`)
- vNext now: New summary editor uses single updatedAt token plus field baselines, other tables have separate commands. (`src/modules/projects/college-project-summary-service.ts:27-34`; `src/components/projects/college-project-summary-editor-full.tsx:46-57`)
- Fix: Verify all section mutations use independent optimistic tokens/append semantics.

## G2-14-028-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy Overall progress bar computed or hand-set when empty. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:94-99`
- vNext now: vNext Progress % editable numeric and separate readiness metric tiles. `src/components/projects/college-project-summary-editor-full.tsx:78-79`, `src/components/projects/project-workspace.tsx:364-412`
- Fix: Show derived progress and disable hand setting when task data available.

## G2-14-028-016  [P1] MISSING  facet F05  effort M
- Legacy: Legacy template dropdown remote-search, preserve selected option during search. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-201`
- vNext now: vNext has no equivalent in summary editor. `src/components/projects/project-workspace.tsx:193-207`, `src/components/projects/college-project-summary-editor-full.tsx:67-70`
- Fix: Restore server-filtered template picker and request-sequence guard.

## G2-14-028-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy status select, progress derived displays read-only bar. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:539-555`
- vNext now: vNext status controlled PLANNED/ACTIVE/COMPLETED and always-editable progress input. `src/components/projects/college-project-summary-editor-full.tsx:73-79`
- Fix: Honor calculated-progress semantics.

## G2-14-028-023  [P1] GAP  facet F06  effort M
- Legacy: Legacy patch sends only touched fields, including explicit 0 class detach. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:282-299`
- vNext now: vNext sends all fields, null sectionId to detach and expected tokens. `src/components/projects/college-project-summary-editor-full.tsx:46-57`, `src/modules/projects/college-project-summary-model.ts:4-23`
- Fix: Avoid overwriting untouched concurrent values.

## G2-14-028-031  [P1] MISSING  facet F09  effort M
- Legacy: Legacy Change template Modal with destructive warning, template search, reapply checkbox. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:451-485`
- vNext now: vNext editor inline, no template dialog. `src/components/projects/college-project-summary-editor-full.tsx:67-111`
- Fix: Implement modal with explicit task/sprint/resource replacement warning.

## G2-14-028-039  [P1] MISSING  facet F11  effort M
- Legacy: Legacy selects only published templates when replacing. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-159`
- vNext now: vNext no summary template action. `src/components/projects/college-project-summary-editor-full.tsx:67-70`
- Fix: Gate attach by published/assigned template, college scope.

## G2-4-017-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy REST response wrapper returns ProjectWorkspaceDTO after updates. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:120-152`)
- vNext now: New summary UI saves with fetch PATCH and refresh, no success toast. (`src/components/projects/college-project-summary-editor-full.tsx:40-63`)
- Fix: Align saved confirmation and visible refreshed section state.

## G2-14-028-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy end date must be on/after start, exact message. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:595-606`
- vNext now: vNext rejects end before start but says after start. `src/components/projects/college-project-summary-editor-full.tsx:40-43`, `src/modules/projects/college-project-summary-model.ts:23-26`
- Fix: Use consistent on-or-after wording.

## G2-14-028-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy mentor warning only when changing into Active without mentor. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:560-568`
- vNext now: vNext help text mentions mentor and backend rejects invalid transition. `src/components/projects/college-project-summary-editor-full.tsx:103-103`, `src/modules/projects/college-project-summary-service.ts:35-41`
- Fix: Show contextual warning on attempted activation.

## G2-14-028-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy template option fetch failure displays targeted message. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-172`
- vNext now: vNext class fetch shows retry message but template picker absent. `src/components/projects/college-project-summary-editor-full.tsx:31-39`
- Fix: Add template-specific errors and retry.

## G2-14-028-028  [P2] GAP  facet F08  effort M
- Legacy: Legacy save toast Workspace updated; reload keeps values. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:299-306`
- vNext now: vNext closes editor and router.refresh, no explicit success toast. `src/components/projects/college-project-summary-editor-full.tsx:59-63`
- Fix: Restore exact toast and retain editor values.
