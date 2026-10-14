# LMS vNext — Account Surface Parity Matrix v2

> **Freshness gate — 2026-10-05:** this matrix was built against FE `38cdd38e...`, while current observed FE is `1d563f75...` and BE is `94af997f...`. The matrix is still useful for work tracking but is not final cutover proof until `docs/planning/clone-parity-protocol.md` is satisfied, the route manifest is refreshed, and family evidence is VERIFIED against the frozen oracle.

**Audit date:** 2026-10-04  
**Legacy UI oracle:** `42Students/lms2-fe@prod-2026`  
**Legacy audited SHA:** `38cdd38e592a6f416c8e8e99ce36438f548ed577`  
**vNext audit baseline:** `d972ebdf4563d34a059d59c4268e1f37911925fa`  
**Mechanical route inventory:** `docs/planning/legacy-ui-route-manifest.md`  
**Detailed page/workflow specs:** `docs/parity/README.md`  
**Learner operational ledger:** `docs/planning/learner-ui-surface-ledger.md`  
**Learner family evidence:** `docs/planning/learner-family-verification.md`  
**No-surprise clone gate:** `docs/planning/clone-parity-protocol.md`

This matrix is the **surface-level behavioral source of truth** for clone-first / redesign-later. The route manifest is the mechanical backstop. The account files under `docs/parity/` are the second-level closure contracts for every page's sections, tabs, actions, forms, filters, modals, drawers, states, permissions, responsive behavior and regression coverage.

A row may be marked DONE only when its user job is implemented **and** the required detailed page contract is closed. For Learner specifically, all corresponding operational ledger rows must also be resolved (`CLOSED`, `REDESIGNED`, or `RETIRED`).

## Audit result

The first matrix was not exhaustive enough. The deep route/navigation/section audit found:
- TPO Companies, TPO Profile and the real TPO More utility surface were absent or under-classified.
- Mentor Courses/Contacts/Quizzes/File Explorer/Profile and Faculty File Explorer are redirect stubs, not missing product pages.
- HR `/hr/colleges` is a retired redirect; the actual college chooser behavior lives on HR Home.
- TPO, Mentor and other role-specific Notifications had been overclaimed as DONE merely because a shared vNext Notifications route exists.
- TPO Settings, TPO Reports, TPO Students, TPO Drive detail, HR Drive detail, Super Admin Tenant Setup/Settings/Module Access/HR Accounts and Admin Project workspaces were represented by umbrella rows that could hide unfinished sections.
- public/shared flows — recruiter invite, company applicant share, auth handoff, AI grading, tracker/ops, marketing/legal and error surfaces — were absent from the account-only matrix.

## Status vocabulary

- **DONE** — user job and relevant route/sections/actions/states are implemented and audited.
- **PARTIAL** — meaningful vNext implementation exists, but parity is not complete.
- **MISSING** — legacy user job has no adequate vNext equivalent.
- **VERIFY** — product ownership/reachability/intent still needs an explicit decision.
- **REDESIGNED** — intentionally different vNext surface covers the full legacy user job; rationale recorded.
- **RETIRED** — intentionally not carried forward; reason recorded.
- **BLOCKED** — implementation/verification requires an external dependency.

Resolved statuses: DONE, REDESIGNED, RETIRED.  
Release-blocking statuses: PARTIAL, MISSING, VERIFY, BLOCKED.

A route existing is not enough. Closure includes sections/tabs/cards, primary and secondary actions, dialogs/drawers, loading/empty/error/permission states, workflow result, role/tenant boundaries and important responsive behavior.

---

# 1. Learner

Detailed page contract: `docs/parity/learner.md`.

| Surface | Legacy route/section | vNext mapping | Audit note | Status |
| --- | --- | --- | --- | --- |
| Courses list | `/learn/courses` | `/learn/courses` | Semester/history, filters, instructor context, progress, responsive course-type controls, correct Electives grid separation and large-list behavior implemented; course thumbnail and mobile/browser evidence remain open. | PARTIAL |
| Course Overview | course `home` tab | existing overview + `/learn/courses/[deliveryId]/progress` | PARTIAL — Added own-enrollment, read-only per-lesson and per-item progress drill-down showing actual persisted content/assignment/quiz completion, in-progress/missed counts, percentages only when items exist, honest unpublished/empty states and links to existing Learning Path. Uses Zod UUID, central `courses.read`, verified persisted active LEARNER membership and existing learning access gate, with mobile cards, loading/error states and authored model/database-denial tests. Authored overview/outcomes already existed; legacy browser/progress workflow parity and executed DB verification remain open.  The Overview now explicitly warns when a published path/lesson/trackable denominator is absent instead of displaying a false 0%; pure model unit coverage added. | PARTIAL |
| Learning Path | course `roadmap` tab | course workspace | Ordered lessons/content/assessments + continue learning. | DONE |
| Course Attendance | course `attendanceDetail` | existing month attendance + `/learn/courses/[deliveryId]/attendance-summary` | PARTIAL — Added own-enrollment read-only per-course attendance history drill-down, India-timezone month grouping, held vs marked/unmarked vs scheduled sessions, real present/other-marked counts, percentage only with marked sessions, threshold context and responsive cards. Uses Zod UUID/month validation, central `academics.read`, persisted current learner membership and existing authorized attendance service. No write routes or fabricated absences. Unit/DB-denial tests authored; legacy/browser and executed DB verification remain open. | PARTIAL |
| Course Discussions | course `discussions` | same legacy tab route | Delivery-scoped feed, post/delete-own, pinned display, polling and explicit loading/empty/error states are implemented. | DONE |
| All Assignments | `/learn/allAssignments` | `/learn/allAssignments` | Aggregate filter/pagination and drawer, published-grade masking and late submission; deadline labels now derive from one server snapshot and regression-tested pure policy. File-backed submission and final mobile/browser verification remain. | PARTIAL |
| All Quizzes | `/learn/allQuizzes` | `/learn/allQuizzes` | Aggregate scope, filter, legacy-sized pagination, attempt/result states and exact standalone quiz deep links are implemented; mobile verification remains. | PARTIAL |
| Standalone quiz attempt UX | `/quiz` | `/quiz` full-screen attempt/review flow | Choice questions, unanswered warning, deadline/results/attempt fences and duplicate-submit protection. Draft restoration is now ordered before autosave and malformed session data is isolated. Final browser/mobile verification remains. | PARTIAL |
| Class Schedule | `/learn/calendar` | `/learn/calendar` | Source parity is closed for title/metrics, next-three preview, Month/Week/Day navigation, filters, event metadata/deep links, empty/error/loading states and mobile agenda fallback; final browser/CI verification remains. | PARTIAL |
| Attendance summary | `/learn/attendance` | `/learn/attendance` | Source parity is closed for course/month controls, metrics/threshold, course overview, desktop records, explicit loading/error/retry/empty states and tenant-safe reads; mobile cards are implemented and await final browser verification. | PARTIAL |
| Placements dashboard | `/learn/my-placements` | `/learn/my-placements` with persisted recent activity | Source-authored recent activity list includes real application submitted/withdrawn timestamps, published screening decisions and applied round outcomes only; ordered by actual event time with IST formatting, mobile layout and truthful empty states. Scoping and central permission derive from the existing learner journey service plus persisted membership validation. Other dashboard parity, browser verification and executed DB tests remain open. | PARTIAL |
| Applications | `/learn/my-placements/applications` | learner journey plus `/learn/my-placements/offers` and read-only application history/company pages | Dedicated all-offers page is now discoverable from Applications and the dashboard offer-alert CTA, displaying all persisted own-member offers with All/Awaiting/Accepted/Closed filters and an explicit no-offers state; reuses the existing response UI/API rather than introducing a new mutation route. Application detail/history/company pages remain. Exact legacy modals, comprehensive offers/withdrawal workflow parity, browser verification and executed DB tests remain open. | PARTIAL |
| Assessments | `/learn/my-placements/assessments` | schedule workspace plus read-only `/learn/my-placements/assessments/results` | PARTIAL — Added official applied TEST/VENDOR_TEST results with All/Passed/Not passed/Other filters, persisted score and shared feedback when present, IST dates, mobile cards, truthful no-result/filtered-empty states and own-application links. Uses registered placement round/application/result tables, persisted learner membership and central `placements.read`; Zod query validation, loading/error pages and authored unit/DB-denial tests included. Pending/Completed employer-submission workflow, browser and executed DB verification still open. | PARTIAL |
| Interviews | `/learn/my-placements/interviews` | scheduled interview/GD workspace | Learner search, Upcoming/Past/Awaiting date buckets, urgency, sorting and detail drawer with approved reschedules; interview confirmation and browser parity remain. Round details link to the existing real reschedule-request form with authorized round preselection; changes require approval. | PARTIAL |
| Career Calendar | `/learn/my-placements/calendar` | dedicated Calendar | Month/Week/Day/Agenda navigation, event-kind filters, approved reschedules and .ics export are implemented for learner-visible scheduled rounds; legacy job important dates/TALK/BLOCKED sources, event drawer and browser parity remain. | PARTIAL |
| Jobs list | `/learn/my-placements/jobs` | scoped published-job feed with URL-backed closing-soon toggle | PARTIAL — Added Closing within seven days toggle against persisted application deadlines, with a single server clock snapshot shared with existing deadline policy, Zod URL validation, and honest exclusion of expired/missing/beyond-window deadlines. Uses persisted own-college job/eligibility data and central `placements.read`; unit and DB-denial tests authored. Saved-job persistence remains unmigrated; remaining legacy tabs, browser and executed DB verification still open. | PARTIAL |
| Job detail | `/learn/my-placements/jobs/[jobId]` | dedicated Learner job detail | Job/company facts, breadcrumbs, role-scoped eligibility checklist and actual/required rule details, existing apply/application/withdrawal actions, confirmed learner-declared external applications and withdrawal request dialog with reason validation, plus safe employer links. Legacy resume/receipt sections and browser parity remain. | PARTIAL |
| Placement Cell | `/learn/my-placements/placement` | offers/requests plus read-only personal placement alerts | PARTIAL — Added personal PLACEMENTS-module notifications from registered activity_events/in_app_notifications, restricted to the signed-in learner, exact college, and active placement participation. Shows real timestamps/unread indicators/sanitized internal links, honest no-alert state and loading/error retries. These are NOT college-wide placement notices, a notice-dispute system or authoritative sanction records: the separate notice producer/source is not registered. Registration/consent, official notices, dispute workflow and full browser verification remain open. | PARTIAL |
| Placement Rules | `/learn/my-placements/rules` | evidence/preference guidance | College-authored policy and acknowledgement workflow remain. | PARTIAL |
| Projects list | `/learn/projects` | same semantic route | Core list exists. | DONE |
| Project Overview | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Team | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Sprints / Board | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Tasks | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Resources | project detail | vNext project workspace | Storage-backed files remain dependency-bound. | PARTIAL |
| Project Meetings | project detail | vNext project workspace | Request/read behavior exists; exact parity pending. | PARTIAL |
| Project Delivery | project detail | vNext project workspace | Submission workflow exists; exact parity pending. | PARTIAL |
| Project Activity | project detail | vNext project workspace | Verify history/activity equivalence. | PARTIAL |
| Notifications feed | `/learn/notifications` plus `/learn/notifications/history` | learner inbox plus own-recipient keyset personal history | PARTIAL — Added 40-record server-paginated personal notification history backed by registered in_app_notifications/activity_events, validated cursor/unread query, stable createdAt+id ordering, verified persisted LEARNER membership and central `academics.read`, honest page-local counts, older/newest navigation, mobile cards and retry states. Existing personal read action remains same-origin protected; college announcement source still readiness-gated, and global feed/domain-filter pagination and browser/DB execution remain open. | PARTIAL |
| Self Profile | `/learn/profile` | `/learn/profile` | Current-oracle removed Job Preferences/Placement Academic Record are now also absent in vNext. Education/Identity Profile Verification, marksheets/private documents, send-back/update-pending states and verified badge metadata remain open and storage-dependent.  Added persisted own-membership user/program/cohort/department identity card with explicit no-active-enrollment state, central `academics.read`, strict Zod membership ID, unit and DB-denial coverage. | PARTIAL |
| `/learn` redirect | `/learn` | not required for greenfield bookmarks | Legacy redirect-only route; no user job lost. | RETIRED |

