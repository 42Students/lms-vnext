# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md

29 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md

## G2-7-010-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:21-29,112-118: `/college-admin/projects/workspaces/:slug/meetings` in AdminWorkspaceShell.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx:1-25: `/college/projects/:UUID/meetings` generic ProjectWorkspace.
- Fix: Support legacy slug/bookmarked route alias and preserve Meetings tab selection.

## G2-7-010-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:113-118: workspace title, subtitle and contextual Back in shell.
- vNext now: V/components/projects/project-workspace.tsx:1466-1475: section h2 Meetings and generic subtitle.
- Fix: Restore exact meeting header/subtitle in shared header.

## G2-7-010-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:119-137: error Alert then six-row Skeleton/meeting plan.
- vNext now: V/components/projects/admin-project-section-page.tsx:24-40: awaited full server view, no meeting-specific inline spinner/error.
- Fix: Add isolated section loading/retry and six-row skeleton.

## G2-7-010-007  [P2] MISSING  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:32-37,52-59: four visibly distinct metrics, no icon decoration.
- vNext now: V/components/projects/project-workspace.tsx:1466-1499: no meeting totals or color metrics.
- Fix: Add four legacy statistic tiles.

## G2-7-010-008  [P2] GAP  facet F03  effort M
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:75-80: primary filled `Save meeting plan` button and subdued calendar note.
- vNext now: V/components/projects/project-workspace.tsx:1476-1499: secondary Schedule action and transition buttons per meeting.
- Fix: Restore primary save button and exact supporting label.

## G2-7-010-009  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:32-37: Meetings=N, Upcoming/requested includes SCHEDULED/RESCHEDULED/REQUESTED, Completed only COMPLETED, Linked to work if linked keys.
- vNext now: V/components/projects/project-workspace.tsx:1500-1523: next upcoming and mentor historical snippets; admin has no equivalent four totals.
- Fix: Calculate four legacy metrics from all meeting rows, retaining requested in upcoming.

## G2-7-010-011  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:8-11: Date separate date picker, Start time/End time separate time pickers.
- vNext now: V/components/projects/project-meeting-controls.tsx:105-135: datetime-local Start/End in IST, no separate Date control.
- Fix: Restore split date + time controls where parity required.

## G2-7-010-015  [P2] GAP  facet F05  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:69-72: title fallback `Meeting N`, empty guidance and Add meeting.
- vNext now: V/components/projects/project-workspace.tsx:1529-1531: `No meetings yet.` + no project meetings recorded, Create control at top.
- Fix: Restore placeholder, add action and empty guidance.

## G2-7-010-025  [P2] GAP  facet F09  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:61-82: all rows edited inline in Card without schedule dialog.
- vNext now: V/components/projects/project-meeting-controls.tsx:6-8,139-224: modal dialog with cancel/discard guard.
- Fix: Restore inline editor and prevent unintended modal-only workflow.

## G2-7-010-027  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:29-35: GET admin workspace populates meetingsList and sprint/task context.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: reads normalized meetings via listProjectMeetings plus related services.
- Fix: Provide stable projection mapping old meeting fields/keys into editor.

## G2-7-010-031  [P2] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:39-41: admin may bulk correct meeting status/links, but sprints/tasks are read-only.
- vNext now: V/components/projects/project-workspace.tsx:1476-1499: mode ADMIN can schedule; student requests segregated.
- Fix: Verify admin status/links editing scope and prevent unrelated sprint/task mutations.

## G2-7-010-033  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:176-218: editable meetingDate + start/end and meeting status/meetingType.
- vNext now: V/db/schema/projects.ts:1104-1206: normalized start/end timestamptz, states and schedule constraints.
- Fix: Map date/time to IST and validate end strictly after start; supply legacy labels.

## G2-7-010-034  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:41-44: sprint/task links use real key-based options, fresh siblings on save.
- vNext now: V/components/projects/project-workspace.tsx:1483-1496: link choices only tasks with sprintId; legacy task select may include unassigned tasks.
- Fix: Include eligible standalone/unassigned tasks if legacy allowed them; keep project-scope FK checks.

## G2-7-010-035  [P2] GAP  facet F12  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:27-36: requested meetings included in Upcoming/requested metric.
- vNext now: V/components/projects/project-workspace.tsx:1500-1515: Next meeting only scheduled/rescheduled and future end; requested excluded.
- Fix: Match metric definition including REQUESTED.

