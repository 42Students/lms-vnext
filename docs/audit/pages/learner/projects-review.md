# Round R review: Learner / Projects

Reviewer: Round R agent (Sonnet 5.5), 2026-10-16. Round A file: `docs/audit/pages/learner/projects.md` (opened only after my own audit).

**Summary: 40 Round A gaps. CONFIRMED 38, WRONG 0, SEVERITY-CHANGE 2, MISSED 4. Discrepancy rate = (4 + 0 + 2) / (40 + 4) = 13.6%.**

Method notes
- My independent audit used legacy `lms-dev-2026` as served by the `_hr-tpo-fe` / `_hr-tpo-be` worktrees (ProjectDetailContent.jsx 10,850 lines, ProjectsContent.jsx, TaskDetailsModal.jsx; backend `ProjectWorkspaceServiceImpl`). The `lms-dev-2026-frontend` worktree is stale (Sep 29, 8,843 lines) and lacks the learner Start work / Report blocker / Submit for review controls; the Round A author used the right (newer) source. My first pass on the stale tree was redone against the newer one for those items.
- vNext judged against current main (after chat-7 and chat-11 merges, commits `c34dcbec1`, `4e3bd6739`, `b7ffa683c`, `cf9831679`). None of those closed a Round A gap: list title/subtitle/empty copy, Final submission labels, and task-comment labels were already excluded from Round A or are still different as stated. I re-read `project-list.tsx`, `page.tsx`, `project-workspace.tsx`, `project-meeting-controls.tsx`, `project-final-delivery-controls.tsx`, `project-task-comments.tsx`, `learner-*` models, `lifecycle-service.ts`, `access.ts` and `meeting-service.ts`.

