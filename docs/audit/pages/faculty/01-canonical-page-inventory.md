# Faculty vNext — canonical page and route disposition

**Frozen decision basis:** GitHub `42Students/lms-vnext` main route tree at `21eadb873454ccf9acd5d9f1b48a8a24db02cea9`; original 12 Faculty PNGs in `42LMS pages prototype-png-faculty.zip`; old LMS `docs/legacy-source/frontend/src/pages/teacher`. Recheck the route tree at implementation time. This is an **inventory and proposed product direction, not code acceptance or a removal authorization**.

## Accounting, without double counting

- **12 Faculty PNG reference screens**: numbered #02–#13 in the source ZIP. The ZIP's remaining first PNG `Companies › Today.png` is TPO and excluded. **#13 is a shared Find/Bell/Profile header interaction reference, not one Next.js page route.** Overview and Blueprint are two design states of a shared catch-all course-tab page route.
- **25 additional active rendered Faculty page routes** without a dedicated PNG, listed below. They are in scope for code acceptance, not automatically required to match a nonexistent dedicated screenshot.
- **5 compatibility redirects** with a `page.tsx` but no independent rendered page. Test their destination, authorization and old feature parity.
- The repository contains **40 `src/app/(authenticated)/teacher/**/page.tsx` route files**, of which **10 implement 11 prototype page states** (Overview and Blueprint sharing one handler), **25 are additional active screens**, and **5 redirect**. One more screenshot documents shared-shell interactions. Hence the proposed acceptance register is **12 reference cases + 25 other functional screen routes + 5 redirect checks**, *not* 42 separate designs or 37 necessarily independent pages.

## Primary product navigation

Keep four prototype sidebar destinations: `/teacher` Today; `/teacher/courses` Courses; `/teacher/assessments` Assignments & Quizzes; `/teacher/calendar` Class Schedule. Course Overview/Blueprint/Students/Attendance/Discussions remain tabs under Courses. Find, notifications, profile and contacts are header/feature entry points, not additional primary sidebar destinations.

### 12 prototype-backed acceptance cases

| Screenshot | Prototype page/state | Canonical destination | Role |
|---|---|---|---|
| #02 | Faculty Today | `/teacher` | primary |
| #03 | Faculty Courses | `/teacher/courses` | primary |
| #04 | Course Overview | `/teacher/courses/:deliveryId/home` | course tab |
| #05 | Course Blueprint | `/teacher/courses/:deliveryId/blueprint` | course tab |
| #06 | Course Students | `/teacher/courses/:deliveryId/students` | course tab |
| #07 | Course Attendance | `/teacher/courses/:deliveryId/attendanceDetail` | course tab |
| #08 | Course Discussions | `/teacher/courses/:deliveryId/discussions` | course tab |
| #09 | Assignments & Quizzes | `/teacher/assessments` | primary unified directory |
| #10 | Assignment Grading | `/teacher/report/assignment/:contentId/grade` | specialist task |
| #11 | Assignment Report | `/teacher/report/assignment/:contentId` | specialist report |
| #12 | Class Schedule | `/teacher/calendar` | primary |
| #13 | Find/Bell/Profile header | shared Faculty shell, with functional destination links | shared interactive surface |

### Additional active rendered routes — all 25 must be accounted for

Status definitions: **CANDIDATE** = probable redundant *destination*, cannot redirect until feature parity and existing browser tests pass; **KEEP** = distinct functional page or drill-down; **REVIEW** = scope may overlap, but cannot assume redundant.

