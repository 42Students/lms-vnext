# Learner / Projects (legacy: /learn/projects and /learn/projects/[projectId], vNext: /learn/projects and /learn/projects/[projectId])
Audited: 2026-10-16 by audit agent (Sonnet 5.5)   Reviewed: not yet (Round R pending)

Sources. Legacy FE `lms-dev-2026` (worktree `42lms\lms-dev-2026-frontend`): `src/pages/learn/projects/index.js`, `[projectId].js`, `src/components/Projects/ProjectsContent.jsx` (449 lines), `ProjectsShell.jsx`, `ProjectDetailContent.jsx` (10,850 lines, one component), `modals/TaskDetailsModal.jsx` (646), `src/data/projectsData.js` (tabs). Legacy BE `service/impl/ProjectWorkspaceServiceImpl.java` (11,048 lines) and `controller/ProjectWorkspaceController.java`. vNext: `src/app/(authenticated)/learn/projects/**`, `src/components/projects/*`, `src/modules/projects/*`, `src/app/api/projects/**`. Line numbers for the legacy detail file are for the learner paths only; the file carries a large mentor surface that is out of scope here (see `docs/audit/pages/mentor/` if that account is audited). Recent merged work (Final Delivery link on Overview, project Resources uploads) was read in the current code and is not re-reported.

## 1. Projects list (/learn/projects)

### 1. Legacy behaviour
- Entry: sidebar "Projects" (hidden when the projects module is off); page title "Projects", subtitle "Choose a project to open its workspace." (`ProjectsContent.jsx:240`), no tabs on the list (`showTabs={false}`).
- API `GET /api/v1/projects/me/page` (`getProjectsPage`: page, size, search, status, attention).
- Filters (URL state `search`, `status`, `attention`, `page`; search debounced 350 ms): search "Search project title, course or slug" (264); status select "All statuses" with Current only, Active, In progress, Ready, Blocked, Archived (273-285); attention select "All attention states" with "Needs my action" (learner) or "Needs my review" (mentor) and "Blocked" (293-297); "Clear filters" appears when any filter is set.
- Sorting: archived last, then "Team N" numeric ordering, otherwise server recency (`sortedProjects`, `compareNumberedTeamProjects`).
- Card: status tag (Archived / Blocked when `blocker` / status text), learner tags "Changes requested" (review status changes requested), "Draft submission"; title; "{course} • {mentor}"; phase and due text ("No due date", "Overdue · {label}", "Due soon · {label}", "Due {label}", line 331); task completion bar "Task completion {done}/{total} tasks" or "Admin-reported progress / Manual estimate" fallback (384); action line: "Update your submission / Open submission" (changes requested), "Finish your draft submission / Open submission" (draft), the blocker text with "Open blocked work", the manual `nextAction` with "Open workspace", else "Open workspace". Deep link adds `?tab=delivery` (changes requested or draft) or `?tab=board&lane=Blocked`.
- Pagination: page sizes 10/25/50 (default 25), "{a}–{b} of {n} projects" (432).
- States: skeleton cards, "Refreshing projects…", error "Projects could not be loaded / Check your connection, then try again. Your project data has not been changed." with Retry, warning "Couldn't refresh projects / Showing the last projects loaded for this view.", empty "No projects assigned yet." or "No projects match these filters." (313).