## (2) Round A gaps: verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| LEARNER-projects-01 | CONFIRMED | `project-list.tsx` renders summary, mentor, members, progress, updated date only. vNext projects have no course field, so "course" needs a source decision (template title?). |
| LEARNER-projects-02 | CONFIRMED | Card footer is a bare arrow. |
| LEARNER-projects-03 | CONFIRMED | No project-level blocker concept in vNext; only task-level `blockerReason`. Deep link `?tab=board&lane=Blocked` has no equivalent. |
| LEARNER-projects-04 | CONFIRMED | `statusSchema` in `learn/projects/page.tsx` is CURRENT/PLANNED/ACTIVE/COMPLETED/ARCHIVED; attention only `LEARNER_ACTION`. |
| LEARNER-projects-05 | CONFIRMED | `parsePageSize` accepts only 50/100 else 25. |
| LEARNER-projects-06 | CONFIRMED | Exact strings come from `learnerProjectListEmptyState` plus route `error.tsx`/`loading.tsx` (both exist, so loading/error states are present, copy differs). |
| LEARNER-projects-07 | CONFIRMED | `learner-project-sort-model.ts` TITLE uses plain `localeCompare` (no `numeric`), so "Team 10" sorts before "Team 2"; default RECENT has no Team-N rule either. UNCONFIRMED part resolved by code. |
| LEARNER-projects-08 | CONFIRMED | |
| LEARNER-projects-09 | CONFIRMED | |
| LEARNER-projects-10 | CONFIRMED | |
| LEARNER-projects-11 | CONFIRMED | `[projectId]/page.tsx` activeSection maps unknown `tab` to overview; legacy maps `performance` to board for learners. Resolved by code. |
| LEARNER-projects-12 | CONFIRMED | Note: `projectTemplateBlueprintSchema` (`validation.ts:101-107`) has only `deliverables`; "Definition of done" and "Who's who" need a blueprint/schema addition, not just UI. Effort higher than S3 suggests. |
| LEARNER-projects-13 | CONFIRMED | |
| LEARNER-projects-14 | CONFIRMED | |
| LEARNER-projects-15 | CONFIRMED | |
| LEARNER-projects-16 | CONFIRMED | |
| LEARNER-projects-17 | CONFIRMED | |
| LEARNER-projects-18 | CONFIRMED | Also no confirm dialog for the learner; legacy asks "Withdraw this meeting request?" first. vNext server rule matches legacy (learner may cancel only own REQUESTED meeting, `meeting-service.ts:~337`). |
| LEARNER-projects-19 | CONFIRMED | UNCONFIRMED part resolved: client does not disable past dates, but `requestProjectMeeting` rejects past windows server-side (`isFutureProjectMeetingWindow`, `meeting-service.ts:~183`) with the generic invalid-state error. Gap stays (message quality, no picker guard). |
| LEARNER-projects-20 | CONFIRMED | |
| LEARNER-projects-21 | CONFIRMED | |
| LEARNER-projects-22 | CONFIRMED | |
| LEARNER-projects-23 | CONFIRMED | |
| LEARNER-projects-24 | CONFIRMED | Type should read MISSING-ACTION/MISSING-FIELD rather than MISSING-TAB (the Board tab exists; the lane view does not). |
| LEARNER-projects-25 | SEVERITY-CHANGE | S2 to S1. A learner cannot start work, report a blocker or resolve one anywhere: `PATCH /tasks/[taskId]` is gated by `requireProjectLifecycleMutationAccess` (ADMIN/MENTOR only, `access.ts:155-184`). Task status for learners can only reach IN_REVIEW via submission. Blocker reporting is the learner's only way to signal risk to the mentor, so this blocks a real workflow. |
| LEARNER-projects-26 | CONFIRMED | `POST /tasks` calls `createMentorProjectTask`. Legacy forces self-assignment and downgrades DONE to IN_REVIEW. |
| LEARNER-projects-27 | CONFIRMED | |
| LEARNER-projects-28 | CONFIRMED | |
| LEARNER-projects-29 | CONFIRMED | |
| LEARNER-projects-30 | CONFIRMED | vNext has "Post comment" button disabled on empty text, placeholder "Share a progress update or note...", "No comments yet." (matches legacy empty copy). No comment type; no "Add a note before posting" message because the button is disabled. |
| LEARNER-projects-31 | CONFIRMED | |
| LEARNER-projects-32 | CONFIRMED | |
| LEARNER-projects-33 | SEVERITY-CHANGE | S3 to S2. Learners lose the ability to add any link or file to the team workspace: `resource-service.ts` writes use `requireProjectLifecycleAccess` and `resourceFileUiAllowed` allows UPLOAD/DELETE only for ADMIN/MENTOR. In legacy this is one of the three learner contribution actions (task, resource, submission). |
| LEARNER-projects-34 | CONFIRMED | |
| LEARNER-projects-35 | CONFIRMED | vNext activity is richer (category, IST date range, cursor paging, CSV); keep as intentional improvement. |
| LEARNER-projects-36 | CONFIRMED | |
| LEARNER-projects-37 | CONFIRMED | |
| LEARNER-projects-38 | CONFIRMED | |
| LEARNER-projects-39 | CONFIRMED | |
| LEARNER-projects-40 | CONFIRMED | |

