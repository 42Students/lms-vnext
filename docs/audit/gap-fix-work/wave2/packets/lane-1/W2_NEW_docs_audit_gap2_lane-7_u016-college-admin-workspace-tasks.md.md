# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md

34 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md

## G2-7-016-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:25-50,112-118 Projects active, workspace Tasks route and contextual workspace title
- vNext now: V/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx:1-16 redirects to /college/projects/:id/tasks
- Fix: Preserve slug/bookmark and source query

## G2-7-016-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:114-118 subtitle Shape the work breakdown and review learner submission activity for this workspace.
- vNext now: V/components/projects/project-workspace.tsx:178-193 dynamic project summary subtitle
- Fix: Restore exact Tasks subtitle

## G2-7-016-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminWorkspaceShell.jsx:10-27 workspace breadcrumb and contextual Back
- vNext now: V/components/projects/project-workspace.tsx:320-335 breadcrumbs suppressed for section routes
- Fix: Render complete workspace breadcrumb

## G2-7-016-007  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:39-50 eyebrow Work breakdown and headline Turn sprint goals into clear, reviewable work
- vNext now: V/components/projects/project-workspace.tsx:804-811 heading Execution and release records
- Fix: Use exact intro text and instructions

## G2-7-016-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:29-35 metrics Tasks, In progress, Done, Submissions
- vNext now: V/components/projects/project-workspace.tsx:364-410 shows Tasks, Sprints, Releases, Final submission
- Fix: Show four Task plan counters in original order

## G2-7-016-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:88-107 Add task and Save task plan plus read-only workflow note
- vNext now: V/components/projects/mentor-task-create.tsx:76-88 Create task, Confirm new task
- Fix: Restore legacy action/footer copy

## G2-7-016-012  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:133-160 Task, Submission, Submitted by, Submitted at columns and em dash for missing member
- vNext now: V/components/projects/project-workspace.tsx:1010-1101 per-task facts, not 4-column summary table
- Fix: Rebuild columns with member/time projection

## G2-7-016-013  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:119-132 table paginates only if more than 10, pageSize 10, no size changer
- vNext now: V/components/projects/project-workspace.tsx:1010-1180 all tasks embedded under sprint cards
- Fix: Restore table default paging and count display

## G2-7-016-015  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:40-47 sprintSelectOptions from existing sprint keys
- vNext now: V/components/projects/mentor-task-create.tsx:85-93 UUID sprint choices filtered to uncompleted
- Fix: Map sprint keys and option labels; preserve backlog

## G2-7-016-016  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:90-98 Title required, example e.g. Draft submission checklist, Key optional
- vNext now: V/components/projects/mentor-task-create.tsx:94-99 Title maxLength200 without key input or example
- Fix: Restore title placeholder and stable-key semantics

## G2-7-016-019  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:109-115 estimates 1,2,3,5,8,13 pts
- vNext now: V/components/projects/mentor-task-create.tsx:125-132 unit-aware mentorEstimateOptions
- Fix: Reconcile Fibonacci options with estimation unit

## G2-7-016-022  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:57-60 untouched submit displays No changes to save without network
- vNext now: V/components/projects/mentor-task-create.tsx:55-75 create only, no plan untouched guard
- Fix: Add no-op bulk save guard and toast

## G2-7-016-030  [P2] GAP  facet F09  effort L
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:72-107 always-inline task plan
- vNext now: V/components/projects/mentor-task-create.tsx:76-176 Confirm new task Dialog
- Fix: Restore inline batch planning or approve modal-first UX

## G2-7-016-032  [P2] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 exact unsaved navigation confirmation
- vNext now: V/components/projects/mentor-task-create.tsx:171-176 modal discard dialog uses different wording
- Fix: Unify discard/route confirm semantics

## G2-7-016-033  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:33-40 GET admin workspace, tasks array and sprint context
- vNext now: V/modules/projects/workspace-view-service.ts:33-67 aggregates normalized tasks/sprints/submissions
- Fix: Project all legacy-visible task fields and statuses

## G2-7-016-037  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:28-30,94-110 requires College Admin and recovers missing college in shell
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42 requireProjectManageAccess before shell
- Fix: Restore missing-college UI while enforcing scope

