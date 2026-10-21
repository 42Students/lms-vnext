# Work packet: edit src/modules/projects/workspace-brief-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-18-028-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy workspace.overview goal/deliverables/definitionOfDone/personas plus arbitrary map facts; overview.js:41-66
- vNext now: New authoredBrief goal/description/deliverables/completionConditions/personas strict model; src/modules/projects/workspace-brief-model.ts:2-16
- Fix: Map definitionOfDone to completionConditions, inherited map keys and intentional empty values

## G2-18-028-019  [P1] GAP  facet F07  effort S
- Legacy: Old deliverables must contain nonblank line: Add at least one deliverable.; WorkspaceOverviewEditor.jsx:60-65
- vNext now: New Zod deliverables array permits empty; workspace-brief-model.ts:5
- Fix: Align required deliverables for published workspace, distinguish draft policy

## G2-18-028-030  [P1] GAP  facet F12  effort L
- Legacy: Old overviewFactsRef re-sends unedited opaque JSON keys; overview.js:41-56,80-97
- vNext now: New strict object and full authoredBrief replace; workspace-brief-model.ts:2-12;workspace-brief-service.ts:23-26
- Fix: Migrate or preserve opaque template fields, never erase silently

## G2-18-028-044  [P1] GAP  facet F22  effort L
- Legacy: Old flexible overview JSON and definitionOfDone key; overview.js:41-66
- vNext now: New projectInstances.authoredBrief strict typed model with completionConditions; workspace-brief-model.ts:2-16;workspace-brief-service.ts:23-26
- Fix: Specify one-to-one migration including opaque facts, defaults and clear values

## G2-7-011-029  [P1] GAP  facet F07  effort S
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:64-67: required deliverables error exactly `Add at least one deliverable.` field-level AntD.
- vNext now: V/components/projects/workspace-brief-editor.tsx:20-24 and workspace-brief-model.ts:5: zero accepted; Zod errors inline global role=alert.
- Fix: Restore required rule and field-level exact message, not generic Zod issue.
