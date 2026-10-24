# Mentor prototype — exhaustive functional gap analysis (excluding visuals)

**Audit date:** 2026-10-24 · **Code baseline:** `42Students/lms-vnext@main` · **Reference:** user-uploaded `42LMS pages prototype.html` SHA-256 `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`. Actual decomposed HTML screens `45-mentor-template.html` through `56-mentor-template.html` were inspected, including rendered copy, HTML controls, `sc-camel-on-click` bindings, and inline DCLogic state. No stock/web images were used as substitutes.

## Interpretation and evidence policy

This is **functionality/data/backend/UI-state scope, NOT pixel or CSS fidelity**. The original HTML is a mixture of interactive DCLogic demo state and *non-interactive* static controls. A visible button demonstrates an intended affordance; it **does not establish an implemented backend or exact business rule**. Prototype counts/names and dates are examples, not production fixtures.

Statuses used below: **GAP** = named prototype capability has no equivalent interaction found in inspected vNext surface; **PARTIAL** = related capability exists but differs materially; **VERIFY** = code path exists but running result, role gate or edge case has not been proved. Prior source-contract checks are not TypeScript/build/DB/Playwright passes. **P0** = core functional/data correctness, safety or acceptance blocker; **P1** = material feature parity; **P2** = polish/secondary nonvisual state. Each unchecked line is work or verification still outstanding; no unchecked item can be considered closed just because related code exists.

### Quantified input inventory

All 12 actual prototype HTMLs were inspected. An independent inventory extracted **306** buttons/links/inputs and **44** explicit `sc-camel-on-click` bindings across the screens (some controls are repeated in shared headers and some are static/unbound). Per screen: #45 11 controls, #46 28, #47 39, #48 41, #49 42, #50 19, #51 37, #52 22, #53 27, #54 25, #55 6, #56 9. This is **an evidence inventory, not 306 distinct acceptance features**.

## Executive blockers: address these before accepting any screen

- [ ] **X-01 P0 — Build / strict-TS / latest CI unknown.** No confirmed clean `npm run typecheck`, `tsconfig.strict.json`, lint, current CI or database-backed integration result for these latest changes. Run and fix; source-only contracts are insufficient.
- [ ] **X-02 P0 — Real authenticated workflow suite missing.** Cover Mentor, read-only faculty guide, college admin shortcut, removed Mentor, wrong tenant, archived/completed project, stale version, competing tabs and partial failures on each mutation.
- [ ] **X-03 P0 — Sprint historical metrics are potentially incorrect.** `MentorPrototypeSprintPlan` computes planned/done points by `task.sprintId===sprint.id`. `completeProjectSprint` moves unfinished tasks to the next sprint/backlog or archives them; historical planned totals therefore change after sign-off. Build immutable sprint commitment/velocity snapshots (or event reconstruction) and test all three dispositions. Also review last-four/per-student carry counts.
- [ ] **X-04 P0 — Notifications are not a unified read model.** Personal inbox has persisted `readAt`; project attention and college announcements do not share a recipient-specific read state. The prototype's single unread count and Mark all read cannot be treated as complete until persistence, fan-out and per-source semantics are defined.
- [ ] **X-05 P0/P1 — Real Google Calendar/Meet integration absent.** Prototype explicitly depicts a connected Google Calendar, automatic Meet link, team calendar additions, invitations and 1-hour reminders, recurring reviews. Current UI truthfully requires a supplied link or draft and offers `.ics`; implement provider-backed OAuth/consent/calendar write/recurrence/idempotency/error paths before claiming these behaviors.
- [ ] **X-06 P0 — Task review/finish semantics and state transitions must be proven in DB.** Run sign-off NEXT/BACKLOG/DROP, stale task token, review-pending block, duplicate IDs, shipped release, archive and rollback scenarios. Run task approve/send-back with feedback, permission and CAS tests.
- [ ] **X-07 P1 — Mentor project attention signal coverage incomplete.** `mentor-attention.ts` derives only REVIEW final submission, STALLED, REQUESTED, MEETING_SOON. The prototype separately lists sprint sign-off, blocked individual task, review-pending task and unassigned next-sprint work.
- [ ] **X-08 P1 — Unified actionable search UX not proven.** Authorized `/mentor/search` returns project/task/student/resource results, but the prototype shows *in-place Ctrl+K grouped results* that navigate straight to a person or task; current search results generally link to containing Board/Team, not focused entities.
- [ ] **X-09 P0 — Missing end-to-end notification delivery verification.** Verify final submission and meeting request send email where the prototype says email; in-app task reviews, blocked alerts and college announcements should not falsely claim email. No send/delivery or unsubscribe checks observed.
- [ ] **X-10 P0 — Exact prototype functional state matrix not executed.** For every #45–56 route, test the controls in default, empty, filtered, loading, error, disabled, archived/read-only, and post-mutation states, plus keyboard/focus. Visual matching is a separate subsequent gate.