### 2. vNext behaviour
- `learn/projects/page.tsx:57-183`: redirects non-learners to /dashboard; query (search max 100, status CURRENT/PLANNED/ACTIVE/COMPLETED/ARCHIVED, attention LEARNER_ACTION, work BLOCKED/NO_TASKS, sort RECENT/TITLE/PROGRESS, pageSize 25/50/100); header "Projects" with "Choose a project to open its workspace."; desktop controls `ProjectParticipantListControls` (search placeholder "Search project title, course or slug", "All statuses", options "Current only / Planned / Active / Completed / Archived", attention "Needs my action", work filter "Has blocked tasks"/"No tracked tasks yet", sort "Recently updated / Title A-Z / Least progress first", page size) and mobile filters; cards via `ProjectList` (participation label, title, status badge, read-only badge, attention badges "Changes requested"/"Draft submission", summary, Mentor / Members / Progress grid, "Updated {date}", arrow). Deep link `?tab=delivery` when attention.
- Search also matches the mentor name (`learnerProjectMatchesSearch`).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-01 | Card does not show the course ("{course} • {mentor}"), phase, or due state (Overdue/Due soon/Due date/No due date). Learners cannot see what is overdue from the list. | MISSING-FIELD | S2 | ProjectsContent.jsx:331-336,364-372 | `project-list.tsx:75-150` (summary, mentor, members, progress, updated only) |
| LEARNER-projects-02 | Card action line missing: "Update your submission", "Finish your draft submission", blocker text with "Open blocked work", next action text; vNext shows only a generic arrow and the attention badges. | MISSING-FIELD | S3 | ProjectsContent.jsx:405-422 | `project-list.tsx:141-155` |
| LEARNER-projects-03 | Blocked state: legacy tags a project "Blocked" from the project's blocker text and sends the learner to the blocked lane (`?tab=board&lane=Blocked`); vNext only filters by "Has blocked tasks" and does not tag or deep-link. | MISSING-FIELD | S3 | ProjectsContent.jsx:325-330,347-353 | `page.tsx:105-108` (filter), `project-list.tsx:98-106` (attention badges only) |
| LEARNER-projects-04 | Status filter options differ: legacy Current only / Active / In progress / Ready / Blocked / Archived; vNext Current only / Planned / Active / Completed / Archived (different status model). Attention filter lacks "Blocked". | COPY | S3 | ProjectsContent.jsx:273-297 | `project-participant-list-controls.tsx:26-32,108-110` |
| LEARNER-projects-05 | Page sizes 10/25/50 vs 25/50/100; "{a}-{b} of {n} projects" total text. | COPY | S4 | ProjectsContent.jsx:429-433 | `page.tsx:34-39`, `project-participant-list-controls.tsx` pagination |
| LEARNER-projects-06 | Empty and error copy differs ("No projects assigned yet.", "No projects match these filters.", "Projects could not be loaded", "Couldn't refresh projects", "Refreshing projects…"). vNext uses `learnerProjectListEmptyState` text and route error boundary. | COPY | S3 | ProjectsContent.jsx:290-313,431 | `page.tsx:129-132` (UNCONFIRMED exact strings: open `learner-project-list-empty-state-model`) |
| LEARNER-projects-07 | List ordering rule "Team N" numeric ordering (Team 2 before Team 10) not applied; recent/title/progress sorts only. | STATE | S4 | ProjectsContent.jsx:112-125; `compareNumberedTeamProjects` | `learner-project-sort-model` (UNCONFIRMED; confirm by listing projects named Team 1, 2, 10) |
| LEARNER-projects-08 | Card shows "Task completion x/y tasks" and falls back to "Admin-reported progress / Manual estimate"; vNext shows "n of m tasks done" and "Not tracked". | COPY | S4 | ProjectsContent.jsx:384-398 | `page.tsx:99-103`, `project-list.tsx:129-139` |

## 2. Project detail shell and tabs (/learn/projects/[projectId])

### 1. Legacy behaviour
- Page `[projectId].js` re-keys on project id and account scope; `ProjectDetailContent` reads `?tab=`.
- Tabs for a learner (`projectTabs`, projectsData.js:1-15 with the performance tab hidden for learners via `hiddenTabKeys`, ProjectDetailContent.jsx:9410,9452): Overview, People & Meetings (key team), Releases and Sprints (key sprints), Board, Resources, Activity. Aliases: `tasks` redirects to Board (833-837), `meetings` maps to team (823), `performance` maps to board for learners (824), `delivery` maps to Overview and opens the Final submission modal once (839-868).
- Archived workspace: read-only for members; message "This workspace is archived, so it is read-only." (857); the server rejects every change ("This project is archived and read-only", `ProjectWorkspaceServiceImpl.requireProjectNotArchived`).
- Membership gating: `requireProjectMemberAccess` denies inactive members ("Your membership on this project is currently inactive", impl ~5451).
- Learner capabilities (BE `requireTaskMutationAccess`, impl ~5497-5530; `upsertProjectTask` ~3871; `removeProjectTask` ~3992): learners can create tasks only for themselves (assignee forced to self, status DONE downgraded to IN_REVIEW), update only their own assigned tasks and only status, blocker notes or order ("Learners can only update their task's status, blocker notes, or order"), delete only tasks they created; they cannot edit mentor-authored fields (title, description, priority, sprint, assignee, acceptance criteria, approach); they request meetings and withdraw their own requests; share resources; edit the team's shared final submission.

