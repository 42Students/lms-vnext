# Learner UI Surface Parity Ledger

> **Freshness warning — 2026-10-05:** the original Learner ledger baseline is now stale for final release. Current observed legacy heads are FE `1d563f75f10ede5dcc0a7b17ad65b75ea03dd07d` and BE `94af997f8f9529ffbe7da317fff47f86c16bcebf`. Historical `CLOSED` rows remain useful evidence, but no family is final-release valid until `docs/planning/learner-family-verification.md` is `VERIFIED` for that family against the current/frozen oracle.
>
> Read `docs/planning/clone-parity-protocol.md` before continuing.

> Operational source of truth for the Learner account parity pass.
>
> **Workflow:** inspect legacy `lms2-fe/prod-2026` + relevant `lms/prod-2026` behavior → compare the exact vNext surface → record every gap → fix it → add/adjust regression coverage → re-check parity → mark the row `CLOSED`.
>
> **Do not mark `CLOSED` merely because a route/component exists.**

## Baseline

- Legacy frontend: `42Students/lms2-fe@prod-2026`
- Legacy frontend audited SHA: `38cdd38e592a6f416c8e8e99ce36438f548ed577`
- Legacy backend: `42Students/lms@prod-2026`
- Legacy backend audited SHA: `36f93fc49dc93bfc8ad9f499a1247fbf7f98a1a9`
- vNext branch: `42Students/lms-vnext@main`
- Ledger introduced after vNext SHA: `6b602390d1b3d2e577991ce8698ea6f0eb2940f5`

Refresh the three heads before each new parity batch. If either legacy `prod-2026` head moved, diff the family from its last verified SHA, mark affected family evidence `STALE`, and re-audit it. Row-level `CLOSED` is historical evidence; final release additionally requires family-level `VERIFIED` evidence.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `UNCHECKED` | Exact legacy-vNext comparison has not happened in the current parity pass. |
| `AUDITING` | Currently being inspected; do not start another row in the same family unless intentionally parallelized. |
| `GAP` | Compared and one or more parity defects are known. |
| `FIXED` | Gaps were implemented, but the surface still needs final parity/browser/regression verification. |
| `CLOSED` | Re-compared against the current legacy baseline, regression expectation accounted for, and no required parity gap remains. |
| `BLOCKED` | Cannot close because of an external/infrastructure dependency. |
| `REDESIGNED` | Intentional deviation approved and documented after parity analysis. |
| `RETIRED` | Legacy artifact/redirect intentionally not reproduced as a product surface. |

Only `CLOSED`, `REDESIGNED`, and `RETIRED` are resolved.

## Operating rules for every chat

1. Read this file first for Learner work.
2. Refresh the legacy frontend/backend and vNext heads.
3. Start from the first non-resolved row unless the user explicitly chooses another row/family.
4. Set the row to `AUDITING` while comparing source + behavior.
5. Expand the row into newly discovered sub-surfaces **before coding** if the legacy page contains something not represented here.
6. Fix all gaps found for the row/family; never hide a legacy capability merely to make the checklist smaller.
7. Add or update tests where practical.
8. Re-check the exact legacy surface after the fix.
9. Mark `CLOSED` only after that second comparison. If browser/cloud verification is still required, use `FIXED` or `BLOCKED`.
10. Update this ledger, `docs/parity/learner.md`, and `docs/planning/account-surface-parity.md` in the same commit when status changes materially.
11. When chat context is ending, hand off the current row ID and the next unresolved row. The next chat continues from there; it does not restart inventory/audit work.

---

## L0 — Learner shell and navigation

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L0-001 | Exact legacy sidebar order + group-boundary separators | `studentNavigationMenu`, Sidebar | learner shell | CLOSED |
| L0-002 | Sidebar label + route: Courses | `/learn/courses` | `/learn/courses` | CLOSED |
| L0-003 | Sidebar label + route: Quizzes | `/learn/allQuizzes` | same | CLOSED |
| L0-004 | Sidebar label + route: Assignments | `/learn/allAssignments` | same | CLOSED |
| L0-005 | Sidebar label + route: Class Schedule | `/learn/calendar` | same | CLOSED |
| L0-006 | Sidebar label + route: Attendance | `/learn/attendance` | same | CLOSED |
| L0-007 | Sidebar label + route: My Placements | `/learn/my-placements` | same | CLOSED |
| L0-008 | Sidebar label + route: Projects | `/learn/projects` | same | CLOSED |
| L0-009 | Sidebar label + route: Notifications | `/learn/notifications` | same | CLOSED |
| L0-010 | Sidebar label + route: Profile | `/learn/profile` | same | CLOSED |
| L0-011 | Projects feature-flag visibility | Sidebar feature filtering | learner shell | FIXED |
| L0-012 | Placements feature-flag visibility | Sidebar feature filtering | learner shell | FIXED |
| L0-013 | Conditional Drive Day sidebar item | Sidebar + `getDriveDayMine` | coordinator assignment + learner Drive Day workspace | FIXED |
| L0-014 | Active sidebar highlight across nested routes | Sidebar | learner shell | CLOSED |
| L0-015 | Learner mobile sidebar/open-close behavior | Sidebar | learner shell | FIXED |
| L0-016 | Learner topbar/account switch/sign-out behavior | shared shell | authenticated shell | FIXED |
| L0-017 | `/learn` redirect to Courses | `src/pages/learn/index.js` | `/learn` | CLOSED |

## L1 — Courses list: `/learn/courses`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L1-001 | Page title/naming = Courses | Courses page | Courses page | CLOSED |
| L1-002 | Program context | Courses listing | Courses page header/filter | CLOSED |
| L1-003 | Semester selector | Courses listing | semester selector | CLOSED |
| L1-004 | Historical semester browsing | Courses listing | includeHistorical | CLOSED |
| L1-005 | Past-semester read-only signal | Courses listing | cards/detail | CLOSED |
| L1-006 | Regular vs Electives filter | Courses listing | course type filter | CLOSED |
| L1-007 | Search courses | Courses listing | search input | CLOSED |
| L1-008 | Course card name/code | Courses cards | learner course cards | CLOSED |
| L1-009 | Section/class metadata | Courses cards | learner course cards | CLOSED |
| L1-010 | Credits metadata | Courses cards | learner course cards | CLOSED |
| L1-011 | Elective badge | Courses cards | learner course cards | CLOSED |
| L1-012 | Course progress | Courses cards | learner course cards | CLOSED |
| L1-013 | Continue/next-learning cue | Courses cards | learner course cards | CLOSED |
| L1-014 | Card click opens Overview | Courses cards | `/[deliveryId]/home` | CLOSED |
| L1-015 | First-run/no-courses empty state | Courses list | learner list | CLOSED |
| L1-016 | Filtered-empty state | Courses list | learner list | CLOSED |
| L1-017 | Loading skeleton | Courses list | route loading | CLOSED |
| L1-018 | Request/error state + retry/back | Courses list | route error | CLOSED |
| L1-019 | Mobile card/filter behavior | Courses list responsive UI | learner list | FIXED |
| L1-020 | Instructor name on learner course card | CoursesContent learner card | learner course cards | FIXED |
| L1-021 | Course thumbnail + fallback image | CoursesContent CourseImage | no canonical course-image field yet | GAP |
| L1-022 | Electives group heading in mixed All view | CoursesContent | learner course list | FIXED |
| L1-023 | Show-more pagination after 48 cards | CoursesContent PAGE_SIZE | learner course list | FIXED |
| L1-024 | Malformed/incomplete legacy record warning | CoursesContent | normalized vNext relational model | REDESIGNED |
| L1-025 | Invalid credit warning/exclusion | CoursesContent | typed non-negative vNext credit model | REDESIGNED |
| L1-026 | Semester fetch retry/fallback message | CoursesContent | server-loaded accessible semester set | REDESIGNED |