## #45 — Projects / focus queue / teams / this week / students to watch

Source: `45-mentor-template.html`; current: `mentor/projects/page.tsx`, `mentor-prototype-home.tsx`, `project-list.tsx`, `mentor-attention.ts`, student-watch/last-activity services.

- [ ] **45-01 P1 PARTIAL** Match prototype five specific attention classes: final submission, sprint sign-off, task waiting for approval, blocked task, meeting request. Current alert kind model lacks several direct classes; extend source queries, priority/age and action deep links.
- [ ] **45-02 P1 PARTIAL** "Needs you · oldest first": verify real oldest-first ordering *within severity* and that per-project actions take user to the exact pending task/sprint/meeting, not merely its project tab.
- [ ] **45-03 P1 PARTIAL** Prototype's Later hides a specific event until it changes. Current `localStorage` snooze uses `key@occurredAt`; test event revision/reopened handling, cross-tab and cross-device behavior and recipient read policy.
- [ ] **45-04 P1 PARTIAL** Team segmented chips Current / Need you / At risk or blocked / Final submission stage / Archived and empty states. Verify the actual server+client filters match those membership-scoped predicates and archived expansion counts.
- [ ] **45-05 P1 PARTIAL** "This week · 9 meetings" gives upcoming joins, meeting requests and review/retro summary. Current right rail derives only `MEETING_SOON` attention (next ~48 hours), not all meetings over the week. Use authorized calendar query.
- [ ] **45-06 P1 PARTIAL** "Students to watch · last 3 sprints": no moves in N days, consecutive carryovers and one student's share of open tasks. Current watch reports blocked and IN_REVIEW counts only. Implement defensible historical signals with timestamps and participation context, not invented risk scores.
- [ ] **45-07 P1 VERIFY** Student count vs membership count vs unique students across teams; avoid double-counting multi-team memberships and read-only mentors.
- [ ] **45-08 P1 VERIFY** Per-team sprint tracker, progress denominator, warning state and last recorded event; test imported/missing/archived sprint data.
- [ ] **45-09 P2 PARTIAL** Prototype greeting, course labels, team lead, archive link and contextual descriptions are not fully data-backed as shown; distinguish known data from unavailable fields.
- [ ] **45-10 P0 VERIFY** Empty roles, cross-college projects, large pagination, snoozed-until-change and closed project access.

## #46 — Project Overview

Source `46-mentor-template.html`; current project route + `MentorPrototypeProjectOverview`/`ProjectBrief`, workspace header.

- [ ] **46-01 P1 GAP** Forecast panel: done *of planned-to-date*, signed-off sprint count, actual velocity trend, planned next two sprint points and estimated finish vs final due. Existing count/percentage is not equivalent; implement defensible velocity and forecast or label data insufficient.
- [ ] **46-02 P1 PARTIAL** Current sprint six-state breakdown needs counts and blocked age, with links to exactly those tasks; verify scopes for ended/pending-sign-off vs ACTIVE sprint.
- [ ] **46-03 P1 PARTIAL** "Needs you on this project" should show approvals, sign-off, blocked help, meeting request and unassigned next-sprint tasks, with individual Later. Current overview actions cover a subset and lack that full queue.
- [ ] **46-04 P1 PARTIAL** About this project includes Goal, Deliverables, Done looks like, Who it's for, dates, sprint cadence, estimates and next step; stored brief is rendered, but the prototype Edit entry point and full edit/post-save experience need confirmation.
- [ ] **46-05 P1 GAP** Compact per-student "Team · Sprint 12" progress/assignment preview and direct Performance deep link; current standalone Team tab is not the same overview mini-table.
- [ ] **46-06 P1 PARTIAL** Next meeting: attendee/invite status, agenda, duration, Join and Open actions; current summary chiefly shows title/time and generic Team link.
- [ ] **46-07 P1 PARTIAL** Final submission readiness: signed-off X/Y, shipped releases X/Y, due-date gating and who can submit. Current summary primarily shows latest submission version/status.
- [ ] **46-08 P1 PARTIAL** Latest activity: event actor/time/link and task/meeting/sprint action; current overview shows latest *Mentor-authored posts* only.
- [ ] **46-09 P1 VERIFY** Shared "+ Add" and "⋯" affordances: add task/sprint/resource; edit details and "view as students see it" with permission scope and correct student role simulation.
- [ ] **46-10 P0 VERIFY** Overview availability on completed, archived, not-yet-started projects and viewer-only mentors.