| ID | Functional route relative to `/teacher` | Current disposition and integration |
|---|---|---|
| E01 | `/allAssignments` | **CANDIDATE** → canonical `/assessments?kind=assignment`; retain advanced assignment review, editing, lifecycle, statuses, filters, browse-safe recovery |
| E02 | `/allQuizzes` | **CANDIDATE** → canonical `/assessments?kind=quiz`; retain quiz question editing, review/attempts, result release and withhold, lifecycle and `?content=id` deep links |
| E03 | `/courses/:deliveryId/assignments/manage` | **KEEP** as specialized authorized section builder/editor, accessible from unified Create flow/Blueprint |
| E04 | `/courses/:deliveryId/quizzes/manage` | **KEEP** as specialized question builder/editor, accessible from unified Create flow/Blueprint |
| E05 | `/report/assignment/:contentId/submissions` | **KEEP**, advanced submissions, CSV and grades; link clearly from prototype grading/report |
| E06 | `/report/quiz/:quizId` | **KEEP**, quiz report is not represented by the assignment report PNG |
| E07 | `/report/quiz/:quizId/attempts` | **KEEP**, individual attempt and question-level drill-down |
| E08 | `/results` | **KEEP**, multi-section assessment response rates, aggregate scores and export |
| E09 | `/response-followups` | **KEEP**, distinct missing-response operational workflow |
| E10 | `/courses/:deliveryId/assessment-health` | **REVIEW** versus section reports hub; keep until metrics/links/scope are proven equivalent |
| E11 | `/courses/:deliveryId/reports` | **KEEP**, section-scoped report index |
| E12 | `/courses/:deliveryId/gradebook` | **KEEP**, published section-gradebook/CSV |
| E13 | `/courses/:deliveryId/gradebook/:learnerMembershipId` | **KEEP**, published individual learner score breakdown |
| E14 | `/courses/:deliveryId/students/:membershipId` | **KEEP**, roster detail, individual attendance and session history |
| E15 | `/courses/:deliveryId/session-coverage` | **KEEP**, scheduled attendance session coverage audit |
| E16 | `/courses/:deliveryId/discussion-history` | **KEEP**, audit/moderation history |
| E17 | `/courses/:deliveryId/discussion-participation` | **KEEP**, participation analytics |
| E18 | `/live-classes` | **KEEP**, live-class management and schedule editor |
| E19 | `/contacts/:contactsTab` | **KEEP**, old LMS Faculty contacts directory capability |
| E20 | `/contacts/:contactsTab/:membershipId` | **KEEP**, scoped contact details |
| E21 | `/notifications` | **KEEP**, full inbox instead of header bell popup only |
| E22 | `/profile` | **KEEP** as canonical Faculty profile |
| E23 | `/profile/details` | **CANDIDATE** → profile section, **only** after save/error/retry and `?section` legacy deep-link parity |
| E24 | `/profile/contacts` | **KEEP** pending identity/registered contact data scope and edit-parity proof |
| E25 | `/profile/teaching` | **KEEP**, detailed College-assigned teaching/role scope |

### Five redirects, not standalone pages

| Existing redirect | Target | Required regression |
|---|---|---|
| `/contacts` | `/contacts/allContacts` | maintain current membership and contact privacy |
| `/courses/:deliveryId` | authorized section `/home` | deny invalid/foreign class IDs, preserve safe legacy hints |
| `/fileExplorer` | `/courses` | **explicitly prove useful old Faculty file-explorer workflows survived within course resources**; redirect alone is not feature parity |
| `/courses/:deliveryId/notices` | `/discussions` | distinguish intentionally retired notice board from lost notices/announcements capability |
| `/courses/:deliveryId/attendance-corrections` | `/attendanceDetail` | check whether authenticated correction request/history feature was intentionally retired |

## Immediate consolidation gates

- [ ] **Assessments feature matrix:** identify each old All Assignments/All Quizzes action (search/status filters, create, metadata edit, question edit, submission details, grading, publish/close/archive/delete, release/withhold results, deep links). Prove its canonical UX equivalent **before** redirect.
- [ ] Canonical assessment `?kind=` and `?content=` links preserve filtering and quiz deep links where safe and authorized; old route bookmarks and URLs must remain operable until then.
- [ ] Do not suppress legacy E2E suites or remove specialized builders to get nominal green. Update them to exercise the **new** canonical destination only after parity; keep security, persistence and mobile witnesses.
- [ ] Verify distinct report/gradebook/student/notification/profile screens; do **not** combine different information scopes merely because their titles sound similar.
- [ ] Keep source-only, browser-tested, deployed-ready and pixel-level visual statuses separate. No sample screenshot counts copied as production telemetry.
- [ ] Complete #05 Blueprint code acceptance before resuming one-at-a-time #06 → #13, then regression #02–#04; compare screenshots only in a later visual phase.
- [ ] Once canonical screens demonstrably replace old destinations, change redundant paths to **scoped backward-compatible redirects** rather than deleting them; rerun legacy bookmarks, unauthorized and deep-link tests.

**Priority:** stable no-feature-loss consolidation **after** canonical page behavior has passed; do not treat proposed merges as completed implementation. Code acceptance tracker: [00-closure-ledger.md](00-closure-ledger.md).