## L2 — Course detail shell and Overview

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L2-001 | Course detail default redirect to Overview | course index | course detail | CLOSED |
| L2-002 | Exact learner tabs: Overview / Learning Path / Attendance / Discussions | `courseTabList` | learner course tabs | CLOSED |
| L2-003 | Blueprint hidden for Learner | `courseTabList` | learner course tabs | CLOSED |
| L2-004 | Students hidden for Learner | `courseTabList` | learner course tabs | CLOSED |
| L2-005 | Back to Courses | course shell | course detail header | CLOSED |
| L2-006 | About this course | Home | transparent authored/catalogue/path fallback provenance, persisted course code and context, explicit no-faculty state and zero-credit display; retains sanitized display-content renderer. PARTIAL pending fresh PG/tsc/lint, browser responsive and authored-html privacy acceptance | PARTIAL |
| L2-007 | What you&apos;ll learn / learning-path summary | Home | published ordered lesson preview with own persisted item counts and null for no denominator; authored takeaways remain separate and are not fabricated. PARTIAL: fresh PostgreSQL test, tsc/lint, responsive browser and learning-path navigation acceptance not executed | PARTIAL |
| L2-008 | Faculty/teacher context | Home | Overview | CLOSED |
| L2-009 | Section + semester context | Home | Overview | CLOSED |
| L2-010 | Credits/elective context | Home | Overview | CLOSED |
| L2-011 | Next action priority: due assessment → live session → continue lesson | Home widgets | Overview | FIXED |
| L2-012 | Overall progress metric | Home | Overview | FIXED |
| L2-013 | Lesson progress metric | Home | Overview | FIXED |
| L2-014 | Assignment progress metric | Home | Overview | FIXED |
| L2-015 | Quiz progress metric | Home | Overview | FIXED |
| L2-016 | Unified recent course updates | Home activity/widgets | course-team announcements plus real last-14-day content completion and assignment submission, alongside next-14-day deadlines/live classes; never fabricate grade/published event timestamps. PARTIAL pending real PostgreSQL/tsc/lint tests, chronology and mobile/browser acceptance | PARTIAL |
| L2-017 | Course-team update links to Discussions | Home activity/widgets | Overview | FIXED |
| L2-018 | Assessment/live update links to exact item | Home activity/widgets | Overview | FIXED |
| L2-019 | Historical course Overview read-only messaging | course history | Overview | CLOSED |
| L2-020 | Course not-found/access handling | course route | course detail | CLOSED |
| L2-021 | Course loading/error state | course route | course detail | CLOSED |
| L2-022 | Overview mobile behavior | Home responsive | mobile-only horizontal accessible jump navigation, 44px targets, scroll offsets and small-screen padding for About/path/next/progress/updates; no dead links to absent sections. PARTIAL pending responsive browser, screen-reader, tsc/lint, fresh PostgreSQL acceptance | PARTIAL |
| L2-023 | Authored introduction content | InThisCourseSection introduction_content | Course domain has description only | GAP |
| L2-024 | Authored rich HTML overview + sanitization | InThisCourseSection html_content | Course domain has no rich overview field | GAP |
| L2-025 | Authored takeaways list | InThisCourseSection takeaways | vNext currently derives lesson names | GAP |
| L2-026 | Long overview Read more / Show less | InThisCourseSection | Overview | FIXED |
| L2-027 | Partial course-details/progress widget warning state | Home | explicitly distinguish no path/lessons/items and avoid false 0 percent | FIXED |
| L2-028 | Announcement body preview + Read more / Show less | UnifiedActivityList | discussion-backed update feed | FIXED |
| L2-029 | Detailed lesson/item progress drill-down | Learner Course progress from persisted progress/submissions | `/learn/courses/[deliveryId]/progress` | FIXED |

## L3 — Learning Path

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L3-001 | Learning Path title/description | syllabus | learner workspace | FIXED |
| L3-002 | Overall progress header | syllabus | learner workspace | FIXED |
| L3-003 | Content filters: All / Lectures / Resources / Assessments / Live Sessions | syllabus | filter nav | FIXED |
| L3-004 | Lesson ordering | syllabus | lesson accordion | FIXED |
| L3-005 | Lesson expand/collapse | syllabus | `details` accordion | FIXED |
| L3-006 | Deep link focuses lesson/content | legacy item navigation | query focus | FIXED |
| L3-007 | VIDEO representation | syllabus/video | content card | FIXED |
| L3-008 | YOUTUBE representation | syllabus/youtube | YouTube player | FIXED |
| L3-009 | RESOURCE representation | syllabus/resource | resource card | FIXED |
| L3-010 | LIVE_CLASS representation | syllabus/liveclass | content card | FIXED |
| L3-011 | ASSIGNMENT representation | syllabus | assignment card | FIXED |
| L3-012 | QUIZ representation | syllabus | quiz card | FIXED |
| L3-013 | Scheduled/locked item state | syllabus | availability model | FIXED |
| L3-014 | Future live URL withheld | syllabus/liveclass | learner service | FIXED |
| L3-015 | Live class join CTA | syllabus/liveclass | content card | FIXED |
| L3-016 | Ended live class state | syllabus/liveclass | content card | FIXED |
| L3-017 | Uploaded video playback | syllabus/video | GCS range route + player | BLOCKED |
| L3-018 | Uploaded video resume/progress | syllabus/video | learner video player | BLOCKED |
| L3-019 | YouTube resume/progress | syllabus/youtube | YouTube player | FIXED |
| L3-020 | Resource open | syllabus/resource | protected GCS route | BLOCKED |
| L3-021 | Resource download | syllabus/resource | protected GCS route | BLOCKED |
| L3-022 | Manual content completion rules | syllabus | progress service | FIXED |
| L3-023 | Assignment open/view | syllabus | assignment card/control | FIXED |
| L3-024 | Assignment submit | syllabus | submission control | FIXED |
| L3-025 | Late assignment submission | syllabus | submission control | FIXED |
| L3-026 | Assignment file upload | syllabus submission | storage-backed submission | BLOCKED |
| L3-027 | Quiz open/take | syllabus | `/quiz` | FIXED |
| L3-028 | Quiz completed/result state | syllabus | quiz control | FIXED |
| L3-029 | Course progress refresh after actions | syllabus | progress model | FIXED |
| L3-030 | Empty learning path | syllabus | EmptyState | FIXED |
| L3-031 | Partial lesson/no-items state | syllabus | lesson state | FIXED |
| L3-032 | Learning Path mobile behavior | syllabus responsive | compact touch-sized mobile Jump-to-Lesson index from authorized published sequence/counts; respects active filter, uses Next Link to focus/open exact lesson without losing filter, empty-filter state is explicit. PARTIAL: isolated PostgreSQL/model tests authored; tsc/eslint, phone/device and screen-reader acceptance pending | PARTIAL |
| L3-033 | Current lesson + completed/in-progress lesson status | syllabus roadmap cards | learner workspace | FIXED |
| L3-034 | Per-lesson content-type breakdown/counts | syllabus roadmap cards | learner workspace | FIXED |
| L3-035 | Assignment due / overdue and expired-quiz row cues | syllabus roadmap rows | learner workspace | FIXED |
| L3-036 | Video/YouTube watched percentage on roadmap row | syllabus roadmap rows | learner workspace | FIXED |
| L3-037 | Roadmap content viewer/drawer interaction parity | syllabus content modal + assignment drawer | inline learner cards/players | GAP |

## L4 — Course Attendance tab

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L4-001 | Course attendance summary | Attendance tab | course attendance | CLOSED |
| L4-002 | Classes held count | Attendance tab | metric | CLOSED |
| L4-003 | Present count | Attendance tab | metric | CLOSED |
| L4-004 | Absent count | Attendance tab | metric | CLOSED |
| L4-005 | Percentage | Attendance tab | metric | CLOSED |
| L4-006 | Threshold signal | Attendance tab/policy | threshold card | CLOSED |
| L4-007 | Unmarked sessions explanation | Attendance tab | summary | CLOSED |
| L4-008 | Session date/time | Attendance tab | table/cards | CLOSED |
| L4-009 | Faculty/location context | Attendance tab | table/cards | CLOSED |
| L4-010 | Present/Absent/Late/etc badge | Attendance tab | status badge | CLOSED |
| L4-011 | No attendance state | Attendance tab | EmptyState | CLOSED |
| L4-012 | Learner cannot mutate attendance | legacy learner permissions | server/service | CLOSED |
| L4-013 | Historical course attendance readable | old semesters | course attendance | CLOSED |
| L4-014 | Mobile attendance cards | Attendance tab responsive | course attendance | FIXED |
| L4-015 | Previous / direct month picker / next month | StudentAttendanceView + CourseAttendeeHeaderFilters | Course Attendance month controls | CLOSED |
| L4-016 | Future classes display as Scheduled, not Present | StudentAttendanceView | attendance status model + Course Attendance | CLOSED |
| L4-017 | Threshold headroom / recovery guidance | StudentAttendanceView attendanceHeadroom | Course Attendance threshold card | CLOSED |
| L4-018 | Read-only per-course attendance history by month | Course attendance records | `/learn/courses/[deliveryId]/attendance-summary` | FIXED |

## L5 — Course Discussions tab

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L5-001 | Discussion feed | Classroom | discussion component | FIXED |
| L5-002 | Faculty/learner author context | Classroom | message badges | FIXED |
| L5-003 | Timestamp context | Classroom | message metadata | FIXED |
| L5-004 | Pinned message/update | Classroom | pinned card | FIXED |
| L5-005 | Post message | Classroom | POST discussion | FIXED |
| L5-006 | Delete own message | Classroom | DELETE own | FIXED |
| L5-007 | Cross-class isolation | Classroom | service auth | FIXED |
| L5-008 | Poll/refresh behavior | Classroom | client polling | FIXED |
| L5-009 | Empty feed | Classroom | EmptyState | FIXED |
| L5-010 | Load error/retry | Classroom | retry state | FIXED |
| L5-011 | Historical discussion read-only | old course | `canPost=false` | FIXED |
| L5-012 | Mobile discussion behavior | Classroom responsive | touch keyboard Enter adds paragraph instead of accidental post, explicit full-width send, mobile-height feed and wrap-safe bubbles, one-tap Jump to latest without replacing unseen counter; private own-course PG and pure-model tests authored. PARTIAL pending browser/keyboard, unit/PG, tsc/eslint acceptance | PARTIAL |
| L5-013 | Consecutive-message sender grouping | Classroom buildFeed | learner discussion feed | FIXED |
| L5-014 | Initial load lands at newest message | Classroom scroll-to-bottom behavior | learner discussion feed | FIXED |
| L5-015 | New-message unseen counter while reading history | Classroom unseenCount | learner discussion feed | FIXED |
| L5-016 | Multiple pinned-message count/context | Classroom pin strip | learner discussion feed | FIXED |
| L5-017 | Persistent discussion invitation/help cue | Classroom composer copy | learner discussion feed | FIXED |