### 2. vNext behaviour
- `learn/projects/[projectId]/page.tsx:15-150`: UUID check (notFound), read access gate, redirects non-learner access to /learn/projects, sections derived from `?tab=` (board/tasks, activity, delivery, team/meetings, sprints, resources, else overview). `LearnerProjectTabs` (`learner-project-tabs.tsx`, labels from `learner-project-tab-alias-model.ts:5-12`: Overview, People & Meetings, Releases and Sprints, Board, Resources, Activity) with the same alias rules (tasks, meetings). Overview shows a "Final delivery" link to `?tab=delivery` (lines 112-117).
- Archived: `ProjectWorkspace` shows "Archived workspace · read only" notice and hides mutation controls (`project-workspace.tsx` readOnly).
- Server rules: learners may submit their own assigned task for review and comment (`task-submission-service.ts`, `project-task-submission-control.tsx`); creating tasks is mentor-only (`api/projects/[projectId]/tasks/route.ts:5-14` uses `createMentorProjectTask`); status transitions are mentor controls (`mentor-task-status-transition.tsx`).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-09 | Page heading/subtitle: legacy shows the page shell title "Projects" with the project's own title and tab strip; vNext shows a workspace `PageHeader` with project title and summary below the tabs and a "Back to projects" link not in legacy. Copy check needed against the legacy shell. | COPY | S4 | ProjectsShell.jsx:25-57 | `project-workspace.tsx:236-262` |
| LEARNER-projects-10 | Archived read-only copy: "This workspace is archived, so it is read-only." (toast on any attempted action) vs vNext banner "Archived workspace · read only / Team, execution, delivery, resources, meetings and activity remain available for review. Mutations are disabled." | COPY | S3 | ProjectDetailContent.jsx:857,2185,2608,3732 | `project-workspace.tsx:292-305` |
| LEARNER-projects-11 | `?tab=performance` and `?tab=delivery` aliases: legacy redirects `performance` to Board for learners and opens the submission modal for `delivery`; vNext handles `delivery` as a section but `performance` is not mapped (UNCONFIRMED: open `?tab=performance` as a learner). | STATE | S4 | ProjectDetailContent.jsx:822-868 | `[projectId]/page.tsx:40-50` (no performance case, falls to overview) |

## 3. Overview tab

### 1. Legacy behaviour (`renderOverviewReadOnly`, ProjectDetailContent.jsx:4385-4800)
- "About this project": rich-text goal or "No project description has been added yet."; due state label ("No due date", "Overdue · was due {label}", "Due soon · {label}", "Due {label}") and the mentor's name with a team icon (4431-4458); "Deliverables" check list or "No deliverables have been added yet."; "Definition of done" ("No definition of done has been added yet."); "Who's who" ("No personas have been added yet.").
- Task donut: percent of tasks done with legend Backlog, To Do, In Progress, In Review, Blocked, Completed (counts and percent), note "Submission also needs all N sprints signed off (x so far)." or "Tasks only — this project has no sprints."; empty "No tasks on the board yet. Add your first task to start tracking progress." (learner).
- "Next step" strip: `project.nextAction` text plus "Open board" link (4630-4645).
- Card "Requires attention" with the blocker text when present.
- Card "Final submission": status pill "Ready for review" / "Submitted" / "Waiting for completion", explanatory text from `readinessReason`, "Mentor left feedback ({status}) — open Final submission to read it.", metrics "Sprints signed off x/y" and tasks, button "Submit final work" or disabled copy, "Final submission" modal.

