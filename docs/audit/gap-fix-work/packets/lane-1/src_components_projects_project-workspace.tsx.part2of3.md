# Work packet: edit src/components/projects/project-workspace.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md, docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md, docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md, docs/audit/gap2/lane-7/u027-mentor-project-detail.md, docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md, docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md

## G2-7-012-008  [P1] MISSING  facet F03  effort S
- Legacy: WorkspaceReadinessOverview.jsx:50-56 Submission readiness eyebrow headline and Ready/Not ready tag
- vNext now: project-workspace.tsx:364-416 lacks verdict headline/tag
- Fix: Restore heading and status tag

## G2-7-012-013  [P1] MISSING  facet F04  effort M
- Legacy: readiness.js:30-38 Proof coverage completed tasks with submissionUrl over completed tasks
- vNext now: workspace-view-service.ts:55-58 exposes submissions; project-workspace.tsx:364-416 omits metric
- Fix: Compute DONE task evidence coverage and zero case

## G2-7-012-022  [P1] GAP  facet F07  effort M
- Legacy: WorkspaceReadinessOverview.jsx:16-25 warning Readiness snapshot is unavailable with detailed explanation
- vNext now: project-workspace.tsx:241,364-416 dereferences readiness without fallback
- Fix: Handle missing snapshot and Retry

## G2-7-012-032  [P1] GAP  facet F10  effort S
- Legacy: readiness.js:78-82 navigate to college override manager
- vNext now: project-workspace.tsx:341-347 wrong admin namespace
- Fix: Fix destination and enforce scoped role

## G2-7-012-036  [P1] GAP  facet F12  effort M
- Legacy: WorkspaceReadinessOverview.jsx:28,52-55 uses server readyForSubmission boolean
- vNext now: project-workspace.tsx:364-416 has no effective ready status
- Fix: Expose effective readiness including override

## G2-7-012-040  [P1] GAP  facet F13  effort S
- Legacy: WorkspaceReadinessOverview.jsx:16-25 unavailable-snapshot warning
- vNext now: project-workspace.tsx:241,367-408 assumes readiness
- Fix: Guard and render warning instead of runtime error

## G2-7-012-064  [P1] GAP  facet F23  effort L
- Legacy: WorkspaceReadinessOverview.jsx:45-105 hero and override facts visible
- vNext now: project-workspace.tsx:341-416 dropped, standalone project-workspace-readiness.tsx:59-89 differs
- Fix: Unify canonical renderer and restore missing facts

## G2-7-014-019  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:62-95: add/remove/Undo/move unsaved rows
- vNext now: V/components/projects/mentor-sprint-write.tsx:41-130 POST add; project-workspace.tsx:945-997 per-sprint delete/transition
- Fix: Restore multirow save/undo/reorder or document deliberate reduction

## G2-7-015-084  [P1] GAP  facet F23  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:474-537 Change template, Archive, Delete and preview summary cards
- vNext now: V/components/projects/project-archive-control.tsx:81-134 Archive/Restore and project-workspace.tsx:362-416 metrics
- Fix: Bring back missing template/delete operations, document Restore as new control

## G2-7-027-017  [P1] GAP  facet F03  effort L
- Legacy: PDC:7113-7124 Project team and member count plus Add member action
- vNext now: project-workspace.tsx:396-470 Project people, admin-only member actions
- Fix: Record removed mentor action and restore count/heading; resolve intentional permission decision

## G2-7-027-057  [P1] GAP  facet F12  effort M
- Legacy: PDC:858-860 editable when mentor and not archived
- vNext now: project-workspace.tsx:260-261 also locks COMPLETED
- Fix: Test legacy completed-state edit rule and specify intentional lock

## G2-12-028-008  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:168-175 info banner with 'Check roster' action
- vNext now: src/components/projects/project-workspace.tsx:725-730 read-only class-team paragraph, no repair action
- Fix: Surface guarded reconciliation action for group team divergence

## G2-12-028-010  [P1] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:104-131 task assigned, done/review/progress and latest task update per user
- vNext now: src/components/projects/project-workspace.tsx:757-799 displays member role only
- Fix: Join per-member task metrics and timestamp as dedicated columns

## G2-12-028-012  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:50-59,85-103 20-row page, substring name+ID search, ALL/LEARNER/FACULTY filter
- vNext now: src/components/projects/project-workspace.tsx:732-799 unpaginated grid, no roster search or role filter
- Fix: Provide 20-row roster pagination, name/ID search and role select with reset-to-page-1 semantics

## G2-12-028-013  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:105-131 columns Member, Role, Tasks assigned, Done · In review · In progress, Last task update
- vNext now: src/components/projects/project-workspace.tsx:757-799 cards only with name, role and member actions
- Fix: Use DataTable with five exact column labels, badges, last-update format and horizontal scroll

## G2-12-028-047  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:50,85-86 page size20 local filter and paginate
- vNext now: src/components/projects/project-workspace.tsx:757-799 renders all members at once
- Fix: Paginate or virtualize roster for 500-learner workspace load

## G2-15-028-020  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:49-56 — Could not load project releases. shown in release Alert.
- vNext now: src/components/projects/project-workspace.tsx:835-885 — no separate releases-load retry within section.
- Fix: Distinguish workspace read from release request error.

## G2-15-028-024  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:54-79 — Loading releases…, failed releases retry, no releases warning.
- vNext now: src/components/projects/project-workspace.tsx:884-890 — create button hidden for SHIPPED but no no-releases warning.
- Fix: Render three source release conditions.

## G2-13-028-026  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:51-53 'No changes to save' info toast
- vNext now: src/components/projects/project-workspace.tsx:802-811 no ADMIN save action
- Fix: Add untouched-save guard and identical toast.

## G2-13-028-030  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:51-53 untouched save message
- vNext now: src/components/projects/project-workspace.tsx:802-811 no bulk save
- Fix: Show unchanged-save feedback rather than POST.