## L6 — All Assignments: `/learn/allAssignments`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L6-001 | Page title = All Assignments | AssignmentsContent | aggregate page | CLOSED |
| L6-002 | Aggregate learner assignment scope | AssignmentsContent/API | learner assessment service | CLOSED |
| L6-003 | Course filter | AssignmentsContent | aggregate component | CLOSED |
| L6-004 | Pagination | AssignmentsContent | aggregate component | CLOSED |
| L6-005 | Course metadata | AssignmentsContent | cards/rows | CLOSED |
| L6-006 | Created/due metadata | AssignmentsContent | cards/rows | CLOSED |
| L6-007 | Not submitted state | AssignmentsContent | state mapping | CLOSED |
| L6-008 | Due soon state | AssignmentsContent | state mapping | CLOSED |
| L6-009 | Overdue + late allowed state | AssignmentsContent | state mapping | CLOSED |
| L6-010 | Submitted state | AssignmentsContent | state mapping | CLOSED |
| L6-011 | Submitted late state | AssignmentsContent | state mapping | CLOSED |
| L6-012 | Graded state | AssignmentsContent | state mapping | CLOSED |
| L6-013 | View/submit primary action | AssignmentsContent | aggregate component | FIXED |
| L6-014 | Submission/view drawer parity | AssignmentsContent | aggregate assignment drawer + own-delivery detail; text/link submission and atomic PII-free audit (PG tests authored, not run) | FIXED |
| L6-015 | Submission text/link/file fields | AssignmentsContent | text/link in aggregate drawer; file awaits secure storage | BLOCKED |
| L6-016 | Grade masked until publish | AssignmentsContent | learner service | CLOSED |
| L6-017 | Metrics/summary pills | AssignmentsContent | aggregate metrics | CLOSED |
| L6-018 | Loading skeleton | AssignmentsContent | aggregate page | CLOSED |
| L6-019 | Request failure/retry | AssignmentsContent | aggregate page | CLOSED |
| L6-020 | Zero assignments | AssignmentsContent | EmptyState | CLOSED |
| L6-021 | Filtered empty | AssignmentsContent | EmptyState | CLOSED |
| L6-022 | Deep link exact assignment | AssignmentsContent | roadmap query | CLOSED |
| L6-023 | Mobile assignment cards/drawer | AssignmentsContent responsive | mobile-first full-width submission action and drawer links; derived due/submitted/grade-visible quick status only from own persisted assignment; card titles wrap. PARTIAL pending fresh PG, unit, tsc/eslint, touch-device and screen-reader acceptance | PARTIAL |

## L7 — All Quizzes: `/learn/allQuizzes`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L7-001 | Page title = All Quizzes | QuizzesContent | aggregate page | CLOSED |
| L7-002 | Aggregate published quiz scope | QuizzesContent/API | learner assessment service | CLOSED |
| L7-003 | Course filter | QuizzesContent | aggregate component | CLOSED |
| L7-004 | Pagination | QuizzesContent | aggregate component | CLOSED |
| L7-005 | Not attempted state | QuizzesContent | state mapping | CLOSED |
| L7-006 | Attempted state | QuizzesContent | state mapping | CLOSED |
| L7-007 | Missed state | QuizzesContent | state mapping | FIXED |
| L7-008 | Result-published state | QuizzesContent | state mapping | CLOSED |
| L7-009 | Due/close timing | QuizzesContent | aggregate rows | CLOSED |
| L7-010 | Attempt count/limit | QuizzesContent | aggregate rows | CLOSED |
| L7-011 | Take Quiz action | QuizzesContent | `/quiz?quizId=...` | FIXED |
| L7-012 | View Result action | QuizzesContent | standalone quiz review + own attempt history/results gated by published grades (PG tests authored, not run) | FIXED |
| L7-013 | Correct delivery in deep link | QuizzesContent | quiz URL | CLOSED |
| L7-014 | Loading skeleton | QuizzesContent | aggregate page | CLOSED |
| L7-015 | Request failure/retry | QuizzesContent | aggregate page | CLOSED |
| L7-016 | Zero quizzes | QuizzesContent | EmptyState | CLOSED |
| L7-017 | Filtered empty | QuizzesContent | EmptyState | CLOSED |
| L7-018 | Mobile quiz list | QuizzesContent responsive | mobile-first full-width quiz action/history links with own persisted remaining attempts, due/closed, and published-results-only quick status; never expose unpublished score. PARTIAL pending PG/unit/tsc/eslint execution and mobile/screen-reader acceptance | PARTIAL |

## L8 — Standalone Quiz Attempt: `/quiz`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L8-001 | Full-screen/no learner shell | `quiz.js` | `/quiz` page | CLOSED |
| L8-002 | Quiz title/progress header | Quizpanel | attempt component | CLOSED |
| L8-003 | Question number navigation | Quizpanel | attempt sidebar | CLOSED |
| L8-004 | Previous/Next navigation | Quizpanel | attempt actions | CLOSED |
| L8-005 | SINGLE_CHOICE rendering | Quizpanel | attempt component | CLOSED |
| L8-006 | MULTIPLE_CHOICE rendering | Quizpanel | attempt component | CLOSED |
| L8-007 | Answer persistence during navigation | Quizpanel | React state | CLOSED |
| L8-008 | Answer persistence across refresh | Quizpanel behavior | sessionStorage | CLOSED |
| L8-009 | Submit confirmation | Quizpanel | confirm flow | CLOSED |
| L8-010 | Prevent unavailable/closed attempt | Quizpanel/API | attempt gating | CLOSED |
| L8-011 | Attempt limit enforcement | Quizpanel/API | service/UI | CLOSED |
| L8-012 | Deadline enforcement | Quizpanel/API | service/UI | FIXED |
| L8-013 | Review mode | Quizpanel/results | review UI | CLOSED |
| L8-014 | Results withheld until publish | Quizpanel/results | result policy | CLOSED |
| L8-015 | Correct answers shown only when allowed | Quizpanel/results | review UI | CLOSED |
| L8-016 | Fatal load error + retry | Quizpanel boundary | error state | CLOSED |
| L8-017 | Missing URL params recovery | Quizpanel | error + All Quizzes | CLOSED |
| L8-018 | Browser Back behavior | Quizpanel | standalone route | FIXED |
| L8-019 | Double-submit/race protection | Quizpanel/API | submit state/service | FIXED |
| L8-020 | Mobile attempt layout | Quizpanel responsive | attempt UI | FIXED |
| L8-021 | Unanswered-question warning before submit | Quizpanel | attempt submit confirmation | CLOSED |
| L8-022 | Post-submit return to prior page | Quizpanel | delayed router.back after success | CLOSED |

## L9 — Class Schedule: `/learn/calendar`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L9-001 | Page title = Class Schedule | ClassScheduleContent | schedule page | CLOSED |
| L9-002 | Today metric | ClassScheduleContent | learner schedule | CLOSED |
| L9-003 | Next class metric | ClassScheduleContent | learner schedule | CLOSED |
| L9-004 | Next classes preview | ClassScheduleContent | learner schedule | CLOSED |
| L9-005 | Month view | CalendarEvents | learner schedule | CLOSED |
| L9-006 | Week view | CalendarEvents | learner schedule | CLOSED |
| L9-007 | Day view | CalendarEvents | learner schedule | CLOSED |
| L9-008 | Previous navigation | ClassScheduleContent | learner schedule | CLOSED |
| L9-009 | Today navigation | ClassScheduleContent | learner schedule | CLOSED |
| L9-010 | Next navigation | ClassScheduleContent | learner schedule | CLOSED |
| L9-011 | Course filters | ClassScheduleContent | schedule filters + validated month/week/course deep link scoped to persisted delivery (PG tests authored, not run) | CLOSED |
| L9-012 | Event title/time | CalendarEvents | event card | CLOSED |
| L9-013 | Course/faculty/location/section context | CalendarEvents | event card | CLOSED |
| L9-014 | Event link to course | CalendarEvents | event card | CLOSED |
| L9-015 | No schedule state | ClassScheduleContent | EmptyState | CLOSED |
| L9-016 | Filtered-empty view state | CalendarEvents | EmptyState | CLOSED |
| L9-017 | Load error vs true empty | ClassScheduleContent | page/service | CLOSED |
| L9-018 | Browser-local date grouping | CalendarEvents | schedule model | CLOSED |
| L9-019 | Mobile agenda/list fallback | CalendarMobileList | learner schedule | FIXED |

## L10 — Attendance summary: `/learn/attendance`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L10-001 | Page title = Attendance | AttendanceContent | attendance page | CLOSED |
| L10-002 | Course selector | AttendanceContent | attendance workspace | CLOSED |
| L10-003 | Prevent raw course-id flash | AttendanceContent | server-resolved course choices eliminate client hydration flash | REDESIGNED |
| L10-004 | Previous month | AttendanceContent | attendance workspace | CLOSED |
| L10-005 | Direct month/year picker | AttendanceContent | month input | CLOSED |
| L10-006 | Next month | AttendanceContent | attendance workspace | CLOSED |
| L10-007 | Total/Held metric | AttendanceContent | metric | CLOSED |
| L10-008 | Present metric | AttendanceContent | metric | CLOSED |
| L10-009 | Absent metric | AttendanceContent | metric | CLOSED |
| L10-010 | Attendance percentage | AttendanceContent | metric | CLOSED |
| L10-011 | College threshold/eligibility signal | AttendanceContent | threshold card | CLOSED |
| L10-012 | Per-course overview | AttendanceContent | overview cards | CLOSED |
| L10-013 | Desktop date/day/time/status table | AttendanceContent | table | CLOSED |
| L10-014 | Mobile attendance list | AttendanceContent | cards | FIXED |
| L10-015 | Select-course empty state | AttendanceContent | first valid course auto-selected; no transient unselected state | REDESIGNED |
| L10-016 | No-records selected-month state | AttendanceContent | EmptyState | CLOSED |
| L10-017 | Request failure is not shown as empty | AttendanceContent | error state | CLOSED |
| L10-018 | Retry attendance load | AttendanceContent | retry behavior | CLOSED |
| L10-019 | Loading skeleton | AttendanceContent | loading state | CLOSED |
| L10-020 | Learner read-only / tenant scope | attendance APIs | service | CLOSED |

