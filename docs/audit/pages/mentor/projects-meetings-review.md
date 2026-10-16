# Mentor / Projects and Meetings: Round R review (covers `projects-meetings.md` and `projects-meetings-part2.md`)

Reviewed: 2026-10-16 by Round R reviewer (Sonnet 5.5)   Round A under review: `MEN-projects-meetings-01` to `-77`

## 1. Summary

77 Round A gaps: 76 CONFIRMED, 0 WRONG, 1 SEVERITY-CHANGE (with an evidence correction), 11 MISSED (`MEN-projects-meetings-R01` to `-R11`).
Discrepancy rate = (11 MISSED + 0 WRONG + 1 SEVERITY-CHANGE) / (77 + 11) = 12 / 88 = 13.6 percent (under the 15 percent line).
Round A is accurate: every file:line I re-read held. Its two weak spots are (a) two "intentional difference" bullets in part 2 section 17 that overstate vNext (organizer overlap scope, "all writes use optimistic concurrency") and (b) gap 63's evidence. Most important miss: R01 (mentor-approved final deliveries probably cannot be reopened).

### Method and independence caveats (honest account)
- I started on the stale worktree `42lms\lms-dev-2026-frontend` (8,843-line `ProjectDetailContent.jsx`, detached 83347e29, 2026-09-29) and built my own gap list from it before opening any Round A file. That list already contained: Overview shows only `summary` and no readiness; Board/Sprints/Task Allocation are one block; task rows omit assignee/due/estimate; comments show body only; no release/sprint CRUD, dates, backlog or carry-over; sprint complete refused with open tasks; Resources lack type/status/pinned/visibility UI/filters/reorder; Activity tab capped at 100 without filters; no learner or mentor notification deliveries from `src/modules/projects`; reviewer-kind members redirected; legacy `/mentor/*` stubs return not-found; Meetings page copy, MISSED rule and Notifications copy differ.
- On diffing I found Round A used the correct dev tip (`42LMS-FRONTEND\lms2-fe` at `lms-dev-2026`, 10,850-line file). I then re-read the dev-tip legacy (detail component, `calendar.js`, `notifications.js`, `index.js`, backend `ProjectWorkspaceServiceImpl` meeting conflict code) and re-verified Round A claims against current vNext code at `origin/main`.
- Independence was not perfect: while locating the plan I read the `docs/audit/owner-decisions.md` row OD-36 (it cites gap 31) and, before finishing the dev-tip re-read, I read the part 1 gap tables. R01 to R11 were found by code reading after that point or before it (R04, R06, R08 partly), and none of them appears in Round A's gap rows (checked by keyword search of both files).
- Evidence is against committed `origin/main`. The shared checkout had other agents' uncommitted staged work (an admin project summary editor, a `PATCH /api/projects/[projectId]`, an admin `submissions/[id]/lock` route). Those are not on main and are not counted as closing any gap; the lock route is relevant to R01 (see below) and to gap 63.

## 2. Round A gaps: verdicts

Abbreviations as in Round A (PDC, PW, MD, MP, SCH, IMPL). "Re-read" = I read the cited legacy/vNext lines and they say what Round A says.