---

# 2. Faculty

Detailed page contract: `docs/parity/faculty.md`.

| Surface | Legacy route/section | vNext mapping | Audit note | Status |
| --- | --- | --- | --- | --- |
| Courses list | `/teacher/courses` | `/teacher/courses` | Exact Faculty Section-scoped listing, search and canonical tabs authored; independent full legacy acceptance still needed. | DONE |
| Course Overview | course `home` | faculty workspace | Exact overview parity pending. | PARTIAL |
| Blueprint | course `blueprint` | learning-path authoring | Core authoring exists; exact controls/states pending. | PARTIAL |
| Course Attendance | course `attendanceDetail` | `/teacher/courses/[deliveryId]/attendanceDetail` | Section monthly report, class scheduling, roster search and marking. Persisted absence selections now initialize per session and reset on explicit session change without effect races; audit/admin-policy/browser evidence remain. | PARTIAL |
| Course Discussions | course `discussions` | `/teacher/courses/[deliveryId]/discussions` | Delivery-scoped polling feed, Faculty post/pin/unpin/delete moderation, historical read-only state and recovery states are source-authored; DB/browser execution remains. | PARTIAL |
| Course Students | course `students` | `/teacher/courses/[deliveryId]/students` | Exact Section/elective delivery roster remains in place. Added read-only active-roster learner drill-in at `/teacher/courses/[deliveryId]/students/[membershipId]`, covering authorized basic roster details and registered Course session attendance across months with explicit unknown/unmarked states, central permission and exact current Faculty teaching scope. Unit/DB-denial tests are authored. Private student profile, photo, browser/positive-DB proof and legacy profile parity remain OPEN. | PARTIAL |
| Contacts — All | `/teacher/contacts/allContacts` | same route | Same-college active directory, role label, full name/email/phone, 10/20/50 server pagination, search and responsive cards. Read-only `/teacher/contacts/[contactsTab]/[membershipId]` now exposes current same-college directory contact and roles, guarded by persisted Faculty membership, central courses.read and strict Zod validation; private profiles and documents are not exposed. Unit/DB-denial tests authored; mobile/browser and profile-image parity remain. | PARTIAL |
| Contacts — Teachers | `/teacher/contacts/teachers` | same route | Persisted Faculty-role active same-college filter plus role-checked directory detail linked from each row, with name/contact/roles only; private Faculty profile data remain out of scope. DB/browser verification and full legacy drill-in parity remain open. | PARTIAL |
| Contacts — Students | `/teacher/contacts/students` | same route | Persisted Learner-role active same-college filter plus role-checked directory detail linked from each row, with name/contact/roles only. Private learner profile and verification remain unavailable; DB/browser proof open. | PARTIAL |
| Notifications | `/teacher/notifications` | `/teacher/notifications` | Membership-scoped personal notifications and announcements, loading/error/retry states; legacy feed/deep-link browser proof pending. | PARTIAL |
| Class Schedule | `/teacher/calendar` | `/teacher/calendar` | Source-authored week/day/month calendar from persisted active Faculty teaching assignments, Section/course filters and correct Faculty Course links. Session edit/marking, responsive behavior and database/browser tests not executed. | PARTIAL |
| All Quizzes | `/teacher/allQuizzes` | `/teacher/allQuizzes` | Aggregate Faculty teaching-section quiz page, course/status filters, 20-row pagination, review-attempts, result publication and Section-specific Quiz Report links are source-authored. Create remains Course-contextual; direct metadata edit/delete are source-authored. Question-structure editing, detailed report analytics/modal parity and DB/browser verification remain. | PARTIAL |
| All Assignments | `/teacher/allAssignments` | `/teacher/allAssignments` | Aggregate Faculty teaching-section assignment page, course/status filters, 20-row pagination, review-submissions, grade/publish control and Section-specific Assignment Report links are authored. Create remains Course-contextual; direct edit/delete and missing-student reporting are source-authored. Exact legacy drawer/modal and DB/browser verification remain. | PARTIAL |
| Assignment report | `/teacher/report/assignment/[contentId]` | same route; `/teacher/results`; `/teacher/response-followups` | PARTIAL — Existing Section report and follow-up remain. Added client-side CSV download of exact authorized response/missing learners with score/privacy/timing notes, UTF-8, quoting and formula-neutralized values. No broader DB reads or new write route. Unit/denial tests authored; true browser CSV, exact legacy output, and full DB/report parity remain open. |
| Quiz report | `/teacher/report/quiz/[quizId]` | same route; `/teacher/results`; `/teacher/response-followups` | PARTIAL — Existing Section report and missing-attempt follow-ups remain. Added client-side CSV of latest persisted learner attempts and current eligible no-attempt rows, with score data only from authorized report readers and formula-neutralized UTF-8 cells. Unit/DB denial tests authored; executed CSV browser proof, complete legacy analytics and exact parity remain open. |
| Self Profile | `/teacher/profile` | `/teacher/profile` | Role-scoped read-only Faculty account details and navigation implemented, with loading/retry. Full legacy About sections and authorized editing await profile storage promotion and browser verification. | PARTIAL |
| File Explorer | `/teacher/fileExplorer` | n/a | Legacy is only a redirect to Courses; not a real product surface. | RETIRED |
| `/teacher` redirect | `/teacher` | n/a | Redirect-only legacy route. | RETIRED |

---

# 3. Mentor

Detailed page contract: `docs/parity/mentor.md`.

| Surface | Legacy route/section | vNext mapping | Audit note | Status |
| --- | --- | --- | --- | --- |
| Mentor landing / Projects-disabled state | `/mentor` | `/mentor` | Implemented projects-on redirect and projects-off notice; browser and tenant-policy verification remain. | PARTIAL |
| Projects list | `/mentor/projects` | same | Exists. | DONE |
| Project Overview | project detail | vNext project workspace | Exact role behavior pending. | PARTIAL |
| Project Team | project detail | vNext project workspace, plus `/mentor/projects/[projectId]/team-history` | PARTIAL — Existing Team workspace retained; new read-only membership history uses registered project_members starts/ends, active assigned Mentor project scope, central projects.read, filters/pagination, and hides ended/inactive member names. Missing pre-migration history, team-edit lifecycle, browser tests and full legacy parity remain open. |
| Project Sprints | project detail | vNext project workspace; cross-project `/mentor/sprint-progress` | PARTIAL — Registered sprint/release and task-status progress is now read-first for current same-college Mentor project assignments; strict scoped search/status pagination, zero-task Unknown completion, authorized workspace drill-through, pure-model and DB-denial tests are authored. Timeline edits, legacy sprint board behavior, positive DB/browser acceptance and exact parity remain open. |
| Project Tasks / Board | project detail | vNext project workspace | Exact role behavior pending. | PARTIAL |
| Mentor pending task reviews | `/mentor/task-reviews` | Pending registered task submissions across active assigned Mentor projects, linked to existing Board controls. | PARTIAL — Uses migrated task/submission/instance tables, strict Mentor role and projects.read college scope, active assignments, Zod filters, bounded search/pagination, disabled/empty/error states and pure-helper/DB-denial tests. This is not the final-delivery review queue. Full task-detail functionality, positive PostgreSQL execution and exact browser/legacy acceptance remain open. |
| Project Resources | project detail | vNext project workspace | Storage-backed files dependency remains. | PARTIAL |
| Project Meetings | project detail | vNext project workspace | Project-level lifecycle exists; exact parity pending. | PARTIAL |
| Project Delivery / review | project detail | vNext project workspace; additional `/mentor/review-history` | PARTIAL — Existing scoped delivery actions stay authoritative. New read-only cross-project review history lists only registered P6 final-delivery decisions from actively assigned Mentor projects, with bounded decision filters, pagination, and no raw feedback or learner identities. It is not an authored-by-current-Mentor audit. Former assignments, historical gaps, positive DB/browser tests and exact legacy parity remain open. |
| Project Activity | project detail | vNext project workspace | Verify activity/history parity. | PARTIAL |
| Global Meetings calendar | `/mentor/calendar` | `/mentor/calendar` | Authorized cross-project meeting list, requested/upcoming/past grouping, auto-refreshing time and safe join links exist; hydration state transition no longer cascades synchronously. Browser/tenant verification remains. | PARTIAL |
| Mentor Notifications | `/mentor/notifications` | membership-scoped inbox, current project attention, college announcements | PARTIAL — Previously existing project attention cards are preserved; personal feed now uses persisted active Mentor role verification and shared own-user keyset notifications, 50-per-page all/unread pagination and malformed-cursor recovery, plus existing college-audience announcements. Central academics.read same-college check, Zod, unit and DB-denial tests authored. Legacy producers/deep links, full browser/CI verification and parity remain open. |
| Mentor delivery review queue | `/mentor/reviews` | Assigned project submission alerts; links to existing Delivery review actions. | PARTIAL — Active Mentor college/member scoping, pending-review filtering, search, pagination, disabled/empty/loading/error states and helper/denial tests authored. Existing Delivery workspace remains authoritative for writes. DB/browser verification and exact legacy queue parity pending. |
| Mentor portfolio activity | `/mentor/activity` | Registered `activity_events` related to actively assigned Mentor projects. | PARTIAL — Central projects.read permission, college/organization and live assignment filters, fixed safe event labels, DB pagination and empty/error states authored. Activity producers, legacy full history coverage and executed DB/browser verification pending. |

