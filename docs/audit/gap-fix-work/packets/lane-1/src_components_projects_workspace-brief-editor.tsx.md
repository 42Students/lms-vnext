# Work packet: edit src/components/projects/workspace-brief-editor.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-18-028-023  [P1] MISSING  facet F08  effort M
- Legacy: Old unsaved changes leave confirm: You have unsaved changes. Leave without saving them?; useUnsavedFormGuard.js:21-54
- vNext now: New inline Close/Cancel without dirty confirmation; workspace-brief-editor.tsx:36-58
- Fix: Use project-editor-discard-guard on Cancel/Close/nav/unload

## G2-18-028-026  [P1] GAP  facet F10  effort L
- Legacy: Legacy PUT /api/v1/admin/projects/{id}?collegeId sends detailsToken and merged overview including unknown facts; overview.js:78-97;AdminService.js:361-362
- vNext now: New PATCH /api/projects/{id}/brief sends strict brief plus expectedUpdatedAt; workspace-brief-editor.tsx:20-30;src/app/api/projects/[projectId]/brief/route.ts:7-13
- Fix: Guard unknown-key preservation and template inheritance across update

## G2-18-028-037  [P1] MISSING  facet F17  effort M
- Legacy: Old dirty editor warns browser unload and client link navigation; useUnsavedFormGuard.js:17-56
- vNext now: New editor lacks discard guard; workspace-brief-editor.tsx:36-58
- Fix: Focus-managed confirmation on tab/sidebar/back/Cancel/keyboard close

## G2-18-028-042  [P1] GAP  facet F20  effort M
- Legacy: Old resetFields on load/refresh and dirty route guard; overview.js:46-67;useUnsavedFormGuard.js:17-56
- vNext now: New useState initial props, no dirty leave guard; workspace-brief-editor.tsx:13-19,31-38
- Fix: Reset form on new workspace and block stale/unsaved navigation

## G2-7-011-004  [P1] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:15-26: full `Project brief` Card, `Learner & mentor view` eyebrow, headline and descriptive paragraph above fields.
- vNext now: V/components/projects/project-workspace.tsx:460-473; workspace-brief-editor.tsx:36-39: border-bottom section and `Edit project brief` collapsed button.
- Fix: Render legacy Card and intro in edit page without extra opening click.

## G2-7-011-012  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:60-81: goal is from `workspace.overview.goal`, empty string fallback.
- vNext now: V/components/projects/project-workspace.tsx:242-248; workspace-brief-editor.tsx:15: goal from project.authoredBrief JSON, template fallback only in read display.
- Fix: Define migration/read-through mapping of legacy overview.goal into authoredBrief.goal including clearing semantics.

## G2-18-028-020  [P2] GAP  facet F07  effort M
- Legacy: Old showProjectError fallback Failed to update overview; overview.js:100-102
- vNext now: New inline error Unable to save workspace brief; workspace-brief-editor.tsx:24,31-33,59
- Fix: Provide field-specific messages and consistent error wording

## G2-18-028-021  [P2] MISSING  facet F07  effort S
- Legacy: Old no dirty fields toast No changes to save; overview.js:69-75
- vNext now: New POST saves unchanged values; workspace-brief-editor.tsx:20-34
- Fix: Track dirty values, suppress redundant writes/toasts

## G2-18-028-022  [P2] MISSING  facet F08  effort S
- Legacy: Old Overview updated success message and reload; overview.js:97-100
- vNext now: New closes editor and refreshes without success message; workspace-brief-editor.tsx:27-33
- Fix: Add success toast or live status with exact words