## #47 — Project Board / List / focused task

Source `47-mentor-template.html`; current `mentor-lane-board.tsx`, task detail dialog, lifecycle actions.

- [ ] **47-01 P1 PARTIAL** Sprint picker grouped by release, Sprint N + backlog, All sprints, task totals, expanded scope memory. Board/List and sprint filter exist; confirm release grouping and exact scope behavior.
- [ ] **47-02 P1 PARTIAL** Six status lanes plus their per-lane *4 visible / +more* behavior; vNext global 150-task limit is not the same per-lane reveal/pagination and can bias one lane.
- [ ] **47-03 P1 GAP** Drag a List-view task into another sprint. Current List uses collapsible sprint groups and status select; no equivalent sprint-to-sprint drop interaction was found.
- [ ] **47-04 P1 PARTIAL** Filter by assignee/everyone, task type and priority; verify correct AND semantics, cleared controls and query-persistent scoped counts.
- [ ] **47-05 P1 PARTIAL** Focused task panel: actual sprint/date, acceptance criteria as checkable items, approach, submission preview/evidence, owner change, blocker age, and complete history. Existing pane is primarily descriptive and pushes some actions into a generic full dialog.
- [ ] **47-06 P1 GAP** Pane action "Move to Sprint 13" with authorized target sprint and carry provenance, not simply a task status change.
- [ ] **47-07 P1 PARTIAL** "Reply with a way round it" and "It's unblocked: back to In progress" as explicit contextual actions with required status/comment audit; current board has generic move controls/comments but lacks these named pane actions.
- [ ] **47-08 P1 PARTIAL** Approve A/Send back S require latest submitted evidence, feedback on send-back, concurrency, permissions and next-awaiting-task focus; guarded dialogs exist but exact sequential focus/feedback result needs test.
- [ ] **47-09 P1 VERIFY** J/K navigation skips edit fields/modal and respects selected sprint/lane/filter; test focus, keyboard repeat, long board and mobile equivalents.
- [ ] **47-10 P1 VERIFY** Drag/drop state mutation, keyboard status move, optimistic concurrency, blocked-status rules and rollback after API rejection.
- [ ] **47-11 P1 VERIFY** All 16+ sprints' history, opening collapsed groups on demand without silently omitting items after global paging.
- [ ] **47-12 P0 VERIFY** Observer/read-only and archived project: cannot approve/reassign/reopen/alter submission despite directly navigating URLs.

## #48 — Sprints & releases / sign-off / ship / planning

Source `48-mentor-template.html`; current SprintPlan, MentorSprintSignOff and lifecycle service.

- [ ] **48-01 P0 GAP/DEFECT** Preserve historical points planned/done and carry-over when unfinished tasks move/are archived; current `task.sprintId` summaries mutate old sprint counts (see X-03).
- [ ] **48-02 P1 PARTIAL** Release chips/status filters, release rows, search "Find a sprint, release or task"; standalone search field absent from promoted summary surface.
- [ ] **48-03 P1 PARTIAL** + Release, + Sprint, Edit/Plan it launch from contextual row (existing workspace editors may exist lower in page); verify target release, project membership and constraints.
- [ ] **48-04 P1 PARTIAL** Sign-off pending approvals, per-task NEXT/BACKLOG/DROP, note and "Start next" are implemented; verify actual completed task count and each option persisted in a real transaction.
- [ ] **48-05 P0 VERIFY** Sign-off CAS: reject stale task versions, duplicated/missing choices, review task waiting, shipped release target, task outside current project, invalid current state and rollback.
- [ ] **48-06 P1 PARTIAL** Start next sprint follows a *second* API call (with explicit partial-success feedback), not atomic with sign-off as one user action. Decide expected transaction semantics and test retry safely.
- [ ] **48-07 P1 VERIFY** "Reopen Sprint 12" vs shipped Release 2; validate compensating state and reversal/undo after NEXT/BACKLOG/DROP, including archived DROPs and historical velocity.
- [ ] **48-08 P1 PARTIAL** Release 1/2/3 grouping, ship/un-ship prerequisites, completed-sprint folding/open, exact release version history and signoff audit notes.
- [ ] **48-09 P1 PARTIAL** "Plan a sprint" date window, target release, automatic weekly sequence, default title and backlog pull. Shared controls exist; contextual edit/plan and date/collision behavior need matching.
- [ ] **48-10 P1 GAP** Velocity guidance and carry ratio ("30 points/sprint, rising", "7 of 168 carried, 3 Ravi") calculated from immutable history, not hard-coded sample numbers.
- [ ] **48-11 P1 VERIFY** 16-sprint/3-release dataset, zero estimates, unplanned future sprints, partially shipped and no backlog scenarios.
- [ ] **48-12 P0 VERIFY** Authorization: students may plan but only qualified Mentor signs off/starts, completed/archived projects do not mutate, future sprint linkage is college/project scoped.