## (3) MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-projects-R01 | No project notifications for learners. Legacy notifies learners (and mentors where noted) on: new project assigned, added to project, new task assigned and task removed, new comment on your task, meeting requested (to team and mentor), meeting scheduled/removed ("Project meeting"), delivery submitted, delivery reviewed, project archived/restored/updated. vNext project services write no notification rows at all, so nothing reaches the learner Notifications page or email for any project event. | SIDE-EFFECT | S2 | `_hr-tpo-be` `ProjectWorkspaceServiceImpl.java`: `notifyTaskAssignee` ~3663/3733, "New comment on" ~3926, "Meeting requested" ~2897-2900, "New project assigned" ~3993, "Delivery reviewed"/"Delivery submitted" ~4034-4060, "Project meeting" ~6947 | `grep notifications` over `src/modules/projects` and `src/app/api/projects` returns nothing; `src/modules/notifications` has no project source type |
| LEARNER-projects-R02 | Learners cannot see core task facts anywhere: assignee (who owns the task), due date, estimate, task type, blocker reason, comment count, "submission link attached" marker. The workspace task row and the board dialog show only title, description, acceptance criteria, status, priority, sprint. Learner-visible due dates are therefore absent from the entire project (no overdue signal). Data exists (`task.dueDate`, `assigneeMembershipId`, `blockerReason`) and is passed to mentor edit controls only. Distinct from Round A -32 (which is only the "not recorded" footnote). | MISSING-FIELD | S2 | `BoardCardBody`/`BoardTaskCard` card meta and `TaskDetailsModal.jsx` header (assignee, due, estimate, type, blocker, submission link) | `project-workspace.tsx:~580-640` (task row), `learner-board-task-detail-dialog.tsx:36-60`, `learner-board-card-model.ts` (status, priority, sprint only) |
| LEARNER-projects-R03 | Why final submission is unavailable is shown only as a `title` tooltip on a disabled button ("Complete every release, sprint and task before submitting."). Disabled buttons are not focusable and `title` is invisible on touch and for most screen-reader flows; legacy BD-16 deliberately replaced this with visible text ("Submission available after completion" plus `readinessReason`). Also, vNext lets a learner create a draft before readiness (legacy blocks opening the submit form until ready, with a warning toast "Complete the required work first."). The latter is a product choice and may be an improvement; the invisible reason is the defect. | A11Y | S3 | `ProjectDetailContent.jsx` BD-16 comment ~8100, `openSubmissionModal` guard ~6580 (`message.warning(readinessReason ...)`), `readinessReason` ~6520 | `project-final-delivery-controls.tsx:173-186` (title attribute only), `readiness-service.ts:138-146` |
| LEARNER-projects-R04 | Sprints tab summary: legacy shows "Sprints completed x of N" and an "Overdue" count for sprints; vNext has a Sprints x/y tile but no overdue indication, and no per-sprint progress value or due date for learners. | MISSING-FIELD | S4 | `case "sprints"` banner (`sprintRollup.overdue`), `aria-label` "`${sprint.title}: ${progressValue}% complete`" | `project-workspace.tsx:~316-355,509-540` |

## (4) SEVERITY-CHANGE details

- LEARNER-projects-25 S2 to S1: see table. Evidence `lifecycle-service.ts:511-520` + `access.ts:155-184` (mentor/admin only). Combined with LEARNER-projects-26 the learner cannot create, start, block or move any task, so the Board is read-only for the people it exists for. Suggested fix scope: learner-allowed transitions (to IN_PROGRESS, to BLOCKED with reason, back from BLOCKED, own-task only; never to DONE) with optimistic-lock + audit event, mirroring legacy `requireTaskMutationAccess`/`learnerPayloadChangesRestrictedFields`.
- LEARNER-projects-33 S3 to S2: see table.

## (5) UNCONFIRMED (batch for the live check on the deployed dev site)

1. Detail load failure/not-found copy: legacy shows a `Result` with "Back to projects" (ProjectDetailContent.jsx ~7512-7545); vNext has `error.tsx` and `not-found.tsx` but exact strings not compared. Confirm: open `/learn/projects/<unknown uuid>` and force a server error.
2. Meeting request as a learner for a past date/time: confirm the exact error text shown (server returns invalid-state code).
3. Archived project as learner: confirm that Comments, task submission and meeting request controls are all hidden or rejected (code passes `canPost={!readOnly}`, others gated on `!readOnly`).
4. Learner with a task assigned in a non-ACTIVE sprint: confirm the submission control is correctly hidden (`sprint.status === "ACTIVE"` gate) and whether the learner sees any explanation.
5. Notifications page for a learner after a mentor assigns a task, schedules a meeting, or reviews a submission: expect nothing (R01). Confirm on dev with a mentor and a learner account.
6. Learner view of the legacy "Stalled" flag is mentor-only in legacy; no learner gap, listed only to close the question.