## L11 — My Placements home: `/learn/my-placements`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L11-001 | Exact placement tabs | PlacementsTabsLayout | learner placement tabs | FIXED |
| L11-002 | First-run onboarding hero | learner placements dashboard | guided rules, real job browsing and optional preferences links appear only when persisted own application feed confirms a true first run; no fabricated completion status when a source fails. Pure model and fresh own-learner PG tests authored; PARTIAL pending static/runtime/browser and legacy onboarding comparison | PARTIAL |
| L11-003 | Partial-source error alert | placements home | authenticated learner gate before parallel independent settled source reads; warns of failed sections, retry button, preserves loaded sections, masks failed dashboard metrics as unknown rather than zero; pure and fresh-learner PostgreSQL tests authored. PARTIAL pending CI, error-injection and browser recovery acceptance | PARTIAL |
| L11-004 | Hero greeting | placements dashboard | placements home | UNCHECKED |
| L11-005 | Next-action priority | placements dashboard | issued still-actionable offer expiring within 24h takes priority over planned round; expired/accepted offers excluded, existing assessment/interview logic otherwise unchanged; on offer-read failure hero remains unknown rather than misleading. PARTIAL pending fresh-PG/tsc/eslint and real expiry-boundary/browser acceptance | PARTIAL |
| L11-006 | Assessment urgency action | placements dashboard | placements home | UNCHECKED |
| L11-007 | Interview urgency action | placements dashboard | placements home | UNCHECKED |
| L11-008 | Next scheduled event action | placements dashboard | placements home | UNCHECKED |
| L11-009 | Browse jobs fallback action | placements dashboard | placements home | UNCHECKED |
| L11-010 | Open-jobs snapshot | placements dashboard | placements home | UNCHECKED |
| L11-011 | Applications snapshot | placements dashboard | placements home | UNCHECKED |
| L11-012 | Interviews snapshot | placements dashboard | placements home | UNCHECKED |
| L11-013 | Assessments snapshot | placements dashboard | placements home | UNCHECKED |
| L11-014 | Needs-attention list | placements dashboard | placements home | UNCHECKED |
| L11-015 | Attention overflow CTAs | placements dashboard | persisted learner-scoped seven-day assessments/interviews show full eligible attention count, first 3 preview, true overflow CTA to own career calendar; missing schedule source remains unknown instead of zero. PARTIAL: PG/unit/typecheck/lint, mobile/browser navigation and time-window acceptance pending | PARTIAL |
| L11-016 | Rolling 7-day calendar preview | placements dashboard | placements home | UNCHECKED |
| L11-017 | Recent placement activity | placements dashboard | persisted own-application activity list | FIXED |
| L11-018 | Loading skeletons | placements dashboard | placements home | UNCHECKED |
| L11-019 | Error counts remain unknown, not zero | placements dashboard | placements home | UNCHECKED |
| L11-020 | All dashboard CTAs preserve intended filter/context | placements dashboard and own round pages | assessment/interview next-action and event CTAs carry persisted application+round IDs; own-scoped round service validates exact ID before opening drawer; metric CTAs remain aggregate. PARTIAL pending disposable PostgreSQL/negative-case and browser deep-link/back acceptance | PARTIAL |

## L12 — Drives/Jobs list

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L12-001 | Page title/tab name = Drives | JobsListContent | jobs page | FIXED |
| L12-002 | All drives tab | JobsListContent | learner jobs | UNCHECKED |
| L12-003 | Saved tab | JobsListContent | learner jobs | UNCHECKED |
| L12-004 | Search with URL state | JobsListContent | learner jobs | UNCHECKED |
| L12-005 | Browser Back/Forward search hydration | learner jobs | strict URL-first Zod parsing; committed searches, filters and pagination use history pushes; popstate/URL effects hydrate controlled search without dropping in-flight edits; unknown caller IDs stripped. PARTIAL pending Playwright/browser Back/Forward and disposable PostgreSQL acceptance | PARTIAL |
| L12-006 | Sort by deadline | JobsListContent | learner jobs | UNCHECKED |
| L12-007 | Sort newest | learner jobs | persisted `placement_jobs.published_at` descending (missing timestamps last), available on Drives; PARTIAL pending fresh PostgreSQL service/negative-case execution, browser sort and Back/Forward verification | PARTIAL |
| L12-008 | Sort highest CTC | JobsListContent | learner jobs | UNCHECKED |
| L12-009 | Job/employment type filter | JobsListContent | learner jobs | UNCHECKED |
| L12-010 | Location filter | JobsListContent | learner jobs | UNCHECKED |
| L12-011 | Eligible-only filter | JobsListContent | learner jobs | UNCHECKED |
| L12-012 | Closing-soon filter | JobsListContent | published-job URL toggle with snapshot-based seven-day deadlines | FIXED |
| L12-013 | Save job | JobsListContent | learner jobs | UNCHECKED |
| L12-014 | Unsave job | JobsListContent | learner jobs | UNCHECKED |
| L12-015 | Pagination | JobsListContent | learner jobs | UNCHECKED |
| L12-016 | Open/not-open/closed grouping | learner jobs | learner-specific open-to-apply/unavailable-to-apply/deadline-passed chips over authorized published roles, with honest counts; PARTIAL pending fresh PostgreSQL negative/read verification and mobile/browser acceptance; unpublished jobs remain intentionally hidden | PARTIAL |
| L12-017 | Deadline urgency labels | JobsListContent | real published application deadline classified using server ISO snapshot into closed, within 24 hours, within seven days, future and not announced; no fabricated expiry for absent timestamps or changes to eligibility. PARTIAL pending fresh PG, unit, tsc/eslint, browser timezone acceptance | PARTIAL |
| L12-018 | Eligibility state on card | JobsListContent | learner jobs | FIXED |
| L12-019 | Existing application state on card | JobsListContent | learner jobs | FIXED |
| L12-020 | Saved-jobs failure distinct from all-jobs failure | JobsListContent | learner jobs | UNCHECKED |
| L12-021 | First-run/filtered-empty | JobsListContent | distinct persisted no-published-drives state (dashboard link) vs active filter mismatch with eligibility/deadline explanations and reset, no inferred employer offers. PARTIAL pending fresh PostgreSQL/tsc/lint and mobile/browser empty-state acceptance | PARTIAL |
| L12-022 | Mobile jobs list/filters | JobsListContent responsive | accessible mobile-only collapsible drive filters with active-filter count, 44px control, desktop always visible and preserved own authorized URL filters; PARTIAL pending Playwright/mobile screen reader, PostgreSQL/test execution, tsc/eslint acceptance | PARTIAL |

## L13 — Job Detail: `/learn/my-placements/jobs/[jobId]`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L13-001 | Drive/company/job identity | VerifiedJobDetailContent | job detail | FIXED |
| L13-002 | Eligibility checklist/reasons | DriveEligibilityPanel | job detail | FIXED |
| L13-003 | Role details | VerifiedJobDetailContent | job detail | FIXED |
| L13-004 | Compensation | VerifiedJobDetailContent | job detail | FIXED |
| L13-005 | Locations/work mode | VerifiedJobDetailContent | job detail | FIXED |
| L13-006 | Openings | VerifiedJobDetailContent | job detail | FIXED |
| L13-007 | Deadline | VerifiedJobDetailContent | job detail | FIXED |
| L13-008 | Apply CTA | VerifiedJobDetailContent | learner jobs control | FIXED |
| L13-009 | Existing application state | VerifiedJobDetailContent | learner jobs control | FIXED |
| L13-010 | External application mode | VerifiedJobDetailContent | learner jobs control | UNCHECKED |
| L13-011 | Registration requirements | VerifiedJobDetailContent | learner jobs control | UNCHECKED |
| L13-012 | Closed/not-open state | VerifiedJobDetailContent | learner-scoped drive detail now explains genuinely closed, submitted, withdrawn, missing-evidence, not-open and open-role states without changing server application guards; PARTIAL pending fresh-PG/unit, responsive screen-reader and expiry/eligibility browser acceptance | PARTIAL |
| L13-013 | Not-eligible state | DriveEligibilityPanel | job detail | FIXED |
| L13-014 | Not-found/access handling | job route | job detail | FIXED |
| L13-015 | Back to Drives/navigation | job detail | job links preserve validated bounded Drives filter/page state in a `back` query and the job detail breadcrumb returns to it; arbitrary tenant/user selectors removed; exact published job still server-scoped. PARTIAL pending PG/unit/tsc/lint, Next app-router and browser Back/Forward acceptance | PARTIAL |
| L13-016 | Application uses the Profile resume; no per-drive resume upload | jobDetailProfileResumeOnly.test.jsx | learner job detail/application | GAP |