## #49 — Team & meetings

Source `49-mentor-template.html`; current TeamOverview and original `ProjectWorkspace` team/meeting controls.

- [ ] **49-01 P1 PARTIAL** Team rows need lead marker, registration/year/discipline, assigned tasks, per-sprint points and accurate "last active" user status. Current table substitutes "last task change", a different signal; do not call it online presence.
- [ ] **49-02 P1 VERIFY** + Add student/mentor must link to authorized student membership, invite/group assignment, role/lead transitions; verify no cross-college account additions.
- [ ] **49-03 P1 VERIFY** Team member ⋯ edit role/promote lead/remove with explicit task reassignment to unassigned and a preserved audit trail; existing controls require real permission/state tests.
- [ ] **49-04 P1 PARTIAL** Meetings by type All/Reviews/Retros/Planning/Standups/Other, chronological grouping, earlier-sprint expansion, requested slot count and filter persistence.
- [ ] **49-05 P1 PARTIAL** Inline asked-to-meet card with requested attendee, task linkage, suggested slot "Fri 3:00 PM, Lab 2", Another time, Answer in a comment; current workflow is split across calendar/project editor.
- [ ] **49-06 P1 PARTIAL** Meeting detail displays type/status, agenda/invited, Google Calendar sync/reminder state, Join, Move, Cancel. Structured meeting fields exist; sync state does not.
- [ ] **49-07 P1 PARTIAL** Past meeting notes: Went well, Didn't go well, action items with owner and checkbox, attendance and outcome/follow-up are persisted and shown, but the prototype inline full edit/save flow still requires verifying on page.
- [ ] **49-08 P1 GAP** Schedule by Sprint review/Retro/Planning/Standup/General with linked sprint, whole team vs selected invitees, weekly recurrence, Calendar/Meet auto-generation and reminder. Existing general quick scheduler is narrower; original editor does not provide verified provider sync.
- [ ] **49-09 P0 VERIFY** Scheduling overlap, timezone, future restrictions, stale project/meeting version, meetings in archived projects and read-only guides.
- [ ] **49-10 P1 VERIFY** Cancellation and reschedule states, visible notes, notification sent to active recipients; draft has no invites.
- [ ] **49-11 P2 VERIFY** Empty team, 2+ Mentors, imported meetings without facilitation metadata, removed student in notes, repeated sprints.

## #50 — Performance / assignments

Source `50-mentor-template.html`; current PerformanceTable and MentorTaskAllocation.

- [ ] **50-01 P1 PARTIAL** Range choices in prototype: Sprint 12, Last 4 sprints, Release 2, Whole project, plus pick sprints. Client has All/Current/Last Four/individual sprint, **not release range**.
- [ ] **50-02 P0/P1 GAP** Historical earned/assigned points for prior sprints after carry-over/reassignment; current task's `sprintId` and current assignee cannot reconstruct prior contributors/commitments reliably.
- [ ] **50-03 P1 PARTIAL** Per-person stacked Done/Waiting/Open points and total tasks done fractions; current table reports counts and a done points column rather than the full stacked proportional breakdown.
- [ ] **50-04 P1 GAP** Mini per-sprint point sparkline for each student and sample-based repeated low-load detection; build from audited historical task/sprint events or declare no trustworthy data.
- [ ] **50-05 P1 GAP** "Worth a look" explanations: repeated carries, workload concentration, testing/review assistance; current table has no contextual warnings.
- [ ] **50-06 P1 PARTIAL** Sprint 13 unassigned queue, skill/type hint, suggested learner per task, "Give it" and "Auto-assign the N" scoped to upcoming sprint. Existing allocation editor acts over *eligible project tasks*, not just next sprint.
- [ ] **50-07 P1 PARTIAL** Workload preview after proposed allocation ("Sprint 13 load · 33 pts planned") and explain why auto-assignment chose a person; current UI has a separate workload section and confirmation.
- [ ] **50-08 P1 VERIFY** Explicit assignment should notify recipients; no fake "they were told" from prototype sample copy.
- [ ] **50-09 P1 VERIFY** Moved/removed teammates, previously carried tasks, zero estimates, task history, review-state updates and students with no tasks.
- [ ] **50-10 P0 VERIFY** Authorization for bulk assign, optimistic concurrency, no duplicate distribution, partial failures and over-capacity safeguards.