| Mentor Courses routes | `/mentor/courses/*` | n/a | Legacy redirect stubs to mentor Projects. | RETIRED |
| Mentor Contacts routes | `/mentor/contacts/*` | n/a | Legacy redirect stubs. | RETIRED |
| Mentor All Quizzes | `/mentor/allQuizzes` | n/a | Legacy redirect stub. | RETIRED |
| Mentor File Explorer | `/mentor/fileExplorer` | n/a | Legacy redirect stub. | RETIRED |
| Mentor Profile | `/mentor/profile` | n/a | Legacy redirect stub by explicit product design. | RETIRED |

---

# 4. College Admin

Detailed page contract: `docs/parity/college-admin.md`.

## 4.1 Operations

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Dashboard | `/college-admin/dashboard` | dashboard workspace | Exact command-center cards/actions parity pending. | PARTIAL |
| Activity Log | `/college-admin/audit` | `/activity` | Activity Center exists; exact filtering/detail/noise-reduction parity pending. | PARTIAL |
| Self Profile | `/college-admin/profile` | `/college/profile` | Read-only account summary (name, mobile, email, college, organization, roles) keyed only by the signed-in user, role-guarded, linked to signed-in devices. Editing contacts and the legacy About sections are not built. Real-DB tested. | PARTIAL |
| Placement Interview Calendar | `/college-admin/calendar` | `/college/placements/calendar` | Source-authored college-scoped placement-round calendar with Month/Week/Agenda, company/job/date and round-kind filters, IST grouping and job/round deep links. Defaults to INTERVIEW; other round kinds can be selected. Exact legacy calendar behavior, application drill-in, browser and database verification remain open. | PARTIAL |

## 4.2 Academic Setup

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Departments | `/college-admin/departments` | `/college/departments` | Core CRUD exists. | DONE |
| Programs | `/college-admin/programs` | Academics workspace | Dedicated parity surface/actions still needed under clone-first rule. | PARTIAL |
| Semesters | `/college-admin/semesters` | `/college/semesters` | PARTIAL: read-first authenticated College Admin program-term list from registered DB-0050 `program_terms` and `program_term_courses`, not an academic-period substitute. Actual term number/name, configured total credits, active/inactive state, mapped-course counts, program/status/search filters, 25-row pagination, college-scope permissions, loading/error/empty states and sidebar link. Creation/edit/delete, dependency checks, exact legacy fields/actions, database execution and browser parity remain open. | PARTIAL |
| Semester–Course Mapping | `/college-admin/semester-courses` | `/college/semester-courses` | PARTIAL read-only college-scoped offerings across registered `course_offerings`, courses, cohorts, programs and academic periods. Program/period selectors, course search, 25-row pagination, CORE/ELECTIVE types, credits and offering deep links. No legacy numbered-semester equivalence is claimed. Add/unmap actions, legacy semester-ordinal and credit-total behavior, duplicate blockers, executed DB tests and browser parity remain open. | PARTIAL |
| Batches | `/college-admin/batches` | `/college/batches` | PARTIAL: read-first authenticated College Admin cohort list from migrated `cohorts`, `programs`, `academic_periods`, registered DB-0051 `cohort_progression_state`, and scoped `sections`/`learner_program_enrollments`. Name/code/program/start period, optional recorded term/year, active class/learner counts, server-side search/program/status filters, 25-row pagination and honest absence/error/loading states. No inferred end dates or promotion eligibility. Legacy create/edit/delete, students modal, move flow, promotion preview, DB execution and browser parity remain open. | PARTIAL |
| Classes | `/college-admin/classes` | Sections | Dedicated operational surface pending. | PARTIAL |
| Batch Promotion | `/college-admin/batch-promotion` | individual progression | Bulk promotion workflow missing. | PARTIAL |
| Lecture Halls | `/college-admin/lecture-halls` | `/college/lecture-halls` | Table (type, capacity, department, upcoming classes, status), add/edit dialog, archive (blocked while classes are scheduled) and restore, unique active names, same-college department check; sidebar entry. 10 real-DB tests, API/page/dialog verified. Not yet compared field-by-field with the legacy page; no bulk import. | PARTIAL |
| Electives | `/college-admin/electives` | ELECTIVE offerings | Dedicated lifecycle surface pending. | PARTIAL |
| Attendance | `/college-admin/attendance` | `/college/attendance` | Policy card, college-scoped Class/Course filters (including show-all-courses), India-local monthly grid, multiple-session chooser, record drawer, corrections with confirmation/window guards, and CSV export implemented. Real-DB, browser and exact legacy behavior verification still pending; no parity closure claimed. | PARTIAL |
| Section operations / schedules | class/section flows | Academics section workspace | Core vNext structure exists; exact legacy actions need audit. | PARTIAL |

## 4.3 Courses & Content

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Courses | `/college-admin/courses` | `/college/courses` | Core list exists. | DONE |
| Course detail | `/college-admin/courses/[id]` | offering workspace | Exact section/action parity pending. | PARTIAL |
| Lessons aggregate | `/college-admin/lessons` | `/college/lessons` | PARTIAL — Read-only college-wide catalogue of migrated `course_lessons`, `course_learning_paths`, `course_offerings`, `courses` and authored `lesson_contents`, with canonical college scope checked across course department, cohort program department and academic period. Search, lesson status, 25-row pagination, course/cohort/period and path state, published-vs-authored content counts, offering deep links, loading/error/empty states. No file metadata or signed media queried; status counts do not imply learner visibility. Legacy create/edit/delete/reorder, content drill-down, detailed filters/export and database/browser parity still open. | PARTIAL |
| Video aggregate | `/college-admin/lesson-content?type=video` | offering workspace | Dedicated surface incomplete; signed storage blocked. | PARTIAL |
| Resources aggregate | `/college-admin/lesson-content?type=resources` | offering workspace | Dedicated surface parity pending. | PARTIAL |
| Live Classes aggregate | `/college-admin/lesson-content?type=live-classes` | offering workspace | Dedicated surface parity pending. | PARTIAL |
| Assignments aggregate | `/college-admin/assignments` | `/college/assignments` | PARTIAL — Dedicated, read-only College Admin aggregate across registered `course_assignments` and `assignment_submissions` (Drizzle migration 0006), joined through lessons/learning paths/offerings/courses/departments to the signed-in college. Title/status filter, database pagination, course/lesson/due-date context, shared versus section-specific authorship, persisted submission-row counts and offering deep links are implemented; sidebar and dashboard quick action linked. Source rows are not authorization for downloading attachments; FILE submission storage remains blocked. Legacy creation/editing/modals, learner-level reporting, cross-college runtime testing and browser parity remain open. | PARTIAL |
| Quizzes aggregate | `/college-admin/quizzes` | `/college/quizzes` | PARTIAL — Dedicated, read-only College Admin quiz aggregate across registered `course_quizzes` and `quiz_attempts` (Drizzle migration 0007), joined through canonical lesson/learning-path/offering/course/department ownership. Title/status filter, 25-row database pagination, due date and course/lesson context, authored scope, attempt-row counts and offering links are visible; sidebar and dashboard quick action linked. Quiz answers/correct options are not read. Legacy create/edit/question management, result publication, per-learner report drill-in, cross-college runtime/browser evidence remain open. | PARTIAL |
| Course Progress | `/college-admin/course-progress` | `/college/course-progress` | PARTIAL — Read-only offering-by-offering counts from migrated `learner_content_progress`, lesson content/path hierarchy and college-owned LEARNER memberships. Distinguishes recorded content progress rows, content rows with completedAt and distinct learners who have any records; does not infer eligible learner denominator, course completion rate, lesson/assessment completion, attendance or current cohort readiness. Search, offering active/archive filter, 25-row pagination, exact college scope, offering links, loading/error/empty states. Legacy program/class/course filters, individual learner and completion breakdowns, export, executed DB/browser verification and final parity remain open. | PARTIAL |

## 4.4 People

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Faculty | `/college-admin/teachers` | `/college/faculty` | Read-first College Admin Faculty directory from registered college memberships, FACULTY roles, users and college-owned active teaching assignments. Includes name/email, membership/account state, joined date, title/email search, membership-status filter, 25-row pagination, honest zero/unknown association states, loading/error and quick/sidebar links. Central `people.manage` enforces the active admin college; no supplied college selector and no profile secrets. Legacy Faculty invite/create, edit, lifecycle actions, detailed profile, full teaching workload and browser/real-DB acceptance remain open. | PARTIAL |
| Faculty Assignment | `/college-admin/faculty-assignment` | `/college/faculty-assignment` | PARTIAL read-only college-scoped teaching assignment roster over migrated teaching assignments, Section deliveries, Faculty role memberships, courses and academic ancestry. Search/status filter, 25-row pagination, active/ended distinction, course links and honest empty/error states. New assignment, reassign, remove, duplicate/conflict validations, full legacy workflow, independently executed DB/browser evidence are still open. | PARTIAL |
| Students | `/college-admin/students` | `/college/students` | Read-first College Admin Students directory from registered college memberships, LEARNER roles, users, and active program/cohort/section enrollments. Includes name/email, membership/account state, joined date, title/email search, membership-status filter, 25-row pagination, honest missing-enrollment/class states, loading/error and quick/sidebar links. College ownership is enforced from the current request context with central `people.manage`; optional relations are read only for returned college-scoped member IDs. Legacy create/import/edit, full learner profiles, academic moves, cross-college DB execution and browser parity remain open. | PARTIAL |
| People Directory | `/college-admin/people` | `/college/people` | Core directory exists. | DONE |
| Student Groups list | `/college-admin/student-groups` | `/college/groups` | Read-only filterable, paged list (type, status, members, waitlist/requests, term). Creating/editing groups, CSV import and rules UI are not built (service has create/join/leave/transition, no screens). | PARTIAL |
| Student Group detail | `/college-admin/student-groups/[id]` | `/college/groups/[groupId]` | Read-only: counts, members ordered by state with waitlist position, self-join window, rule status, recent activity. No member add/remove/lock actions yet. 9 real-DB tests. | PARTIAL |