| Round A gap ID | Verdict | Note |
|---|---|---|
| MEN-projects-meetings-01 | CONFIRMED | `mentor/page.tsx` and `projects/page.tsx` do `.catch(() => null)` then `!== true`; dev-tip `mentor/projects/index.js` has separate loading, `failed` and disabled branches. |
| -02 | CONFIRMED | Eyebrow and extra sentence present in `mentor/page.tsx`. |
| -03 | CONFIRMED | `project_instances` has no course, phase or due columns. |
| -04 | CONFIRMED | Mentor `work` enum has no BLOCKED. |
| -05 | CONFIRMED | Card footer is an arrow with sr-only text only. |
| -06 | CONFIRMED | Also see R08: vNext "Current only" hides COMPLETED as well as ARCHIVED. |
| -07 | CONFIRMED | Sizes 25/50/100 (`mentor-project-list-query.ts:15`). |
| -08 | CONFIRMED | Generic `(authenticated)/loading.tsx` and `error.tsx` exist; none under `mentor/projects/`. |
| -09 | CONFIRMED | `localeCompare` without numeric collation. |
| -10 | CONFIRMED | Whole set loaded in memory (`projects/page.tsx`). |
| -11 | CONFIRMED | `access.ts` returns OBSERVER for non-mutating role kinds; `MD` redirects any non-MENTOR access. Still needs the seeded live check Round A lists. |
| -12 | CONFIRMED | `sprints`, `board`, `performance` all hit `show("sprints") \|\| show("tasks")` (PW:474 on main). |
| -13 | CONFIRMED | `?tab=tasks` and `?tab=meetings` fall to `overview`. |
| -14 | CONFIRMED | Ten link buttons counted. |
| -15 | CONFIRMED | |
| -16 | CONFIRMED | `show("summary")` false when `activeSection="overview"`. |
| -17 | CONFIRMED | |
| -18 | CONFIRMED | |
| -19 | CONFIRMED | |
| -20 | CONFIRMED | `api/projects/[projectId]/route.ts` exports GET only on main (a PATCH for College Admin summary is staged locally, not on main, and does not give mentors the edit). |
| -21 | CONFIRMED | |
| -22 | CONFIRMED | No `delivery` pill and no Overview/Board button; entry points are list card, notification card, quick links back-links. |
| -23 | CONFIRMED | |
| -24 | CONFIRMED | |
| -25 | CONFIRMED | |
| -26 | CONFIRMED | Flat list, no organizer column. Related: R04, R11. |
| -27 | CONFIRMED | `project_meetings` has `outcome` and `cancellation_note` only. |
| -28 | CONFIRMED | |
| -29 | CONFIRMED | `projectMeetingHttpsUrlSchema` is https only. See also R03 (time zone field). |
| -30 | CONFIRMED | |
| -31 | CONFIRMED | grep: no `deliverInAppNotification` under `src/modules/projects`. Same root as -49, -66, -72. |
| -32 | CONFIRMED | Only `releases/[releaseId]/ship` and `unship` routes exist. Add R06 (no empty state when no releases). |
| -33 | CONFIRMED | |
| -34 | CONFIRMED | Dialog text itself says dates cannot be saved. |
| -35 | CONFIRMED | `sprints/[sprintId]/route.ts` exports PATCH only. |
| -36 | CONFIRMED | `projectTasks.sprintId` NOT NULL; `mayCloseProjectSprint` needs 0 open tasks. |
| -37 | CONFIRMED | `window.confirm` at `mentor-sprint-write.tsx:84`; ship/unship have no confirm. |
| -38 | CONFIRMED | |
| -39 | CONFIRMED | |
| -40 | CONFIRMED | |
| -41 | CONFIRMED | Re-read `PW` task article: title, description, criteria, badges only; `assigneeMembershipId`, `dueDate`, `estimatePoints`, `blockerReason` are passed only to edit forms. `board-review` page does not show them either. |
| -42 | CONFIRMED | |
| -43 | CONFIRMED | `project-task-comments.tsx` renders `body` only. |
| -44 | CONFIRMED | |
| -45 | CONFIRMED | |
| -46 | CONFIRMED | `tasks/[taskId]/route.ts` exports PATCH only. |
| -47 | CONFIRMED | `mentor-task-transition-service.ts:46` rejects BLOCKED without an existing note. |
| -48 | CONFIRMED | |
| -49 | CONFIRMED | |
| -50 | CONFIRMED | |
| -51 | CONFIRMED | |
| -52 | CONFIRMED | |
| -53 | CONFIRMED | |
| -54 | CONFIRMED | `visibility` ("TEAM" or "MENTOR_ONLY") is in `validation.ts:663,689` only; no UI mention in `components/projects`. |
| -55 | CONFIRMED | |
| -56 | CONFIRMED | |
| -57 | CONFIRMED | |
| -58 | CONFIRMED | |
| -59 | CONFIRMED | |
| -60 | CONFIRMED | `activity-service.ts` `.limit(101)`, `slice(0,100)`. |
| -61 | CONFIRMED | `PW:1173` prints `eventType.split(".").slice(1)`. |
| -62 | CONFIRMED | |
| -63 | SEVERITY-CHANGE | S3 to S4, and the evidence "`lockedAt` unused by any control" is wrong: `submission-service.ts:502` sets `lockedAt` when an APPROVED review is written, `delivery-reopen-service.ts:31` reads it, and `delivery-activity-model.ts` defines a LOCKED event. Approval already locks the learner out (see section 4). The remaining difference (no Accepted vs Locked split, no separate Lock button) is cosmetic. NOTE: the mentor approve route does not set it, which is the real defect R01. |
| -64 | CONFIRMED | `PW` version card shows summary, source and demo links, review text only. |
| -65 | CONFIRMED | |
| -66 | CONFIRMED | |
| -67 | CONFIRMED | |
| -68 | CONFIRMED | `mentor-calendar-view.ts:67` (main) compares IST date keys. Dev-tip `calendar.js` marks MISSED when the end instant has passed. Same defect on the People and Meetings tab: R11. |
| -69 | CONFIRMED | |
| -70 | CONFIRMED | |
| -71 | CONFIRMED | Stays UNCONFIRMED (needs forced failure). |
| -72 | CONFIRMED | Duplicates -31/-66/-49 root cause; fine to keep as separate rows for lane assignment but fix once (OD-36). |
| -73 | CONFIRMED | |
| -74 | CONFIRMED | No `mentor/profile`, `contacts`, `courses`, `allQuizzes`, `fileExplorer` directories; stays UNCONFIRMED on exact response. |
| -75 | CONFIRMED | |
| -76 | CONFIRMED | |
| -77 | CONFIRMED | |