### 2. vNext behaviour
- `project-workspace.tsx`: four metric tiles (Tasks x/y, Sprints x/y, Releases x/y, Final submission status with detail text) 316-355; for learners a "Your final submission" card with `LearnerFinalDeliveryControl` (356-388); "Overview" section with the project summary text (390-400); `LearnerProjectGoals` ("Goals and deliverables": Project goal, description, Expected deliverables; `learner-project-goals.tsx`) rendered above.

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-12 | "Definition of done" and "Who's who" (personas) lists missing from the learner Overview. | MISSING-FIELD | S3 | ProjectDetailContent.jsx:4519-4540 | `learner-project-goals.tsx` (goal, description, deliverables only) |
| LEARNER-projects-13 | Overview lacks due date state, mentor name, "Next step" strip linking to the Board, and the "Requires attention" blocker card. | MISSING-FIELD | S2 | ProjectDetailContent.jsx:4431-4458,4630-4645,4650-4665 | absent (`project-workspace.tsx:383-392`) |
| LEARNER-projects-14 | Task donut with per-lane counts and the "Submission also needs all N sprints signed off" note missing; vNext shows plain x/y metric tiles. | MISSING-FIELD | S3 | ProjectDetailContent.jsx:4400-4420,4560-4620 | `project-workspace.tsx:316-355` |
| LEARNER-projects-15 | "Final submission" summary card with status pill (Ready for review / Submitted / Waiting for completion), reason text ("What's left"), and the "Mentor left feedback (...)" hint on Overview missing; vNext shows the card only on the delivery section. | MISSING-FIELD | S3 | ProjectDetailContent.jsx:4660-4735 | `project-workspace.tsx:356-380` |
| LEARNER-projects-16 | Section headings differ ("About this project", "Deliverables", "Project team", "Final submission" vs "Overview", "Goals and deliverables", "Project people", "Your final submission"). | COPY | S3 | ProjectDetailContent.jsx:4435,4470,7113 | `project-workspace.tsx:361,385,398`, `learner-project-goals.tsx:6` |

## 4. People & Meetings tab (key team)

### 1. Legacy behaviour
- Team summary "Project team" / "See who is assigned, what role they play, and how the project is staffed.", "{n} member(s)" (7112-7125); roster rows (name, role label, mentor/primary mentor labels). Learners cannot change the roster.
- Meetings (`renderMeetingCard` 6412+): "Upcoming meetings and recent history." (7155), "Past meetings" / "Meeting history" headings (7313), card shows title, date/time, status, meeting link, agenda, notes/outcome when completed; learner actions: "Request a meeting" (button 7167) opens modal "Request a meeting" with Title (required "Meeting title is required", placeholder "What do you want to discuss?"), Preferred date (required, past dates disabled), Preferred start time (required), Preferred end time (required, defaults to start + 30 min, "End time must be after the start time."), "Agenda / reason" ("Briefly describe what you'd like to cover"), buttons Cancel / "Send request" (10262-10341); toast "Meeting request sent to your mentor."; own REQUESTED meetings show "Withdraw" with confirm "Withdraw this meeting request? / Your mentor will no longer see this request." ok "Withdraw request" (6471-6480), toast "Meeting request withdrawn." Learner cannot withdraw others' requests (6368-6377).
- APIs: `POST /projects/{id}/meetings/request`, `POST .../meetings/{key}/withdraw`.

### 2. vNext behaviour
- Roster cards with role badges (`project-workspace.tsx:407-475`), managed class-team notice text; meetings section "Requested, scheduled and completed Project conversations." with `RequestProjectMeetingControl` (button "Request meeting", dialog "Request mentor meeting", fields title/agenda/start/end/timezone, `project-meeting-controls.tsx:144-300`) and learner cancel of own request via `ProjectMeetingActions` ("Cancel meeting", 636-760); empty "No meetings yet."

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-17 | Meeting copy differs: legacy "Request a meeting" button and modal title, submit "Send request", success "Meeting request sent to your mentor.", agenda label "Agenda / reason"; vNext "Request meeting", "Request mentor meeting", "Request meeting" submit, toast "Meeting requested". | COPY | S3 | ProjectDetailContent.jsx:7167,10262,10341,3758 | `project-meeting-controls.tsx:83,88,136,205` |
| LEARNER-projects-18 | Withdraw own meeting request: legacy action "Withdraw" with confirm "Withdraw this meeting request? / Your mentor will no longer see this request." and toast "Meeting request withdrawn."; vNext uses "Cancel meeting" with a note dialog and different toast ("Meeting cancelled"). | COPY | S3 | ProjectDetailContent.jsx:6379-6389,6469-6481 | `project-meeting-controls.tsx:665-760` |
| LEARNER-projects-19 | Validation parity: legacy requires preferred date, start and end time (end after start, past dates disabled, error "Preferred date is required" etc.). vNext requires times and end after start ("Meeting end time must be after the start time.") but UNCONFIRMED whether past dates are blocked. | VALIDATION | S4 | ProjectDetailContent.jsx:10277-10325 | `project-meeting-controls.tsx:176-190`; confirm by requesting a past date as a learner |
| LEARNER-projects-20 | Meeting list headings and empty text: "Upcoming meetings and recent history.", "Past meetings"/"Meeting history", legacy empty copy vs "No meetings yet." | COPY | S4 | ProjectDetailContent.jsx:7155,7313 | `project-workspace.tsx:1017-1050` |
| LEARNER-projects-21 | Team header "Project team / See who is assigned, what role they play, and how the project is staffed." and "{n} member(s)" count absent (vNext "Project people"). | COPY | S4 | ProjectDetailContent.jsx:7112-7125 | `project-workspace.tsx:398-402` |