## 4.5 Placements

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Drives landing | `/college-admin/jobs` + `/college-admin/jobs/all` | placements operations | Exact tabs/filters parity pending. | PARTIAL |
| Drive Overview | job detail | vNext job workspace | Core exists; exact overview pending. | PARTIAL |
| Applications | `/college-admin/jobs/[jobId]/applications` | embedded job workspace | Dedicated workflow parity pending. | PARTIAL |
| Interviews | `/college-admin/jobs/[jobId]/interviews` | rounds | Dedicated interview surface pending. | PARTIAL |
| Shortlisted | `/college-admin/jobs/[jobId]/shortlisted` | screening state | Dedicated shortlist surface pending. | PARTIAL |
| Job Settings | `/college-admin/jobs/[jobId]/settings` | lifecycle/edit controls | Exact settings surface pending. | PARTIAL |
| Companies | `/college-admin/companies` | employer relationships | Dedicated company surface pending. | PARTIAL |
| Hiring Analytics | `/college-admin/hiring-dashboard` | funnel analytics | Exact analytics page pending. | PARTIAL |
| Placement Cell / TPO workspace | sidebar link to `/tpo/home` | admin placement operations | Must inherit TPO parity relevant to acting-as-TPO behavior. | PARTIAL |

## 4.6 Projects — list/aggregate

Legacy group landing: `/college-admin/projects`.

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Workspaces list | `/college-admin/projects/workspaces` | `/college/projects` | Core list exists; exact list actions pending. | PARTIAL |
| At Risk | `/college-admin/projects/at-risk` | `/college/projects/at-risk` | Source-authored read-only cross-project at-risk aggregate scoped to the College Admin's college (landed earlier; audited here only for existence). Legacy parity, browser and real-database acceptance remain open. | PARTIAL |
| Readiness | `/college-admin/projects/readiness` | `/college/projects/readiness` | Source-authored read-only readiness aggregate (landed earlier). Legacy parity, browser and real-database acceptance remain open. | PARTIAL |
| Submissions | `/college-admin/projects/submissions` | `/college/projects/submissions` | Source-authored read-only submissions aggregate (landed earlier). Legacy parity, browser and real-database acceptance remain open. | PARTIAL |
| Templates catalogue | `/college-admin/projects/templates` | templates available during create | Dedicated catalogue missing. | PARTIAL |
| Template detail | `/college-admin/projects/templates/[templateId]` | no dedicated detail | Missing/partial read-only detail. | PARTIAL |
| Project Audit | `/college-admin/projects/audit` | `/college/projects/audit` | Source-authored read-only cross-project audit view (landed earlier). Legacy parity, browser and real-database acceptance remain open. | PARTIAL |
| Create Workspace | `/college-admin/projects/workspaces/new` | creation control/dialog | User job exists; route form may later be REDESIGNED after exact action audit. | PARTIAL |
| Reassign Mentor | `/college-admin/projects/workspaces/reassign-mentor` | team controls | Bulk reassign workflow missing. | PARTIAL |
| Deleted Workspaces | `/college-admin/projects/workspaces/deleted` | none | Explicit product decision required; previous legacy audit questioned this UX. | VERIFY |

## 4.7 Projects — workspace sections

Parent detail route: `/college-admin/projects/workspaces/[workspaceId]`.

| Surface | Legacy section route | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Summary | `summary` | unified workspace | Exact metadata/status/archive/delete controls pending. | PARTIAL |
| Overview | `overview` | unified workspace | Narrative goal/deliverables/definition-of-done parity pending. | PARTIAL |
| Team | `team` | unified workspace | Member/mentor/team actions pending exact audit. | PARTIAL |
| Sprints | `sprints` | unified workspace | Lifecycle/edit behavior pending exact audit. | PARTIAL |
| Tasks | `tasks` | unified workspace | Board/task actions pending exact audit. | PARTIAL |
| Resources | `resources` | unified workspace | URL/text exists; storage upload blocked. | PARTIAL |
| Meetings | `meetings` | unified workspace | Schedule/complete/cancel exists; exact admin behavior pending. | PARTIAL |
| Readiness | `readiness` | unified workspace | Derived readiness exists; exact admin controls pending. | PARTIAL |
| Delivery | `delivery` | unified workspace | Final submission/review exists; exact admin behavior pending. | PARTIAL |
| Audit | `audit` | unified workspace/activity | Exact project history/audit parity pending. | PARTIAL |

---

# 5. Super Admin

Detailed page contract: `docs/parity/super-admin.md`.

Super Admin must not inherit College Admin parity only by prose. Shared surfaces are explicit below and are global/scoped as appropriate.

## 5.1 Platform / Tenant onboarding

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Overview | `/superadmin/dashboard` | dashboard | Exact platform KPIs/actions pending. | PARTIAL |
| Tenant Setup — Create stage | `/superadmin/tenants` tab 1 | Organizations + Colleges pages | User jobs exist separately; onboarding sequence/auto-select parity pending. | PARTIAL |
| Organizations onboarding CRUD | Tenant Setup Create | `/admin/organizations` | Core CRUD exists; exact onboarding behavior pending. | PARTIAL |
| Colleges onboarding CRUD | Tenant Setup Create | `/admin/colleges` | Core CRUD exists; exact onboarding behavior pending. | PARTIAL |
| Tenant Setup — Set up stage | Tenant Setup tab 2 | fragmented | Combined go-live setup flow missing. | MISSING |
| Readiness Gate | Tenant Setup | `/admin/colleges/[collegeId]/readiness` | W24: read-only college-scoped checklist with 10 persisted-data checks: college active; active College Admin, Faculty and TPO memberships; non-archived departments; active programs; non-archived cohorts; active learner enrollments; active placement season; and verified primary tenant domain. Pure evaluator distinguishes PASS/FAIL/UNKNOWN and READY/NOT_READY/INCOMPLETE. Lecture halls and persisted attendance-policy presence are supplemental, not invented blockers. Unknown data never passes; missing PostgreSQL relations return UNKNOWN, while other database errors surface explicitly. Central Super Admin college.read scope is enforced. Existing Colleges list links to the gate without removing CRUD. Exact legacy readiness criteria, runtime domain/login checks, actionable setup workflow, recheck/browser behavior, cross-college negative tests and real-PostgreSQL verification remain open. | PARTIAL |
| Tenant Domains | Tenant Setup | `/admin/domains` | Core domain management exists; DNS verify/primary/redirect behavior parity pending. | PARTIAL |
| College Branding | Tenant Setup | `/admin/colleges/[collegeId]/branding` | PARTIAL — Read-only Super Admin detail and illustrative desktop/mobile sign-in style previews use persisted `college_branding` (registered migration 0057), existing strict public-HTTPS URL rules, and LMS colour/contrast helpers. Scoped by `isSuperAdmin`, central `admin-scope.select` and exact `college.read` resource permission. Zod validates college IDs; unknown IDs return not-found; no private storage fields are queried. Shows safe public logo/backgrounds, mobile fallback, primary/secondary swatches, optional support and policy links, plus loading/error states; Colleges list links to preview. Pure-helper unit tests and source-authored disposable-PostgreSQL integration tests are included. Legacy exact sign-in appearance, uploads/editing, browser and executed DB verification remain open. | PARTIAL |
| Feature Controls | `/superadmin/features` | `/admin/features` | W28: Read-only, search/paginated active-college matrix for Projects, Placements and Electives, using persisted `module_access_rules` and the existing resolver for global/organization/college inheritance, ancestor locks and fixed source defaults. Super Admin selected-scope authorization is enforced by the central `admin-scope.select` and `college.read` permissions, with explicit college-filtered queries. College-detail drill-in shows inheritance and stored lower-scope overrides. Legacy switches, bulk changes, confirmation/blast-radius behavior, full module list and browser/database certification remain open. | PARTIAL |
| Module Access hierarchy | `/superadmin/module-access` | `/admin/features/[collegeId]` | W28: Read-only per-college global/organization/college inheritance matrix and paginated stored overrides for Department, Program, Cohort, Section and Membership scopes. Descendant rows are restricted by persisted college ownership, including academic parent joins; stored values are explicitly not misrepresented as effective learner access. Only the existing three optional modules are included. Complete node enumeration, effective descendant/learner traces, student counts, per-student override/lock drawers and editing remain open. | PARTIAL |
| Module Access student overrides/locks | drawers | none | Missing. | MISSING |
| Module Access access trace | “Why this student sees…” | `/admin/features/[collegeId]/trace` | W33: Read-only Super Admin college-specific learner search (active learner memberships only, name/roll-number substring search, max 25/page) with individual membership selection and validated same-college ownership. Shows the production `buildModuleAccessChain` levels (Membership, Section, Cohort, Program, Department, College, Organization, Global) plus actual source default for Projects, Placements and Electives. Displays exact stored rule per available level, ignored placement rules below College, selected winner, ancestor lock precedence and effective module On/Off from the existing resolver; does not duplicate decision logic or expose learner email/phone. Existing hierarchy page links to the trace. This explains module-access rules, not final placement participation or downstream route/action authorization. Legacy embedded drawer, full student identity/search semantics, non-active memberships, browser parity, independently executed real-PostgreSQL cross-tenant tests and final access trace certification remain open. | PARTIAL |
| Activity Log | `/superadmin/audit` | `/activity` | Global/scoped exact parity pending. | PARTIAL |
| HR Accounts list/create/edit | `/superadmin/hr` | `/admin/hr` plus `/api/admin/hr` | Super Admin-only account table, search, ACTIVE/ARCHIVED/DISABLED filter, server pagination, add/edit dialogs and detail drawer. Creation uses the first-party identity-provisioning path and requires an existing active company-college relationship; company reassignment is deliberately unsupported. Legacy exact fields and behaviour, disabled-user lifecycle, error recovery, responsiveness and browser tests still require verification. | PARTIAL |
| HR college-access grants/revoke | HR Accounts detail | `/admin/hr` detail drawer and `/api/admin/hr/[userId]/grants` | Visible active grants, company-matched relationship selection, grant, explicit revoke confirmation and refreshed account state using existing recruiter grant services. Scope is enforced by the backend; when the last visible grant is revoked a scoped recruiter may disappear. Cross-college negative tests, large-option-list behaviour and exact legacy interaction parity are not certified. | PARTIAL |
| HR terminate sessions | HR Accounts action | `/admin/hr` detail drawer and `/api/admin/hr/[userId]/terminate-sessions` | Explicit destructive confirmation calls the existing all-device session revocation for the canonical recruiter user; the effect extends to the user's other memberships. Executed session invalidation, audit-event coverage, concurrent revocation behaviour and browser acceptance remain unverified. | PARTIAL |

## 5.2 Tenant Settings groups

Parent route: `/superadmin/settings`.