## 3. MISSED gaps (not in Round A)

IDs continue Round A's prefix with an R.

| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-R01 | A final delivery approved through the Mentor route can probably not be reopened by the same mentor, and no LOCKED event is written. The mentor "Review final delivery" dialog posts to `.../submissions/{id}/mentor-decision`, which updates only `status` and `updatedAt` on approve. `lockedAt` is set only by the other review route (`reviewProjectSubmission`), and `reopenApprovedDelivery` rejects any submission without `lockedAt`. The workspace still shows "Reopen for revision" to mentors on APPROVED, unevaluated, ACTIVE-project deliveries, so the click would fail with a generic invalid-state error. Legacy lets the mentor reopen an Accepted submission with a confirm (`Reopen this submission for revision?`). | PERMISSION | S2 | PDC:10142-10209 (Reopen for revision, Popconfirm "The learner will be able to edit and resubmit it."); IMPL delivery reopen via `updateProjectDelivery` action REOPEN | `mentor-final-delivery-decision-service.ts:37-41` (status only); `submission-service.ts:502` (only writer of `lockedAt`); `delivery-reopen-service.ts:31` (`!latest.lockedAt` => `PROJECT_SUBMISSION_INVALID_STATE`); `project-workspace.tsx:890` (control shown for non-learner modes); `project-final-delivery-controls.tsx:344` (mentor path) |
| MEN-projects-meetings-R02 | Meeting double-booking check is per project, not per organizer. Legacy blocks a meeting that overlaps ANY other meeting of the same organizer on any workspace they mentor ("This meeting time conflicts with another meeting for the same organizer"); a mentor of several teams can double-book across projects in vNext. Round A part 2 section 17 lists the overlap check as an improvement without this scope loss. Learner requests are checked only against the requester's own requested/scheduled meetings. | VALIDATION | S3 | IMPL:6902-6919 (`requireNoOrganizerConflict`, organizerId over date range); `ProjectMeetingRepository` comment "workspace they mentor, not just the one being edited"; lines 3070-3084 (request path also checked) | `meeting-service.ts:189,236,261` (filter `projectId = scope.project.id`); `mentor-meeting-reschedule-service.ts:51-55` (same) |
| MEN-projects-meetings-R03 | The schedule dialog has a free-text "Time zone" box (any string up to 80 characters, never checked against real zones) while the start and end `datetime-local` values are read in the mentor's browser zone and converted with `new Date(value).toISOString()`. The label can therefore contradict the instant, the team tab prints that label next to an en-IN formatted time, and the reschedule dialog uses IST instead. Legacy has no such field: the zone is stamped from the browser and shown ("Times are in {tz}"). Decision 2 says IST everywhere. | VALIDATION | S3 | PDC:3660 (`timezone: Intl...resolvedOptions().timeZone` on save), 10421 ("Times are in {tz}" helper) | `project-meeting-controls.tsx:34-47,126-140`; `validation.ts:727-731` (`timeZone` min 1 max 80 only); `mentor-meeting-reschedule.tsx:55,64` (IST) |
| MEN-projects-meetings-R04 | The People and Meetings tab shows "Join meeting" for every meeting that has a URL, including CANCELLED and COMPLETED ones (the cancel transition keeps `meetingUrl`). Legacy hides Join for completed, missed and cancelled meetings, and the vNext calendar page already hides it for CANCELLED. | STATE | S3 | PDC:6412-6496 (`joinUrl && !isPastLocked`) | `project-workspace.tsx:1094` (no status check); `meeting-service.ts:367` (cancel sets status only) |
| MEN-projects-meetings-R05 | COMPLETED projects look editable. The workspace read-only banner and control hiding key off `status === "ARCHIVED"` only. For COMPLETED the server refuses execution writes (task create, sprint start/complete, `projectAllowsExecution`) but still accepts resources and meetings, so a mentor sees the same controls, no explanation, and mixed generic errors. Legacy has no COMPLETED state, so there is no equivalent message; the gap is vNext-internal consistency. | STATE | S3 | PDC:856-860 (archived message "This workspace is archived, so it is read-only." is the only lock) | `project-workspace.tsx:181-186,293`; `mentor-task-create-service.ts:36`; `mentor-sprint-write-service.ts:98`; `resource-service.ts:45-50`; `meeting-service.ts:34-40` |
| MEN-projects-meetings-R06 | The Execution block has no empty state. With zero releases (legacy-migrated or template-less workspaces) it renders the heading and nothing else, and because "Add sprint" lives inside a release article a mentor has no control at all on Releases and Sprints, Board or Task Allocation. Legacy shows "No sprints yet. Add the sprints this project should be measured against..." and "Add sprint". Extends -32/-36. | STATE | S3 | PDC:7644 ("No sprints yet..." Empty with Add sprint), 8119-8130 (board empty states) | `project-workspace.tsx:474-485` (`workspace.releases.map` with no fallback) |
| MEN-projects-meetings-R07 | Concurrency is not guarded on resource edit/archive, meeting create/schedule and release ship/unship, and the "Meetings" / "Resources" writes carry no version token, unlike legacy (`resourcesToken`, `meetingsToken`, per-row `version` with 409 "Someone else changed..."). Round A part 2 section 17 says all writes use optimistic concurrency with confirmation on mentor routes; that holds for tasks, sprints, assignee, reschedule, notes, decisions, but not these. Two mentors can silently overwrite each other. | VALIDATION | S3 | PDC:3362 (`assertProjectEditorVersion("Resource"...)`), 3605 (`"Meeting"`) | `scheduleProjectMeetingInputSchema` (`validation.ts:774-785`) has no `expectedUpdatedAt`; `project-resource-controls.tsx:270-282` PATCH body has none; `ReleaseLifecycleActions` posts no token |
| MEN-projects-meetings-R08 | List search and filters promise more than they do. The placeholder copy "Search project title, course or slug" is legacy wording, but vNext matches title, slug and summary (no course on instances, so the promise is false). Status "Current only" also hides COMPLETED (legacy: only archived). There is a visible Apply button instead of live 350 ms search, and "Clear filters" is always shown (legacy: only when a filter is set). | VALIDATION | S3 | PC:264 (placeholder), 277 (`CURRENT` option), 299 (Clear filters only when a filter is set); backend `ProjectWorkspaceRepository` status clause: CURRENT = not archived | `project-participant-list-controls.tsx:58,178-190`; `mentor/projects/page.tsx:139,153-156` |
| MEN-projects-meetings-R09 | No estimation unit. Legacy workspaces have POINTS or HOURS; the estimate picker offers a Fibonacci or hours scale and cards say "5 pts" or "4 hrs". vNext tasks take any integer 0 to 1000 with no unit or label and show nothing on cards (see -41). | MISSING-FIELD | S4 | PDC:185-190 (`taskEstimateOptionsFor`), 365 (card text "n pt/pts" or "hr/hrs") | `mentor-task-create.tsx` Estimate `<Input type="number" min=0 max=1000>`; no unit column in `projectInstances` |
| MEN-projects-meetings-R10 | Query strings from legacy-style links are rejected rather than ignored: `status=IN_PROGRESS\|READY\|BLOCKED`, `pageSize=10` and zero-based `page` (legacy `page=0` is first page) make the strict schema fail, and the page renders "Invalid Project filters" with a Clear link. Legacy URL state is `search`, `status`, `attention`, `page` and ignores unknowns. | STATE | S4 | PC:157-166 (URL hydration: string params used as-is, `page` clamped with `Math.max(0, Number(q.page) || 0)`) | `mentor-project-list-query.ts:6-15` (`.strict()`, fixed enums); `projects/page.tsx:44-52` |
| MEN-projects-meetings-R11 | On the People and Meetings tab a SCHEDULED meeting whose time has passed keeps the plain "Scheduled" badge and the Reschedule/Complete controls; legacy shows MISSED, locks edit and offers "Add notes". Round A -68 covers only the Meetings page. | STATE | S4 | PDC:2017 (`meetingDisplayStatus`), 6445 and 6489-6493 (isPastLocked, "Add notes") | `project-workspace.tsx:1049-1070` (raw `meeting.status`), `project-meeting-controls.tsx` |