## 5. Releases and Sprints tab (key sprints), read-only for learners

### 1. Legacy behaviour
- Roadmap strip (one segment per release, status colour, click jumps to the release), release groups and sprint rows with tasks (`renderReleaseGroup`, `renderSprintRow`, `renderTaskRows` 7470-7700). Learner view is read-only; create/edit/ship/start/complete/reopen are mentor-only (`canManageMentor` gates 7714, 7825); mentor toasts such as "Sprint started." are not learner paths.
- Learner can pull a backlog task into the active sprint? Line 5242 `Pulled "{task}" into {sprint}` is on the Board (see section 6).

### 2. vNext behaviour
- `project-workspace.tsx:479-800`: "Execution" section "Release → sprint → task state from normalized..." with release cards (status badge), sprint cards (status, dates), tasks under sprints with priority/status badges, `ProjectTaskSubmissionControl` for the learner's active-sprint tasks (666-680), `ProjectTaskComments`, learner criteria preview.

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-22 | Roadmap summary strip (one segment per release with status colour, current release highlight) missing; vNext lists releases flat. | MISSING-FIELD | S4 | ProjectDetailContent.jsx:7337-7380 | `project-workspace.tsx:479-520` |
| LEARNER-projects-23 | Section copy: vNext "Execution / Release → sprint → task state from normalized ..." is internal wording, not legacy copy ("Releases and Sprints" tab content has no such heading). | COPY | S3 | ProjectDetailContent.jsx:7337+ | `project-workspace.tsx:477-483` |

## 6. Board tab

### 1. Legacy behaviour (`case "board"`, ProjectDetailContent.jsx:7891-8315)
- Six lanes `BOARD_LANES` (153): Unscheduled labelled "Backlog", Backlog labelled "To Do", In Progress, In Review, Blocked, Completed (173-180); cards show title, priority, assignee, due, estimate, blocker text, comments count (`BoardCardBody`, 251-410); drag and drop between lanes (`BoardLaneDropZone`, 201) with optimistic save and "Saving your change…".
- Learner rules: can drag only own tasks; "Only your mentor can move a task into Completed." (2231), "Only your mentor can move a task out of Completed." (2240), "Start a sprint before moving backlog tasks onto the board." (2281); undo toast "Task moved." with undo; "Task move undone." (2490); warnings "Task moved, but its position within the lane may not have saved. Refreshing…" (2434,2443).
- Toolbar: "Filters" drawer (badge with active count) with Lane chips (All + lanes), Priority (All priorities, High, Medium, Low), Assignee ("Mine"), Sprint scope (active sprint plus backlog, all history), "Clear all"; button "Add my task" (8124; mentor sees "Create task") opening a task form (title, status, priority, sprint, due, estimate, type, description, "Done when", approach, blocker note; learners are forced to self-assign); "Submit final work" button or the explanation text "Submission available after completion".
- Task details modal (`TaskDetailsModal.jsx`): "Task details", chips "Carried over" and template tags, "Done when", "Approach", "Submission", "Task actions" (learner: start work / report blocker with "Blocker note", "Submit for review"), delete with "Delete this task?" confirm (only own created), "Activity", "Comments" with type and message ("Add a note before posting", placeholder "Share a progress update or note..."). Toasts: "Task update saved.", "Blocker reported." / "Task moved to In Progress." (2792), "Submitted for review." (2835), "Task added." / "Task updated.", "Task removed.".
- Pull from backlog: `Pulled "{task}" into {sprint}.` (5242).