## #51 — Resources

Source `51-mentor-template.html`; current `ProjectResourceList`, resource controls.

- [ ] **51-01 P1 PARTIAL** "Showing active", type, "shared by anyone", "seen by anyone" filters. Existing status/type/visibility/sprint/task/pin search exists, but **creator/"shared by" filtering was not found** in promoted directory controls.
- [ ] **51-02 P1 PARTIAL** Pinned references, Sprint 13, Whole project, earlier-sprint group counts and "show by sprint" hierarchy. Pinned/Other headings exist; full grouping and per-sprint expansion differ.
- [ ] **51-03 P1 VERIFY** Resource types Link/File/Document/Code/Note/Environment and mode-dependent fields, actual link/file upload, document URL, code path, inline note, setup/access note.
- [ ] **51-04 P1 VERIFY** "Required", Pin it, mentors-only visibility and student access restrictions; direct API tests for private resources and archived docs.
- [ ] **51-05 P1 VERIFY** Save as draft, share now, edit, archive, restore, move order; current generic editor has DRAFT metadata but location/submit path and state transitions need execution tests.
- [ ] **51-06 P1 PARTIAL** Resource items show owner+shared time, linked scope, status, required badge and open/download; test metadata availability and whether role visibility is grounded rather than synthesized.
- [ ] **51-07 P1 VERIFY** Earlier 31 completed-sprint resources fold, more rows and zero/filtered state; hidden items must never be lost during reordering or pagination.
- [ ] **51-08 P1 GAP** Private document/file preview for authorized members, signed storage links/expiry and safe fallback across PDF, spreadsheet and code formats; generic external links alone cannot reproduce every prototype open path.
- [ ] **51-09 P0 VERIFY** Upload validation/content type/size, unsafe URLs, broken links, unauthorized learner access, draft visibility, consistency after optimistic mutations.

## #52 — Activity

Source `52-mentor-template.html`; current activity reader, summary, update composer and local since-visit marker.

- [ ] **52-01 P1 PARTIAL** Seven category pills Everything/Tasks/Sprints/Team & meetings/Resources/Submission/Project details. Verify actual event taxonomy coverage and selected label mappings.
- [ ] **52-02 P1 GAP** "In any sprint" filter by recorded sprint IDs. Current `ProjectActivityFilteredList` has category, actor, date window and text search, **not sprint ID filter**.
- [ ] **52-03 P1 PARTIAL** "by anyone" added, but actor option set is derived from currently loaded events; loading older events may change choices and filtering only the loaded page can miss prior actor history.
- [ ] **52-04 P1 PARTIAL** 14 new since yesterday 6:30 PM. Current marker uses per-device `localStorage` and only loaded event rows; a durable recipient-specific cursor and cross-device semantics remain absent.
- [ ] **52-05 P1 PARTIAL** Day-grouped event feed, quoted comments, actors, time, action deep links, "Show week before" pagination. Current generic list supports paging but needs grouped timeline and event-specific links audited.
- [ ] **52-06 P1 GAP** "This week" summary specifically Tasks moved, Comments, Things shared and Quietest student. Current summary classifies event names into Task/Meeting/Resource/Other and lacks comments/quietest analysis.
- [ ] **52-07 P1 VERIFY** Post an update persists a Mentor-authored project event; confirm learners can read it, and verify notification delivery if requirement is that the team is told (currently no delivery is claimed).
- [ ] **52-08 P1 VERIFY** Timezone, imported event timestamps, all 1,240 events, same-millisecond cursor, deletion/redaction and paginated filter reset.
- [ ] **52-09 P0 VERIFY** Mutation same-origin, tenant isolation, recipient visibility and rate limits/spam content; archived/read-only Mentors cannot post.

## #53 — Final submission / review / lock and reopen

