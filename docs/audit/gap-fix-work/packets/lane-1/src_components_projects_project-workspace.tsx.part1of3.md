# Work packet: edit src/components/projects/project-workspace.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md, docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md

## G2-15-028-006  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:81-103 — Sprints editor and Save sprint plan button.
- vNext now: src/components/projects/project-workspace.tsx:884-969 — per-release Add/Edit action buttons, no full-plan Save.
- Fix: Offer Super Admin bulk editor for all sprints.

## G2-15-028-012  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:87-94 — swap row positions Up/Down across full sprint plan.
- vNext now: src/components/projects/project-workspace.tsx:905-966 — grouped release/order fixed, no reorder control.
- Fix: Implement persisted sprint sequence reorder under admin scope.

## G2-13-028-012  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-140 Task fields key,priority,title,sprint,estimate,type,dueLabel,description,doneWhen,approach
- vNext now: src/components/projects/project-workspace.tsx:1027-1097 view has title,description,assignee,dueDate,estimate,taskType,blocker
- Fix: Map all ten plan fields to edit/display schema; keep distinct dueLabel vs dueDate and acceptance criteria.

## G2-13-028-015  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:58-63 tasksToken loaded from original workspace snapshot
- vNext now: src/components/projects/project-workspace.tsx:1027-1035 read view no tasksToken visible
- Fix: Support section-level optimistic token with admin plan save.

## G2-13-028-023  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:99-103 Sprint picker with empty backlog default
- vNext now: src/components/projects/project-workspace.tsx:971-983 Mentor task create restricted to active sprints
- Fix: Enable admin plan sprint linking including unassigned backlog tasks.

## G2-13-028-036  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:57-60 refreshWorkspaceForSave merges fresh sibling sections
- vNext now: src/components/projects/project-workspace.tsx:214-260 workspace view built server-side
- Fix: Avoid overwriting sprints/resources/meetings when submitting only tasks.

## G2-3-029-031  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-140`
- vNext now: `src/components/projects/project-workspace.tsx:1212-1429`
- Fix: Legacy delivery view read-only; vNext ADMIN adds review/evaluation/reopen controls on this page. Owner to decide if intentionally functional expansion, ensure no accidental write paths in clone view.

## G2-4-029-066  [P1] GAP  facet F23  effort S
- Legacy: Dedicated resource audit table (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85`)
- vNext now: Generic Activity feed replaces resource-only history (`src/components/projects/project-workspace.tsx:1658-1674`)
- Fix: Reinstate dedicated Resource activity view on Audit tab.

## G2-14-028-005  [P1] GAP  facet F02  effort M
- Legacy: Legacy Workspace health card contains status/template/phase, summary, overall progress and four facts. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:73-112`
- vNext now: vNext Tasks/Sprints/Releases/Final submission metrics with no same health card. `src/components/projects/project-workspace.tsx:364-412`
- Fix: Restore workspace health layout and quick facts.

## G2-14-028-007  [P1] MISSING  facet F03  effort M
- Legacy: Legacy Change template, Archive and Delete icon buttons in header. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:419-447`
- vNext now: vNext header only Archive/Restore control and status badge. `src/components/projects/project-workspace.tsx:193-207`
- Fix: Add Change template and soft Delete actions in summary header.

## G2-14-028-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy quick facts Team member count, task done, sprint done, target date. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:66-70`
- vNext now: vNext task/sprint/release/final submission counts; Team and Target omitted from tiles. `src/components/projects/project-workspace.tsx:364-412`
- Fix: Restore Team and Target facts.

## G2-14-028-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy Overall progress bar computed or hand-set when empty. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:94-99`
- vNext now: vNext Progress % editable numeric and separate readiness metric tiles. `src/components/projects/college-project-summary-editor-full.tsx:78-79`, `src/components/projects/project-workspace.tsx:364-412`
- Fix: Show derived progress and disable hand setting when task data available.

## G2-14-028-016  [P1] MISSING  facet F05  effort M
- Legacy: Legacy template dropdown remote-search, preserve selected option during search. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-201`
- vNext now: vNext has no equivalent in summary editor. `src/components/projects/project-workspace.tsx:193-207`, `src/components/projects/college-project-summary-editor-full.tsx:67-70`
- Fix: Restore server-filtered template picker and request-sequence guard.

## G2-14-028-035  [P1] MISSING  facet F10  effort M
- Legacy: Legacy attachProjectTemplate replaces plan and optionally blank defaults. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:314-330`
- vNext now: vNext no template replacement mutation on mapped summary. `src/components/projects/project-workspace.tsx:193-207`
- Fix: Build safe attach/new-plan replacement with audit and confirmation.

## G2-14-028-055  [P1] MISSING  facet F18  effort M
- Legacy: Legacy Change template… and warning about replacing tasks/sprints/resources. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:419-420,451-467`
- vNext now: vNext header no Change template. `src/components/projects/project-workspace.tsx:193-207`
- Fix: Restore exact action text and destructive warning.

## G2-14-028-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy overall progress derived from resolvedTasks/resolvedSprints, fallback manual. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:48-70`
- vNext now: vNext readiness from execution records, plus editable progressPercent. `src/components/projects/project-workspace.tsx:364-412`
- Fix: Align numerator/denominator and fallback when no tasks.

## G2-7-010-017  [P1] GAP  facet F06  effort L
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:61-81: explicit Form validation+submit, Save plan once, disabled while saving.
- vNext now: V/components/projects/project-meeting-controls.tsx:169-217 and project-workspace.tsx:1476-1648: modal create/schedule/transition actions; no batch form.
- Fix: Offer bulk editing Save plan with pending/disabled state.

## G2-7-012-003  [P1] GAP  facet F01  effort S
- Legacy: readiness.js:78-82 Manage override links college-admin/projects/readiness?projectId
- vNext now: project-workspace.tsx:341-347 links /admin/projects/readiness?projectId
- Fix: Use /college/projects/readiness and keep projectId

## G2-7-012-005  [P1] GAP  facet F02  effort M
- Legacy: WorkspaceReadinessOverview.jsx:45-74 hero Card then progress then four metrics
- vNext now: project-workspace.tsx:364-416 only four border-top metrics
- Fix: Restore full hero and order

## G2-7-012-006  [P1] MISSING  facet F02  effort M
- Legacy: WorkspaceReadinessOverview.jsx:76-105 override alert or no-override card below hero
- vNext now: project-workspace.tsx:341-416 override summary absent
- Fix: Render override detail card or empty state