## G2-7-010-037  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:71: empty `No meetings yet. Add one when the team needs a planned touchpoint.`
- vNext now: V/components/projects/project-workspace.tsx:1529-1531: `No meetings yet.`/`No project meetings have been recorded.`
- Fix: Restore empty guidance and Add meeting action.

## G2-7-010-041  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:39-82: four responsive metrics and two half-width form fields per row.
- vNext now: V/components/projects/project-meeting-controls.tsx:79-135: modal field grid 2 cols at sm, no metric grid.
- Fix: Restore four metrics with responsive 1/2/4 layout and inline half-fields.

## G2-7-010-042  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:112-139: AdminWorkspaceShell responsive tabs and full-width Card.
- vNext now: V/components/projects/project-workspace.tsx:1466-1648: generic stacked articles with dialog.
- Fix: Compare tab/header widths and inline card placement at 375/768/1280.

## G2-7-010-043  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:61-74: Form label Meetings, custom validator, per-row field labels, button submit.
- vNext now: V/components/projects/project-meeting-controls.tsx:79-135: labelled modal form controls, no row-level inline validation.
- Fix: Expose accessible repeat editor add/remove and form errors for each row.

## G2-7-010-044  [P2] GAP  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:39: unsaved changes guard before route navigation.
- vNext now: V/components/projects/project-meeting-controls.tsx:159-161: modal discard guard; active section links may bypass unsaved plan because no plan editor.
- Fix: Preserve focus-safe unsaved warning when editing multiple rows.

## G2-7-010-045  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:117: `Plan project touchpoints and connect conversations to the work they support.`
- vNext now: V/components/projects/project-workspace.tsx:1472-1474: `Requested, scheduled and completed Project conversations.`
- Fix: Restore exact page subtitle.

## G2-7-010-046  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:40-49: `Meeting plan`, `Team cadence`, `Keep project conversations attached to the work they move forward`, long helper.
- vNext now: V/components/projects/project-workspace.tsx:1466-1475: only `Meetings` section heading and generic description.
- Fix: Restore card intro/header exact wording.

## G2-7-010-048  [P2] GAP  facet F19  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:64-79: refresh siblings and batch materialize keys once per save.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: 8 concurrent service reads at section entry; per-row mutations refresh view.
- Fix: Lazy load unrelated sections; don't trigger 8 reads for meeting plan alone.

## G2-7-010-050  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:29-35,80-86: reset form and refill synchronously after save, clear touched state only then.
- vNext now: V/components/projects/project-meeting-controls.tsx:202-208: close modal and router.refresh.
- Fix: Restore stable bulk form state and touched-reset logic after successful reload.

## G2-7-010-051  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:64-78: same save includes stale meetingsToken from initial snapshot.
- vNext now: V/modules/projects/meeting-service.ts:185-624: per-row optimistic state guarded by status/updatedAt not matching bulk meetingsToken.
- Fix: Map stale-token errors to current per-row CAS semantics.

## G2-7-010-054  [P2] GAP  facet F22  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:176-218: field defaults/key generator and optional 12 fields.
- vNext now: V/components/projects/project-meeting-controls.tsx:53-135: form maxLength 200 title/4000 agenda, required datetime bounds IST.
- Fix: Keep compatible title/agenda/time validations, placeholders, linked options and original field lengths.

## G2-7-010-055  [P2] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectMeeting.java and legacy ProjectWorkspace DTO (meetingSnapshotMap): meetingStatus is authoritative per projectSectionFieldConfigs.js:168-175.
- vNext now: V/db/schema/projects.ts:1113-1115: `status` is authoritative stored column.
- Fix: Map meetingStatus (not legacy status alias) to DB enum and preserve read/write transitions.

## G2-7-010-056  [P2] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:41-44: Meetings section edits meetings only; sprints/tasks read-only linked context.
- vNext now: V/components/projects/project-workspace.tsx:1476-1499: schedule dialog selects linked tasks only with sprintId.
- Fix: Audit missing unassigned task options and prevent broken link identity on rename.

## G2-7-010-018  [P3] MISSING  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:50-57: untouched submit yields info toast `No changes to save`.
- vNext now: V/components/projects/project-meeting-controls.tsx:139-217: create modal, no untouched plan save and no matching toast.
- Fix: Add untouched-save guard and exact info feedback if bulk edit restored.

## G2-7-010-049  [P3] GAP  facet F19  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:52-60: counter calculations O(rows).
- vNext now: V/components/projects/project-workspace.tsx:1500-1515: mentor computes upcoming sorted every render, admin doesn't compute four metrics.
- Fix: Reuse normalized derived metrics for consistent performance.