### 2. vNext behaviour
- Board section = filters `LearnerProjectBoardSearch` (search, status, priority, sprint, release, task order, status/priority counts), an "Open task details · n matching" list (`learner-board-task-index.tsx`) and a read-only dialog `LearnerBoardTaskDetailDialog` (status, priority, sprint, Details, Acceptance criteria; link "Open task actions in Board"; note "Actions and submissions use the authorized Project workspace, not this read-only preview."); the task cards themselves are the execution list (section 5) with status badges, "Submit for review" control and comments. No kanban lanes, no drag and drop.
- Server: `updateProjectTaskStatus` (`lifecycle-service.ts:511`) exists but only mentor UI uses it; task creation is mentor-only (`api/projects/[projectId]/tasks/route.ts`).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-24 | No lane board: learners cannot see tasks grouped by Backlog / To Do / In Progress / In Review / Blocked / Completed, nor drag their own tasks between lanes. Board is a filtered list. | MISSING-TAB | S2 | ProjectDetailContent.jsx:153-180,201-250,7891-8315 | `learner-board-task-index.tsx:17-30`, `project-workspace.tsx:480-800` |
| LEARNER-projects-25 | Learner cannot move their own task to In Progress, report a blocker with a note, or reorder; only "Submit for review" exists. Legacy allows status, blocker note and order updates on own tasks (Completed is mentor-only; DONE downgrades to In review). | MISSING-ACTION | S2 | ProjectDetailContent.jsx:2231-2250,2792; BE impl ~5497-5530 | `project-workspace.tsx:666-680` (submission only); `lifecycle-service.ts:511` mentor UI only |
| LEARNER-projects-26 | "Add my task" (learner self-assigned task with the full form) and delete of own created task missing. | MISSING-ACTION | S2 | ProjectDetailContent.jsx:8124,2933,4376; BE `upsertProjectTask` ~3871, `removeProjectTask` ~3992 | `api/projects/[projectId]/tasks/route.ts:5-14` (mentor-only) |
| LEARNER-projects-27 | Filter set: legacy Lane, Priority, Assignee "Mine", Sprint scope; vNext has search, status, priority, sprint, release, order but no assignee/"Mine" filter. Filter UI is inline, legacy uses a "Filters" drawer with active-count badge and "Clear all". | MISSING-FILTER | S3 | ProjectDetailContent.jsx:8010-8100 (drawer) | `learner-project-board-search.tsx:16-67` |
| LEARNER-projects-28 | Task modal missing learner sections: "Done when", "Approach", "Submission", "Task actions", task Activity and Comments inside the modal, tags "Carried over"; vNext dialog is explicitly read-only and sends the learner back to the list. | MISSING-MODAL | S3 | TaskDetailsModal.jsx:216-640 | `learner-board-task-detail-dialog.tsx:45-70` |
| LEARNER-projects-29 | Pull a backlog task into the active sprint (`Pulled "..." into ...`) and the board rule messages ("Start a sprint before moving backlog tasks onto the board.") missing. | MISSING-ACTION | S3 | ProjectDetailContent.jsx:2281,5242 | absent |
| LEARNER-projects-30 | Task comment form: legacy comment type, message, "Add a note before posting"; vNext has `ProjectTaskComments` (UNCONFIRMED type selector and error copy). | VALIDATION | S4 | TaskDetailsModal.jsx:630-634 | `project-task-comments.tsx` (51 lines) |
| LEARNER-projects-31 | Board button copy: "Add my task", "Filters", "Saving your change…", "Submit final work"/"Submission available after completion"; vNext "Open task details · n matching", "Open task actions in Board". | COPY | S3 | ProjectDetailContent.jsx:8124,8036,8090 | `learner-board-task-index.tsx:17`, `learner-board-task-detail-dialog.tsx` |
| LEARNER-projects-32 | vNext states "Task type and story points are not recorded in the current Project schema." under the task list (internal wording); legacy shows estimate and type per task. | COPY | S3 | TaskDetailsModal.jsx:425-431 | `learner-board-task-index.tsx:31` |

## 7. Resources tab

### 1. Legacy behaviour (`case "resources"`, ProjectDetailContent.jsx:8724-9160)
- Learner can open and also "Share a resource" (8740; mentor sees "Add resource"); stats tiles Total/Showing, by type, Other (always rendered); filters/search; "Last updated {time}"; rows draggable only for mentors (`SortableResourceRow`, 531) with open link/file; messages "This resource has no link or file attached yet.", "This resource's link is not a valid web address, so it can't be opened.", "Your browser blocked the new tab. Allow pop-ups for this site to open resources." (597-615); mentor-only visibility resources hidden from learners (622); toasts "Resource added.", "Resource file uploaded.", "Resource removed.", "File size exceeds 50MB limit." (3467); archived message.
- Download `GET /projects/{id}/resources/{key}/download`.