Source `53-mentor-template.html`; current DeliveryEvidence, FinalReviewControl, mentor evidence preview.

- [ ] **53-01 P1 PARTIAL** Submission identity "second try", authored-by team lead, timestamp, summary and submitter notes; page shows version/status but verify complete metadata and latest attempt ordering.
- [ ] **53-02 P1 PARTIAL** Click an evidence item to make it the active content preview; current attachment list/Zoom is not the prototype's selected Report/Video/Repo/Trial inline preview.
- [ ] **53-03 P1 PARTIAL** Formats PDF page navigator/zoom, embedded demo video, README/code preview and XLSX trial summary. Safe image/PDF iframe Zoom alone covers only a subset; providers can block embeds.
- [ ] **53-04 P1 PARTIAL** "Ready for review" prechecks: **all 16 sprints signed off, all releases shipped, all tasks done, due date**. Need real server-backed evidence/readiness states and hard gating, not display-only checks.
- [ ] **53-05 P1 PARTIAL** Previous review feedback compared against new evidence, changed/new artifact tags and revision-to-revision history; current history list is more generic.
- [ ] **53-06 P1 PARTIAL** Accept vs Request changes, four quick reason pills, required feedback on changes, explicit effect message and decision send; generic modal and reason chips exist but need exact workflow and reset/validation tests.
- [ ] **53-07 P0 VERIFY** Accept terminal state, submission lock, who can reopen, due date preserved across revision and immutable CAS status/actor auditing.
- [ ] **53-08 P1 VERIFY** Reopen for revision vs Lock it are both available when valid and absent/disabled in forbidden states; no direct unauthorized bypass.
- [ ] **53-09 P1 PARTIAL** Chronological draft/submission/review events and each attempt's artifacts; current summary displays a capped history excerpt.
- [ ] **53-10 P0 VERIFY** Private file access (signed URLs), source/demo URL safety, malicious attachments, stale reviewer, hidden archived projects, repeated submission and interrupted upload.

## #54 — Meetings across teams

Source `54-mentor-template.html`; current MentorCalendarPage, MeetingsCalendar, QuickSchedule, MeetingRequestActions, meeting facilitation editor.

- [ ] **54-01 P1 PARTIAL** True seven-day strip with event totals, next-review/retro groups and 19-meeting/11-hour weekly workload summary; the calendar has schedule/list/detail, but test aggregate/count semantics.
- [ ] **54-02 P1 PARTIAL** Filters all eight teams, meeting type, Coming up/Asked vs Past/Notes missing; verify team selection, note-incomplete predicate and pagination.
- [ ] **54-03 P1 PARTIAL** "Yes, this time" accepts requested window only with real join URL; "Another time" currently leaves calendar for project editor; "No, answer in a note" uses audited cancellation. Prototype implies direct answer flow and team calendar write.
- [ ] **54-04 P1 PARTIAL** Join, Move it, Cancel it in selected detail; confirm these preserve meeting version, state transition, organiser double-booking and notifications.
- [ ] **54-05 P1 PARTIAL** Who's coming vs Who came, attendance Yes/Didn't, notes, action items with owner, follow-up selector and Save. Structured `project_meetings.facilitation` **already exists** and is editable in the full project editor, but not yet fully inline in the selected calendar pane.
- [ ] **54-06 P1 GAP** Auto-created Meet URL, synced personal/team calendars, 1-hour reminder and recurring Every sprint meetings. Quick scheduler supports real link or draft only.
- [ ] **54-07 P1 PARTIAL** Schedule meeting by ceremony type and linked sprint with invitee choice. Calendar quick-add hardcodes GENERAL and does not expose all original scheduler fields.
- [ ] **54-08 P1 VERIFY** Invitation fan-out, cancellation/reschedule notifications, editing notes after completion, historical audit, no fake "team informed" results.
- [ ] **54-09 P1 PARTIAL** Global `.ics` includes scheduled/rescheduled meetings but is an export, not synchronization. Verify RFC5545 folding/import and cancelled-event updates.
- [ ] **54-10 P0 VERIFY** Cross-project overlap locking, IST parsing, DST/international-viewer display, project/membership revocation, stale status token and meeting request owned by learner.
- [ ] **54-11 P2 VERIFY** Meetings with no invitees, draft, cancellation, no agenda, old attendees/unknown names, and second mentor read-only.

## #55 — Notifications

Source `55-mentor-template.html`; current notifications page and toolbar.