## G2-7-016-041  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:90-140 ten task authoring fields and titles; status not editable
- vNext now: V/components/projects/mentor-task-create.tsx:27-54 adds status/assignee/dueDate/blocker restrictions
- Fix: Separate editing fields from state machine actions

## G2-7-016-043  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276 bulk cap 500
- vNext now: V/modules/projects/mentor-task-create-model.ts:6-25 per-task only, no 500 section cap
- Fix: Handle large workspaces and document limits

## G2-7-016-044  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:119-139 six-row Skeleton, retry, not found
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx:1-10 generic directory load state
- Fix: Use task-specific six-row skeleton/retry

## G2-7-016-045  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:67-79 No sprints are available yet and Sprints tab link
- vNext now: V/components/projects/project-workspace.tsx:816-826 generic No sprints yet
- Fix: Restore task drafting info with linked Sprints tab

## G2-7-016-046  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:91-95 No tasks yet. Add the first task when the work breakdown is ready.
- vNext now: V/components/projects/project-workspace.tsx:1005-1010 mentor-specific sprint empty notice
- Fix: Restore exact Task plan empty copy

## G2-7-016-047  [P2] MISSING  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:113-117 No tasks have a submission link yet.
- vNext now: V/components/projects/project-workspace.tsx:1010-1101 no submissions table
- Fix: Add empty submission table state

## G2-7-016-052  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:38-165 Card editor then horizontally scrollable Table on small screens
- vNext now: V/components/projects/project-workspace.tsx:802-1180 nested responsive cards not table
- Fix: Restore separate table with horizontal scroll at 375px

## G2-7-016-053  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:157-169 xs24/md12 half-width form cells
- vNext now: V/components/projects/mentor-task-create.tsx:76-176 single-column dialog controls
- Fix: Restore desktop two-column inline form

## G2-7-016-054  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:119-132 accessible table headers and row selection context
- vNext now: V/components/projects/project-workspace.tsx:1010-1180 task articles, no submission table
- Fix: Add semantic table and keyboard-safe links

## G2-7-016-055  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:115-138 aria-expanded, named move/remove row actions
- vNext now: V/components/projects/mentor-task-create.tsx:76-176 dialog has labelled inputs but no reordering
- Fix: Provide keyboard ordering and aria associations

## G2-7-016-057  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:117 exact Shape the work breakdown and review learner submission activity for this workspace.
- vNext now: V/components/projects/project-workspace.tsx:178-193 generic subtitle
- Fix: Restore exact subtitle

## G2-7-016-058  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:39-50 Task plan Work breakdown and exact headline
- vNext now: V/components/projects/project-workspace.tsx:804-811 Execution
- Fix: Copy Task plan heading/intro

## G2-7-016-059  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:91-107 Add task Save task plan and Assignee, status and submission state are not changed here.
- vNext now: V/components/projects/mentor-task-create.tsx:76-88 Create task/Confirm new task
- Fix: Restore action/footer wording

## G2-7-016-060  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:108-165 Task submissions, Open submission, Submitted by and Submitted at
- vNext now: V/components/projects/project-workspace.tsx:1060-1101 submission detail per card
- Fix: Restore dedicated heading/columns

## G2-7-016-061  [P2] GAP  facet F19  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:124-132 page 10 table rows over 10 submissions
- vNext now: V/components/projects/project-workspace.tsx:1010-1180 no submission-only paging
- Fix: Add server-safe paging with legacy default

## G2-7-016-062  [P2] GAP  facet F19  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:98-103 search only when more than 12 rows, MAX500
- vNext now: V/components/projects/project-workspace.tsx:1010-1180 no task-specific list search
- Fix: Restore large-list filter/expand behavior

## G2-7-016-063  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:33-39 resetFields then refill on reload
- vNext now: V/components/projects/mentor-task-create.tsx:27-49 modal state and discard, not bulk form
- Fix: Restore safe post-save rehydration

## G2-7-016-065  [P2] GAP  facet F20  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:138-146 unsafe submission URL => Unavailable link
- vNext now: V/components/projects/project-workspace.tsx:1095-1101 link suppressed when unsafe
- Fix: Show disabled link reason explicitly