### 2. vNext behaviour
- `project-workspace.tsx:913-1010`: resources list (`ProjectResourceControls`), plus `ProjectResourceFilesSection` -> `ProjectResourceFilesPanel`; learners see READY files and download via signed grant; upload and edit controls are for mentors/admins only (`project-resource-files-section.tsx:11`, `project-resource-file-service.ts:105,115,199,205` lifecycle access).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-33 | Learners cannot "Share a resource" (add a link or file) as in legacy; add/upload is mentor/admin only. | MISSING-ACTION | S3 | ProjectDetailContent.jsx:8740,3409,3492 | `project-resource-files-section.tsx:11`, `project-resource-file-service.ts:115` |
| LEARNER-projects-34 | Open-resource guard messages ("This resource has no link or file attached yet.", invalid address, pop-up blocked) and the stats tiles (Total/Showing, by type) absent or UNCONFIRMED. | COPY | S4 | ProjectDetailContent.jsx:597-615,8745-8790 | `project-resource-files-panel.tsx` (UNCONFIRMED: open Resources as a learner) |

## 8. Activity tab

### 1. Legacy behaviour (9164-9400)
- Filters: "Type" select "All activity", Sprint changes, Task changes, Team & meetings, Resources shared, Submission updates, Project details; date range picker; list of events with category label (Overview, Meeting, Resource, Sprint, Submission), title, time; "Load more"; errors "We couldn't load this project's activity. The history is still there — this is a connection problem, not an empty log." with Retry; empty "No project activity yet. Task moves, sprint updates and resource changes will appear here."; API `GET /projects/{id}/activity/feed?sourceTab=...`.

### 2. vNext behaviour
- `learner-project-activity.tsx` (101 lines): heading "Activity", select "Activity type" with the same seven option labels (`learner-project-activity-filter-model.ts:7-15`), From/Through (IST), in-page search, pagination by cursor ("Activity pages").

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-35 | Error/empty copy differs (legacy "We couldn't load this project's activity..." / "No project activity yet. Task moves, sprint updates and resource changes will appear here."); label "From (IST)/Through (IST)" vs date range picker. | COPY | S4 | ProjectDetailContent.jsx:9252-9300 | `learner-project-activity.tsx:33-61` |

## 9. Final submission (delivery)

### 1. Legacy behaviour (modal opened from Overview/Board or `?tab=delivery`; ProjectDetailContent.jsx:9747-10130)
- Eyebrow "Final submission", title = project title; learner panel "Submit final work" ("Add a concise summary, notes, and the final attachment."), revision tag "Revision n", alert "This is your team's shared submission / Any active team member can view and edit it — there's no single designated submitter. Changes save automatically as you type.", "Last edited by {name} · {time}".
- Panel "What's left before you can submit" listing incomplete tasks and sprints (first 8, "+n more"); mentor review box "Mentor review: {status}" with feedback; locked alert "This submission is locked" / "This submission has been accepted" ("It can no longer be edited from here. Ask your mentor to reopen it if changes are needed.").
- Form fields: "Primary link (optional)" with inline Upload (`accept .pdf,.doc,.docx,.txt,.ppt,.pptx,.zip,.png,.jpg,.jpeg`, 50 MB), Summary ("Short summary of what was submitted"), Notes ("Add any final notes"), "Additional files & links (n of 10)" with Add link ("Paste another link and press Add") and Upload, per-item "Added by {name}", remove, limit message "Limit reached — remove one above to add another.". Link validation "That doesn't look like a valid link." / "Links must start with http:// or https://"; "Up to 10 additional files & links are allowed."; "File size exceeds 50MB limit."
- Autosave with status text ("Unsaved changes…", "Saving…", "Saved", "Couldn't autosave — use Save draft"), buttons "Save draft" and "Submit final work" with popconfirm "Submit on behalf of your team?". Toasts: "Draft saved.", "Submission sent for review.", "File uploaded. Saving the submission draft…", error "Add at least one attachment and a summary before submitting."
- Mentor outcomes (accepted, changes requested, locked, reopened) appear as read-only status for learners with the feedback; learner list tags "Changes requested"/"Draft submission".
- BE: `ProjectDeliveryDTO`, readiness check (all tasks done and sprints signed off) gates submit.