- [ ] **55-01 P0 PARTIAL** A single All/Unread/Submissions/Meetings/Tasks & teams/From the college read model. Existing categories work across multiple sources but *Unread* is only personal inbox read state.
- [ ] **55-02 P0 PARTIAL** "Mark all read" should clear all badge/unread rows consistently, not only persisted personal notifications while urgent project attention remains separate. Requires recipient read records for each source.
- [ ] **55-03 P1 PARTIAL** Newest-first merged grouped-by-day feed with icon, title, source, time and action; current implementation shows separate announcement/attention/inbox sections.
- [ ] **55-04 P1 VERIFY** Opening a notification marks that exact item read, updates sidebar/bell count, and deep-links to final review/task/meeting; test across views and devices.
- [ ] **55-05 P1 GAP/UNVERIFIED** Actual email only for final submissions and meeting requests; test template, recipients, opt-out/preferences, deduplication and delivery vs mere UI explanatory copy.
- [ ] **55-06 P1 VERIFY** College announcement visibility, wrong-tenant notification, inaccessible archived project, stale item behavior and deleted user.
- [ ] **55-07 P1 VERIFY** Pagination, filter-specific counts and Mark all read behavior when the inbox is only partially loaded.
- [ ] **55-08 P2 VERIFY** Zero unread/empty categories, error retry, badge disappearance and notification age formatting.

## #56 — Everywhere / search / bell / profile

Source `56-mentor-template.html`; current TopbarCommandSearch, role shell, mentor search route, bell and account menus.

- [ ] **56-01 P1 PARTIAL** Ctrl/Cmd+K should show grouped STUDENTS/TASKS/GO TO results *in place*, with keyboard selection and direct navigation to a focused task/student. Existing command flyout links to `/mentor/search` and containing project tabs.
- [ ] **56-02 P1 PARTIAL** Full search includes teams, students, tasks and resources across Mentor-assigned projects; service does so, but task owner/context, filters, exact-match ranking, pagination and highlighted terms need verification.
- [ ] **56-03 P1 PARTIAL** Bell preview shows last few *merged* notifications with per-item actions and badge, See all/Join/Mark all read. Existing alert sources are heterogeneous and not yet merged into one persisted unread model.
- [ ] **56-04 P1 PARTIAL** Profile Details surface: name/contact phone/email, current college, number of teams and course names, Edit details and Sign out; current account menu routes may not expose an equivalent compact details/edit interaction.
- [ ] **56-05 P1 GAP** Google Calendar **Connected** state and manage/disconnect account flows, including OAuth failures/expiry and permissions. The prototype's "Connected" is example demo text; never hardcode as a production assertion.
- [ ] **56-06 P1 PARTIAL** Email preference "final submissions and meeting requests only" with actual persisted setting and send behavior; cannot infer from copy alone.
- [ ] **56-07 P1 VERIFY** Multi-role faculty+Mentor shell, TPO shortcut not activating TPO skin for non-TPO, correct role/college context after switching.
- [ ] **56-08 P1 VERIFY** Old Courses/Quizzes/Contacts/Files/Profile URLs redirect to Mentor Projects where required; route inventory and back/forward behavior.
- [ ] **56-09 P1 VERIFY** Ctrl+K focus/no duplicate modal, escape/outside close, navigation keys, screen reader semantics, inaccessible search hits and empty search results.
- [ ] **56-10 P0 VERIFY** Search and bell never disclose students or resources outside assigned Mentor workspaces, even under direct API request.

## Cross-screen end-to-end scenarios required to close functionality

1. [ ] New Mentor with 0 projects: every landing, search, calendar, notifications, resource and project-link empty state.
2. [ ] Active Mentor with 16 sprints/3 releases: start, plan, assign, block, submit/review, sign off with each carry disposition, ship, final submit, accept, lock, reopen.
3. [ ] Two mentors on same team and a faculty read-only guide: simultaneous edits, CAS rejection, meeting and task review permission behavior.
4. [ ] Student moved/removed mid-sprint: past contributions preserved; unassigned current tasks flagged; notifications and access revoked.
5. [ ] Mentor switching colleges/roles: no stale project/search/bell results, no unauthorized resource or private notes leaks.
6. [ ] Time-sensitive events: same-minute multiple activity events, next-day time zones, stale pending meeting requests and repeated calendar invites.
7. [ ] Notifications: submission/request email vs in-app-only task and blocked alerts, unified read marker, badge counts after open and mark-all.
8. [ ] Media: PDFs, videos, GitHub README, XLSX, uploaded files, signed URL expiry, unavailable external preview, unsafe URL rejection.
9. [ ] Scale: 50+ teams, 16+ sprints, 200+ tasks, 1000+ events, 46+ resources, pagination/filter/sort consistency, no hidden-row mutation losses.
10. [ ] Strict TS, lint, unit, DB integration, permissions and Playwright; no screen is accepted from source snapshots alone.