## 4. WRONG and SEVERITY-CHANGE details

- **MEN-projects-meetings-63 (SEVERITY-CHANGE S3 to S4, evidence corrected).** Round A says the `lockedAt` column is "unused by any control". It is written on approval by `reviewProjectSubmission` (`submission-service.ts:502`, with `reopenedAt: null`), read as a precondition by `reopenApprovedDelivery` (`delivery-reopen-service.ts:31`) and has a LOCKED activity type (`delivery-activity-model.ts`). Because APPROVED already blocks learner edits, the missing explicit "Lock submission" button and Accepted/Locked split are S4 under the exact-wording rule at most. The real defect is that the Mentor approve route skips that write: R01 (S2).
- **Part 2 section 17 (not a gap row, correction for the register).** (i) "Meetings: overlap check against other scheduled meetings" is per project only (R02); the legacy check is per organizer across projects. (ii) "All writes use optimistic concurrency ... on mentor routes" is true for tasks, sprints, assignee, reschedule, notes, decisions and reviews, false for resource edit/archive, meeting create/schedule and release ship/unship (R07). (iii) "Task completion is review-gated" is correct; note that a mentor also cannot change status of tasks in PLANNED sprints (`mentor-task-status-transition.tsx` returns null unless the sprint is ACTIVE; legacy allows any lane at any time), which Round A does not list; low priority, S4, add to -39 when the board work is scoped.
- No Round A gap was found WRONG (vNext already does it, or legacy does not).