## L14 — Applications

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L14-001 | Search + URL state | ApplicationsContent | applications page | UNCHECKED |
| L14-002 | Back/Forward hydration | applications route | strict URL state for search/stage/sort/view/pagination/own selected application; navigable history and popstate restoration, bounded search; no tenant selector. PARTIAL pending PostgreSQL/unit, lint/typecheck, mobile/back-forward browser acceptance | PARTIAL |
| L14-003 | Stage filter chips | ApplicationsContent | own application screening-stage chips with persisted counts, active pressed states, URL navigation and 44px mobile hit targets; uses existing authorized learner journey. PARTIAL pending executed isolated PostgreSQL, unit, tsc/eslint and mobile/browser Back-Forward acceptance | PARTIAL |
| L14-004 | All / In Progress / Completed views | ApplicationsContent | applications page | UNCHECKED |
| L14-005 | Sort recent activity | ApplicationsContent | applications page | UNCHECKED |
| L14-006 | Sort stage | ApplicationsContent | explicit persisted screening-stage A–Z sort; stable latest-activity then ID tie breaks, URL validation and selection preserved. PARTIAL: fresh PostgreSQL, tsc, lint, unit and browser/back-forward acceptance remain | PARTIAL |
| L14-007 | Sort company | ApplicationsContent | applications page | UNCHECKED |
| L14-008 | Attention banner | ApplicationsContent | own persisted shortlisted/under-review stages presented as informational screening updates with scoped application deep links and overflow; no invented deadline, placement action or employer completion. PARTIAL pending isolated PostgreSQL, lint/tsc, mobile and browser acceptance | PARTIAL |
| L14-009 | Review offers opens full offered list | applications route | own-offers page with status filters | FIXED |
| L14-010 | Application cards | ApplicationsContent | applications page | UNCHECKED |
| L14-011 | Journey/status visualization | ApplicationsContent | learner journey | FIXED |
| L14-012 | Application Detail modal | ApplicationsContent | applications page | UNCHECKED |
| L14-013 | Application History modal | ApplicationsContent | dedicated read-only history route from applications drawer | FIXED |
| L14-014 | Company Preview modal + retry | ApplicationsContent | dedicated read-only company route with error boundary | FIXED |
| L14-015 | Withdrawal request modal + reason | ApplicationsContent | confirmed direct self-withdrawal/reason built in drawer; separate legacy approval-request semantics require owner decision | GAP |
| L14-016 | Offer accept confirmation | ApplicationsContent | learner offers | FIXED |
| L14-017 | Offer decline confirmation | ApplicationsContent | learner offers | FIXED |
| L14-018 | Assessment deep link | ApplicationsContent | drawer now links to exact own-application shortlisted persisted assessment via scoped request-workspace rounds (approved reschedule respected), generic fallback only when none; PARTIAL pending executed unit/fresh-PG, lint/tsc, browser drawer navigation and cross-tenant validation | PARTIAL |
| L14-019 | Interview deep link | ApplicationsContent | drawer resolves exact active own application+interview round from membership-scoped persisted scheduled rounds, nearest upcoming first; fallback general interview list where no round exists. No invented outcome. PARTIAL pending fresh PostgreSQL, unit, tsc/lint and browser deep-link checks | PARTIAL |
| L14-020 | Job/similar roles deep link | ApplicationsContent | own persisted application now carries exact job ID to published drive detail and its role options from cards and drawer; unauthorized/unpublished jobs still enforce server scope. PARTIAL: similar-role recommendation ranking not registered; pending PG/unit/tsc/lint/mobile/browser acceptance | PARTIAL |
| L14-021 | Loading state | ApplicationsContent | applications page | UNCHECKED |
| L14-022 | Hard/inline error state | ApplicationsContent | applications page | UNCHECKED |
| L14-023 | First-run/filtered-empty | ApplicationsContent | applications page | UNCHECKED |
| L14-024 | Mobile cards/modals | ApplicationsContent responsive | mobile-only collapsible filters with active-count/44px button; cards wrap long roles, full-width tap action, drawer links become full-width on mobile without changing own-membership data; PARTIAL pending mobile browser/keyboard screen-reader, tsc/lint and fresh-PG execution | PARTIAL |

## L15 — Placement Assessments

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L15-001 | Route is materialized, not placeholder | assessments page | vNext assessments | FIXED |
| L15-002 | Pending / Completed views | AssessmentsContent | scheduled assessment view + separate applied-results route; provider completion remains unregistered/unverified | GAP |
| L15-003 | Search | AssessmentsContent | already authorized local search now has a bounded Zod-validated shareable query and Back/Forward restoration, preserving exact own application/round links; fresh learner PG and pure tests authored. PARTIAL: PostgreSQL/ESLint/tsc and mobile browser acceptance unexecuted | PARTIAL |
| L15-004 | Urgency filter | AssessmentsContent | persisted IST schedule urgency now distinguishes due today, this week, later, scheduled time passed, and awaiting employer schedule with scoped counts; never equates elapsed time to submitted/completed. PARTIAL: disposable PostgreSQL, lint/tsc, mobile and timezone-browser acceptance outstanding | PARTIAL |
| L15-005 | Due today bucket | AssessmentsContent | IST-calendar upcoming due-today count and quick filter | FIXED |
| L15-006 | Due this week bucket | AssessmentsContent | IST Monday-Sunday upcoming assessment count and quick filter | FIXED |
| L15-007 | Later bucket | AssessmentsContent | assessments page | GAP |
| L15-008 | Waiting on employer link bucket | AssessmentsContent | assessments page | GAP |
| L15-009 | No deadline bucket | AssessmentsContent | assessments page | GAP |
| L15-010 | Overdue bucket | AssessmentsContent | assessments page | GAP |
| L15-011 | Employer-link unavailable state | AssessmentsContent | career rounds | FIXED |
| L15-012 | External assessment launch | AssessmentsContent | career rounds | FIXED |
| L15-013 | Time-critical leave confirmation | AssessmentsContent | assessments page | GAP |
| L15-014 | Local non-authoritative submitted reminder | assessments route | assessments page | GAP |
| L15-015 | Undo/dismiss/change reminder | AssessmentsContent | assessments page | GAP |
| L15-016 | Job/application navigation | AssessmentsContent | career rounds | FIXED |
| L15-017 | Loading/error/empty/filter-empty | AssessmentsContent | assessments page | GAP |
| L15-018 | Employer-side submission disclaimer (not a server receipt) | assessments route notice | assessments page notice | FIXED |
| L15-019 | Applied official assessment results | registered placement_round_results | own-member applied TEST/VENDOR_TEST results page | FIXED |

## L16 — Interviews

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L16-001 | Route is materialized, not placeholder | InterviewsContent | interviews page | FIXED |
| L16-002 | Upcoming / Past views | InterviewsContent | per-learner schedule tabs with actual upcoming, past and unscheduled counts, URL-backed view choice and browser navigation, preserving own round deep links; past schedule explicitly not attendance/completion. PARTIAL: fresh PG, ts/lint, mobile and Back/Forward runtime acceptance pending | PARTIAL |
| L16-003 | Search | InterviewsContent | searchable authorized shortlisted interview round list now has bounded Zod-backed shareable `q` URL, preserves `view` and exact application/round link, restores query on Back/Forward; no other-college records. PARTIAL: isolated PostgreSQL, unit, typecheck/lint and mobile/browser acceptance pending | PARTIAL |
| L16-004 | Highlight deep link | InterviewsContent | exact validated own-round deep link now highlights corresponding interview card and reports when filters hide it, with explicit reveal control; no forged ID can highlight a non-owned card. PARTIAL: fresh PG, unit, tsc/eslint and browser/keyboard drawer/filter acceptance pending | PARTIAL |
| L16-005 | Countdown/live/past badges | InterviewsContent | countdown from persisted UTC interview instant with minute refresh, active scheduled window label, pending and past badges; never claims interview began or learner attended. PARTIAL: TypeScript/eslint, disposable PG and browser/screen-reader/timezone acceptance pending | PARTIAL |
| L16-006 | Confirm interview | InterviewsContent | interviews page | GAP |
| L16-007 | Join now | InterviewsContent | career rounds | FIXED |
| L16-008 | Interview Detail modal | InterviewsContent | interviews page | GAP |
| L16-009 | .ics download | InterviewsContent | existing own persisted interview ICS export hardened with UTF-8 codepoint-safe RFC 5545 75-octet folding, calendar properties and injection-safe authored labels; no external send or fabricated duration. PARTIAL pending fresh-PG, typecheck/lint, native calendar import/browser verification | PARTIAL |
| L16-010 | Google Calendar link | InterviewsContent | interviews page | GAP |
| L16-011 | Request new slot | InterviewsContent | learner requests | GAP |
| L16-012 | Reschedule reason | InterviewsContent | learner requests | GAP |
| L16-013 | Preferred date/daypart/details | InterviewsContent | learner requests | GAP |
| L16-014 | Cancel reschedule request | InterviewsContent | learner requests | GAP |
| L16-015 | Reschedule summary + copy | InterviewsContent | approved own application-round exception displayed with original and new IST date plus venue; copyable sanitized personal schedule excludes meeting credentials and does not send employer messages. PARTIAL pending actual PG/tsc/eslint, clipboard permission and browser/mobile acceptance | PARTIAL |
| L16-016 | Decline interview confirmation | InterviewsContent | interviews page | GAP |
| L16-017 | Withdrawal request | InterviewsContent | confirmed owned-interview application withdrawal request, strict same-origin POST, locked millisecond stale token + existing audited pending producer; PARTIAL pending PG/browser/team approval acceptance | PARTIAL |
| L16-018 | Loading/error/empty | InterviewsContent | interviews page | GAP |
| L16-019 | Mobile interview actions/modals | InterviewsContent responsive | mobile-safe interview filter scroller, 44px full-width drawer links/close, wrapping titles and IST effective scheduled/rescheduled summary drawn only from authorized round; PARTIAL pending device keyboard/screen-reader acceptance plus PG/unit/tsc/lint/browser verification | PARTIAL |
| L16-020 | Deterministic assessment vs interview round-kind classification | Rounds are typed TEST/VENDOR_TEST/GD/INTERVIEW; names editable | learner-career-rounds typed policy | FIXED |