| Surface | Legacy group | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Platform & auth settings | base/global host, cookie, IP allowlist, OTP | deployment/auth config only | No equivalent admin settings surface. | MISSING |
| SMS settings | sender + attendance/placement templates | `/admin/settings#sms` | PARTIAL — Read-only SMS inventory now distinguishes Exotel's fixed OTP SMS source template from fixed recruiter invitation/reminder outbound intent keys (not an active SMS sender), lists the contract-declared EMAIL/SMS/WHATSAPP channels and shared maximum-attempt/initial retry constants directly from source, and explicitly documents that provider acceptance is not delivery. No sender credentials, provider IDs, phone numbers, environment values or secrets are read or shown. Attendance/placement SMS templates and per-college SMS overrides have no verified registered persistence; `placement_tpo_college_settings` and DB10 outbound queue are draft/unmigrated, so their values are not claimed or queried. Legacy sender management, attendance/placement SMS template editing, actual queued dispatch, database/browser verification remain missing. | PARTIAL |
| Course & progress settings | watched/in-progress/poll/save thresholds | source config | `/admin/settings` shows the fixed timed-content completion threshold imported from the live course progress service, with source attribution. It is read-only and does not add global controls. Separate watched, in-progress, polling, save-interval and full legacy configuration parity remain open; runtime/browser acceptance unverified. | PARTIAL |
| Attendance settings | eligibility/correction/schedule grace | none | `/admin/settings` displays the source fallback attendance eligibility threshold and correction-window hours, or the selected college's persisted `attendance_policies` overrides, with explicit origin labels. No college selection means defaults only, not a platform-wide effective-policy claim. Editing remains outside this read-only inventory; schedule-grace parity and runtime/browser acceptance remain open. | PARTIAL |
| Placement settings | interview windows + placement thresholds/rate limits | source config | `/admin/settings` displays numeric college offer-rule defaults/overrides and non-secret recruiter-visibility booleans from the existing `placement_college_rules` and `placement_company_visibility_settings` sources. College-scoped persisted values require a selected college; no write controls are added. Job-specific thresholds, interview windows, rate limits, full legacy settings behavior and runtime/browser acceptance remain open. | PARTIAL |
| Operational caps | bulk/progress/identity/announcement limits | source config | `/admin/settings` shows selected fixed, non-secret numeric bounds imported from the live login, session, outbound-delivery and announcement sources, including login send budgets, challenge lifetime, resend gap, session age, delivery retry cap and announcement length/page limits. No runtime environment values or secrets are read. Bulk-upload caps, endpoint-specific limits, remaining legacy controls and runtime/browser acceptance remain open. | PARTIAL |
| Other stored keys | add/remove custom key | none | Explicit decision needed whether free-form config remains supported. | VERIFY |

## 5.3 Shared Academics / Courses / People / Placements

Every row below is Super-Admin scoped, even if College Admin has the same user job.

| Surface | Legacy | Status |
| --- | --- | --- |
| Departments | `/superadmin/departments` | PARTIAL |
| Programs | `/superadmin/programs` | PARTIAL |
| Semesters | `/superadmin/semesters` | PARTIAL |
| Semester–Course Mapping | `/superadmin/semester-courses` | PARTIAL |
| Batches | `/superadmin/batches` | PARTIAL |
| Classes | `/superadmin/classes` | PARTIAL |
| Batch Promotion | `/superadmin/batch-promotion` | PARTIAL |
| Lecture Halls | `/superadmin/lecture-halls` | PARTIAL |
| Electives | `/superadmin/electives` | PARTIAL |
| Attendance | `/superadmin/attendance` | PARTIAL — `/admin/attendance` exists on main (Super Admin attendance oversight). Exact legacy parity and browser acceptance remain open. |
| Courses | `/superadmin/courses` | PARTIAL |
| Lessons | `/superadmin/lessons` | PARTIAL |
| Video / Resources / Live Classes | `/superadmin/lesson-content` | PARTIAL |
| Assignments | `/superadmin/assignments` | PARTIAL |
| Quizzes | `/superadmin/quizzes` | PARTIAL |
| Course Progress | `/superadmin/course-progress` | PARTIAL |
| Faculty | `/superadmin/teachers` | PARTIAL |
| Faculty Assignment | `/superadmin/faculty-assignment` | PARTIAL |
| Students | `/superadmin/students` | PARTIAL |
| People Directory | `/superadmin/people` | PARTIAL |
| Drives / all drives | `/superadmin/jobs` + `/superadmin/jobs/all` + `/superadmin/jobs/[jobId]` | PARTIAL |
| Drive Applications | `/superadmin/jobs/[jobId]/applications` | PARTIAL |
| Drive Interviews | `/superadmin/jobs/[jobId]/interviews` | PARTIAL |
| Drive Shortlisted | `/superadmin/jobs/[jobId]/shortlisted` | PARTIAL |
| Drive Settings | `/superadmin/jobs/[jobId]/settings` | PARTIAL |
| Companies | `/superadmin/companies` | PARTIAL |
| Placement Interview Calendar | `/superadmin/calendar` | PARTIAL |
| Hiring Analytics | `/superadmin/hiring-dashboard` | PARTIAL |

**Lecture Halls (`/admin/lecture-halls`):** selected-college page reuses the College Admin hall table, create/edit/archive/restore actions, department options, and schedule-conflict guard. Lecture-hall service requires the selected Super Admin college for API reads and writes. Legacy search/filter parity, executed Super Admin database evidence and browser checks are pending; this is PARTIAL, not closed.

## 5.4 Projects — aggregate/template

Projects landing route: `/superadmin/projects`.

| Surface | Legacy | Status |
| --- | --- | --- |
| Templates list | `/superadmin/projects/templates` | PARTIAL — `/admin/projects/templates` exists with the catalogue and lifecycle controls. Exact legacy parity and browser acceptance remain open. |
| New Template | `/superadmin/projects/templates/new` | MISSING |
| Template Overview | `/superadmin/projects/templates/[templateId]` + `/overview` | PARTIAL — `/admin/projects/templates/[templateId]` exists with tabs for the read-only sub-views. Exact legacy parity and browser acceptance remain open. |
| Template Sprints | `/superadmin/projects/templates/[templateId]/sprints` | PARTIAL |
| Template Tasks | `/superadmin/projects/templates/[templateId]/tasks` | PARTIAL |
| Template Resources | `/superadmin/projects/templates/[templateId]/resources` | PARTIAL |
| Template Colleges | `/superadmin/projects/templates/[templateId]/colleges` | PARTIAL |
| Template Versions | `/superadmin/projects/templates/[templateId]/versions` | PARTIAL |
| Workspaces list | `/superadmin/projects/workspaces` | PARTIAL |
| At Risk | `/superadmin/projects/at-risk` | PARTIAL |
| Readiness | `/superadmin/projects/readiness` | PARTIAL |
| Submissions | `/superadmin/projects/submissions` | PARTIAL |
| Project Audit | `/superadmin/projects/audit` | PARTIAL |
| Create Workspace | `/superadmin/projects/workspaces/new` | PARTIAL |
| Reassign Mentor | `/superadmin/projects/workspaces/reassign-mentor` | PARTIAL |
| Deleted Workspaces | `/superadmin/projects/workspaces/deleted` | VERIFY |

## 5.5 Projects — workspace sections

Parent detail route: `/superadmin/projects/workspaces/[workspaceId]`.

| Surface | Legacy section | Status |
| --- | --- | --- |
| Summary | `summary` | PARTIAL |
| Overview | `overview` | PARTIAL |
| Team | `team` | PARTIAL |
| Sprints | `sprints` | PARTIAL |
| Tasks | `tasks` | PARTIAL |
| Resources | `resources` | PARTIAL |
| Meetings | `meetings` | PARTIAL |
| Readiness | `readiness` | PARTIAL |
| Delivery | `delivery` | PARTIAL |
| Audit | `audit` | PARTIAL |

---

# 6. TPO

Detailed page contract: `docs/parity/tpo.md`.

## 6.1 Home / CRM / Students

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Home command center | `/tpo/home` | dashboard + placement operations | Needs-you queue, setup checklist, follow-ups, weekly agenda, season numbers, branch performance, season/company funnels and compensation intelligence not fully cloned. | PARTIAL |
| Leads — Table | `/tpo/recruiters?view=table` | `/tpo/recruiters` | W05 source-backed list/search/manual-stage filter and create modal implemented; missing legacy owner/source/follow-up/export/bulk filters; API migration-gated, browser unverified. | PARTIAL |
| Leads — Board | `?view=board` | `/tpo/recruiters` Board view | W05 manual NEW/CONTACTED/NOT_NOW columns/cards; derived fact stages, drag/drop and overflow remain missing; DB gate blocks live data. | PARTIAL |
| Leads — Companies view | `?view=companies` | `/tpo/companies` and existing `/tpo/recruiters?view=companies` | Read-only college-scoped company directory with search, pagination, linked-contact counts, drive counts, offer counts, accepted offers and confirmed-joining counts. Canonical employer relationships and unlinked free-text CRM company groups remain distinct; missing CRM migration data is labeled unavailable. Existing recruiter Companies view is preserved. Legacy presentation/export parity, cross-role/browser evidence and performance verification remain open. | PARTIAL |
| Leads add/import/invite/bulk ownership/stage | Leads actions | create and duplicate-check on `/tpo/recruiters` | Add lead, contact collision lookup implemented (staged); import, invite, bulk owner/stage and prepared messages absent; 503 until W01 migration. | PARTIAL |
| Lead detail | `/tpo/recruiters/[recruiterLeadId]` | `/tpo/recruiters/[leadId]` | W05 edit contacts, interaction timeline, follow-ups/add/done, Not Now; missing invite, company drill-in, reschedule UI, derived stages; DB-gated/browser unverified. | PARTIAL |
| Company detail | `/tpo/companies?name=...` | `/tpo/companies/[companyId]` for canonical UUIDs; legacy `/tpo/companies?name=...` preserved | Read-only canonical college-company detail with explicitly linked recruiter contacts, persisted drives, offer/joining history and timeline based on stored contact activities, drive timestamps and offer events. Links to recruiter and job details; existing legacy name-based Company Memory behavior and add-contact link preserved. An additional read-only, paginated contact activity log at /tpo/companies/[companyId]/contact-log filters the registered college-scoped DB09 activities by type and lists contact, outcome and recorded time without PII/contact notes; unavailable tables show an explicit unavailable state. Unlinked contact reconciliation, documents, full legacy create-drive flow, history correction semantics, database/browser acceptance and parity verification remain open. | PARTIAL |
| Students intelligence summary | `/tpo/students` | `/tpo/students` | Source-authored five journey-state cards, active-enrollment and registered-pool metrics, branch placement intelligence and drill-down filters. Readiness and placed outcomes are explicitly provisional. Registration and external-offer source availability are surfaced, not silently interpreted as genuine zeroes. Legacy denominator and browser parity remain unverified. | PARTIAL |
| Students roster + journey filters | Students tab | `/tpo/students` | Source-authored college-scoped roster with journey, branch, search and pagination; student identity, academic evidence, registration, applications, offers, best applied round and provisional placement status. Filtered full-roster CSV uses an authorized GET and formula-safe escaping. Students roster entries now deep-link to /tpo/students/[membershipId]/history for paginated, college-scoped all-season application, applied-round, offer-version and joining evidence, with no private comments or unmigrated external offers. Company and journey-depth filters, saved views, bulk actions, academic import, full legacy student detail UX and browser verification remain missing. | PARTIAL |
| Students Requests tab | Students tab | `/tpo/students/requests` | Source-authored global read-only student requests view with persisted statuses, status and search filters, counts, pagination and job links. Direct request decisions, send-back behaviour, exact legacy request taxonomy and age filters, and browser acceptance remain missing. | PARTIAL |
| Student bulk Add to Drive | Students action | `/tpo/placements/jobs/[jobId]` and `/api/placements/jobs/[jobId]/bulk-add` | PARTIAL — TPO-only Bulk Add-to-Drive control in published drive workspace supports name-filtered active learner roster, 25/page browsing with selection across pages, up to 200 distinct memberships per confirmed POST, selected active role, and per-learner added/already-added/ineligible responses. Central `placements.manage` with TPO role and persisted college scope, strict Zod body, same-origin mutation check, learner participation and drive eligibility checks, current job/season/role validation, current application preservation, coordinator exclusion, transactionally inserted application/screening/history and signed-in TPO attribution. Reads/writes use migrated placement and core identity tables only; staged external offers/registrations are not accessed. Existing withdrawn applications are not revived and external-only drives are not auto-applied. Pure-model tests and PostgreSQL denial paths are authored; execution, remaining preflight-to-insert eligibility/policy race certification, user-facing consent/notification parity, exact legacy multi-role/selection UX and browser verification remain open. | PARTIAL |
| Student bulk Nudge / WhatsApp prep | Students action | none | Missing. | MISSING |
| Assign preparation | Students action | none | Missing. | MISSING |
| Higher-studies / participation state | Students action | `/tpo/students/[membershipId]/participation` now provides a TPO-only learner membership eligibility override (ELIGIBLE, INELIGIBLE with reason, or clear to inherited class/batch decision), guarded by central placements.manage scope, active learner enrollment validation, optimistic stale-state rejection, same-origin PUT and transactionally persisted PLACEMENTS activity audit. Registered `placement_eligibility_decisions` is the only participation table changed. **This is not a Higher Studies registration:** choices/consent/history in unmigrated `placement_batch_registrations` remain unavailable, along with TPO batch/class bulk decision-event history. Exact legacy participation workflow, database/browser verification and registrations are still missing. | PARTIAL |
| Debar | Students action | `/tpo/students/[membershipId]/participation` | W42 PARTIAL: A learner-level Debar/Remove-debar form uses the already registered `placement_eligibility_decisions` MEMBERSHIP scope and the existing participation PUT writer. Debar creates an INELIGIBLE override with mandatory tagged reason, a checked confirmation and existing transactionally atomic activity log. The same-origin guarded route and `placements.manage`/TPO college authorization are reused, including optimistic expected-decision conflict rejection. Actual learner self-application is blocked by `requireLearnerPlacementAccess` in the placement job apply flow. Removing only a Debar-tagged override clears it to class/batch inheritance; this does not automatically make the learner eligible, restore an earlier member override, revoke historical applications, or provide timed/drive-count DB08 debarment functionality. Legacy roster bulk/modal UX, debar duration and drive counts, cross-college real-PostgreSQL evidence, browser parity and product sign-off remain open. | PARTIAL |
| Academic-details import | Students action | none | Missing. | MISSING |

