# Work packet: edit src/modules/projects/college-project-summary-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md

## G2-4-017-029  [P1] GAP  facet F06  effort L
- Legacy: Legacy resources/sprints/tasks/meetings arrays have distinct concurrency tokens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:26-36`)
- vNext now: New summary editor uses single updatedAt token plus field baselines, other tables have separate commands. (`src/modules/projects/college-project-summary-service.ts:27-34`; `src/components/projects/college-project-summary-editor-full.tsx:46-57`)
- Fix: Verify all section mutations use independent optimistic tokens/append semantics.

## G2-4-017-031  [P1] GAP  facet F07  effort M
- Legacy: Legacy stale section token returns 409 rather than overwrite newer child rows. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:26-36`)
- vNext now: New summary service raises PROJECT_SUBMISSION_CONFLICT on baseline mismatch. (`src/modules/projects/college-project-summary-service.ts:27-34`)
- Fix: Map exact 409 user copy and guard child collections individually.

## G2-4-017-065  [P1] GAP  facet F20  effort M
- Legacy: Legacy JPA @Version Long null for new entities prevents merge/persist confusion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:119-125`)
- vNext now: New project uses updatedAt optimistic baseline with row locks, no integer version column. (`src/modules/projects/college-project-summary-service.ts:17-34`)
- Fix: Prove optimistic tokens survive timestamp precision and prevent lost writes.

## G2-14-028-034  [P1] GAP  facet F10  effort M
- Legacy: Legacy updateProject PATCH with detailsToken, touched scalar fields. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:267-312`
- vNext now: vNext PATCH full project summary in transaction with optimistic state tokens. `src/modules/projects/college-project-summary-service.ts:13-61`
- Fix: Document API adapter and partial patch semantics.

## G2-14-028-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy workspace scalar project status/progress/classId plus detailsToken. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:230-249`
- vNext now: vNext projectInstances UUID/sectionId/status/progressPercent and expectedUpdatedAt. `src/modules/projects/college-project-summary-model.ts:4-23`, `src/modules/projects/college-project-summary-service.ts:53-59`
- Fix: Field-by-field migration; preserve null/date semantics.

## G2-14-028-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy mentor warning only when changing into Active without mentor. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:560-568`
- vNext now: vNext help text mentions mentor and backend rejects invalid transition. `src/components/projects/college-project-summary-editor-full.tsx:103-103`, `src/modules/projects/college-project-summary-service.ts:35-41`
- Fix: Show contextual warning on attempted activation.

## G2-14-028-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy update 409 detailsToken mismatch shows Project error modal. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:298-308`
- vNext now: vNext expectedUpdatedAt/title/summary/status mismatch error code. `src/modules/projects/college-project-summary-service.ts:27-35`
- Fix: Map conflict to field-preserving error with Refresh.