### 2. vNext behaviour
- `LearnerFinalDeliveryControl` (`project-final-delivery-controls.tsx:40-330`): buttons "Create final draft"/"Edit final draft", "Submit final work" (disabled with a title explaining why), dialog "Edit final draft"/"Create final draft" ("Drafts can be prepared early. Final submission unlocks after Project execution is complete."), fields summary (6000), source URL, demo URL, notes (6000), "Additional files & links" with title and URL link rows (max 10, https only, `kind FILE` supported in the type but no upload control), "Save draft". Review history for mentor is in the same file.

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-36 | No file upload in the final submission (primary attachment or additional files, 50 MB, allowed types), only links. Storage upload exists for project resources, not wired here. | MISSING-FIELD | S2 | ProjectDetailContent.jsx:9990-10075,4160-4170 | `project-final-delivery-controls.tsx:28,262-280` (LINK only) |
| LEARNER-projects-37 | Autosave and save-status text missing; changes are lost unless "Save draft" is pressed. | MISSING-ACTION | S3 | ProjectDetailContent.jsx:1120,10084 | `project-final-delivery-controls.tsx:75-123` |
| LEARNER-projects-38 | Panels missing: team shared-submission alert, "Last edited by {name}", "What's left before you can submit" list, "Mentor review: {status}" with feedback in the learner modal, locked/accepted notice. UNCONFIRMED whether review feedback is shown to the learner elsewhere (open a project with a returned submission). | MISSING-FIELD | S2 | ProjectDetailContent.jsx:9923-9985 | `project-final-delivery-controls.tsx` (learner side has no feedback panel); `project-workspace.tsx:356-380` |
| LEARNER-projects-39 | Field set differs: legacy Primary link, Summary (short), Notes; vNext Summary (long), Source URL, Demo URL, Notes. Labels and placeholders differ ("Paste a link, or upload a file below", "Short summary of what was submitted", "Add any final notes"). | COPY | S3 | ProjectDetailContent.jsx:9990-10025 | `project-final-delivery-controls.tsx:205-260` |
| LEARNER-projects-40 | Submit validation/confirmation copy: legacy "Submit on behalf of your team?" confirm, "Add at least one attachment and a summary before submitting.", toasts "Draft saved." / "Submission sent for review."; vNext toasts "Final draft created/updated" and server messages. | COPY | S3 | ProjectDetailContent.jsx:4097-4105,4143,10091 | `project-final-delivery-controls.tsx:109-118,167-190` |

## 4. Intentional differences (keep unless owner objects)
- Server-side access via `requireProjectReadAccess` with non-leaking `notFound` and role redirect (`[projectId]/page.tsx:34-50`); inactive/foreign members never see existence.
- List filters not in legacy: work (blocked/no tasks), sort (recent/title/progress), mentor-name search, URL pagination, mobile filter sheet; page-size choices.
- Board filters add release, task order, status and priority counts; deep-link `taskId` opens a task dialog with return-to-Board recovery message.
- Activity: IST date range filter, cursor pagination, in-page search.
- Final delivery: draft/submit separation and immutable review history; link rows with title (`project-final-delivery-controls.tsx`).
- Resources: signed grants, scan status, project resource files panel (merged); mentor-only visibility enforced server-side.
- Team: class-team managed roster notice (`project-workspace.tsx` team notice).

## 5. Test hooks
- Existing: `tests/integration/chat7-learner-project-team.test.ts`, pure-model tests for list sorting, blocked filter, task dialog, activity filters (see `docs/parity/learner.md` Projects entries), `ProjectTaskSubmissionControl` and meeting-request service tests (`src/modules/projects`).
- Needed (`scripts/verify/pages/learner-projects.mjs`): list filters and deep links; overview content with due/blocker/next step; request and withdraw meeting; task submit for review; learner task create/move/blocker (once built); final submission with file upload, autosave, locked and changes-requested states; archived workspace read-only behaviour; 1280 and 375 px layouts.
- UNCONFIRMED (verify with seeded data): -06, -07, -11, -19, -30, -34, -38.


### chat-11 WP-01 implementation checkpoint (2026-10-16; verification pending)

- **LEARNER-projects-25:** Own assigned-task Start work, Report blocker with required note, Move to To Do and Move up/down controls, with learner server authorization, active-sprint/project guards, stale row checks, a collision-safe three-update sequence swap and activity recording. Added unit and disposable PostgreSQL integration tests; **not executed** here. Browser verification at mobile and desktop remains open.