## L17 — Career Calendar

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L17-001 | Route is materialized, not placeholder | CareerCalendarContent | calendar page | FIXED |
| L17-002 | Agenda mode | career calendar | distinct rolling 30-day agenda anchored to selected IST date, with 30-day navigation and actual chronologically ordered own rounds rather than mirroring month view; pure unit + owned PG test authored. PARTIAL pending execution, browser navigation and source-parity acceptance | PARTIAL |
| L17-003 | Month mode | career calendar | dedicated 42-cell month grid now summarizes scoped actual assessment/interview/other rounds in the current IST month; month totals reflect persisted event selection, not job deadlines guessed from unknown sources. Pure and self-fixtured PostgreSQL tests authored; PARTIAL until execution, desktop/mobile browser and legacy source verification | PARTIAL |
| L17-004 | Week mode | career calendar | mobile week shows all seven consecutive IST calendar days including genuine empty days, not just days containing known rounds; authorized saved schedule remains source. Unit and own PG tests authored. PARTIAL pending execution, mobile/keyboard and legacy calendar acceptance | PARTIAL |
| L17-005 | Day mode | career calendar | selected IST day now has its own explicit schedule overview with accurately sorted first/last persisted round instants, no fabricated attendance or completion; pure-model and authorized PG checks authored. PARTIAL pending runtime, mobile/browser and legacy acceptance | PARTIAL |
| L17-006 | Previous / Today / Next | career calendar | previous/next now use view-specific day/week/30-day agenda/month shifts but disable correctly at strictly validated 2000–2100 IST date boundaries; Today remains an explicit fresh-day action. Pure model and authorized PG tests authored; PARTIAL pending runtime, navigation browser history and legacy controls acceptance | PARTIAL |
| L17-007 | Date picker | learner career calendar | date input with strict valid YYYY-MM-DD IST day keys; existing owned persisted round filter remains; pure and fresh-learner PG tests authored. PARTIAL pending executed PostgreSQL, Vitest, TypeScript/ESLint, calendar browser/mobile and timezone acceptance | PARTIAL |
| L17-008 | Event-type filters | CareerCalendarContent | strict learner URL event kind + date/view; refresh/history persistence and own persisted event filters; PARTIAL pending PG/browser acceptance | PARTIAL |
| L17-009 | Event chips | career calendar | month/week desktop grid shows up to two persisted authorized round labels/types per IST day, with overflow count and day navigation; pure model and own-fixture PG checks authored. PARTIAL pending executed tests, direct event-chip action, keyboard/screen reader and mobile/desktop browser parity | PARTIAL |
| L17-010 | Selected-event detail drawer | learner career calendar | event cards now open own-scoped detail drawer with real IST time, employer, kind, approved-reschedule cue and exact assessment/interview deep link; never shows provider secrets. PARTIAL pending PG/TypeScript/ESLint and mobile/browser acceptance | PARTIAL |
| L17-011 | Event action/deep links | CareerCalendarContent | career rounds | FIXED |
| L17-012 | Partial-source failure + retry | CareerCalendarContent | dedicated loading + hard-failure retry preserves calendar URL; PARTIAL pending PG/browser error injection and legacy partial-source acceptance | PARTIAL |
| L17-013 | Empty calendar state | CareerCalendarContent | career calendar | FIXED |
| L17-014 | Timezone handling | career calendar | .ics export now uses exactly the visible IST day/week/month/30-day event period and active kind filter, with unmodified real UTC instants; no calendar provider URL/meeting credentials. Pure model + own persisted PG checks authored. PARTIAL pending native calendar import, leap/IST boundary, browser and executed tests | PARTIAL |
| L17-015 | Mobile agenda fallback | learner career calendar | month/week show accessible mobile IST day-grouped agenda rather than 38rem horizontal grid; same persisted filtered own events, details and exact deep links; pure and fresh-learner PG tests authored. PARTIAL pending executed tests, responsive screen-reader and browser acceptance | PARTIAL |

## L18 — Placement Cell

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L18-001 | Route is materialized, not placeholder | PlacementCellContent | placement page | FIXED |
| L18-002 | Debar alert | PlacementCellContent | placement page | GAP |
| L18-003 | Registration card | PlacementCellContent | placement page | GAP |
| L18-004 | Placements choice | PlacementCellContent | placement page | GAP |
| L18-005 | Higher Studies choice | PlacementCellContent | placement page | GAP |
| L18-006 | Not Interested choice | PlacementCellContent | placement page | GAP |
| L18-007 | Consent workflow | PlacementCellContent | placement page | GAP |
| L18-008 | Placement Rules link | PlacementCellContent | placement page | FIXED |
| L18-009 | Offers list | PlacementCellContent | learner offers | FIXED |
| L18-010 | Accept offer | PlacementCellContent | learner offers | FIXED |
| L18-011 | Decline offer | PlacementCellContent | learner offers | FIXED |
| L18-012 | Offer acceptance preview | PlacementCellContent | existing own-offer cards now require read-only term preview and explicit confirmation before existing guarded ACCEPT POST | FIXED |
| L18-013 | Your rounds | PlacementCellContent | career rounds | FIXED |
| L18-014 | Confirm round | PlacementCellContent | placement page | GAP |
| L18-015 | Ask to reschedule | PlacementCellContent | requests | FIXED |
| L18-016 | Requests list | PlacementCellContent | learner requests | FIXED |
| L18-017 | Registration-change request | PlacementCellContent | requests | GAP |
| L18-018 | Correction request | PlacementCellContent | requests | GAP |
| L18-019 | External-offer request | PlacementCellContent | requests | GAP |
| L18-020 | Absence-dispute request | PlacementCellContent | requests | GAP |
| L18-021 | Offer-extension request | PlacementCellContent | requests | FIXED |
| L18-022 | New Request modal dynamic fields | PlacementCellContent | requests UI | GAP |
| L18-023 | Notices from placement cell | PlacementCellContent | placement page | GAP |
| L18-024 | Notice dispute flow | PlacementCellContent | placement page | GAP |
| L18-025 | Offer-letter/file flow | PlacementCellContent | storage-backed offer flow | BLOCKED |
| L18-026 | Page loading/error/retry/empty | PlacementCellContent | placement page with error/retry and loading route; offers/requests/alerts empty states | FIXED |
| L18-027 | Personal placement activity alerts, not official notices | registered in-app PLACEMENTS notifications | learner Placement Cell recent alerts | FIXED |

## L19 — Placement Rules

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L19-001 | Route is materialized, not placeholder | PlacementRulesPage | rules page | FIXED |
| L19-002 | Back action | PlacementRulesPage | safe Zod-validated dashboard/cell/drives back destination, linked from source pages | FIXED |
| L19-003 | Personal "Where you stand" note | PlacementRulesPage | registered learner-scoped evidence/preferences with explicit unknown values and no eligibility invention | FIXED |
| L19-004 | Authoritative college rules summary | PlacementRulesPage/API | no canonical policy model | BLOCKED |
| L19-005 | Rule-change applicability wording | PlacementRulesPage | own saved submitted-app count and candid future-vs-submitted eligibility applicability wording; no invented College policy version, effective date or retroactive decision; link to own applications. PARTIAL pending executed PG/unit/tsc/lint and College-owner policy approval/browser copy acceptance | PARTIAL |
| L19-006 | Loading skeleton | PlacementRulesPage | dedicated loading.tsx with LoadingState | FIXED |
| L19-007 | Load error + Retry | PlacementRulesPage | dedicated error.tsx retry and safe return | FIXED |
| L19-008 | Drive-level eligibility explanation | DriveEligibilityPanel | rules page | FIXED |

## L20 — Projects list: `/learn/projects`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L20-001 | Page title = Projects | ProjectsContent | projects page | UNCHECKED |
| L20-002 | Search my projects | ProjectsContent | project list | UNCHECKED |
| L20-003 | Current only filter | ProjectsContent | project list | UNCHECKED |
| L20-004 | Active filter | ProjectsContent | project list | UNCHECKED |
| L20-005 | In progress filter | ProjectsContent | project list | UNCHECKED |
| L20-006 | Ready filter | ProjectsContent | project list | UNCHECKED |
| L20-007 | Blocked filter | ProjectsContent | project list | UNCHECKED |
| L20-008 | Archived filter | ProjectsContent | project list | UNCHECKED |
| L20-009 | Needs my review filter | ProjectsContent | project list | UNCHECKED |
| L20-010 | Needs my action filter | ProjectsContent | project list | UNCHECKED |
| L20-011 | Project card title/status | ProjectsContent | project list | UNCHECKED |
| L20-012 | Team/mentor context | ProjectsContent | project list | UNCHECKED |
| L20-013 | Progress/readiness signal | ProjectsContent | project list | UNCHECKED |
| L20-014 | Archived/read-only signal | ProjectsContent | project list | UNCHECKED |
| L20-015 | Correct project navigation | ProjectsContent | project route | FIXED |
| L20-016 | Loading/error/empty/filtered-empty | ProjectsContent | project list | UNCHECKED |
| L20-017 | Mobile project list/filter UI | ProjectsContent responsive | project list | UNCHECKED |