## 6.2 Drives

| Surface | Legacy drive workspace | vNext | Status |
| --- | --- | --- | --- |
| Drives list | `/tpo/drives` | placement operations | PARTIAL |
| New Drive | `/tpo/drives/new` | `/tpo/placements/new` | DONE |
| Edit Drive | `/tpo/drives/[jobId]/edit` | embedded controls | PARTIAL |
| Overview tab | drive detail | vNext job workspace | PARTIAL |
| Applicants tab | drive detail | vNext job workspace | PARTIAL |
| Rounds tab | drive detail | vNext job workspace | PARTIAL |
| Offers tab | drive detail | vNext job workspace now includes TPO-only confirmed bulk withdrawal of up to 50 persisted ISSUED or pending-joining ACCEPTED offers, with a mandatory reason, strict Zod input and same-origin mutation route. The scoped service reuses existing audited single-offer WITHDRAW transitions, supplies per-offer withdrawn/already-withdrawn/ineligible results and preserves learner-only ACCEPT/DECLINE. Complete multi-status bulk actions, executed PostgreSQL/tsc/eslint/browser verification and exact legacy interaction remain open. Optional expected-status checking under the existing locked offer transition prevents withdrawal after an offer changes from the selected state. | PARTIAL |
| Drive Day tab | drive detail | vNext job workspace | PARTIAL |
| Global Drive Day | `/tpo/drive-day` | embedded per job | PARTIAL |
| Round-focused Drive Day | `/tpo/drive-day/[roundId]` | Existing learner-coordinator route preserved; TPO-only membership now receives a read-only, centrally authorized, college-scoped round overview with job/company header, IST scheduling, attendance/result counts, shortlisted progression roster, application/result states and job workspace backlink. Malformed, unknown and cross-college round IDs return not-found. A read-only formula-safe per-round attendance CSV export links from the TPO round overview and uses that same authorized, persisted progression-filtered roster; missing attendance stays WAITING, and staged outcomes are not exported as applied. The round also links to /tpo/drive-day/[roundId]/no-shows, distinguishing explicit ABSENT marks from WAITING/unmarked or unknown statuses without inventing no-shows; unfinished rounds are labelled provisional. A dedicated explicitly-ABSENT-only, formula-safe CSV download is linked from the no-show page; unmarked/WAITING records are never exported as no-shows. Attendance/result mutations, historical no-show snapshots, mixed-role TPO view selection, exact legacy controls, executed database/security tests and browser parity remain open. | PARTIAL |
| Approve + publish preflight | drive action | vNext lifecycle | PARTIAL |
| Reject / send back request | drive action | vNext lifecycle | PARTIAL |
| Export applicants | drive action | `/tpo/placements/jobs/[jobId]` + `/api/placements/jobs/[jobId]/applicants/export` | PARTIAL |
| Share with company | drive action + `/company-share/[token]` | none | Critical external-sharing workflow missing. | MISSING |
| Extend deadline | drive action | vNext requests/lifecycle | PARTIAL |
| Cancel drive + consequence preview | drive action | vNext lifecycle | PARTIAL |
| Close drive + consequence preview | drive action | vNext lifecycle | PARTIAL |
| Recruiter Messages drawer | drive action | none | Missing. | MISSING |
| Student detail drawer | drive action | manager data | Exact UX missing. | PARTIAL |

## 6.3 Requests / Calendar / Reports / Messages

| Surface | Legacy | Audit note | Status |
| --- | --- | --- | --- |
| Global Requests inbox | `/tpo/requests` | Per-job request handling exists; global decision inbox missing. | PARTIAL |
| Calendar — Week | `/tpo/calendar` | Source-authored Monday-first seven-day grid with period navigation, event counts, job/round/lead links and IST times. Exact legacy display and browser verification remain open. | PARTIAL |
| Calendar — Month | same | Source-authored 42-day month grid with adjacent-month events, event links and navigation. Month-only metric semantics, responsive browser behavior and legacy parity remain unverified. | PARTIAL |
| Calendar — Agenda | same | Source-authored chronological day groups, event details, status, venue and deep links. Legacy popovers, detail parity and browser verification remain open. | PARTIAL |
| Calendar filters/summary | same | Shared authorized college read service supplies scheduled/completed rounds, published/closed job deadlines and recruiter follow-ups. Company text, kind/date filters, counts and next event are source-authored. Partial-source failure recovery, exact filter UX and executed DB/browser evidence remain open. | PARTIAL |
| Calendar create/move follow-up | `/tpo/calendar` | W38: TPO-only create form for an existing recruiter lead and reschedule form on each open follow-up card; inputs are explicitly IST and refresh the calendar after mutation. New same-origin guarded calendar POST/PATCH routes derive college from the active TPO membership, centrally authorize `placements.manage`, validate bodies with Zod, and reuse existing DB09 CRM `addTpoFollowup`/`moveTpoFollowup` services. Completed follow-ups stay immutable. Calendar forms appear only when `DB09_TPO_API_READY=DB09_VERIFIED`; existing TPO and other-role read views are preserved. This is a minimal form flow, not legacy modal/drag-drop parity; current CRM follow-ups have no optimistic version/timestamp guard. Browser verification, real-PostgreSQL execution and cross-tenant negative acceptance remain open. | PARTIAL |
| Reports gallery | `/tpo/reports` | Read-only gallery with overview/student-outcome/relationship groups, headline metrics, season/drive filters and live links to Placement Summary and By Branch. Other report cards are intentionally not linked. Exact legacy card set, semantics and browser parity unverified. | PARTIAL |
| Placement summary | `/tpo/reports/placement-summary` | Scoped server report with headline KPIs, distinct placed/offer counts, drive funnel, company table, season/drive filters, batch-registration caveat and authorized CSV download. Legacy presentation, saved views, historical denominator semantics and browser parity remain open. | PARTIAL |
| By branch | `.../by-branch` | Scoped department-attributed branch breakdown with registered/applicant/application/offer/placed counts, full-time package metrics, season/drive filters and authorized CSV download. Branch history snapshots, legacy chart/drill-ins and browser parity remain open. | PARTIAL |
| By company | `.../by-company` | `/tpo/reports/by-company` uses existing scoped company drive/applicant/offer/unique placed/best-accepted-full-time package aggregates and CSV. Legacy drill-ins and browser parity unverified. | PARTIAL |
| CTC | `.../ctc` | `/tpo/reports/ctc` adds accepted full-time offer CTC histogram, average, median, highest and unknown-CTC counts with CSV. Histogram counts offer records; existing Placement Summary remains best-offer-per-learner. Exact legacy chart and browser parity open. | PARTIAL |
| Unplaced students | `.../unplaced` | `/tpo/reports/unplaced` lists college-scoped current placement-pool registrations without an accepted offer in selected season/drive, with learner name, branch and CSV. This is not a historical season pool; legacy readiness, profile drill-ins and browser parity open. | PARTIAL |
| Offers & acceptance | `.../offers-acceptance` | `/tpo/reports/offers-acceptance` shows stored offer statuses per drive/company; expired outstanding is derived from persisted ISSUED expiry timestamps. CSV implemented. Historical releases/acceptances, exact legacy funnel and browser parity open. | PARTIAL |
| Joining status | `.../joining-status` | `/tpo/reports/joining-status` counts current accepted offers with JOINED, DEFERRED, DID_NOT_JOIN or pending/unrecorded joining outcomes by drive/company, plus CSV. Exact legacy history and browser parity open. | PARTIAL |
| Failure reasons | `.../failure-reasons` | `/tpo/reports/failure-reasons` groups current screening rejections, applied failed round results, and recorded application-withdrawal/offer-decline/offer-withdrawal history by reason and drive, with CSV. Counts are outcome/event records, not unique learners; unrecorded reasons are explicit. Season/drive filtering uses persisted job and college ownership. Legacy failure taxonomy, historical supersession rules, exact presentation and database/browser acceptance remain open. | PARTIAL |
| Leads report | `.../leads` | `/tpo/reports/leads` groups college-scoped recruiter CRM leads by manual stage and recorded source, with invite, click, recruiter-account and company-relationship linkage counts plus CSV. Recruiter linkage is only an observed proxy for conversion, not a proven hiring outcome. Leads lack persisted season/drive assignment, so this report is college-wide. Legacy lead conversion definitions, visual parity and database/browser acceptance remain open. | PARTIAL |
| Accreditation export | `.../accreditation` | PARTIAL — Read-only /tpo/reports/accreditation provides a scoped, formula-neutralized CSV evidence sheet at /api/placements/reports?kind=accreditation, using registered placement seasons, jobs, applications, offers, academic enrolments and department ownership only. The reader uses central placements.manage authorization and the authenticated college, checks season/drive ownership, and does not read staged placement_batch_registrations or placement_external_offers. Overall, by-branch and by-company rows show observed in-app applications, offers, currently accepted offers, distinct placed memberships and accepted full-time compensation; a completeness preflight is included in the page and CSV. Unknown graduating-population denominators, historical placement-time cohorts, external offers and statutory placement rates remain blank/not certified rather than fabricated. Exact legacy NAAC/NIRF column sets, preflight blockers, year normalization, browser acceptance and independent integration verification remain open. | PARTIAL |
| Report filters/saved views/export/presentation | report detail | Season and drive filtering plus formula-neutralized CSV exports implemented for Placement Summary and By Branch only. Saved views, charts, presentation mode, other report types and exact legacy export columns remain missing. | PARTIAL |
| Messages inbox | `/tpo/messages` | Read-only `/tpo/messages` authored with TPO membership and centralized `placements.manage` authorization, college-scoped recruiter-thread metadata when both DB09 message tables are registered, and a clearly labeled fallback over persisted PLACEMENTS in-app notification deliveries addressed to active TPO recipients otherwise. Includes unread/read/empty status filters where applicable, IST date range, display-name/job or event-type search, pagination, source-specific summary, loading/error/empty states and sidebar navigation. Message bodies, notification bodies, recipient addresses, phones, hashes and secrets are not exposed. Recruiter conversations and DB10 outbound messages remain migration-dependent; fallback notifications are not presented as actual conversations. Thread detail/body, reply/send workflows, recruiter drawer, sent/delivery tracking, exact legacy search/read semantics, database evidence and browser parity remain missing. | PARTIAL |

