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

## Mandatory unresolved prototype requirements (implementation is not complete)
1. **#47 Board:** exact task approval/send-back experience in persistent pane (current guarded decision confirmation modal), sprint-to-sprint drag in List view, exact modal/keyboard/focus design.
2. **#48 Sprints:** prototype sign-off note, unfinished task carry-over flow and start-next-sprint checkboxes. Existing lifecycle endpoints alone do not reproduce these distinct states.
3. **#49/#54 Meetings:** recurring Google Calendar/Meet integration, invite sync, attendance, retrospective sections, action items and task assignment persistence. Current meeting schema does not represent those independently.
4. **#50 Performance:** prototype-specific student risk explanations and auto-assign result presentation; filters now implemented but not verified at runtime.
5. **#51 Resources:** exact pinned group, share/upload modal states, private signed previews and earlier-sprint presentation.
6. **#52 Activity:** “new since last looked” persisted watermark, complete pagination/time period grouping, source-backed comments count and delivery to student notifications.
7. **#53 Final submission:** zoom/full-screen previews for safe authorized stored artifacts, exact lock/reopen dialog UI, evidence and review panel action placement.
8. **#55 Notifications:** merged chronological read-state across announcements, project attention and personal notifications rather than source-specific unread only.
9. **#56 Everywhere:** prototype inline universal search overlay vs current scoped results page; account detail edit/switch modal geometry, keyboard result selection and visual alignment.
10. **#45/#46 Home/Overview:** exact per-student last activity and health forecasts require verified source data; do not fake prototype's sample time/point forecasts.
11. **All:** actual captured vNext page and interaction states at the reference desktop viewport, side-by-side comparison with real prototype frames, visual corrections, mobile and accessibility checks.
12. **All:** `npm run typecheck`, `npx tsc -p tsconfig.strict.json --noEmit`, `npm run lint`, unit, DB and e2e tests must PASS on the latest main; no successful run was observed.

## Release gate
- A `src/` edit plus source assertion can be **IMPLEMENTED / UNVERIFIED**, never `CLOSED`.
- For each screen, a named real tester and evidence must confirm (1) functioning route and permissions, (2) precise reference visual geometry, (3) all actions/missing/empty/readOnly/error/stale states, (4) latest clean CI; only then mark VERIFIED.
- No fake labels, hardcoded prototype fixtures or mock completion percentages should be used to satisfy these requirements.

## Recommended next execution order
1. Obtain a running disposable vNext Mentor fixture and authoritative CI status.
2. Fix any strict TypeScript/lint failures from latest `main` first.
3. Finish persisted meeting attendance/action items/calendar integration and sprint carry-over/review state models.
4. Verify #45–56 visually and functionally, correct screenshot diffs, then close individually.