## L21 — Project detail shell / legacy tabs

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L21-001 | Overview tab | ProjectDetailContent | `?tab=overview` | FIXED |
| L21-002 | People & Meetings tab | ProjectDetailContent | `?tab=team` | FIXED |
| L21-003 | Releases and Sprints tab | ProjectDetailContent | `?tab=sprints` | FIXED |
| L21-004 | Board tab | ProjectDetailContent | `?tab=board` | FIXED |
| L21-005 | Resources tab | ProjectDetailContent | `?tab=resources` | FIXED |
| L21-006 | Activity tab | ProjectDetailContent | `?tab=activity` | FIXED |
| L21-007 | Task Allocation hidden for Learner | ProjectDetailContent | learner tabs | FIXED |
| L21-008 | `?tab=tasks` compatibility → Board | ProjectDetailContent | project route | UNCHECKED |
| L21-009 | `?tab=meetings` compatibility → Team | ProjectDetailContent | project route | UNCHECKED |
| L21-010 | `?tab=delivery` opens final delivery flow | ProjectDetailContent | project route | UNCHECKED |
| L21-011 | Tab click does not remount/lose modal/form state | project route | App Router detail | UNCHECKED |
| L21-012 | Not-found/access/error state | project detail | project route | UNCHECKED |

## L22 — Project Overview

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L22-001 | Project narrative/description | ProjectDetailContent | workspace | UNCHECKED |
| L22-002 | Goals/deliverables | ProjectDetailContent | workspace | UNCHECKED |
| L22-003 | Definition of done | ProjectDetailContent | workspace | UNCHECKED |
| L22-004 | Project status/readiness | ProjectDetailContent | workspace | UNCHECKED |
| L22-005 | Learner final-delivery summary | ProjectDetailContent | workspace | UNCHECKED |
| L22-006 | Archived/read-only behavior | ProjectDetailContent | workspace | UNCHECKED |

## L23 — People & Meetings

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L23-001 | Team member list | ProjectDetailContent | workspace Team | UNCHECKED |
| L23-002 | Member roles | ProjectDetailContent | workspace Team | UNCHECKED |
| L23-003 | Mentor information | ProjectDetailContent | workspace Team | UNCHECKED |
| L23-004 | Meeting list | ProjectDetailContent | workspace Meetings | UNCHECKED |
| L23-005 | Request meeting | ProjectDetailContent | meeting service/UI | UNCHECKED |
| L23-006 | Cancel meeting/request | ProjectDetailContent | meeting UI | UNCHECKED |
| L23-007 | Meeting status | ProjectDetailContent | meeting UI | UNCHECKED |
| L23-008 | Meeting timezone/date handling | ProjectDetailContent | meeting UI | UNCHECKED |
| L23-009 | Meeting external link safety | ProjectDetailContent | meeting UI | UNCHECKED |
| L23-010 | Empty/error states | ProjectDetailContent | team/meetings | UNCHECKED |

## L24 — Releases and Sprints

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L24-001 | Release list/order | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-002 | Release state | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-003 | Sprint list/order | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-004 | Current sprint signal | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-005 | Sprint goal | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-006 | Sprint dates | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-007 | Sprint needs-attention signal | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-008 | Learner-visible lifecycle actions | ProjectDetailContent | workspace Execution | UNCHECKED |
| L24-009 | Empty/no sprint/release state | ProjectDetailContent | workspace Execution | UNCHECKED |

## L25 — Board / Tasks

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L25-001 | Board columns/statuses | ProjectDetailContent | task workspace | UNCHECKED |
| L25-002 | Priority filter | ProjectDetailContent | task workspace | UNCHECKED |
| L25-003 | Sprint scope filter | ProjectDetailContent | task workspace | UNCHECKED |
| L25-004 | Assignee filter + Mine | ProjectDetailContent | task workspace | UNCHECKED |
| L25-005 | Release filter | ProjectDetailContent | task workspace | UNCHECKED |
| L25-006 | Search tasks | ProjectDetailContent | task workspace | UNCHECKED |
| L25-007 | Task card title/type/priority/points | ProjectDetailContent | task workspace | UNCHECKED |
| L25-008 | Task detail modal | TaskDetailsModal | task UI | UNCHECKED |
| L25-009 | Learner task status transitions | ProjectDetailContent | task service/UI | UNCHECKED |
| L25-010 | Task submission/link flow | ProjectDetailContent | task submission UI | UNCHECKED |
| L25-011 | Assignment/ownership visibility | ProjectDetailContent | task UI | UNCHECKED |
| L25-012 | Unassigned/attention state | ProjectDetailContent | task UI | UNCHECKED |
| L25-013 | Board empty/filter-empty | ProjectDetailContent | task workspace | UNCHECKED |
| L25-014 | Mobile board/task interaction | ProjectDetailContent responsive | task workspace | UNCHECKED |

## L26 — Project Resources

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L26-001 | Resource list | ProjectDetailContent | workspace Resources | UNCHECKED |
| L26-002 | Resource type | ProjectDetailContent | resource UI | UNCHECKED |
| L26-003 | Description/notes | ProjectDetailContent | resource UI | UNCHECKED |
| L26-004 | Related sprint/task | ProjectDetailContent | resource UI | UNCHECKED |
| L26-005 | Visibility Everyone/Mentors | ProjectDetailContent | resource UI | UNCHECKED |
| L26-006 | Link resource | ProjectDetailContent | resource UI | UNCHECKED |
| L26-007 | File resource | ProjectDetailContent | storage resource | BLOCKED |
| L26-008 | Required/pinned/access context | ProjectDetailContent | resource UI | UNCHECKED |
| L26-009 | Open/download file | ProjectDetailContent | storage resource | BLOCKED |
| L26-010 | Empty/error states | ProjectDetailContent | Resources | UNCHECKED |

## L27 — Project Activity

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L27-001 | Activity feed exists | ProjectDetailContent | project activity | UNCHECKED |
| L27-002 | Sprint changes filter | ProjectDetailContent | project activity | UNCHECKED |
| L27-003 | Task changes filter | ProjectDetailContent | project activity | UNCHECKED |
| L27-004 | Team & meetings filter | ProjectDetailContent | project activity | UNCHECKED |
| L27-005 | Resources shared filter | ProjectDetailContent | project activity | UNCHECKED |
| L27-006 | Submission updates filter | ProjectDetailContent | project activity | UNCHECKED |
| L27-007 | Date-range filter | ProjectDetailContent | project activity | UNCHECKED |
| L27-008 | Actor/time/context presentation | ProjectDetailContent | project activity | UNCHECKED |
| L27-009 | Meaningful/noise-controlled history | ProjectDetailContent | project activity | UNCHECKED |
| L27-010 | Empty/error state | ProjectDetailContent | project activity | UNCHECKED |

## L28 — Final Delivery deep flow

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L28-001 | `?tab=delivery` deep link | ProjectDetailContent | project route | UNCHECKED |
| L28-002 | Final submission form/modal | ProjectDetailContent | final delivery UI | UNCHECKED |
| L28-003 | Submission link/file | ProjectDetailContent | delivery UI | UNCHECKED |
| L28-004 | Submission status | ProjectDetailContent | delivery UI | UNCHECKED |
| L28-005 | Review feedback | ProjectDetailContent | delivery UI | UNCHECKED |
| L28-006 | Resubmit/reopen rules | ProjectDetailContent | delivery UI | UNCHECKED |
| L28-007 | File-backed final delivery | ProjectDetailContent | storage delivery | BLOCKED |

## L29 — Notifications: `/learn/notifications`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L29-001 | Page title = Notifications | NotificationsContent | notifications page | UNCHECKED |
| L29-002 | Course notifications | NotificationsContent | notification feed | UNCHECKED |
| L29-003 | Project notifications | NotificationsContent | notification feed | UNCHECKED |
| L29-004 | Placement/job notifications | NotificationsContent | notification feed | UNCHECKED |
| L29-005 | Announcements/general notifications | NotificationsContent | notification feed | UNCHECKED |
| L29-006 | Personal notifications | NotificationsContent | own-recipient paginated personal history + canonical notifications feed | FIXED |
| L29-007 | Unread signal | NotificationsContent | notification list | FIXED |
| L29-008 | Mark read | NotificationsContent | read API | FIXED |
| L29-009 | Action: Take Assessment | NotificationsContent | personal assessment notifications now display explicit view-assessment action, validate strict UUID application+round pair, discard caller tenant selectors and navigate to own-scoped assessment detail; not an external provider submission. PARTIAL pending fresh PostgreSQL/unit, tsc/eslint and notification action-browser acceptance | PARTIAL |
| L29-010 | Action: View Interview | NotificationsContent | actionHref | UNCHECKED |
| L29-011 | Action: View in My Applications | NotificationsContent | actionHref | UNCHECKED |
| L29-012 | Action: View Course | NotificationsContent | actionHref | UNCHECKED |
| L29-013 | Project deep links | NotificationsContent | actionHref | UNCHECKED |
| L29-014 | Loading state | NotificationsContent | notification page | UNCHECKED |
| L29-015 | Empty state | NotificationsContent | notification list | FIXED |
| L29-016 | Error/stale/retry behavior | NotificationsContent | unreadable personal feed remains a hard failure; independent announcement-fetch errors retain authorized personal notifications with explicit partial-source warning and refresh retry; no false empty. PARTIAL pending executed unit/own-PG, TypeScript/ESLint, announcement failure-injection/browser acceptance | PARTIAL |
| L29-017 | No cross-college/cross-role leakage | notification API | current persisted Learner membership, event college-scoped inbox/history and single/bulk read actions; DB success/denial tests authored, not run | FIXED |
| L29-018 | Mobile notification list | NotificationsContent responsive | notification page | UNCHECKED |