## 6.4 Settings — explicit ten sections

| Surface | Legacy `/tpo/settings?tab=` | Status |
| --- | --- | --- |
| Placement Season | `season` | PARTIAL |
| Placement Rules | `rules` | PARTIAL |
| Placement Team + student coordinators | `team` | PARTIAL — Read-only `/tpo/settings/team` shows active college-scoped TPO memberships, persisted TPO Admin and Faculty Coordinator assignments when `placement_tpo_team_members` is registered, and dated student Drive Day coordinator assignments when their table is available. Member names, roles and active membership statuses are displayed without emails or phones. The dedicated team table remains migration-dependent; unavailable assignment evidence is not presented as zero. Add/search/assign/remove/reassign flows, removal-impact checks, legacy role parity, integration and browser verification remain open. |
| Recruiter access | `recruiters` | PARTIAL — W36: Read-only `/tpo/settings/recruiters` lists persisted recruiter college grants from the registered `placement_recruiter_college_grants`, recruiter-profile and company-relationship tables. An active TPO membership plus the central `placements.manage` college scope is required; every database query is constrained to that signed-in TPO's own college. The page displays recruiter name, company, exact ACTIVE/REVOKED grant status, granted date and revoked date (IST), with status filtering and database-side pagination (25/page). Historical revoked grants remain visible, including when recruiter or company records are archived. Active grant status is not claimed to guarantee current account access. No emails, phone numbers or identifiers are displayed, and no mutations occur. Shared settings navigation is updated. Legacy grant/revoke controls, confirmation and immediate effects, exact browser UX, cross-college real-database regression testing and final parity certification remain open. |
| Trusted Companies/domains | `trusted` | PARTIAL — Read-only `/tpo/settings/trusted` lists active college-company relationships with persisted college-specific `isTrusted` flags and company primary-domain metadata. Explicit trusted-domain allowlist entries are read only from `placement_tpo_trusted_domains` when registered, with an unavailable-data warning otherwise. College website domains and company primary domains are not inferred to be trusted email domains. Add/normalize/remove trust actions, request-approval consequences, migration acceptance, integration tests and browser parity remain open. |
| Communication Templates | `templates` | MISSING |
| Student Notices + prep/readiness | `notices` | MISSING |
| My Notifications preferences | `notifications` | PARTIAL — Read-only `/tpo/settings/notifications` displays exclusively the signed-in TPO user's persisted in-app notification deliveries whose activity event belongs to their current college and organization, with all/unread/read filters, database-side pagination, scoped totals and safe fixed module-derived subjects. Raw notification titles, bodies, metadata and action URLs are not selected; no read acknowledgments or other writes occur. Own-college preference fields (morning digest, recruiter messages, requests, results ready, follow-ups) are read from `placement_tpo_user_preferences` only when registered, labeled Persisted when a user row exists, Source default when the table exists without an override, or Unavailable when the table is absent. Exact legacy preference-edit controls, downstream delivery enforcement, event coverage, notification action/detail flows, database acceptance and browser parity remain open. |
| What Companies See | `see` | PARTIAL — Read-only `/tpo/settings/see` displays all five effective recruiter-sharing flags for the signed-in TPO's own college: exact CGPA, Class 10/12 percentages, project links, assessment scores and attendance. The existing `getCompanyVisibilitySettings` reader applies central `placements.manage` college scope and returns the persisted `placement_company_visibility_settings` row or `DEFAULT_VISIBILITY` when absent. Each field is labelled Persisted or Source default, with a plain-language explanation. The shared Settings navigation links to this page; no edit/save behavior, database changes or unrelated data reads are introduced. Legacy editing, field-level enforcement across recruiter previews/shares/exports, privacy integration tests and browser parity remain open. |
| Placement Branding | `branding` | PARTIAL — Read-only `/tpo/settings/branding` displays the signed-in TPO's current college name, safe public logo preview where available, and persisted primary/secondary brand colours. The source is the registered `colleges` and `college_branding` tables, with per-field Persisted or Source default labels. Reads require an active TPO membership and centrally authorized `placements.manage` scope for that membership's college. Private `colleges.logoObjectPath` storage keys are never read, and unsafe logo URLs are not rendered. This is existing college-wide branding also used for sign-in, not proof of a separate placement-specific branding source. Legacy placement-branded documents, recruiter communications, upload/edit/save workflows, runtime tenant-isolation tests and browser parity remain open. |

Settings parity includes unsaved-change protection and all create/edit/remove/reassign/revoke flows represented by these sections.

**W20 — PARTIAL; read-only source implementation:** `/tpo/settings` redirects to `/tpo/settings/season` (or `/rules` for the legacy `?tab=rules` bookmark). Season shows the active/closed statuses and dates actually persisted for the TPO's college; it does not infer registration availability from season dates. Rules displays effective college-wide offer policy, explicitly distinguishing the persisted `placement_college_rules` row from the established source defaults, together with fixed participation behavior and paginated job-specific eligibility thresholds from `placement_job_eligibility_policies`. Every database read is protected by an active TPO role and central `placements.manage` college scope. No mutation behavior, save validation, dirty-state protection, registration management or blocked-date management is claimed. Real PostgreSQL, cross-tenant negative, and browser acceptance for W20 remain pending.

## 6.5 Audit / Notifications / Account

| Surface | Legacy | Audit note | Status |
| --- | --- | --- | --- |
| TPO Audit Log | `/tpo/audit` | Read-only, college-scoped TPO audit page joins persisted PLACEMENTS activity events with application status history, screening decisions, round change events, recorded result versions, offer transitions, joining history and available TPO share/download events. Event-kind/IST date/search filters, summary counts, pagination and loading/error/empty states are implemented without exposing actors' contacts, recipient emails, IPs, raw metadata or free-text reasons. Canonical activity and domain history can both record an action, so counts are records rather than deduplicated user actions. No historical settings-change audit is inferred without persisted records. Exact legacy event detail, actor/entity filters, settings coverage, export, cross-tenant/database verification and browser parity remain open. | PARTIAL |
| TPO Notifications | `/tpo/notifications` | Shared vNext Notifications exists, but legacy has All/Unread, mark-all-read, time grouping and linked notifications; exact event coverage unproven. | PARTIAL |
| TPO Profile | `/tpo/profile` | `/tpo/profile` adds a read-only, self-only membership profile: display name, college/code, persisted roles and membership status, and department when the signed-in membership has a matching-college faculty profile. The service authorizes the current TPO membership and never accepts another user's ID or exposes contact details. Accessible through `/tpo/more`; legacy profile editing, image/details, full faculty-backed field parity and browser/database acceptance remain open. | PARTIAL |
| More utility | `/tpo/more` | `/tpo/more` is a real secondary navigation page with links to existing Students, Student Requests, Calendar, Reports, Audit Log, recruiter Companies view and self Profile. A single TPO sidebar entry makes it reachable without removing existing navigation. Legacy Messages, Notifications and Settings utilities are not falsely linked because corresponding TPO-specific routes/workflows are incomplete; exact mobile-navigation presentation, additional utilities and browser parity remain open. | PARTIAL |
| `/tpo` redirect | `/tpo` | Redirect-only to Home. | RETIRED |

---

# 7. HR / Recruiter

Detailed page contract: `docs/parity/hr.md`.

## 7.1 Home / Drives

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| College-less chooser on Home | `/hr/home` | recruiter grants + dashboard | Exact chooser/pending-invite behavior incomplete. | PARTIAL |
| College-scoped Today | `/hr/home` | recruiter dashboard | Exact Today queue/metrics/actions pending. | PARTIAL |
| Drives list | `/hr/drives` | `/hr/placements` | Portfolio exists; exact filter/action parity pending. | PARTIAL |
| New Drive / request | `/hr/drives/new` | none | Employer-side request/create flow missing. | MISSING |
| “Fix” existing drive request | `/hr/drives/new?fix=` | none | Missing. | MISSING |
| “Hire again” from prior drive | `/hr/drives/new?from=` | none | Missing. | MISSING |
| Drive Overview tab | drive detail | vNext recruiter job | PARTIAL |
| Applicants tab | drive detail | vNext recruiter job | PARTIAL |
| Rounds & Interviews tab | drive detail | vNext recruiter job | PARTIAL |
| Offers tab | drive detail | vNext recruiter job | PARTIAL |
| Messages tab | drive detail | none | MISSING |
| Applicant review drawer/notes | drive detail | result staging | PARTIAL |
| Add/change/remove rounds | drive detail | limited manager model | MISSING |
| Interview slots | nested rounds tab | none | MISSING |
| Send results table | nested rounds tab | staged results | PARTIAL |
| Selection list / Offer / LOI workflow | offers | result/offer model | PARTIAL |

