# Mentor prototype pass 5 — implementation coverage vs exact-match acceptance

**Updated:** 2026-10-24 · **Branch:** `main` per owner's explicit directive · **Reference:** uploaded `42LMS pages prototype.html` (56 screens, Mentor #45–56). Original SHA-256 `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`.

## Verdict
**0 / 12 Mentor screens fully verified and closed.** All 12 have real implementation contributions. This is not evidence that their complete HTML/CSS/behavior matches the prototype.

**Source audit:** 31/31 scoped assertions passed by re-reading GitHub source after the continuation; not executed tests, not strict TS, not browser. Typecheck/lint/CI status is **unknown**; don't report green.

## New functional work this pass
- Board: six compact lanes, grouped per-sprint/backlog List, keyboard J/K navigation, keyboard A/S review triggers, live search, selected task pane, existing server-side CAS reviewer actions and full task/comment dialog.
- Sprints & Releases: source-backed sprint bar charts and backlog; moved existing start/complete/reopen and ship/unship actions into section, active Mentor-only.
- Projects home: student-specific blocked/review watch from scoped active learner memberships, replaces aggregate placeholder.
- Project Overview: learner-facing persisted authored brief, goal, deliverables, completion conditions, personas and dates; latest Mentor-authored updates.
- Activity: new active-Mentor-only, permission-checked `POST /api/projects/[projectId]/mentor-updates`; 1–1000 character message persisted as a scoped PROJECTS event. No notification/email claim.
- Final review: real attachment references and chronological review history; user-supplied URLs allowed only if safe; guarded Accept/Request changes and feedback chips retained.
- Performance: interactive All, Current, Last Four or one sprint view over actual task rows; authorization-controlled allocation editor kept.
- Meetings: previously added ICS and real notes/request/history links maintained.
- Search: `/mentor/search`, bounded cross-project project/task/student/resource results, verifies assigned Mentor project IDs and active member/role; existing topbar keyboard flyout links to search.

## Pass 6 correction — meeting facilitation exists in the database

The prior claim that attendance and action-item storage were absent was **incorrect**. Current `project_meetings.facilitation` is typed by `mentorMeetingFacilitationSchema`, with stored attendees, actionItemRows, retroActions, notes, wentWell, retroDidntGoWell, improve, nextTime and followUp fields. `ScheduleProjectMeetingControl` already edits and saves them. The Mentor calendar now loads and displays agenda, outcome, attendees, structured action rows, retro notes, follow-up and a deep link to the real editor at `?tab=team#meeting-<id>`. This is source-verified, not browser-verified.

## Mandatory unresolved prototype requirements (implementation is not complete)
1. **#47 Board:** exact task approval/send-back experience in persistent pane (current guarded decision confirmation modal), sprint-to-sprint drag in List view, exact modal/keyboard/focus design.
2. **#48 Sprints:** new sign-off dialog now requires pending task reviews to be resolved, previews unfinished tasks moving to backlog, persists an optional note in the scoped sprint activity transaction, and can start the next planned sprint as a separate explicit mutation with partial-success handling. Still missing exact per-task prototype choices (“next sprint”, “backlog”, “drop”) and atomic one-step sign-off/next-sprint semantics.
3. **#49/#54 Meetings:** structured attendance, retrospective notes, action rows, and follow-up fields already persist in `project_meetings.facilitation` and can be edited in the existing authorized meeting editor. The calendar selected-detail pane now renders these recorded values. Still missing: provider-backed recurring Google Calendar/Meet creation and invite sync, and the prototype's fully inline meeting editor.
4. **#50 Performance:** prototype-specific student risk explanations and auto-assign result presentation; filters now implemented but not verified at runtime.
5. **#51 Resources:** exact pinned group, share/upload modal states, private signed previews and earlier-sprint presentation.
6. **#52 Activity:** “new since last looked” persisted watermark, complete pagination/time period grouping, source-backed comments count and delivery to student notifications.
7. **#53 Final submission:** zoom/full-screen previews for safe authorized stored artifacts, exact lock/reopen dialog UI, evidence and review panel action placement.
8. **#55 Notifications:** merged chronological read-state across announcements, project attention and personal notifications rather than source-specific unread only.
9. **#56 Everywhere:** prototype inline universal search overlay vs current scoped results page; account detail edit/switch modal geometry, keyboard result selection and visual alignment.
10. **#45/#46 Home/Overview:** exact per-student last activity and health forecasts require verified source data; do not fake prototype's sample time/point forecasts.
11. **All:** actual captured vNext page and interaction states at the reference desktop viewport, side-by-side comparison with real prototype frames, visual corrections, mobile and accessibility checks.
12. **All:** `npm run typecheck`, `npx tsc -p tsconfig.strict.json --noEmit`, `npm run lint`, unit, DB and e2e tests must PASS on the latest main; no successful run was observed.

## Pass 7 — sprint sign-off behavior implementation
- The migrated `completeProjectSprint` transaction already moves all unfinished work to the product backlog, and records the carry count in project activity. That behavior was previously obscured by the generic "Complete sprint" button.
- Added `MentorSprintSignOff` with pending-review list and Board link, an explicit unfinished-task backlog preview, optional team-facing sign-off note (up to 1,000 chars), and a checkbox to start the next planned sprint.
- The existing completion endpoint now accepts strictly validated optional `note`; the service records it as a scoped project activity event in the same transaction as sprint completion.
- Starting the next sprint is a **separate** request, not falsely described as atomic; on partial failure the UI states that the sprint was completed and the next was not started.
- Exact prototype per-task Sprint N / Backlog / Drop selection is not implemented until a validated task reassignment/discard backend workflow can back it.
- These are source-verified changes only; CI, browser and screenshot acceptance remain unverified.

## Release gate
- A `src/` edit plus source assertion can be **IMPLEMENTED / UNVERIFIED**, never `CLOSED`.
- For each screen, a named real tester and evidence must confirm (1) functioning route and permissions, (2) precise reference visual geometry, (3) all actions/missing/empty/readOnly/error/stale states, (4) latest clean CI; only then mark VERIFIED.
- No fake labels, hardcoded prototype fixtures or mock completion percentages should be used to satisfy these requirements.

## Recommended next execution order
1. Obtain a running disposable vNext Mentor fixture and authoritative CI status.
2. Fix any strict TypeScript/lint failures from latest `main` first.
3. Verify existing persisted meeting facilitation actions from calendar selection, then complete provider-backed calendar sync and sprint carry-over/review state models.
4. Verify #45–56 visually and functionally, correct screenshot diffs, then close individually.