| L29-019 | Placement notification choices with conflict protection | registered placement preferences | required expected flags, membership serialization, 409/reload recovery and audit; PARTIAL pending PG/browser/producer acceptance | PARTIAL |

## L30 — Profile: `/learn/profile`

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L30-001 | User summary/name/program | Profile/About | persisted own-user profile and active program/cohort/department identity card | FIXED |
| L30-002 | Profile completeness | ProfileCompleteness | profile workspace + read-only all/filled/missing saved-field checklist (PG tests authored, not run) | FIXED |
| L30-003 | Profile image view | About/userInfo | profile workspace | UNCHECKED |
| L30-004 | Profile image upload/remove | profile image flow | secure storage | BLOCKED |
| L30-005 | Resume view/status | About | profile workspace | UNCHECKED |
| L30-006 | Resume upload/import/remove | About | secure storage | BLOCKED |
| L30-007 | Contacts | contacts | mobile confirmation for alternate phone/contact email only; strict same-origin PATCH, live membership/role, transactional JSONB section update + PII-free audit; PG tests authored | FIXED |
| L30-008 | Social profiles | socialProfiles | profile workspace | FIXED |
| L30-009 | Address | address | profile workspace | FIXED |
| L30-010 | Personal details | personalDetails | profile workspace | FIXED |
| L30-011 | Identity numbers + masking | identity | profile workspace | FIXED |
| L30-012 | Aadhaar/PAN file upload/import/replace cleanup | identity | secure storage | BLOCKED |
| L30-013 | Experiences add/edit/delete | experiences | profile workspace | FIXED |
| L30-014 | Education/qualifications add/edit/delete | qualifications | profile workspace | FIXED |
| L30-015 | Skills add/edit/delete/proficiency | skills | profile workspace | FIXED |
| L30-016 | Learner projects add/edit/delete | projects | profile workspace | FIXED |
| L30-017 | Certifications add/edit/delete | certifications | profile workspace | FIXED |
| L30-018 | Achievements add/edit/delete | achievements | profile workspace | FIXED |
| L30-019 | Languages add/edit/delete | languages | profile workspace | FIXED |
| L30-020 | Extracurricular add/edit/delete | extracurricular | profile workspace | FIXED |
| L30-021 | Hobbies edit | hobbies | profile workspace | FIXED |
| L30-022 | Metadata section | metadata | profile workspace | FIXED |
| L30-023 | Publications/awards legacy handling | profile subcomponents | profile workspace | UNCHECKED |
| L30-024 | Job Preferences must be absent from learner Profile | learnerProfileSectionsRemoved.test.jsx / About | learner self-profile keeps placement preferences out | FIXED |
| L30-025 | Placement Academic Record must be absent from learner Profile | learnerProfileSectionsRemoved.test.jsx | learner self-profile keeps placement academic evidence out | FIXED |
| L30-026 | Contact deep-link scroll | profile query section | strict Zod ?section=contacts route input, live target scroll, responsive completion checklist deep links | FIXED |
| L30-027 | Connect-accounts deep-link scroll | profile query section | profile workspace | UNCHECKED |
| L30-028 | Optional-section partial failure isolation | removed from current learner Profile composition | no separate optional placement-section fetches | RETIRED |
| L30-029 | Loading skeleton | ProfileSkeleton | responsive academic identity, introduction and section-shaped placeholders; PARTIAL pending browser/mobile exact parity | PARTIAL |
| L30-030 | Hard-error + Retry | profile route | honest hard failure retry/exit plus independent academic-summary recovery after live owned profile gate; PARTIAL pending PG/browser retry and unsaved edits acceptance | PARTIAL |
| L30-031 | Visibility refresh | profile route | guarded visibility-triggered router.refresh after 45s, manual saved-profile refresh, and reconciliation of newer server props only when on-screen document matches previous saved state (unsaved changes protected); PARTIAL pending fresh PostgreSQL/unit, tsc/eslint, multi-tab browser and concurrent-editor acceptance | PARTIAL |
| L30-032 | Role fence/redirect | profile route | server context | FIXED |
| L30-033 | Mobile profile cards/forms | profile responsive | profile workspace | UNCHECKED |
| L30-034 | Profile Verification card | ProfileVerificationCard | no vNext verification domain/UI | GAP |
| L30-035 | Education verification missing/ready/submitted/verified/sent-back states | ProfileVerificationCard | no vNext equivalent | GAP |
| L30-036 | Identity verification missing/ready/submitted/verified/sent-back states | ProfileVerificationCard | no vNext equivalent | GAP |
| L30-037 | Send / resend changed Education or Identity for verification | ProfileVerificationCard | no vNext equivalent | GAP |
| L30-038 | Verified profile badge + verified-by/date | ProfileVerificationCard | no vNext equivalent | GAP |
| L30-039 | Sent-back reason and change-needed guidance | ProfileVerificationCard | no vNext equivalent | GAP |
| L30-040 | Changed-since-verification / update-pending semantics | ProfileVerificationCard | no vNext equivalent | GAP |
| L30-041 | Education marksheet upload/replace/view, PDF/JPG/PNG ≤5 MB | MarksheetUpload + private docs | no vNext verification/private-doc flow | GAP |
| L30-042 | Aadhaar/PAN private document upload/view tied to Identity verification | identity + PrivateDocLink | no vNext verification/private-doc flow | GAP |
| L30-043 | Verification status refresh while page remains visible | ProfileVerificationCard polling | no vNext equivalent | GAP |

| L30-044 | Whole-profile save conflict protection + audit | learner Profile edit workflow | strict saved baseline, locked live own-profile write, stale-before-no-op, private-value-free field-name audit; PARTIAL pending PG and multi-tab/browser acceptance | PARTIAL |

## L31 — Conditional Drive Day learner entry

The old learner sidebar can dynamically expose `Drive Day` but the actual route lives under `/tpo/drive-day`. Treat this as a cross-role learner-access surface, not as permission to expose TPO controls.

| ID | UI surface | Legacy oracle | vNext target | Status |
| --- | --- | --- | --- | --- |
| L31-001 | Detect learner's Drive Day assignment | Sidebar + `getDriveDayMine` | `hasStudentCoordinatorAssignmentToday` | FIXED |
| L31-002 | Conditional sidebar item only when assigned | Sidebar | learner shell | FIXED |
| L31-003 | Learner-safe Drive Day landing | `/tpo/drive-day` | `/tpo/drive-day` | FIXED |
| L31-004 | Assigned drive/round context | Drive Day page | assigned round cards + restricted roster | FIXED |
| L31-005 | Learner cannot see/manage TPO-only controls | Drive Day page | coordinator access policy + Present/Absent-only UI | FIXED |
| L31-006 | Not-assigned access denied/empty | Drive Day page | assignment-gated service | FIXED |

---

## Final Learner closure gate

Learner is not complete until all of the following are true:

- every row above is `CLOSED`, `REDESIGNED`, or `RETIRED`; any `BLOCKED` row keeps full Learner parity open;
- every legacy Learner route in `docs/planning/legacy-ui-route-manifest.md` is represented here;
- standalone `/quiz` is represented here;
- conditional Drive Day learner access is represented here;
- exact sidebar naming/order/routes match legacy;
- no compatibility route is accidentally treated as the canonical learner route;
- every modal/drawer/deep-link discovered during audits gets its own row before closure;
- tenant/role isolation has regression coverage for sensitive reads/actions;
- mobile/responsive fallbacks have been browser-checked;
- the legacy frontend/backend SHAs are refreshed immediately before final sign-off;
- `npm run parity:learner`, `npm run parity:pages`, and `npm run parity:status` are recorded in the final Learner closure commit/handoff.

After Learner closes, move to Faculty using the same ledger pattern. Do not start a broad redesign pass before Learner parity closes.


### L0 current-oracle re-audit note — 2026-10-05

Against FE `008d113ddd9f515df65ae7fe90dba360938314f6` + BE `ed1377b744088f2ec759895658105c494337ba30`, vNext now has persisted optional-module decisions with the legacy precedence/lock semantics, Placements' college-only module switch, and the learner Placement eligibility ladder (membership → section → cohort, equivalent to legacy learner → class → batch). The learner shell consumes those results fail-closed for optional links while keeping core navigation available.

L0-011 through L0-013 are now implemented at the consumer/domain level and remain `FIXED`, not `CLOSED`: CI/browser evidence is still unavailable and producer UIs must be verified in their owning admin/TPO families. Drive Day now has persisted dated coordinator assignments, applicant-conflict prevention, learner-only conditional navigation, an assigned-round landing, and a restricted roster that hides contact/result controls and permits only Present/Absent for student coordinators.

## 2026-10-10 W02 quiz/assignment safety re-audit

The current legacy FE `e6b09e6d` explicitly shows read-only review for expired unattempted and submitted quizzes, with no retake after deadline; BE `21bad59d` blocks opening/submitting a new attempt past due. vNext quiz list actions, transaction-time attempt guards, and assignment publish/actor guards were updated on main. Rows L7-007, L7-011, L7-012, L8-012, L8-019 and L6-013 are `FIXED`, not final `CLOSED` while PostgreSQL concurrency tests and browser/mobile parity are unexecuted. The actual source proof and remaining dependencies are in `docs/planning/w02-learning-assessment-closure-ledger.md`.