## 7.2 Calendar / Messages / Company / Account

| Surface | Legacy | Status |
| --- | --- | --- |
| Recruiter Calendar | `/hr/calendar` | PARTIAL — Read-only Week, Month and Agenda views use persisted scheduled/completed hiring rounds and application deadlines restricted to the recruiter's authorized job portfolio through `placements.recruiter.read` and exact college/company-relationship grants. Server-rendered IST dates, navigation, event links, no-access/empty states, loading and retry UI are implemented at source level. Legacy SLOT and RESULTS_DUE events, exact styling, browser verification and executed integration/permission tests remain open. |
| Recruiter Messages inbox | `/hr/messages` | MISSING |
| Company tab | `/hr/company?tab=company` | PARTIAL — `/hr/company` exists on main with company and team tabs. Exact legacy parity and browser acceptance remain open. |
| Team tab | `/hr/company?tab=team` | PARTIAL — the Team tab of `/hr/company` exists on main. Exact legacy parity and browser acceptance remain open. |
| Reports tab | `/hr/company?tab=reports` | PARTIAL — Read-only `/hr/company/reports` reports persisted hiring-drive, application and current offer-status counts for one recruiter-authorized college/company relationship at a time. The legacy-style `?tab=reports` destination redirects to the dedicated page, with additive Company & Team navigation. Uses registered `placement_jobs`, `placement_applications`, `placement_offers` and recruiter-grant persistence only. Central `placements.recruiter.read` authorization, persisted active recruiter/company relationship validation, college and relationship scoping, status filters, bounded pagination, summary, loading/error/empty states and pure-helper unit tests are included. Only PUBLISHED/CLOSED recruiter-visible jobs are counted; applications are records rather than unique learners, and current ISSUED/ACCEPTED offer counts are not lifetime issuance or joining outcomes. Legacy reporting taxonomy, visualizations, saved filters, exports, exact tab presentation, executed database tests and browser parity remain open. |
| Recruiter self Profile | `/hr/profile` | PARTIAL — The existing `/hr/profile` already displays the signed-in recruiter's name, own contact fields, designation, employer and active access count. This additive read-only expansion displays the currently active recruiter profile status, college names, grant statuses, active company-relationship statuses and persisted grant creation dates in IST. Registered sources are `placement_recruiter_profiles`, `placement_recruiter_college_grants`, `placement_company_relationships`, `colleges` and `organizations`. The new reader uses the signed-in identity, exact trusted grant allowlist, persisted active-state joins and central `placements.recruiter.read` checks; no other person's email or phone is read. HR Profile navigation and the existing Leave Access control were already implemented and remain unchanged. Legacy profile editing, full identity-field parity, independent testing of the pre-existing leave workflow, executed real-database acceptance for this addition and browser parity remain open. |
| Leave college access | Profile action | PARTIAL — Already implemented on `/hr/profile`: `RecruiterProfileAccess` displays the signed-in recruiter's active college grants, requires destructive confirmation and calls the same-origin `DELETE /api/placements/recruiter/access/[grantId]` endpoint. The service validates the grant UUID, checks ownership against the trusted recruiter context and signed-in user, and atomically revokes only that user's ACTIVE grant; the UI redirects to `/hr/home` on success. Existing behaviour is preserved. Executed real-database revocation/tenant-boundary tests, session refresh/browser verification, and exact legacy confirmation/error-state parity are still open. |
| `/hr/colleges` | retired redirect to Home | Legacy explicitly retired this route; chooser belongs on Home. | RETIRED |
| `/hr` | redirect to Home | Redirect-only route. | RETIRED |
| Public invite acceptance | `/hr-invite/[token]` | Join/pending/decline/not-hiring/unsubscribe flow missing. | MISSING |

---

# 8. Shared / public / cross-account product surfaces

Detailed page contract: `docs/parity/shared-public-ops.md`.

These were absent from matrix v1 and are now explicit.

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Tenant-aware login entry | `/` | `/` (college host shows college name, logo, colour, support links) | First-party phone/email OTP; college hosts admit only their members/granted recruiters; unknown hosts fail closed. Verified live 2026-10-13 (scripts/verify/login-live.mjs). See docs/architecture/first-party-login.md. | DONE |
| Login | `/login` | `/` sign-in (`/login` redirects) | Phone or email one-time code via Exotel SMS / ZeptoMail, resend timer, email fallback; real SMS and email delivery proven with a real device. No Firebase. | DONE |
| Separate Super Admin login | `/superadmin-login` | unified sign-in on a platform host | Intentional: one login; a college host refuses super admins, they sign in on the platform host. **Production must add a second factor for SUPER_ADMIN (docs/architecture/privileged-authentication.md); phone/email OTP alone is not enough.** | REDESIGNED |
| Cross-domain/account auth handoff | `/auth/handoff` | membership chooser/switcher only | Same-origin membership switching exists; token handoff across hosts is not equivalent. | PARTIAL |
| Company applicant share | `/company-share/[token]` | none | Code-gated external applicant list, expiry/revocation, CSV/resume ZIP/download audit is missing. | MISSING |
| Standalone AI Grading | `/ai-grading` | AI tools only | Legacy has exam/rubric form+JSON, PDF grading, extraction evidence, confidence/review queue and report generation. | MISSING |
| Standalone learner quiz | `/quiz` | inline quiz UI | Tracked under Learner; exact full-screen behavior pending. | PARTIAL |
| Privacy Policy | `/privacy-policy` | none | Decide whether vNext owns legal/public site or separate deployment retains it. | VERIFY |
| Custom 404 | `/404` | `src/app/not-found.tsx` | Legacy copy, Go back and Home recovery authored with brand tokens; public/mobile/browser parity remains unverified. | PARTIAL |
| Custom 500 | `/500` | `src/app/global-error.tsx` | Root fatal boundary uses legacy copy, Go back, Home and retry; browser/session/error-observability proof remains. | PARTIAL |

---

# 9. Operational / QA surfaces

Detailed page contract: `docs/parity/shared-public-ops.md`.

| Surface | Legacy | Audit note | Status |
| --- | --- | --- | --- |
| Issue Report | `/tracker` | No vNext equivalent. Decide whether 42 Tracker remains separate/legacy or is migrated. | VERIFY |
| Issues list | `/tracker/issues` | Same ownership decision. | VERIFY |
| Issue detail | `/tracker/issues/[issueId]` | Same ownership decision. | VERIFY |
| Logs | `/tracker/logs` | Legacy Super Admin Cloud Logging workflow, known-errors/digest/test alert/log→issue handoff. | VERIFY |
| Legacy E2E superadmin login | `/e2e/superadmin-login` | Test-only helper; vNext uses deterministic/E2E auth infrastructure instead. | RETIRED |

---

# 10. Public marketing surfaces

Detailed page contract: `docs/parity/shared-public-ops.md`.

These are outside the seven authenticated accounts but cannot remain unclassified.

| Surface | Legacy route | Status |
| --- | --- | --- |
| Marketing Home | `/home` | VERIFY |
| Platform | `/platform` | VERIFY |
| Universities | `/universities` | VERIFY |
| Enterprises | `/enterprises` | VERIFY |
| Request Demo | `/request-demo` | VERIFY |

Before parity launch closure, explicitly decide whether these remain served by the legacy/public site or migrate into vNext. Do not accidentally delete them during app replacement.

---

# 11. Legacy route artifacts / redirects

The full list lives in `docs/planning/legacy-ui-route-manifest.md`.

Important rules:
- files under `src/pages/Dashboard/course/**` and `src/pages/superadmin/sections/**` are reusable implementation components that accidentally live under Pages Router; do not recreate their URL-shaped paths;
- redirect-only routes are not “missing pages” unless bookmark compatibility is explicitly required;
- framework and E2E-only files are not product surfaces.

---

# 12. Shared dependency blockers

| Capability | Note | Status |
| --- | --- | --- |
| Browser login | Replaced by first-party Exotel/ZeptoMail OTP (no Identity Platform project needed). | DONE |
| Live session restoration | Opaque device sessions (digest stored, revocable per device); verified live: session survives requests, logout/revocation ends it, signed-in devices page. | DONE |
| Assignment file upload | Cloud Storage upload receipt/signing required. | BLOCKED |
| Signed VIDEO playback | Cloud Storage signed delivery required. | BLOCKED |
| Project file resource uploads | Same Cloud Storage dependency. | BLOCKED |
| Vertex AI-backed quality runs | Provider/config dependency; does not block non-AI parity work. | BLOCKED |

---

# 13. Audit invariants

Parity cannot close until all are true:

1. `npm run parity:status` reports zero PARTIAL, MISSING, VERIFY and BLOCKED rows.
2. `npm run parity:pages` reports zero open detailed page checks.
3. Every master DONE/REDESIGNED row has its required `docs/parity/*.md` contract closed or an explicit documented reason why a detailed item is not applicable.
4. Every account product route in `legacy-ui-route-manifest.md` is represented here.
5. Every legacy navigation destination is represented here.
6. Every composite page with tabs/sections has explicit subrows; umbrella rows alone are insufficient.
7. Every meaningful deep-link/modal/drawer action is implemented or explicitly REDESIGNED/RETIRED.
8. Redirect stubs/artifact routes are classified and not mistaken for product requirements.
9. The legacy baseline SHA is refreshed and diffed immediately before final parity sign-off.
10. Critical role/tenant/browser regression coverage executes successfully; authored-but-unrun tests are not “green”.

# 14. Execution order after this audit

Continue:
**Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR → shared/public decisions → blockers → final fresh diff.**

Within a page:
1. inspect exact legacy page and supporting components;
2. enumerate sections/actions/states in this matrix before coding;
3. implement cleanly in vNext;
4. add authorization/regression coverage;
5. update only the exact rows actually closed;
6. continue without broad redesign until parity is complete.


### Learner shell access re-audit — 2026-10-05

Current-oracle re-audit found that Learner Projects and Placements cannot be static shell links. vNext now carries persisted hierarchical optional-module decisions plus learner placement participation resolution into the shared shell. The implementation gap for conditional Projects/Placements visibility is fixed, while family verification remains open until the corresponding admin/TPO producer workflows and browser evidence are complete. Conditional learner Drive Day is implemented in source; final producer/browser verification remains open.
