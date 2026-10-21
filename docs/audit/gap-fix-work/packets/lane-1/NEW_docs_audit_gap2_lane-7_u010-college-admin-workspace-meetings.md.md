# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md

17 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md

## G2-7-010-003  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:39: useUnsavedFormGuard prevents navigation away with unsaved meeting changes.
- vNext now: V/components/projects/project-meeting-controls.tsx:7-8,139-161: modal-specific discard guard; no persistent in-page bulk plan edits.
- Fix: Ensure equivalent unsaved-changes guard for plan editor or explicitly replace workflow.

## G2-7-010-004  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:39-60: Meeting plan Card, Team cadence eyebrow/headline, help paragraph, four metrics.
- vNext now: V/components/projects/project-workspace.tsx:1466-1499: header with schedule action then stacked meetings, no Meeting plan Card/metrics.
- Fix: Recreate Card, intro and four metric cells before editor.

## G2-7-010-005  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:61-82: inline RepeatingItemEditor plus Save meeting plan footer.
- vNext now: V/components/projects/project-workspace.tsx:1476-1499,1532-1648: ScheduleProjectMeetingControl opens dialog, records shown as articles.
- Fix: Restore inline bulk editor and single Save action (or equivalent multi-edit workflow).

## G2-7-010-010  [P1] GAP  facet F04  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:176-218: twelve field attributes incl Key, Status, Title, Ceremony, Date, Start/end, URL, Linked sprint/task, Agenda, Notes.
- vNext now: V/components/projects/project-meeting-controls.tsx:53-135: dialog fields title/agenda/start/end with IST; other controls manage type/link when scheduling, no direct notes editable on college plan.
- Fix: Expose all 12 legacy editable fields with same validation/placeholder semantics.

## G2-7-010-014  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:67-73: repeating-item rows can be added/removed/reordered and edited before one save.
- vNext now: V/components/projects/project-workspace.tsx:1532-1648: existing meetings rendered as timeline articles, per-item actions.
- Fix: Implement equivalent add/remove/reorder bulk editing or confirm deliberate workflow reduction.

## G2-7-010-016  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:210-215: meeting editable notes and linked sprint/task keys.
- vNext now: V/components/projects/project-workspace.tsx:1557-1604: outcome, facilitation and link IDs displayed; editing notes mentor-only.
- Fix: Enable admin authorized meeting notes/link editing to legacy scope, respecting role rules.

## G2-7-010-019  [P1] GAP  facet F06  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:64-80: submit only `meetingsList` and `meetingsToken` with fresh sibling data.
- vNext now: V/modules/projects/meeting-service.ts:185-300: separate create/schedule endpoints per meeting, no bulk meeting token.
- Fix: Implement comparable optimistic concurrency/version protection on multi-edit workflow.

## G2-7-010-026  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:39: unsaved-form navigation guard for dirty plan.
- vNext now: V/components/projects/project-meeting-controls.tsx:159-161: modal guard only.
- Fix: Apply dirty-form guard to in-page plan if restored.

## G2-7-010-028  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:75-79: POST updateProject `/api/v1/admin/projects/:slug` with meetingsList and meetingsToken.
- vNext now: V/modules/projects/meeting-service.ts:185-300,432-624: separate meeting request/schedule/transition APIs with per-row payload.
- Fix: Implement equivalent bulk admin correction endpoint or map UI to safe sequential mutations with failure reconciliation.

## G2-7-010-032  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:50-79: untouched-save and optimistic meetingsToken prevent overwriting third-party changes.
- vNext now: V/modules/projects/meeting-service.ts:185-624: normalized mutations use row scope and optimistic checks, no bulk token.
- Fix: Preserve no-op safety, explicit stale-conflict message and per-row version comparison.

## G2-7-010-038  [P1] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:119-135: failed load alert with Retry, no stale edit form.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: aggregate fetch failure may prevent all section rendering.
- Fix: Isolate meeting failure from unrelated workspace services, with retriable error.

## G2-7-010-053  [P1] GAP  facet F22  effort L
- Legacy: LBE/dto/projects/ProjectWorkspaceUpdateDTO.java:meeting fields; LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:75-79 submits meetingsList + meetingsToken.
- vNext now: V/db/schema/projects.ts:1104-1206: project_meetings normalized id UUID, status enum, date times, link FK, outcome/facilitation.
- Fix: Map legacy JSON meeting keys/date/status/notes to relational rows, including edit/import path.

## G2-7-010-020  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:119-135: `Workspace could not be loaded`, API description, Retry; clean 404 `Workspace not found`.
- vNext now: V/components/projects/admin-project-section-page.tsx:24-40: Promise of whole view not wrapped with section error state.
- Fix: Add scoped section error/Retry and distinct 404.

## G2-7-010-021  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:87-90: showProjectError fallback `Failed to update meetings` on invalid save.
- vNext now: V/components/projects/project-meeting-controls.tsx:210-214: local error message `Could not request the meeting.` for request, schedule uses own errors.
- Fix: Map validation/concurrency errors to equivalent meeting-plan-specific messages.

## G2-7-010-022  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:94-110: missing college warning in workspace shell.
- vNext now: V/components/projects/admin-project-section-page.tsx:24-32: throws access denial without explicit warning.
- Fix: Restore no-college warning and tabs.

## G2-7-010-023  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:55-57,80: `No changes to save` info and `Meetings updated` success toast.
- vNext now: V/components/projects/project-meeting-controls.tsx:203-207: `Meeting request sent to your mentor.` success toast; per action differs.
- Fix: Restore exact admin plan save messages.

## G2-7-010-024  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:87-89: error opens showProjectError project-specific dialog.
- vNext now: V/components/projects/project-meeting-controls.tsx:210-214: inline modal error string.
- Fix: Honor legacy error modal for bulk update failures where appropriate.
