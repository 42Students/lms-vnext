# Work packet: edit src/modules/projects/college-project-summary-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-4/project-workspace-model.md

## G2-14-028-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy status options ACTIVE, IN_PROGRESS, READY, BLOCKED, ARCHIVED read-only. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:63-80`
- vNext now: vNext PLANNED, ACTIVE, COMPLETED state machine and ARCHIVED gated separately. `src/modules/projects/college-project-summary-model.ts:4-8,27-35`
- Fix: Map legacy statuses and preserve historical values.

## G2-14-028-023  [P1] GAP  facet F06  effort M
- Legacy: Legacy patch sends only touched fields, including explicit 0 class detach. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:282-299`
- vNext now: vNext sends all fields, null sectionId to detach and expected tokens. `src/components/projects/college-project-summary-editor-full.tsx:46-57`, `src/modules/projects/college-project-summary-model.ts:4-23`
- Fix: Avoid overwriting untouched concurrent values.

## G2-14-028-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy can persist IN_PROGRESS/READY/BLOCKED, archived special workflow. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:63-80`
- vNext now: vNext only PLANNED→ACTIVE→COMPLETED, archived in archive control. `src/modules/projects/college-project-summary-model.ts:27-35`
- Fix: Model historical status migration.

## G2-14-028-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy workspace scalar project status/progress/classId plus detailsToken. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:230-249`
- vNext now: vNext projectInstances UUID/sectionId/status/progressPercent and expectedUpdatedAt. `src/modules/projects/college-project-summary-model.ts:4-23`, `src/modules/projects/college-project-summary-service.ts:53-59`
- Fix: Field-by-field migration; preserve null/date semantics.

## G2-4-017-033  [P2] GAP  facet F07  effort M
- Legacy: Legacy project status can be free-text; invalid transition logic resides service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:31-32`)
- vNext now: New Zod status enum and transition gate require mentor/approved submission. (`src/modules/projects/college-project-summary-model.ts:4-35`)
- Fix: Map old statuses then give precise field error on invalid transitions.

## G2-14-028-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy end date must be on/after start, exact message. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:595-606`
- vNext now: vNext rejects end before start but says after start. `src/components/projects/college-project-summary-editor-full.tsx:40-43`, `src/modules/projects/college-project-summary-model.ts:23-26`
- Fix: Use consistent on-or-after wording.