## 5. UNCONFIRMED items and how to confirm (batch for the live check)

| Item | How to confirm |
|---|---|
| R01 reopen after mentor approval | On dev: as Mentor approve a SUBMITTED final delivery (dialog "Review final delivery"), then click "Reopen for revision" and read the error; DB: `select locked_at from project_submissions where id=...` is null after a mentor approve and set after an admin approve. Re-run after the staged admin lock route lands. |
| R02 cross-project overlap | Seed a mentor on two projects; schedule an identical slot in both; expect success in vNext, failure in legacy dev. Legacy live check with owner sign-in is optional (code evidence is explicit). |
| R03 time zone | Open the schedule dialog with the browser set to UTC, type "Asia/Kolkata", save; compare stored `starts_at` with what the Team tab prints. |
| R04, R05, R06, R11 | Seed a cancelled meeting, a COMPLETED project and a project with no releases (or a template without releases) and open the Team, Board and Sprints tabs at 1280 and 375 px. |
| R07 | Two browser sessions as Mentor and Co-Mentor edit the same resource and the same meeting; expect last write wins in vNext, 409 in legacy. |
| Round A -11, -71, -74 | As listed in Round A section 18 (reviewer-kind member, forced source failures, `/mentor/profile` response). |
| Legacy dev tip vs prod | Gaps citing dev-only features (Task Allocation, releases, sprint lifecycle, activity date range) rely on dev tip source `lms2-fe@lms-dev-2026` (63fea105); confirm on the deployed old LMS dev site that these are live before treating them as parity targets (decision 7 says dev-only is in scope). |