## Proposed implementation packets (dependency order)

**Packet A — baseline/tests and core correctness (P0):** establish clean main CI and authenticated fixtures; fix historical sprint snapshots and last-four calculations; test sign-off and review atomicity/CAS/rollback; audit tenant and role isolation.

**Packet B — prototype-local functional parity (P1):** complete #45/#46 attention signals and actions, #47 focused-task moves/unblock/details, #48 search and planning controls, #49 roster/meetings inline workflows, #50 release-range/sparklines/warnings and sprint-scoped allocation, #51 creator filters and resource grouping, #52 sprint filter/comment metrics/timeline, #53 readiness/history/artifact selector.

**Packet C — cross-screen identity, notifications and calendar (P0/P1):** unify persisted unread/recipient semantics and email policy; integrate Google Calendar/Meet OAuth, invitations, recurrence, reminders and sync status; wire #54 request/scheduler and #56 search/bell/profile to real supported data.

**Packet D — exhaustive acceptance:** test all the listed flows against the *actual* 12 prototype states; fix functionality and permissions first. Only after this functional audit passes begin pixel-level visual comparison, which is explicitly excluded from this document.

## Completion standard

Do **not** interpret "implementation exists" as "behavior is complete." No screen is functionally closed in this analysis. Report each checked item with (1) code commit, (2) authorization/backend test, (3) browser interaction evidence, (4) expected vs actual result, and (5) fixture/tenant context. Items labelled GAP/PARTIAL need implementation; items labelled VERIFY need tests and may reveal further defects. **0/12 Mentor screens have sufficient end-to-end acceptance evidence.**

## Continuation note — started-sprint selector source fix (2026-10-24)

- **Source fix, tests unexecuted:** Shared src/modules/projects/mentor-recent-worked-sprints-model.ts now returns the most recent four ACTIVE/COMPLETED sprints, rather than including future PLANNED sprint sequences. Both src/components/projects/mentor-prototype-project-summaries.tsx (Team last-four totals) and src/components/projects/mentor-prototype-performance-table.tsx (Last four filter) consume it.
- Added four cases in tests/unit/mentor-recent-worked-sprints-model.test.ts, including the 16-sprint prototype (11 completed, one active, four future planned), active/completed ordering, short/empty state and input immutability. **No Vitest/typecheck/CI/browser result has been observed.** The checkboxes above remain unchecked until those gates pass.
- **Important distinction:** This selector corrects future-sprint inclusion but does **not** fix X-03 / 48-01 historical commitment points shifting after per-task carry-over; that still requires a verified immutable snapshot or event-reconstruction design.

## Source continuation checkpoint (2026-10-24)

The sprint completion transaction now records an immutable sign-off workload snapshot before task NEXT/BACKLOG/DROP moves; Mentor sprint bars, per-student Performance and Team last-four stats use this persisted record. It represents the sign-off workload, not initial commitment. Historical completed sprints lacking snapshots display unavailable. Snapshot DB concurrency, permission and reopen tests remain to be executed.

The Mentor home weekly meeting rail now uses assigned-project calendar meetings through the end of the current IST week, rather than the 48-hour attention feed. Project Overview adds a learner sprint summary, actionable sign-off/assignment/request links and permitted meeting details. Activity exposes recorded sprint IDs and allows combining a sprint filter with actor/type/date filters; untagged events remain outside selected-sprint results.

Focused pure-model TypeScript compile checks and isolated Node assertions passed on local copies of the new snapshot/week models. Repository Vitest, DB tests, lint, strict build, authenticated browser and visual checks were not run. All existing acceptance checkboxes remain open, as does the overall Mentor 0/12 verified status.

### Further source changes in this batch

Project Overview now uses sign-off point history for a limited velocity estimate: at least three completed snapshots are required, latest four are considered, and the UI explicitly avoids claiming a delivery date. Three focused pure modules (snapshot, IST-week meetings, velocity) passed strict TypeScript checks and isolated Node assertions on local copies; full repository tests and persistent DB validation are still outstanding. A dedicated four-case Vitest model suite was authored for velocity. These changes do not close the original forecast, notification, calendar-provider or database acceptance requirements.
