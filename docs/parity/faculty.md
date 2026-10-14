# Faculty — Detailed Page Parity Spec

Legacy navigation: Courses, Contacts, Notifications, Class Schedule, All Quizzes, All Assignments, Profile.

## Page: Courses list
- [ ] Teaching assignments determine visible courses.
- [ ] Course/class context is visible.
- [ ] Course cards/list metadata matches legacy.
- [ ] Loading/empty/error states are verified.
- [ ] Navigation preserves correct class context.

## Page family: Course detail
**Legacy tabs:** Overview, Blueprint, Students, Attendance, Discussions.

### Course bootstrap / class chooser behavior
Legacy route resolves slug/numeric identifiers, validates active Faculty assignment, resolves class context, canonicalizes URL and periodically revalidates assignment.

- [ ] Course identifier/canonical URL behavior is defined.
- [ ] Active teaching assignment is authoritative.
- [ ] Faculty with multiple class assignments can select/resolve correct class.
- [ ] Revoked/remapped assignment invalidates stale page state.
- [ ] Access error and retry states match.

### Overview — DONE (2026-10-14, scoped live acceptance)
- [x] Course/class/faculty summary shows persisted current teaching assignment and exact Section, never another class's draft content.
- [x] Teaching progress/quick actions include pending grading, at-risk learners, grade/performance signals, direct Section reports hub and Student roster actions.
- [x] Learner/content counts use persisted roster and workspace lessons/contents/assessments, published and marked/unmarked distinctions, unknown scores/attendance where missing.
- [x] Loading/empty/error states exist for workspace and reports; desktop/mobile browser exercised correct linked transitions and no page errors/overflow.

### Blueprint
- [ ] Lesson create/edit/delete.
- [ ] Lesson ordering/reordering.
- [ ] Resource/video/live-class content create/edit/delete.
- [ ] Assignment create/edit/delete.
- [ ] Quiz create/edit/delete.
- [ ] Scheduling/visibility controls.
- [ ] Content validation and destructive confirmations.
- [ ] Empty and partial-content states.
- [ ] File/video storage-dependent actions remain explicit BLOCKED items until live.

### Students — DONE (current Section roster acceptance 2026-10-14)
- [x] Class roster fields follow approved Faculty need-to-know access: public name, roll, and learner contact for the assigned teaching Section only; CSV never exports contact.
- [x] Search/filter, bounded pagination, responsive roster and spreadsheet-safe filtered CSV behave correctly.
- [x] Read-only student detail/profile drill-in works for the exact active Section, with real Course attendance and explicit unknown/unmarked/upcoming distinctions; private photo and unrelated academic records are intentionally out of scope.
- [x] Empty/no-match, source-authored loading/error/retry and desktop/mobile responsive states are represented and the authenticated no-match browser journey is exercised.
- [x] Roster and drill-in cannot expose another Section or college.

### Attendance — DONE (2026-10-14, executable scope acceptance)
- [x] IST monthly calendar/grid, session selector, per-day marks and persisted session deep link.
- [x] Real Faculty current-Section present/absent marking with confirmation, roster search, no-match and per-session reset.
- [x] Retroactive corrections require the configured correction window, changed statuses, a meaningful reason, and optimistic marked-at token; no silent overwrites.
- [x] Student/session attendance detail drawer and recorded-status labels are available.
- [x] Eligibility/attendance percentages count only recorded marks; future/unmarked attendance stays unknown, including a real zero-percent absent case.
- [x] Loading/no-session, correction-window status and error responses are represented; desktop/mobile browser acceptance covers the active flow.
- [x] Append-only activity audit records mark versus correction without exposing learner identities.

### Discussions — DONE (evidence accepted 2026-10-14)
- [x] Feed/read behavior matches the registered Section chat contract: exact teaching Section, paged history, current highlights and bounded polling.
- [x] Faculty post/reply/pin/unpin/delete behavior matches the live legacy classroom chat contract; stale-token and cross-Section requests are denied, audit retained. Pinned-strip unpin works for an out-of-page highlight.
- [x] Empty/loading/error and retry states exist; empty Faculty discussions offer welcome/focus draft starters, and the browser suite exercised empty starter controls.
- [x] Course/class isolation is enforced.
Evidence: `1f374255579a3e2e09cc65a69c14c11276abb3be` CI [38595677626](https://github.com/42Students/lms-vnext/actions/runs/38595677626) had 25 passing browser cases including all Discussions cases, plus `faculty-c4-reports-audit-contact.test.ts` 3/3, `learner-course-discussion-actions.test.ts` 3/3 and `learner-discussion-mobile.test.ts` 2/2 on real disposable PostgreSQL. Unit, typecheck and build jobs passed. Full CI is red due to other surfaces, **not** evidence of failed Discussion acceptance. DB10 Section notices are a separate blocked product surface, not silently claimed as completed by this chat acceptance.

## Page: Contacts
**Legacy:** `/teacher/contacts/[contactsTab]`  
Tabs: All Contacts, Teachers, Students.

- [x] All Contacts tab matches the approved public directory fields and role labels, same-college current memberships, server search and 10/20/50 pagination, public detail and browser/PG acceptance.
- [x] Teachers tab matches the approved public directory fields (name, active role and department; private email/phone/profile withheld), with exact same-college role detail.
- [x] Students tab matches approved public-only Learner directory (name, active Student role, department), same-college scope, search and role-checked detail, without exposing private learner contact details.
- [ ] Search/filter/pagination behavior from ContactsGrid is matched.
- [ ] Contact actions/deep links are matched.
- [ ] Empty/loading/error states are verified.
- [x] College scoping is enforced.

## Page: All Assignments — DONE (2026-10-14)

**2026-10-13 implementation improvement:** the Faculty content-order editor
now remounts when lesson, delivery, or persisted item order changes, rather
than synchronously overwriting an unsaved order from a React effect.
Persistence and browser/reorder acceptance remain open.

Legacy `AssignmentsContent` runs in Faculty mode.

Legacy contract:
- course filter;
- pagination;
- create assignment;
- view;
- View Submissions modal;
- Report link;
- Edit drawer;
- Delete confirmation/action;
- metrics;
- load/error/empty states.

- [x] Aggregate assignment list is derived from active assigned Faculty Section deliveries; tenant, assignment audience and teaching-role checks remain in the shared service.
- [x] Course/Section filter, status filter and 20-row pagination are source-implemented; final browser parity still pending.
- [x] Create Assignment uses validated, confirmed text-only Section authoring fields in the dedicated management screen (no file upload or fabricated legacy drawer).
- [x] View assignment title/Section/lesson/status/details and report navigation in the authenticated aggregate, with edit controls only for owned Section items.
- [x] Authorized Section submissions use a labeled accessible review drawer; desktop/mobile acceptance exercised open, empty and close.
- [x] Report deep link works for the exact persisted assignment and teaching delivery.
- [x] Draft-only edits persist with optimistic version token; published edits and stale writes are denied.
- [x] Explicitly confirmed Archive is the approved non-destructive lifecycle replacement for deletion; referenced submission history and audit are preserved.
- [x] Aggregate total, Published and Section counts derive from the persisted authorized active assignment collection.
- [x] Management/list load and error/empty states are present; authenticated test exercises no-match and published list, with responsive desktop/mobile navigation.


**Executed acceptance — [Faculty All Assignments workflow 38625377461](https://github.com/42Students/lms-vnext/actions/runs/38625377461)** at `12b1e1575d5f1d0fd5cad99677a1d09fdd6ecb37` passed **7/7 registered PostgreSQL** tests in `faculty-section-authoring.test.ts` and **2/2 authenticated desktop/mobile Playwright** tests in `faculty-all-assignments.spec.ts`. The browser creates, edits, publishes and archives persisted text assignments with confirmation and stale-token denial; navigates the Faculty aggregate list, exact Section/status/search filters, accessible submissions drawer, privacy-safe report link, and verifies absence from the active manager after Archive. Scope is consciously text-only: no file uploads, storage receipts, or external sending under the approved no-file-features decision. This DONE does not certify unsupported file-backed parity or full repository CI.\n
## Page: All Quizzes
Legacy `QuizzesContent` runs in Faculty mode.

- [x] Aggregate quiz list, Section scope, course filter and status filter source-implemented.
- [x] Aggregate quiz list uses 20-row pagination; browser regression still pending.
- [ ] Create quiz workflow matches.
- [ ] Edit quiz workflow matches.
- [ ] Delete/close lifecycle actions match.
- [ ] View attempts and result publish use existing FacultyQuizReview panel; legacy overlay/report UI behavior not fully verified.
- [ ] Quiz Report deep link works.
- [ ] Schedule/attempt/result-publication controls match.
- [ ] Loading/error/empty states are verified.

## Page: Class Schedule — DONE (2026-10-14)
- [x] Faculty schedule is sourced from registered active Section teaching assignments and current Faculty grants; role/foreign-college denial is enforced.
- [x] Day/week/month agenda, 42-day IST month grid, previous/current/next month controls and distinct Course Section links work.
- [x] Exact current teaching-Section filters show only persisted scheduled class events; invalid month and forged Section render non-disclosing error/clear states.
- [x] Course/session metadata, IST date and 12-hour time, overnight boundary and real scheduling/rescheduling/audit are registered and tested.
- [x] Empty, loading, error and retry states exist; both desktop and mobile authenticated journeys exercised them, with no browser errors or horizontal overflow.
- [x] [Dedicated Faculty Class Schedule run 38621557113](https://github.com/42Students/lms-vnext/actions/runs/38621557113) completed **2/2 PostgreSQL and 2/2 Chromium PASS** at source commit `769bc395468002e9fa6098c44b85bf8aee58e06a`; the 2026-10-14 default decision is IST everywhere.

## Page: Assignment Report
**Legacy:** `/teacher/report/assignment/[contentId]`

- [x] Assignment title, Course, Section, lesson and due date appear in source-authored Faculty Report page.
- [x] Report derives submission and grading counts from the authorized live submission reader; not DB-executed yet.
- [x] Report table renders learner identity, submitted timestamp, late/on-time and published/private grade.
- [x] Source-authored report distinguishes submissions after the assignment due instant; timezone/browser verification OPEN.
- [ ] Score distribution matches.
- [ ] Not-submitted learners are visible.
- [ ] Submission detail/grading drill-in matches.
- [ ] Empty/loading/error states.
- [x] Report resolves exact assigned Section through authoritative Faculty aggregate and reused authorized submission reader; wrong-tenant DB tests OPEN.

## Page: Quiz Report — DONE (2026-10-14)

**Legacy:** `/teacher/report/quiz/[quizId]`

- [x] Authorized current-Section quiz summary, attempted/missing learners, latest attempt and normalized scores.
- [x] Score distribution, question-level answered/correct/accuracy from persisted answers and attempts (missing remains unknown).
- [x] Per-learner attempt drill-in, results published/private badges and response filters.
- [x] Printable PDF, capped 500-row formula-neutralized CSV downloads for learner responses and aggregate question accuracy; no private contacts.
- [x] Honest empty, loading and error states; desktop/mobile responsive navigation.
- [x] Strict current active teaching-Section scope; foreign/forged delivery and wrong role rejected.

**Independent evidence:** [Faculty Quiz Report workflow 38618101294](https://github.com/42Students/lms-vnext/actions/runs/38618101294) on commit `1d8d4a9e8bec8571e714bf66efd41af7ba67b8fc`: **7/7 PostgreSQL**, **14/14 unit**, **2/2 authenticated desktop/mobile Chromium**, including real quiz creation, question/filtered learner CSV downloads, foreign delivery denial and no mobile overflow. Both independent jobs passed. Does not imply completion of quiz authoring, private learner PII access or the entire LMS CI.
## Page: Notifications
- [ ] Faculty announcements/personal notifications match legacy feed.
- [ ] Read/unread/deep-link behavior is verified.
- [ ] Empty/loading/error/stale states.
- [ ] College and role scoping.

## Page: Faculty Profile

**Source-only partial implementation:** `/teacher/profile` now has Faculty-only
membership-scoped reads, basic identity/teaching details, Faculty navigation and
loading/error/retry states. It deliberately does **not** let Faculty edit
college-owned academic title, employment type or department assignments.
The legacy rich About sections, profile-document persistence, private uploads,
verified browser parity and cross-role workflow remain open; do not mark DONE.

Audited shared Faculty-profile sections:
- user summary/profile image/completeness;
- resume;
- contacts, social, address, personal details, identity;
- Aadhaar/PAN;
- experience;
- education;
- skills;
- certifications;
- languages;
- publications;
- awards;
- metadata;
- deep-link section scrolling;
- partial-section failure tolerance.

- [ ] User summary/profile image edit behavior matches.
- [ ] Profile completeness refresh matches.
- [ ] Resume upload/import/remove matches.
- [ ] Contacts edit.
- [ ] Social edit.
- [ ] Address edit.
- [ ] Personal details edit.
- [ ] Identity edit + Aadhaar/PAN storage flow.
- [ ] Experience add/edit/delete.
- [ ] Education add/edit/delete.
- [ ] Skills add/edit/delete/proficiency.
- [ ] Certifications add/edit/delete.
- [ ] Languages add/edit/delete.
- [ ] Publications add/edit/delete.
- [ ] Awards add/edit/delete.
- [ ] Metadata edit.
- [ ] Partial endpoint failures do not blank unrelated sections.
- [ ] Loading/hard-error/retry/visibility-refresh behavior matches.
- [ ] Learner/Admin/Mentor/TPO role misroutes are safely redirected/fenced.

## Retired route: File Explorer
Legacy `/teacher/fileExplorer` only redirects to Courses.

- [x] Classified RETIRED in master matrix; do not recreate as a product page.

## 2026-10-10 W02 Faculty assessment aggregate implementation

- [x] Exact legacy `/teacher/allQuizzes` and `/teacher/allAssignments` routes exist on `main`, with Faculty sidebar links, published/draft filtering, class context, progress/pagination and existing view-attempt/grade-publish modules.
- [x] A source-authored PostgreSQL integration test checks aggregate producer scope, only assigned Section visibility, and learner-role rejection.
- [ ] Faculty create/edit/delete are not yet cloned from the legacy full-screen/modal workflows. Separate Assignment and Quiz Report routes now exist, but their detailed analytics/export/roster/parity are still incomplete.
- [ ] Loading/failure/retry/mobile, accurate per-learner counts, and exact legacy source/browser verification remain OPEN. Existing reports and review panels are not interchangeable without the full page contract.
- [ ] The test is authored but has **not been executed**, and W01's CI/PostgreSQL environment is not yet evidenced as passing.

Reference: `docs/planning/w02-learning-assessment-closure-ledger.md` and issue #22.

### W02 Faculty Class Schedule — 2026-10-10

- [x] Source-authored legacy `/teacher/calendar` route and Faculty sidebar link. A new `getFacultyClassSchedule` read service scopes Section events and course links to authoritative persisted active teaching assignments; campus and user role checks fail closed.
- [x] Reused day/week/month calendar with `/teach/courses/:deliveryId` Faculty links (instead of learner links). An additional disposable-Postgres integration case asserts Section A and general events are visible but Section B events are excluded.
- [ ] PostgreSQL integration, role-revocation, timezone, mobile and browser tests are **authored/not executed**, never passing evidence.

### W02 Faculty assessment reports — 2026-10-10

- [x] Standalone routes `/teacher/report/quiz/[quizId]` and `/teacher/report/assignment/[contentId]` restored, linked from exact Faculty aggregate assessment cards with `deliveryId` query parameter. Existing tenant-scoped faculty aggregate/attempt/submission API functions supply rows. Shared offering in more than one Section without `deliveryId` fails closed instead of aggregating unrelated classes.
- [x] Reports expose source-authored counts, learner attempt/grade tables, assignment late-submission breakdown, results-published badge, and unknown rather than fabricated score averages.
- [ ] Legacy Quiz Report response distribution, Assignment Report not-submitted roster, score analytics, interactive grading drill-in, exports, browser/keyboard/mobile states and execution tests remain OPEN. Tests are source-authored, not run.

## Faculty report parity improvement (2026-10-13)

Against legacy FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` and BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, both Faculty assessment report pages now expose a direct, client-generated multi-page PDF of the authorized Section's summary, per-learner scores, missing learners, score buckets and (for quizzes) question accuracy. Both reports embed the existing server-authorized review/grading panels for drill-in. The export uses standard PDF fonts; non-Latin glyph fidelity is NOT certified and remains a known parity limitation. Full browser/keyboard/mobile, live database, privacy and user-facing visual parity acceptance remains OPEN. No page/family marked DONE here.

The report score tables now implement best-score-first ordering, case-insensitive name/email search, 20-student paging and responsive mobile cards. Browser tests and end-to-end parity acceptance remain OPEN; the source additions are not checkbox closure evidence by themselves.

## Faculty aggregate assessment create + report error states (2026-10-13)

The All Assignments and All Quizzes screens now provide an authorized teaching Course / Section / Lesson selector and open the existing validated Faculty authoring form inside a responsive drawer. New assessments are Section-scoped drafts, including when no assessments exist yet. Reuses the existing server mutation authorization, rather than trusting the displayed lesson list. Both standalone reports now have explicit loading skeleton and hard-error/retry/back states. End-to-end PostgreSQL, keyboard/mobile/browser, time zone and legacy parity verification remain OPEN; do not change page parity checkboxes to DONE on source implementation alone.

## 2026-10-13 Faculty five-tab route and course-list recovery

Against legacy FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, the exact legacy five-tab taxonomy is now source-implemented under `/teacher/courses/{deliveryId}/{home|blueprint|students|attendanceDetail|discussions}`. Course list has name/code/Section search and 48-item incremental loading. Overview is separate from the Blueprint editor, with the existing authorized teaching-section services powering both. The Faculty-only tab layout enumerates Section choices only from persisted current assignments. The legacy slug/numeric mapping system is intentionally NOT impersonated by a non-authoritative fallback: vNext uses delivery UUIDs; migration of historical deep links remains an OPEN parity decision. Five-tab browser navigation, stale-assignment revocation, responsiveness and producer-consumer acceptance remain OPEN. No checkbox changed to DONE before execution evidence.

Faculty Blueprint items now link to exact Section-scoped Assignment/Quiz Reports. The Faculty tab navigation refreshes server authorization on window focus, visibility return and each 60 seconds to invalidate stale teaching context. Existing authenticated Playwright Faculty course coverage now navigates the five original tabs. These E2E tests must actually execute successfully on the target SHA before any page/family closure.

## 2026-10-13 Faculty Blueprint metadata editing

The Faculty Blueprint now provides an Edit content drawer for Section-owned Resource, YouTube, and Live Class items. The existing PATCH service rechecks exact Section teaching authorization and parent lifecycle. The UI checks HTTPS URLs, YouTube host/duration and Live Class chronology. Shared Offering items remain read-only for Faculty; VIDEO edits remain blocked pending private-file capabilities. Unit and browser/DB acceptance must pass before parity closure.

## Faculty independent browser verification and route recovery (2026-10-13)

Added a standalone Faculty-only Playwright suite covering authenticated Course search, Section-isolated Blueprint resources, metadata editor, all five legacy tabs, mobile navigation, and aggregate Assessment draft drawers. It is separate from the serial Learner course suite so unrelated learner regressions cannot silently skip Faculty assertions. Faculty course list and detail routes now have retry/error and skeleton loading surfaces. All checks remain OPEN until the new suite executes at a known commit; the broader clone gate and Faculty Profile remain blocked independently.

## Faculty attendance session timing guard (2026-10-13)

A Faculty member can no longer mark attendance before the assigned session begins or past the persisted college's correction window after class end (default 24 hours). The check runs in the exact-delivery marking transaction before any record changes. Admin corrections retain their separate permission policy. Test fixtures use in-window time and include negative future/expired cases; full DB06 history migration remains unregistered and NOT DONE. Do not mark Attendance parity closed before browser/DB acceptance.

Faculty Attendance UI now uses the same session-window evaluator as the server to prevent premature or expired submissions and display an explicit administrative-correction path. A one-minute client clock refresh keeps an open tab's disabled Submit state current. The server transaction remains authoritative, including for stale browser sessions. Full browser and DB06 history completion gates remain open.

The Faculty sidebar Courses link now opens the exact legacy `/teacher/courses` listing (rather than the temporary `/teach/courses` compatibility workspace), using the shared LMS Course icon. Dual-role Faculty and admin/learner sidebar regression expectations were updated; old `/teach/courses` URLs remain operational for existing callers until downstream source links are migrated.

## Faculty-only navigation CI regression (2026-10-14)

After the canonical `/teacher/courses` sidebar switch, the Faculty-only account was still falling back to a generic Dashboard shell and one stale multi-role test checked `/teach/courses`. This batch restores the exact seven-entry Faculty-only sidebar and updates the cross-role regression to the actual destination. No database tracker checkbox changes; CI evidence required at the committed SHA.

## Faculty Resource edit persisted end-to-end (2026-10-14)

A dedicated authenticated Faculty browser regression now submits the Section-owned Resource PATCH, performs a full page reload, asserts the edited persisted notes and exact sibling-Section isolation, then restores the seeded Resource. The editor also resets its draft from latest server props on reopening after a router refresh, avoiding stale edits. Authored tests are not acceptance evidence until executed on an exact SHA; full Faculty parity and DATABASE phase remain open.

## Faculty closure batch — Contacts, deep links and recovery states (2026-10-14)

Compared with legacy `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` ContactsGrid/contactColumns and `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`: the three Faculty Contacts tabs now expose the legacy 10/20/50 page-size control (default 10), retain search and chosen size in pagination URLs, preserve active-college/persisted Faculty-role read constraints, and normalize the LEARNER role label to Student. Authenticated desktop/mobile Playwright cases cover tab filtering, query, results and page size. Calendar event links and Students/Attendance/Discussions/Overview quick links now point to the actual canonical Faculty course tabs rather than temporary `/teach/courses` compatibility UI. Calendar and Notifications receive loading skeleton and retry/error boundaries. This batch is NOT page closure until final-SHA tests execute; Profile DB07, video/private uploads, deep drill-in and full clone gate remain open.

## Faculty Contacts cross-college verification (2026-10-14)

The registered database integration test now checks page-size 10, exact college-A membership visibility, exclusion of the same user in college B, and a separate active Faculty membership's college-B-only directory. It retains Learner access-denial and role-specific search assertions. The shared-calendar regression checks both Learner and Faculty canonical course tabs after the route repair. Source-authored negative tests still require a successful exact-SHA disposable PostgreSQL job before marking College scoping verified.

## Faculty Contacts pagination/search edge acceptance (2026-10-14)

Directory pagination now derives the last valid page from an authoritative same-college SQL COUNT before applying OFFSET; deleting/revoking rows cannot strand Faculty on a misleading blank stale page. SQL LIKE metacharacters are treated as literal search text and search length is capped before Zod validation. Disposable PostgreSQL tests now cover stale page clamping, literal wildcard search and exact membership/college scoping. These remain conditional on executed exact-SHA CI before checklist closure.

## Faculty independently executed, scope-specific closures (2026-10-14)

**Executed evidence:** `lms-vnext@e13c0f8b85447e758ff26a993104b5afbe6e716c`, [GitHub Actions database run 38455771397](https://github.com/42Students/lms-vnext/actions/runs/38455771397), database job `115498438882`; `tests/integration/courses-ui2a-faculty.test.ts` **10/10 passing** and registered database run **413 passed / 98 skipped**. Verified negative tests enforce: (1) a Faculty roster lookup for another delivery rejects with `FACULTY_TEACHING_SCOPE_REQUIRED`; (2) Faculty discussion access and moderation remain restricted to the exact teaching delivery; (3) Contacts contain only active same-college memberships, including distinct College A/B memberships of the same person, with Learner role rejected. These three narrow checklist invariants are marked checked; the parent Students/Discussions/Contacts pages remain PARTIAL pending full visual, field and browser acceptance. This evidence does not certify the newer wildcard/paging service correction, profile storage, registered DB07 privacy or the global DATABASE phase.

The All Assignments and All Quizzes aggregate cards now use the same canonical delivery-scoped Blueprint destination as Course Overview, rather than the old compatibility `/teach/courses` page. Reuses the existing verified `facultyCourseTabHref` function and its unit contract. This closes only the broken deep-link implementation, not legacy aggregate UI/page acceptance.

## Faculty Attendance learner-session history (2026-10-14)

The monthly grid's learner name now opens a read-only detail drawer that breaks down each persisted class session as Present, Absent, Unmarked or Upcoming, includes stored notes/timestamps, computes percentage only for definitively marked sessions, and opens the existing constrained Faculty marking flow only while the actual college correction window remains OPEN. Records originate from the already authorized exact Section service and are never refetched by arbitrary learner ID. A pure model has unit tests for future/unmarked math, cross-learner record isolation and historic absence evidence. Full authenticated browser acceptance remains OPEN; do not close the parent Attendance surface without it.

### India-local month selector consistency (2026-10-14)

The Faculty monthly attendance report now initializes and shifts its month in Asia/Kolkata, matching the established session grouping and avoiding false empty grids at UTC/local month boundaries. The pure grid-model regressions exercise midnight and year rollover. Full visual/role and exact-SHA acceptance remains pending.


### Faculty monthly class-health and PDF parity (2026-10-14)

Implemented a persisted, active Section-roster monthly health summary with P/A, unmarked and upcoming counts and an exact marked-only attendance denominator. The missing percentage is shown as unknown (not 100%). Departed/historic learners remain in per-learner historical detail but do not inflate current Section health. An on-demand PDF for that same authorized Section/selected India-local month includes the aggregated figures and each active learner's marks. Added pure-model negative/edge-case unit tests and authenticated browser assertions; exact-SHA executed evidence is required before closing the Attendance checklist and whole page remains PARTIAL.

### Calendar-to-Attendance Faculty flow (2026-10-14)

Faculty-only calendar event cards link to the exact Section delivery Attendance tab with a server-resolved persisted session ID. The destination still queries via the active Faculty authorization path and checks that the session is among its scoped rows, discarding injected or revoked-session query IDs. On a valid session link, the editor starts with that exact session and its stored absence selections, and the existing live correction-window rule determines whether marking is enabled. Learner calendar links remain Course Overview and expose no Faculty attendance controls. Source and unit tests added; authenticated browser proof remains a release gate.

## Faculty Course Student drill-in (2026-10-14)

Source-authored read-only `/teacher/courses/[deliveryId]/students/[membershipId]`
links from the current authorized Section/elective delivery roster. The current
Faculty role, central courses.read college scope and persisted active teaching
assignment are required before the target learner is resolved against the exact
current roster. Course-level attendance counts exclude unknown/unmarked and
future sessions from recorded attendance. The existing monthly attendance report
is unchanged. Loading/error and pure-model/denial tests are authored only;
full private profile, positive database/browser tests and exact legacy drill-in
parity remain OPEN. No checklist item is closed solely from source work.

### Faculty aggregate Assessment search and editor draft recovery (2026-10-14)

All Assignments and All Quizzes now search by title, course, Section, lesson and description in already-authorized teaching data, combining with persisted status/delivery filters and resetting pagination when the search changes. The Edit drawer restores current server-provided values on every open; closing an unsaved edit can no longer inadvertently persist stale draft fields on subsequent re-open. Pure filter unit tests and complete authenticated Assignment create/edit/archive browser coverage are added; no aggregate surface is marked DONE without executed evidence.

### Faculty Quiz end-to-end authoring browser gate (2026-10-14)

Added an authenticated Faculty browser scenario that creates a real Section-scoped Quiz with a persisted multiple-option question, searches for it on All Quizzes, edits the title and maximum attempts, verifies the persisted edit after navigation, and archives the Quiz through the existing confirmed lifecycle route. It requires actual successful Playwright execution before closing the Create/Edit/Delete Quiz checklist rows. No change to quiz schema, learner attempt access, or global phase gates.

### Faculty notification inbox cursor and role boundary (2026-10-14)

The Faculty notifications page now requires an active persisted Faculty membership before either announcements or personal notifications are fetched. It exposes the shared unread/all filter, mark-all-read action and member-owned keyset pagination rather than silently truncating to 60 messages; expired, malformed or partial URL cursors give an explicit recovery link instead of a false empty feed. Navigation remains under `/teacher/notifications`; shared inbox Toolbar retains its original default `/notifications` for other accounts. The existing server-owned notification read/write routes still enforce recipient ownership and same-origin mutation checks. Unit and authenticated browser tests are added; full parity remains PARTIAL until exact-SHA execution and source comparison.

## Faculty Contacts detail reader (2026-10-14)

A read-only detail route `/teacher/contacts/[contactsTab]/[membershipId]`
now opens from each listed same-college Faculty contact. It repeats the
authoritative persisted active Faculty-role membership check and restricts the
target to an active same-college contact with the requested directory role.
Only existing public-to-college directory fields (name, email, phone, current
college roles) are selected; private profile documents, identity and academic
verification records are not loaded. Zod rejects forged tabs/IDs and cross-tenant
selectors. Loading/error, pure-model tests and PostgreSQL denial cases are
authored; independent execution and legacy full Contact/Profile coverage remain
OPEN. Preserve all previously authored Faculty attendance, roster and assessment
parity sections. No checkbox is marked DONE by this source-only work.

### Faculty Attendance PostgreSQL exclusion and editor accessibility repair (2026-10-14)

E2E uncovered a real database overlap constraint (section_schedule_events_section_no_overlap_excl). The Faculty session write now maps only registered exclusion-constraint failures to a 409 SCHEDULE_EVENT_CONFLICT, preserving PostgreSQL's concurrency protection; other errors are not silenced. Browser E2E scheduling fixtures use separate non-overlapping session slots across two scenarios and retries. The existing shared Drawer used globally repeated HTML IDs, which caused multiple Faculty assessment editor dialogs to resolve the wrong accessible name; it now uses React useId per instance for title/description, maintaining accessible labels without hiding inactive row drawers. New pure tests assert error mapping and browser CRUD exercises the actual dialog labels. Full acceptance remains pending exact-SHA CI.

### Faculty monthly attendance guidance threshold (2026-10-14)

Added Section-local advisory guidance against the persisted College attendance policy. The below-threshold list uses **exact integer marks**, never rounded display percentage; unknown/unmarked learners are kept separate rather than falsely classified safe or at risk. Faculty can open the existing authorized learner-session drawer from the list, and the PDF includes below-guidance/unknown totals. This is explicitly not official debarment or institution-wide eligibility; those decisions remain separate administrative policy and migration gates. Threshold edge/boundary tests authored; exact-SHA runtime and parity still required.

### Faculty Section overlap rejection UI (2026-10-14)

Faculty class scheduling now translates persisted PostgreSQL non-overlap exclusion violations into an actionable message in the Schedule Class form, without inventing a success or disabling the constraint. E2E schedules a real class, attempts the same Section/time a second time, asserts HTTP 409 and the recovery text, then continues into Calendar and attendance correction. This does not certify full scheduling parity without the exact-SHA run.

## Faculty assessment results overview (2026-10-14)

Source-authored read-only `/teacher/results` joins existing active Section
teaching-assignment assessment discovery with the already authorized Section-
specific Assignment and Quiz report readers. Filters are strict Zod enum/search/
paging; results are limited to five assessments per page to bound database
fan-out. Figures are actual eligible/responded/missing and graded-score averages
from the existing report services. Averages with no scored responses show
Unknown, not zero; draft/private results are never called learner-visible.
All Quizzes and All Assignments link to this overview. Pure-model tests and
PostgreSQL denial tests are authored, not executed here. This does not replace
legacy detailed reports, analytics, grading controls or authenticated browser
verification; parent rows remain PARTIAL.

## Faculty overdue response follow-ups (2026-10-14)

New read-only `/teacher/response-followups` derives unresponded current-roster
learners for published Assignment and Quiz assessments whose recorded due time
has passed. It reuses the existing active teaching-Section discovery and
Section-specific assignment/quiz report readers. The new view excludes drafts,
future deadlines and assessments without a due date; it does not infer failure,
misconduct or sent messages. Server-side expansion is limited to five
assessments per page and at most twelve learner labels per assessment, with a
link to the complete authorized report. Zod validates bounded filters and
navigation. Pure-model tests and PostgreSQL denial tests are authored, not
represented as executed. Exact legacy reporting, write/notification actions,
positive database results and mobile/browser evidence remain OPEN; existing
Assignment and Quiz report rows remain PARTIAL.

### Faculty Section roster CSV export and browser-acceptance fixes (2026-10-14)

The exact scoped Students list can now export its currently filtered/sorted rows to CSV with roll, email and phone, without another backend query or wider membership access. The CSV serializer quotes fields and neutralizes spreadsheet formula prefixes (including phone numbers beginning with +), supports UTF-8, and names files by Section. Pure tests and an authenticated download test are authored. Faculty Attendance browser regressions now use exact, unique accessible names and preserve the captured delivery ID after scheduling rather than deriving it from a potentially changed browser URL. None of this independently closes full Faculty roster or attendance legacy parity until exact-commit browser/DB evidence is passing.

### Faculty per-Section assessment results rate (2026-10-14)

The aggregate Assessment Results route now filters by the exact active teaching Section in addition to assessment type/status/search, retaining the Section selector in pagination links and never fetching another college's Section. It displays a recorded response rate computed from eligible/responded membership counts; missing or inconsistent denominators show Unknown, while a valid Section with zero responses shows 0%. Pure model tests and authenticated Section selector/browser checks have been authored; final exact-SHA browser and PostgreSQL proof is required before closing Results parity.

### Faculty Attendance navigation-mode correctness (2026-10-14)

Fixed a verified browser-root-cause bug: the server previously converted a missing Calendar session parameter into a fallback first-session ID, inadvertently opening Mark mode for plain Attendance navigation and hiding the monthly report/selector. It now passes a deep-link ID only when the URL requested an exact persisted authorized session; no/invalid link starts in Report mode. The editor can still choose the first authorized session as an internal fallback. New pure unit tests distinguish these cases. This is a functional repair, not only a Playwright selector change, and full browser proof remains required.

## Faculty Section report CSV downloads (2026-10-14)

The existing Section-scoped Assignment and Quiz report pages now offer an
additional **Download CSV** control alongside their PDF export. It serializes
only the already-authorized report responses from persisted registered
assessment/roster tables: learner name, email, response state, score when
recorded, percentage when valid, submitted timestamp and timing/review note.
The view includes current eligible learners with no recorded response as
explicit NOT_SUBMITTED / NOT_ATTEMPTED rows, rather than inventing zero scores.
Every cell is quoted, double quotes are escaped, UTF-8 is supported, and
formula-like values (including whitespace/BOM/zero-width prefixes followed
by =,+,-,@) receive a leading apostrophe to prevent spreadsheet execution.
A strict Zod schema checks CSV props at export time. The existing Faculty
Section report reader supplies data; no new report/identity read or mutation
endpoint is added. Unit tests and a PostgreSQL denial suite for the report
readers are authored, not executed. Large-report browser acceptance, exact
legacy export shape, offline download reliability and report semantic parity
remain OPEN. The existing Assignment/Quiz report rows stay PARTIAL.

## Faculty server-owned Section report CSV endpoint (2026-10-14)

The existing Quiz and Assignment report pages now link to the authenticated
`GET /api/courses/faculty/reports/[kind]/[assessmentId]/csv?deliveryId=...`.
The endpoint Zod-validates assessment kind, UUIDs and absence of extra scope
parameters; checks active Faculty membership and central courses.read; and
re-executes the canonical persisted Section report reader before exporting.
Rows include recorded attempts/submissions, missing eligible Learners, scores
when actually graded, timing notes and private/published grade indicators.
CSV uses quoted UTF-8 cells and formula neutralization for spreadsheet-safe
imports, an attachment filename, private no-store and nosniff headers.
The client-only CSV exporter is replaced with an authenticated same-origin
GET link; no write method was introduced. Unit and PostgreSQL denial tests
are authored but not executed; real browser download and full legacy output
parity remain PARTIAL.

## Faculty self-profile current teaching assignments (2026-10-14)

The read-only `/teacher/profile/teaching` subpage is linked from Faculty self
Profile. It uses the existing persisted self-profile identity guard and current
FACULTY teaching-assignment reader to show Course/Section, active assignment
role and academic-period labels only in the signed-in college. Central
courses.read, strict Zod search/page limits, server pagination and
loading/error/empty recovery are source-authored. College-managed academic
title/employment fields are read-only. No historic experience, rich profile
document, social/identity secrets, degree, skills or file records are invented.
Pure-model and disposable PostgreSQL denial tests are authored. This improves
the Self Profile PARTIAL row, but does not close rich legacy About/profile
storage parity or authenticated browser/DB acceptance.

## Faculty positive PostgreSQL fixture coverage — authored, not executed (2026-10-14)

Added isolated `C4POS-*` academic fixture tests for successful Faculty own
teaching-profile discovery, active same-college contact detail, published
Section assessment-health and results metrics, and CSV regeneration through
the existing server-side Faculty export service (with actual enrolled
Learner missing-response rows). A non-due assessment stays out of the
overdue queue. These are positive-path tests in `tests/integration`, not
merely role-denial cases. Still pending: actual disposable PostgreSQL run,
CI lint/typecheck, mobile/browser evidence and exact legacy acceptance.
All Faculty parity rows remain PARTIAL.

## Faculty grade/regrade/publish stale-version reconciliation (2026-10-14)

The registered `assignment_submissions` grade/feedback flow already performs
transactional, actor-scoped grade/regrade (resetting publication), publishes
only graded submissions, and records sanitized version-keyed activity events.
This batch tightens strict Zod on grade/publish request bodies and rejects
a stale `expectedVersion` even when a grade was already published (a repeated
publish at the current version remains an idempotent no-op without an event).
The existing Faculty submission review UI now explicitly confirms publish;
the published regrade confirmation remains. The existing PostgreSQL suite
has additional stale/repeat, forged learner and extra-college-key assertions.
Section-scoped positive/negative DB and browser execution against this exact
SHA are not independently verified here; the parent Assignment report and
All Assignments rows remain PARTIAL.

## Faculty Quiz/Assignment CSV GET request hardening (2026-10-14)

The existing authorized report pages and server-owned CSV endpoint remain the
canonical Faculty report surfaces. This batch rejects ambiguous or injected
GET query fields, including duplicate deliveryId selectors, rather than
silently accepting the last value. It also enforces deterministic safe
attachment filenames, private no-store/nosniff headers and keeps the strict
existing Section-scoped report reader and formula-neutralized UTF-8 serializer.
Unit tests cover GET URL, malformed query, headers and filename; the existing
isolated PostgreSQL positive and tenant-denial tests continue to cover
the underlying export service. No new write or UI table was invented.
Independent execution and full legacy report/browser parity remain PARTIAL.

## Public Faculty Contacts policy applied — 2026-10-14

The All/Teachers/Students directory and drill-ins are now limited to public
display name, registered active same-college role and Faculty department.
The service does not select email, phone, photo or private profile identity,
and searches only public name/department. Central courses.read, active
persisted Faculty role, same-college actor/target scoping, strict Zod,
ten/twenty/fifty pagination and exact tab links remain enforced. Existing
PostgreSQL tenant test search is updated from private email to display name.
Private contact actions are intentionally not offered. Parent parity
remains PARTIAL until browser/DB acceptance of this exact revision.

## IST-safe Faculty Class Schedule month grid (2026-10-14)

`/teacher/calendar` now includes a 42-cell server-rendered month grid keyed to
the authoritative Asia/Kolkata dates of persisted Section schedule sessions,
including sessions crossing IST midnight; dates do not depend on browser
timezone. Course/Section filtering is limited to current Faculty teaching
deliveries through the existing scoped schedule service and central courses.read
authorization. Exact course-linked sessions link to their real delivery Home;
Section-wide sessions are explicitly unlinked rather than guessed. Strict Zod
month/delivery selectors, previous/next month, mobile horizontal scrolling and
existing loading/error/empty states apply. The existing week/day interface is
preserved. Unit tests cover timezone boundaries, and the existing unique-
fixture disposable PG suite now authors a real crossing-midnight Section
session, success, foreign-delivery and wrong-role denials with full session
cleanup. Browser execution and independent current-SHA CI remain PARTIAL.

## Faculty Assignment Section submissions and filtered CSV (2026-10-14)

The Section-authenticated `/teacher/report/assignment/[contentId]/submissions`
page now lists persisted submissions with ALL/GRADED/UNGRADED/LATE filters,
20-row paging, grades only when recorded, publication privacy status,
mobile cards, loading/error/empty states and links back to the canonical
Section report. Its CSV link reuses the server-side formula-neutralizing
GET reader with a strict optional validated assignment-only filter; duplicate
or forged query selectors are rejected. ALL retains the existing missing
learner rows; narrower views return only matching actual submissions and
never invent a grade for non-submitters. The route remains GET-only with exact
Faculty delivery authorization; no new audit rows or writes occur.
Pure-model and query regression tests and the existing unique-fixture
PostgreSQL positive-path assertion are authored. Complete grading editing,
runtime/browser export and exact legacy modal parity remain PARTIAL.

## Faculty Section notices — DB10 registration blocker (2026-10-14)

The migrated schema barrel does not promote `db10Announcements`;
`src/db/schema/db10-announcements.draft.ts` explicitly states draft-only.
`/teacher/courses/[deliveryId]/notices` is an authorized read-only blocker
page, not an invented zero-notices report. It requires an active Faculty
Section grant and central courses.read through the existing Faculty workspace
reader, rejects forged delivery/college selectors, and links to live Course
Discussions. No post actions, DB writes, audits or phantom stored notices
were added. Loading/error and mobile-facing availability panels are present.
The existing unique-fixture Faculty PostgreSQL test is extended with success
(unavailable state) and wrong-role/foreign-scope checks but not executed here.
Posting waits for a promoted DB10 migration and Faculty authoring/audit policy.
The course notices capability remains PARTIAL and blocked.

## Faculty Quiz individual-attempt detail (2026-10-14)

The read-only `/teacher/report/quiz/[quizId]/attempts?deliveryId=...`
now shows Section-authorized persisted attempt rows with score, submission
instant, per-question correctness and earned/possible points. Aggregate
question accuracy continues to use *latest* attempt per learner, while the
individual-attempt list explicitly includes retakes. Faculty permission,
current persisted teaching assignment and matching Quiz/delivery are checked
before any answer rows are fetched. The page labels unpublished results
as private, does not change publication, and does not expose raw selected
option IDs to the page. Pagination is bounded to ten attempts per page, with
honest empty/error/loading states and a link from the main Quiz report.
Pure model tests and seeded PostgreSQL success-empty + foreign/wrong-role
denial assertions are authored. Actual attempt-populated PostgreSQL
and authenticated browser acceptance remain PARTIAL.

## Faculty Section published-grade gradebook (2026-10-14)

Read-only `/teacher/courses/[deliveryId]/gradebook` and private no-store
CSV GET compute per-current-Section-learner earned/possible totals ONLY from
actually published assignment grades and quiz results. Canonical Section
roster/assessment readers recheck current Faculty college + teaching scope.
For each learner, incomplete or missing published grades are **unknown**, not
zero. Each row distinguishes number of published-scored assessments and
total publishable assessments; percentages are explicitly partial observed
scores, not weighted final course grades. Quiz retakes use canonical latest
attempt only. CSV cells are formula-neutralized, UTF-8 and quoted. Up to
100 published assessments are supported; above that the page refuses to
silently produce incomplete totals. Pure-model tests and an addition to the
already passing unique-fixture Faculty positive PostgreSQL test are authored,
not independently run here. The full legacy gradebook weighting, print
format, and browser proof remain PARTIAL.

## Faculty attendance corrections — policy read with missing request storage (2026-10-14)

Read-only `/teacher/courses/[deliveryId]/attendance-corrections` uses the
existing authorized exact Section attendance workspace and the registered
attendance_policies correction window. Each real scheduled session is labeled
OPEN/NOT_STARTED/WINDOW_EXPIRED using the same clock logic used for Faculty
marking. Filter and pagination use strict Zod; zero sessions use an honest
empty state. Crucially, **request history is unavailable**, not an empty
zero-request list: registered attendance schema contains no correction-request
table or lifecycle. No request submit/approve/write endpoint or audit fiction
was introduced. Pure-model/unit coverage and an addition to the existing
unique-fixture Faculty PostgreSQL test are authored but not executed in this
chat. The request-history requirement is BLOCKED by missing migration/policy;
legacy correction parity stays PARTIAL.

## Faculty assessment authoring and published live-class views (2026-10-14)

**PARTIAL only.** Section assignment command authoring uses the registered
`course_assignments` columns for confirmed draft create/edit, guarded publish
and archive (soft delete). The dedicated route requires active current
Faculty teaching scope and same origin, strict Zod, locked optimistic timestamp
and a single transaction-coupled safe actor audit for each accepted change.
Text instructions only, no attachments; submission-bearing assignments are not
silently deleted. Section quiz authoring uses the registered choice-question
tables for validated draft create/edit and guarded publish, including distinct
correct-answer rules, total-point limits and rejection after publication or
registered attempts. It uses the same narrow permission and audit pattern.
Both pages have loading/retry, no-lesson blockers and confirmation controls.

The read-only `/teacher/live-classes` page uses authorized current Section
course workspaces and only published `LIVE_CLASS` records, with upcoming/past,
per-Section filters and bounded pagination. Exposed meeting links must be valid
HTTPS without credentials; unsafe and missing URLs are shown as unavailable
and never logged. SQL/DB tests are authored but not yet demonstrated green at
the final commit; no DONE status is claimed.

## Faculty discussion moderation event history (2026-10-14)

PARTIAL: `/teacher/courses/[deliveryId]/discussion-history` reads only registered
`activity_events` for exact `course-discussion:<deliveryId>` with pin-change
and delete types, checked against current live Faculty teaching scope,
`courses.read` and college/organization. There is strict Zod action/page
validation, 20-event pagination, error/loading/empty states, and a direct
Discussions link. The audit intentionally avoids deleted message text and
untrusted metadata. A learner can delete their own unpinned post; existing
delete events lack an actor-role snapshot and therefore show the neutral
label **Discussion deletion recorded**, not an invented Faculty moderator.
Historic actions before the event producer existed, full moderation analytics,
browser and DB proof remain OPEN.


## Faculty current-Section Reports hub (2026-10-14)

PARTIAL: `/teacher/courses/[deliveryId]/reports` reuses the canonical exact
teaching-Section assessment-health, Faculty assessment overview and attendance
workspace readers. It displays actual registered total/published Quiz and
Assignment counts, scheduled/marked class sessions, and up to five published
assessment report summaries per page. Assignment/Quiz detailed reports, the
published-gradebook reader and attendance workspace are linked directly.
Unknown, unmarked or private grades are never shown as zero or as final
weighted results. Strict Zod delivery/type/page filters, mobile cards,
loading/error/empty recovery and current Faculty college/Section scope are
present. Complete legacy reports/export, executed DB/browser acceptance and
weighted-grade semantics remain OPEN.


## Faculty own alternate contact storage decision (2026-10-14)

C is BLOCKED by missing migrated storage. Registered faculty_profiles holds only
primaryDepartmentId/employmentType/academicTitle, without alternate phone or
contact email. The richer faculty-profile document is staged but not registered;
users.email/phoneE164 are login identifiers and MUST NOT be repurposed.
Read-only `/teacher/profile/contacts` is linked from Faculty Profile, scoped
via active Faculty-only profile.self.manage and persisted own membership. It
shows identity contact as noneditable and the explicit missing-storage state.
No edit endpoint, audit fiction or accidental identity mutation was introduced.
DB owner must migrate separate private contact fields and the product/privacy
owner must decide edit scope, version concurrency and audit semantics before C
can be delivered. The Self Profile parity row remains PARTIAL.

## Faculty live class schedule/edit/cancel (2026-10-14, chat-4 A)

`/teacher/live-classes` now has a mobile-ready confirmation flow for a
registered lesson-scoped LIVE_CLASS entry. `POST /api/courses/faculty/live-classes/
[deliveryId]/command` accepts strictly validated CREATE, EDIT and CANCEL
commands only for an active, same-college Faculty teaching assignment, with
offset-bearing time strings, https-only meeting URL, same academic-period
window, overlap checks against that Faculty's live sessions, and optimistic
millisecond edit tokens under an advisory transaction lock. CANCEL changes
content status to ARCHIVED rather than deleting history. A college-scoped
transaction audit records action and times but never the raw meeting URL.
Unit and disposable PG fixture tests (success, foreign/role/stale denials,
activity count) are authored but **not executed**. Multi-instructor cross
tenant conflict/original legacy modal and browser proof remain PARTIAL.

## B — Faculty attendance-session create/reschedule (2026-10-14)

A confirmation form on the exact course Attendance page invokes
`POST /api/courses/faculty/attendance/[deliveryId]/schedule`. Only
registered section_schedule_events and their course-delivery link are written.
Strict Zod, `courses.read` plus live Faculty teaching scope, actor+Section
transaction advisory locks, explicit academic-period time bounds, overlap
detection for same Section or teacher, optimistic updatedAt and a single
per-change actor/college activity row are source-authored. Rescheduling
already MARKED attendance is refused; no attendance records are moved.
The existing page's marking flow remains separate. Unit and disposable PG
fixtures with success, conflict, stale and role/foreign denial are authored
but not executed. Mobile/browser and full registrar calendar semantics remain
PARTIAL; no parity rows are promoted.

## C — Faculty Quiz results CSV size guard (2026-10-14)

The existing authenticated exact-delivery Quiz GET export is extended with a
hard 500-learner-row result cap (latest-attempt learners first, then unmatched
eligible learners), an explicit numeric omitted-row notice in CSV and
X-Export-Truncated / X-Export-Omitted-Rows response headers. UI warns before
download. Every learner cell remains formula-neutralized by the registered
CSV serializer, with UTF-8 and private/no-store response headers retained.
This is a bound on exported rows, not a bound on underlying authorized report
reads, and not a complete gradebook when truncated. Unit tests and an added
assertion in the existing fresh-PG positive Section fixture are authored but
not executed here. Full legacy analytics/download browser parity stays PARTIAL.

## 2026-10-14 Faculty gradebook learner breakdown (PARTIAL)

A per-learner read-only drill-down under the exact Faculty-owned delivery's
published gradebook enumerates only registered published assignments and quizzes
with results explicitly released. Published assignment scores require the
individual gradePublished flag; Quiz scores require resultsPublished. A missing,
private, unattempted, or invalid score is **Unknown**, not zero. The current
Section roster is rechecked and arbitrary membership identifiers return a
non-leaking NOT_FOUND error. The drill-down is not a weighted final grade.
Pure model and positive/denial PostgreSQL tests are authored, not independently
executed; mobile/browser and legacy gradebook acceptance remain open.

## 2026-10-14 Faculty attendance scheduling co-teacher editor parity (PARTIAL)

The Section attendance schedule editor now limits **reschedule choices** to
events authored by the current signed-in Faculty membership. Selecting an
existing unmarked event prefills title, description, location and local-time
start/end for safe correction. Client-side time validation avoids invalid
Date serialization, but strict Zod, transaction locks, optimistic token and
same-origin command authorization remain server authoritative. Existing
isolated PostgreSQL create/reschedule/denial test and new pure model tests
are authored; TypeScript, browser and PostgreSQL reruns remain open.

## 2026-10-14 Faculty read-first: Discussion participation and Section session coverage (PARTIAL)

Added exact live Faculty-Section read-only `discussion-participation` using the
migrated `course_discussion_messages`: persisted total, Faculty, Learner and
pinned counts plus the latest 12 role/time entries. Reply counts and unresolved
questions are *not* inferred from the legacy flattened text prefix.
Added `session-coverage` from already-authorized scheduled/marked attendance
sessions: separates recorded marks from elapsed unmarked and upcoming sessions,
caps displayed rows at 40 and discloses truncation. Both are linked from the
existing Faculty workspace, with loading/retry/mobile states, pure model/unit
tests and independent Section/role/forged-selector PostgreSQL assertions in the
fresh-Faculty fixture. No table created, no write route or fabricated notice.
The DB10 Section notices store is still unregistered; read/write remains blocked.
Real PG, eslint/tsc and responsive browser execution still open: PARTIAL only.

## 2026-10-14 assignment editor recovery — PARTIAL
The current legacy All Assignments row now preserves persisted due instants in
browser-local datetime controls, rejects malformed local time, blocks archived
actions and provides accessible write feedback; server transaction/audit and
same-origin guards remain authoritative. A dedicated pure model test and
unique-fixture PostgreSQL command tests cover success, stale, cross-Section,
wrong-role and audit. **Not DONE:** browser/keyboard/mobile and exact
legacy edit/submission-grade modal acceptance plus executed PG/lint/tsc.

## 2026-10-14 Faculty All Quizzes authoring recovery — PARTIAL
Existing draft quiz builder now consumes the actual nested GET response, safely
ignores stale overlapping load responses, restores local due instants without
UTC hour drift, validates unique options and correct selections before POST,
requires an explicit confirmation and blocks published-question editing.
The existing own-Section command retains row lock, Zod and transactional audit;
unique Faculty-only fixture PG tests add create/edit/publish, old token,
wrong-role and foreign-Section denial. Outstanding: independently execute PG,
unit, ESLint/tsc, browser/keyboard/mobile, exact legacy result-edit parity.

## 2026-10-14 Faculty course-discussion optimistic moderation (PARTIAL)
The shared discussion surface now submits a required confirmed millisecond
version token for PATCH pin/unpin and DELETE. The service supports a
microsecond-safe SQL CAS at the mutation boundary and increments the pin token;
a stale/delete race yields explicit retry instead of silent overwrite.
Existing Faculty/Learner scopes remain unchanged, including learner own-unpinned
self-delete; only live Section Faculty can pin. Transactional moderation,
post/delete activity audit and same-origin fences remain. Added pure model and
in-test Faculty-only membership PostgreSQL create/pin/stale/foreign/wrong-role/
delete/audit assertions. Outstanding: run unit/PG/lint/TypeScript and browser
role/keyboard/mobile tests; exact legacy moderation workflows. PARTIAL.

## Faculty published gradebook searchable roster (2026-10-14)

PARTIAL: The exact teaching-Section published gradebook now renders 25
current authorized learners per page, with bounded case-insensitive search
by name, roll number and email, deterministic roll/name order, strict Zod
query validation and links to existing own-Section score breakdown. The CSV
still exports the full server-authorized Section, not filtered screen rows.
Malformed nonfinite, negative or over-maximum score evidence is excluded
rather than counted as a legitimate grade in the pure aggregate model.
Existing server Faculty permission/tenant/Section/grade-publication gates
are unchanged; no new mutation, audit event, schema or private grading
read path was added. Focused unit regressions are authored but NOT claimed
as executed PostgreSQL, browser, ESLint or whole-repository TypeScript proof.
Legacy gradebook weighting, full exported/download acceptance and responsive
browser review remain OPEN; no parity status is promoted to DONE.

## Faculty Section Quiz archive workflow (2026-10-14)

PARTIAL: The Section choice-quiz builder now offers a confirm-first Archive
action for current DRAFT, PUBLISHED or CLOSED quizzes. Server authorization
requires a live Faculty teaching delivery and centrally granted course access,
strict Zod confirmation, a locked optimistic token, and a transactional audit
event `courses.quiz.archived`. Persisted learner attempts block archival.
The action changes quiz status to ARCHIVED without deleting questions or
attempt history. Added pure schema tests for malformed/forged inputs, and
extended isolated PostgreSQL tests with published archive, wrong-role, foreign
Section and stale-token denial, retained row and audit assertions.
These tests are authored, not independently executed; browser parity, an
attempt-populated runtime denial and legacy close actions remain OPEN.
No Faculty parity row is promoted to DONE.

## Faculty Quiz CLOSE and released-result continuity (2026-10-14)

PARTIAL: Authenticated Faculty can now confirm CLOSE for a current published
quiz in their exact persisted teaching Section. Same-origin, strict validated
command, optimistic row token, current teaching scope, transaction lock and
actor/college audit are preserved. CLOSE is allowed even with attempts;
learner submissions/results remain stored, while ARCHIVE remains denied if
any attempt exists. Previously closed quizzes with `resultsPublished=true`
remain in Faculty published gradebook totals and the Section reports/results
summary; private/unreleased results are still excluded from score totals.
Updated pure-model tests and the in-test PostgreSQL success/denial audit
fixture cover PUBLISHED→CLOSED→ARCHIVED (the latter only with zero attempts).
This is authored rather than independently executed PostgreSQL/browser
evidence; no Faculty page status is promoted from PARTIAL.

## Faculty assessment aggregate lifecycle controls (2026-10-14)

PARTIAL: Faculty All Assignments and All Quizzes cards now link to their
exact-Section authoring workspace and show confirmation-gated PUBLISH/ARCHIVE
or PUBLISH/CLOSE/ARCHIVE controls (only for actual Faculty-owned entries).
These reuse the existing strict, same-origin authenticated Faculty command
routes, current teaching grant, optimistic version, transaction audit and
submission/attempt protections. Shared Offering cards expose no mutation.
A pure unit suite checks every status/kind combination, safe confirmation
messages and narrow version-token command bodies. Successful saves refresh
the server-owned list, with explicit error/status feedback; no client state
is treated as proof of authorization. Actual PostgreSQL and authenticated
browser/keyboard/mobile execution, published edit parity, archived-list parity
and richer legacy modals remain OPEN. All Assessments/Quizzes remain PARTIAL.

## Faculty Overview evidence correctness and at-risk totals (2026-10-14)

PARTIAL: The Faculty Course Home current-Section signals now deduplicate marked
sessions and absence pairs, reject out-of-roster attendance or submission
records and nonfinite assignment grades, and report the full current-roster
at-risk count rather than truncating the counter to eight displayed previews.
The source still links to the exact Section roster; it does not invent
historical enrollment dates, weighted scores or private grade publication.
Unit tests cover duplicate/foreign evidence, malformed scores, missing
grading, 12-student risk counts and preview truncation. These additions are
source-authored only; legacy behavior, real PostgreSQL and authenticated
mobile/browser verification remain open. Course Overview stays PARTIAL.

## Faculty assessment review drawers and append-only notification fixture (2026-10-14)

PARTIAL: The existing Faculty All Assignments submission-grading panel and All
Quizzes immutable-attempt review now use the shared accessible native-dialog
Drawer (Escape handling, titled panel, responsive mobile width, dismissal
control) instead of a long inline list. Existing exact-Section API reads,
optimistic per-submission grade writes and explicit result visibility controls
are preserved; publishing Quiz results now asks for confirmation as hiding
already did. The authenticated PostgreSQL Faculty Notifications fixture was
corrected to remove only mutable notification recipients, never immutable
activity_events or the user/membership/role records referenced by their audit
history. This is a regression-safety correction, not a passed database run.
Authenticated keyboard/Playwright, real PostgreSQL and exact legacy overlay
acceptance remain OPEN; no detailed or master parity row is marked DONE.

## Executed CI Faculty-browser blocker repairs (2026-10-14)

An earlier main CI browser run (38590894448) exposed four Faculty
regressions. The Faculty Discussion E2E had not accepted the new intentional
pin/unpin confirmation dialogs, so no PATCH was sent while it waited for a
response; both dialogs are now explicitly accepted in the test. Faculty
Contacts E2E assertions still expected the retired private-email/table UI
after the directory's public-only card policy; the tests now assert active
role-labeled public cards by seeded membership ID, confirm that searching
private login email finds no directory member, and check responsive cards.
Faculty Notifications E2E reused SQL parameter $1 as UUID and text, causing
PostgreSQL type inference failure; the insert now uses explicit UUID casts
and a separate $6::text subject field. Its teardown no longer deletes
append-only activity_events or their referenced actor/membership rows.
These are source changes targeting proven failing CI cases, **not yet a
successful rerun at this revision**. Run targeted authenticated Chromium,
then full CI, before marking Discussions/Contacts/Notifications DONE.

## Faculty Contacts — Teachers: DONE (2026-10-14)

The approved 2026-10-14 privacy decision limits contact visibility to
need-to-know actors. This Teachers public directory is read-only: active
Faculty membership, public name, department and current college roles, never
unrelated learner contact information, identity, document or private profile.
It retains legacy Teachers navigation, same-college role filtering, bounded
server search, 10/20/50 paging, exact role-checked detail and return link,
responsive cards, empty/loading/error/retry and stale/foreign denial.

**Executed acceptance (immutable source SHA
`c9e5a8d2e2c416a99708d8f9d1581b2fd18373e7`):**
[GitHub CI 38599250226](https://github.com/42Students/lms-vnext/actions/runs/38599250226)
ran `tests/integration/faculty-contacts-teachers-acceptance.test.ts`
**3/3 PASS** (positive listing/detail, name search/phone-email non-disclosure,
wrong-role/suspended/disabled/foreign-college and forged scope denial).
`tests/e2e/faculty-contacts-teachers.spec.ts` passed both **desktop and
mobile** authenticated user journeys, including list→detail→back, same-college
teacher-only cards, search/no-match, public-only visibility, mobile
horizontal-scroll check and no uncaught page errors. Typecheck, unit and build
also passed at that source SHA. Overall CI still has failures in other
modules and a pre-existing repository lint violation; this DONE designation
is scoped exclusively to **Faculty Contacts — Teachers**, not All Contacts,
Contacts — Students, whole Faculty or database/release certification.
## 2026-10-14 Faculty All Assignments published-grade guards (PARTIAL)
Existing audited grade/regrade/publish writers now fail closed when the linked
assignment is DRAFT/ARCHIVED and hold a shared assignment row lock while a
published-only grade or grade publication is committed. Existing integer
optimistic submission version and immutable audit remain authoritative.
The mobile submission grading card displays write status. Pure-model and a
fresh Learner+Faculty Section PostgreSQL test cover successful grade/publish,
stale version, wrong role, forged college and archived assignment denial.
Still PARTIAL: execute tsc/eslint/PG/unit tests, browser and legacy grading
modal/regrade review, old server consumers.
## 2026-10-14 Faculty Attendance correction optimistic token — PARTIAL
Existing mark/update path already enforces exact Section roster, correction
hours and same-origin PATCH. Corrections to an already MARKED session now require
the prior persisted markedAt ISO token, compare millisecond precision under the
session row lock, and advance timestamp monotonically. Audit metadata preserves
old/new mark timestamps plus existing aggregate counts without learner IDs.
Existing browser editor supplies the token and surfaces explicit stale reload
instruction. Pure-model and test-created Faculty+Learner Section PG fixtures
cover default SQL now microseconds, successful correction, stale replay,
foreign-scoped and wrong-role denial, audit. PARTIAL until tsc/lint/PG/unit,
mobile browser and actual legacy correction history are independently verified.
## 2026-10-14 Faculty Quiz result publication command — PARTIAL
The Faculty-owned CLOSED quiz report's Publish/Hide controls now send a
confirmation and persisted millisecond timestamp to a same-origin scoped
command. The service rechecks active Faculty teaching delivery, locks the
exact quiz, forbids draft/open or unchanged transitions, and writes the
visibility change with immutable activity audit in one transaction.
No manual score override or unpublished score disclosure was added.
Pure model/unit and fresh Faculty/Learner Section PG case covers
SQL default now(), publish/hide, forged delivery, wrong role, stale token
and two audit events. Still PARTIAL: executed PG/TS/lint, responsive
browser, legacy result-publication and learner masking acceptance.
## 2026-10-14 Faculty correction explanation and no-op guard — PARTIAL
The existing same-origin, optimistic, correction-window checked Faculty mark
transaction now requires a short explanation when an already-MARKED session
actually changes. It derives a persisted absence delta before mutating,
rejects no-op corrections, and writes only counts plus a reason to its existing
immutable activity audit (no learner IDs or names in metadata). First marks are
unchanged. A mobile-friendly textarea and explicit error messages were added.
Pure-model unit and fresh Section PG fixtures cover real correction, no-op,
missing reason, wrong role, foreign Section, stale token and audit.
Still PARTIAL: executed tests, mobile/keyboard/browser, correction-request
workflow and legacy report acceptance.
## 2026-10-14 Faculty version-checked moderation replies — PARTIAL
A distinct, same-origin Faculty-only reply POST uses existing discussion
storage and an authorized teaching-Section scope. The parent message is
re-read with a shared row lock in the insert transaction, rejecting deleted,
foreign-Section or stale parent versions before a reply can be created.
A new immutable `courses.discussion.replied` event records only parent ID,
Section and role (not private message text). Learner replies retain their
existing route. Shared mobile composer displays a clear stale-parent error.
Pure model/unit and own-Faculty PostgreSQL tests authored for success,
wrong-role, non-leaking foreign parent, stale, delete race and single audit.
Still PARTIAL: execution/browser, genuine threaded-reply storage absent,
and a locked-thread flag is not migrated; no fictitious lock implemented.
## 2026-10-14 Faculty Section CSV contact privacy, cap and IST — PARTIAL
Applies orchestrator decisions: exported Assignment/Quiz rows never include
learner email or phone columns; timestamps display in Asia/Kolkata, with
correct IST calendar rollover. Both report kinds are capped at 500 response
rows, with omitted-row notices and formula-injection neutralization retained.
A pure-model unit regression tests dangerous cells, IST, cap and contact
non-disclosure. Disposable Section PG fixture tests persisted export, wrong
role, foreign-scope denials and absence of the learner's private email.
GET-only reports have no stale write token; other writes remain unchanged.
PARTIAL until orchestrator gate, mobile download and legacy comparison.
## 2026-10-14 Faculty Assignment editor optimistic SQL CAS — PARTIAL
Exact Faculty Section CREATE/EDIT/PUBLISH/ARCHIVE remains on the existing
same-origin route. After locking the parent assignment, EDIT and transitions
now recheck its version and status in SQL using Postgres millisecond truncation,
and expose a distinct declared STALE_VERSION error instead of confusing it
with illegal lifecycle changes. Existing no-edit-after-publish and no-archive-
with-submission guards, plus immutable transaction audit, are unchanged.
Model/unit plus disposable lesson/Section PG tests cover SQL now() precision,
authorized edit, wrong-role/foreign delivery, stale replay and audit.
Remains PARTIAL: orchestrator execution gate, keyboard/mobile authoring drawer
and legacy assignment lifecycle proof.
## 2026-10-14 Faculty Quiz authoring SQL optimistic CAS — PARTIAL
The registered exact-Section Faculty question builder now emits the declared
FACULTY_QUIZ_STALE_VERSION error independently of invalid publish/close/archive
transitions and checks the millisecond-normalized updatedAt version in both
EDIT and lifecycle SQL UPDATE statements, under the existing locks. Immutable
questions/answers for published attempts remain protected; no new assessment
score overrides are introduced. The existing audited transaction continues
to encompass question replacements and state transitions.
Pure model unit and own-Section PG fixtures cover now() microseconds,
successful edit, stale replay, foreign selector, wrong-role and event count.
Remains PARTIAL: orchestrator gates, responsive builder/browser and legacy
publish/release acceptance.
## 2026-10-14 Faculty regrade of published Assignment requires feedback — PARTIAL
The existing exact-Section, same-origin grade/regrade PATCH still uses an
integer submission version, published parent-Assignment lock and immutable
audit. When Faculty revise an already learner-visible grade, meaningful
learner-facing feedback is now required; the update hides the old published
grade until republished. The shared activity metadata records only the
previous visibility and feedback-presence flags, never private score or
freeform feedback. Mobile grading drawer explains the required rationale.
Pure policy/unit and self-created Section/Learner PG grading sequence now
covers initial grade, publication, denied unexplained regrade, valid feedback,
stale replay, wrong-role, foreign college and duplicate audit protection.
Remains PARTIAL: orchestrator tests, mobile drawer and legacy review.
## 2026-10-14 Faculty Quiz result release bypass sealed — PARTIAL
The legacy generic Quiz results endpoint can no longer be used by Faculty to
circumvent their confirmed, millisecond-versioned publish/hide route. It now
permits only course-managing Admin actors and CLOSED quizzes; its own
transaction locks the quiz, writes a conditional visibility transition, and
records an immutable results-changed audit event. Duplicate writes and
published/draft/archived states fail closed. Faculty's own exact Section route
remains unchanged. Pure policy unit and disposable Section PG tests cover
Faculty/wrong-role/foreign-denied, Admin publish/hide, no-op denial, and audit.
PARTIAL: orchestrator gates, browser and legacy role continuity.
## 2026-10-14 Faculty Quiz CSV attempted-state filters — PARTIAL
Existing exact-Section server-verified Quiz report CSV now supports mutually
exclusive ALL, ATTEMPTED and NOT_ATTEMPTED query selectors. The GET schema
rejects Assignment-only grading filters on Quiz and Quiz-only filters on
Assignment; it rejects duplicate and forged selectors. Filter first, then
enforce the combined 500-row cap, neutralize formulas and omit learner contact.
Faculty Quiz report offers mobile-friendly direct links for both subsets.
Pure unit and disposable PG read fixtures cover empty attempted vs persisted
unattempted, invalid filter, foreign Section and learner denied. GET-only;
no stale write token. PARTIAL until tests/browser/legacy.
## 2026-10-14 Faculty grading idempotence — PARTIAL
The existing exact-Section Faculty grade/regrade PATCH now rejects a no-op
score+feedback pair before it can increment the submission version, hide
a learner-visible published score or create a redundant audit event. Changes
to either score or learner feedback still go through the existing published
assignment lock, integer optimistic version and transaction-coupled audit.
The mobile grading drawer disables Save when no revision exists. Pure model
unit and the disposable Faculty/Learner grading PG fixture verify rejection
alongside valid regrading, stale version, role/scope denial and audit event
counts. Remains PARTIAL: CI and mobile/keyboard/legacy UI acceptance.
## 2026-10-14 Faculty discussion reply moderation history — PARTIAL
The exact-Section Faculty moderation audit now includes the registered
`courses.discussion.replied` event and a strict REPLY filter, alongside pin
changes and deletions. Pagination remains capped, and history only renders
sanitized action labels, event time and actor-presence indicators: never reply
body, archived deleted text, or learner contact. The mobile read page exposes
a Faculty replies filter, with no new file or external-send features.
Pure model/unit and own-Section disposable PG test cover real audited reply,
wrong-role and foreign-scope/forged selector denial. As a GET read, no stale
write token applies; the underlying Faculty POST retains its parent token.
PARTIAL until test gates and authenticated responsive/legacy validation.
## 2026-10-14 Work Mode merge verification — PARTIAL
Merged current main without conflicts, preserving existing DONE rows. Repaired
both Course and aggregate Quiz review call sites to pass the persisted quiz
updatedAt token required by the publication command; removed an out-of-scope
grading status setter from the submissions loader. npm ci, TypeScript and
changed-file ESLint executed successfully; the complete unit suite passed (505 files, 2,002 tests). Browser/mobile and PostgreSQL acceptance remain
open. Disposable PostgreSQL binaries are available, but this sandbox maps only
UID 0: chown to a non-root user fails and unshare UID mapping is denied;
PostgreSQL refuses root. No database test is claimed as executed.
## 2026-10-14 Faculty assessment deadline authoring in IST — PARTIAL
Assignment and Quiz draft controls now read and save explicit IST wall times,
including the aggregate edit drawer and Blueprint authoring form. Assignment
EDIT uses the same strict conversion as CREATE; impossible calendar dates
are rejected rather than normalized or silently clearing the deadline.
Pure tests exercise leap days, midnight rollover and device-independent
conversion. The own-Section PostgreSQL assignment fixture now checks persisted
CREATE/EDIT deadlines alongside existing stale, foreign-scope and role denial.
Existing publication guards, version checks and immutable audit are unchanged.
Remaining: PostgreSQL execution (sandbox UID restriction), browser/mobile and
legacy-oracle deadline acceptance; no DONE promotion.
## 2026-10-14 Faculty CSV contact fallback and roster cap — PARTIAL
Assignment/Quiz report CSV no longer uses email as a missing-name fallback.
Roster CSV now exports names and roll numbers only, omits phone/email and
membership identifiers, caps at 500 learners with an explicit omission notice,
and neutralizes invisible-prefix formulas using the shared serializer.
The download control labels its exported fields. Pure regression tests cover
missing names, privacy, UTF-8, quoting, formulas and cap notice. The own-Section
PostgreSQL CSV fixture now tests actual persisted learners with no display name
alongside existing role/foreign-selector denials. GET-only; no stale token.
Remaining: database execution, browser downloads and legacy acceptance.
## 2026-10-14 Faculty publish only the saved grade — PARTIAL
The grading drawer blocks publication while its score or feedback differs
from the persisted grade, explains the required Save step, and rejects empty
scores instead of interpreting them as zero. Grade cards rebase on the returned
version so explicit refresh/updates show the actual persisted score/feedback.
A pure Zod-backed model covers deliberate zero, invalid scores, unsaved feedback,
ungraded and published states. The existing fresh-Section grading PostgreSQL
fixture checks the editor against actual persisted grades while retaining
success, foreign/role/stale and audit assertions. Existing writers unchanged.
Remaining: database execution and browser/mobile/legacy grading acceptance.
## 2026-10-14 Faculty attendance correction preview — PARTIAL
The attendance editor now confirms first marks with present/absent counts and
corrections with the actual counts moving to absent/present. The preview never
contains learner identifiers. Unchanged corrections are disabled and rejected
before requesting a mutation; the existing bounded correction-reason policy
is reused in the UI. Same-origin, window, current roster, markedAt token and
transactional immutable audit remain in the existing server writer.
Pure tests cover count deltas, duplicate/reordered sets, no-op and invalid
rosters. The fresh-Section PostgreSQL correction fixture derives the preview
from its persisted absence while retaining stale, foreign/role and audit tests.
Remaining: PostgreSQL execution and mobile/keyboard/legacy correction acceptance.
## 2026-10-14 Faculty generic Assignment edit bypass closed — PARTIAL
The existing partial Assignment PATCH now forwards authorized Faculty edits
to the same published-state guarded, confirmed, versioned and audited command
as the dedicated editor. Admin behavior is preserved. Omitted fields retain
persisted values; explicit deadline clearing remains supported; sequence
changes use the separate lesson-order workflow. Both Faculty drawer call sites
carry the actual persisted updatedAt token and require edit confirmation.
Pure adapter tests and the fresh Faculty Section PostgreSQL fixture cover
successful generic edit, missing/stale tokens, wrong/foreign-role denials and
the additional immutable update audit. Remaining: database/browser acceptance
and generic Quiz/assessment lifecycle bypass review; no DONE promotion.
## 2026-10-14 Faculty generic Quiz edit bypass closed — PARTIAL
Faculty metadata/question PATCH now forwards to the confirmed, versioned,
publication/attempt guarded command and immutable audit. Metadata-only edits
preserve persisted question IDs, choices and total points; only explicitly
provided valid questions replace the bank. CREATE still requires questions.
The question drawer captures the loaded draft token, refuses missing/currently
published drafts and confirms replacement before PATCH. The metadata drawer
already sends its persisted token. Admin behavior stays on its prior writer.
Pure adapter tests and own-Section PostgreSQL assertions cover missing/stale
version, publication, role/foreign denial, preserved question IDs and update
audit; affected prior Quiz PG tests now supply the client token.
Remaining: PostgreSQL execution, responsive browser/legacy builder acceptance,
and generic lifecycle writer review. No DONE promotion.
## 2026-10-14 Faculty generic assessment lifecycle bypass closed — PARTIAL
Faculty calls to the older Assignment/Quiz transition endpoints now forward
to the same confirmed, version-checked and audited lifecycle commands. Missing
client versions cannot publish, close or archive. Admin transitions retain
prior behavior. Blueprint controls use the existing guarded lifecycle UI;
the Edit drawer's Delete action carries the persisted version and confirmation.
Pure boundary tests cover required tokens/confirmation. Fresh Section PG
fixtures test successful legacy-route publication, stale/missing-version and
scope/role denial with audit; older Faculty PG fixtures now read actual
persisted assessment versions using a test-only helper. No cleanup changes.
Remaining: PostgreSQL execution and browser/legacy lifecycle acceptance.

## Faculty Contacts — Students: DONE (2026-10-14)

The `/teacher/contacts/students` surface and `/teacher/contacts/students/[membershipId]` drill-in are accepted as the **public directory** per the 2026-10-14 approved learner privacy decision. The server uses persisted active LEARNER grants with the requesting Faculty actor's live same-college membership, strict Zod validation, server-side public name/department search, 10/20/50-row bounded pagination, current role labels, and an active-role-checked detail. It does **not** reveal private email, mobile, verified identity or files to an unassigned faculty member. The legacy unrestricted contact fields intentionally do not override privacy policy.

**Executed acceptance:** GitHub [CI run 38603899755](https://github.com/42Students/lms-vnext/actions/runs/38603899755), source SHA `ab63f45774fbf6122322ccb17540d77089fe840c`, containing commit `9645065197f2617b702c12c698e1895ff98f068e` (desktop selector correction). On disposable PostgreSQL `tests/integration/faculty-contacts-students-acceptance.test.ts` passed **3/3**: same-college active learner list and detail; private-field removal, public name search and inaccessible email search; foreign-college target, wrong-role, forged-actor and suspended/disabled/foreign-college-scope denials. The authenticated Chromium `tests/e2e/faculty-contacts-students.spec.ts` **desktop and mobile passed**, including Student tab navigation, public card/detail/return, private-field masking, empty search, mobile width and page-error checks (26 browser tests passed; none of the browser failures was from this surface). Unit, typecheck and build jobs passed. Overall CI remains **red** on other modules and repository lint, not a Faculty Students acceptance failure. No Contacts All, Contacts Teachers, other Faculty row or database tracker state is changed by this closure. A later comparison from this SHA to `9fc26ce920a58390e1f48b493a5bed457ee231c6` found **no changes to Faculty Contacts source or Students acceptance tests**.

## Faculty Contacts — All: DONE (2026-10-14)

**Scope:** `/teacher/contacts/allContacts` and read-only same-college
`/teacher/contacts/allContacts/[membershipId]`. Registered PostgreSQL
membership/role/user/department joins, active user and membership gates,
strict Faculty permission and actor identity, 10/20/50 bounded server paging,
name/department search, public role labels and drill-in; never private contact,
identity, verification, files or unrelated tenants. This privacy restriction
is an intentional approved change from legacy unrestricted contact columns.
The server-owned search form now remounts from the URL on Clear search, fixing
stale filter state on navigation.

**Executed:** [Faculty Contacts acceptance workflow 38608927968](https://github.com/42Students/lms-vnext/actions/runs/38608927968)
ran on source commit `8fba44b728c84f59e60c3aeb814930acada5cd38`.
The registered-data PostgreSQL run passed **9/9 tests** for All, Teachers and
Students: All-specific **3/3** included active college/role aggregation,
foreign/forged/suspended/disabled denial, contact non-disclosure, true 13-row
pagination, capped page sizes, and private-email search denial.
The authenticated Chromium job passed **6/6 tests** across desktop/mobile All,
Teachers, Students; All-specific **2/2** verified role cards, exact same-college
detail/return, no private contacts, URL search reset, no page errors, and mobile
horizontal-scroll bounds. The independent two-job workflow was green.
This is a scoped Contacts All closure, not a claim of complete legacy contact
storage, unrestricted contact fields, all Faculty rows, or global CI readiness.

## Faculty Course Students — DONE (2026-10-14)

**Accepted scope:** active teaching-Section learner roster and exact current-roster
Student detail/attendance. Registered roster readers check the current Faculty
teaching assignment and college; inactive, foreign, unrostered or non-Faculty
callers do not see the detail. Displayed learner email/phone is available only
to a Faculty member actively teaching that learner's exact Section, under the
2026-10-14 need-to-know decision. Exports deliberately contain name and roll
only (formula-neutralized, bounded); no sensitive email/phone, private photo,
identity, documents or additional learner records are exported or fabricated.

**Executed acceptance on source SHA
`5f7b8850fdf13ca7f1d081dfd926c432f9289cb8`:**
[Faculty Course Students workflow 38609626729](https://github.com/42Students/lms-vnext/actions/runs/38609626729)
completed both independent jobs successfully. PostgreSQL 17 ran
`faculty-c4-reports-audit-contact.test.ts` **4/4 PASS** including the
persisted current-Section roster, positive student summary/drill-in, null
attendance without marks, unrostered/current actor denial and malformed
college request rejection. Authenticated Chromium ran
`faculty-course-students.spec.ts` **2/2 PASS** for desktop and mobile:
exact teaching delivery, student search and no-match, link to student details,
Course attendance and recorded unknown states, safe CSV contents, return
navigation, zero browser page errors and mobile no-overflow check.
Existing `faculty-courses.spec.ts` source assertion was corrected from an
outdated email/phone CSV expectation to the approved privacy-safe format.
This DONE is scoped to Course Students, not full Faculty, institution-wide
learner PII access, private-file/photo features or all LMS CI tests.

## Faculty Course Overview — DONE (2026-10-14)

**Scoped acceptance:** the Faculty Course `home` summary and its linked
read-only Section Reports hub. Current persisted Faculty teaching assignment,
course/Section/period, active learning-path summary, learner attendance,
assignment grading/risks and performance, and status distinctions are the
only sources for metric cards; unrecorded attendance or grades are unknown,
not invented zeros. The Overview now links directly to the authenticated
Section Reports hub and current Section Students roster. This closure does
not include the separate Faculty Blueprint, Attendance, Course reports or
any private file/video storage claims.

**Executed on `1f5d64398f1cd9830aacaa5926b801422433f076`:**
[Faculty Course Overview acceptance workflow 38615289795](https://github.com/42Students/lms-vnext/actions/runs/38615289795)
finished green with **5/5 PostgreSQL tests** in
`tests/integration/faculty-c4-reports-audit-contact.test.ts`, including
the new positive zero-lesson/zero-mark real teaching Section Overview,
not-in-course/foreign-college/disabled/wrong-role denial and existing report
scope; **2/2 Chromium desktop and mobile** in
`tests/e2e/faculty-course-overview.spec.ts` including the actual persisted
assigned Course, active Faculty role, correct metric labels/quick action,
no foreign Section content, reports filter/clear, back to workspace, no
uncaught browser page errors and no mobile horizontal overflow. Both
independent CI jobs were SUCCESS; global CI is not claimed here.

## Faculty Assignment Report — DONE (2026-10-14)

**Scope accepted:** real persisted current teaching-Section assignment
report with eligible/submitted/graded/on-time/late/missing learner counts,
score buckets, PDF view, linked submissions and GET-regenerated, bounded
spreadsheet-safe CSV. The export rechecks current Faculty scope, never
includes learner email/phone, and uses formula neutralization. Unknown scores
are not invented.

**Executed:** [Faculty Assignment Report acceptance 38616571640](https://github.com/42Students/lms-vnext/actions/runs/38616571640),
source SHA `f176845b234307b5cf5bdf9456746b5c1d9fdb1e`. Both independent
jobs passed: `faculty-section-authoring.test.ts` **6/6 PostgreSQL** tests
including a new positive CREATE/PUBLISH/report/CSV and wrong-role/foreign-
Section/forged-scope denials, and `faculty-assignment-report.spec.ts`
**2/2 clean desktop/mobile Chromium** real draft creation, report display,
CSV download and 4xx unauthorized delivery; no browser page errors, retries,
or mobile overflow. Browser fixtures run sequentially to prevent competing
same-lesson draft sequence conflicts. Other Faculty authoring and global CI
rows remain separate.

## Faculty closure evidence reconciliation (2026-10-14)

Course Overview is restored to DONE in the master matrix, matching the already completed detailed Overview checklist and the two green independent CI jobs in [run 38615289795](https://github.com/42Students/lms-vnext/actions/runs/38615289795) (5 registered PostgreSQL and 2 browser). Quiz Report is closed on [run 38618101294](https://github.com/42Students/lms-vnext/actions/runs/38618101294) (7 PostgreSQL, 14 unit, 2 browser). Neither row claims global CI release readiness.

## 2026-10-15 Faculty attendance and live-class IST scheduling — PARTIAL
Attendance create/reschedule and Blueprint live-class editors now read and
write IST wall times independently of the device timezone. Labels and session
summaries explicitly use IST. Invalid calendar dates and reversed windows fail
before confirmation; the original attendance create dialog confirms its IST
window. Rescheduling adds a SQL millisecond CAS beside its locked-version check.
Pure tests cover midnight rollover and impossible dates. A fresh Faculty
Section PG fixture covers UTC persistence, wrong/foreign-role denial, SQL now()
microsecond tokens, reschedule, stale replay and two immutable audit events.
Remaining: real PostgreSQL execution, mobile/browser scheduling and legacy
calendar acceptance. The non-root PostgreSQL attempt is blocked: useradd -m
pguser fails with "Cannot open audit interface - aborting" in the root-only UID
namespace; no PostgreSQL run is claimed. Existing DONE rows remain unchanged.

## 2026-10-15 Faculty Courses URL filters and bounded workspace reads — PARTIAL
Courses search, academic-period/teaching-role selectors and pagination now
round-trip through validated URLs. Only current persisted teaching deliveries
are selectable; filters never widen scope. The server filters/pages before
loading at most 48 full Course workspaces, and cards render on the server
instead of serializing all lesson/content data to a client list. Clear,
filtered-empty, previous/next, retry and responsive cards remain available.
Pure tests cover literal search, combined filters, pagination/clamping and
invalid/duplicate/forged selectors. Fresh Faculty Section PG fixtures cover
success, wrong-role/foreign selector, forbidden college injection and revocation.
GET-only; stale write tokens do not apply. Remaining: PostgreSQL execution and
legacy/browser/mobile list acceptance. No DONE promotion.

## 2026-10-15 Faculty submitted-file review entry point — PARTIAL
The Assignment grading drawer now handles FILE alongside TEXT and LINK.
Readiness is computed on the server and passed to each review caller; when
ready, the link uses only the existing authenticated assignment file endpoint,
which rechecks scope and delegates to storage signed-read helpers. No object
key, bucket path, receipt metadata or signed URL is embedded in list payloads;
prefetch is disabled. Unready files and unsafe/missing links have explicit
states. Submitted text retains line breaks and review timestamps use IST.
Pure tests cover safe content projection, runtime gating and URL/path injection.
The fresh Section PG reader fixture covers real persisted text and wrong-role/
foreign-scope denial. Real FILE receipt/R2 read acceptance remains BLOCKED by
DB06_ASSIGNMENT_FILES_READY/storage attestation and PostgreSQL execution; no
file workflow or existing DONE report row is promoted by this UI wiring.

## Faculty Class Schedule closure evidence (2026-10-14)

**DONE** for Faculty `/teacher/calendar` and live authenticated Section
schedule navigation, not the separate Attendance marking/correction or
LIVE_CLASS file/provider integrations. [CI run 38621557113](https://github.com/42Students/lms-vnext/actions/runs/38621557113)
ran on commit `769bc395468002e9fa6098c44b85bf8aee58e06a` with **2/2 PostgreSQL**
(schedule create/reschedule, collision, audit, exact IST midnight and
cross-college/role denial) and **2/2 Chromium desktop/mobile** (persisted
class displayed on exact IST day, month and Section filters, authorized link,
day/week/month view selection, invalid request and stream-rendered foreign
scope error, mobile no-overflow). Both jobs succeeded. React's streaming
error boundary can return 200 while refusing foreign scope; the browser
assertions check the error section and absence of leaked month records.
No completion of Course Attendance or overall CI is claimed.

## 2026-10-15 Faculty paged grading drawer — PARTIAL
View Submissions now reads at most 20 serialized grade-review rows per response
with All/Needs grading/Graded/Late filters, totals and previous/next controls.
The GET rechecks persisted current teaching scope and published assignment;
foreign/nonexistent selectors share a non-leaking denial. Duplicate/injected
query selectors are rejected. Client responses are Zod-validated, old requests
cannot overwrite a newer filter, and successful grading refreshes membership
in the selected filter and report metrics. Equal-time rows have stable ID order.
Pure tests cover query injection, cap, ISO dates and omission of storage fields.
Fresh Section PG fixtures cover real review/grading/filter transitions and
wrong/foreign-role, forged selector and archived-parent denial. Writes remain
on the existing same-origin versioned audited endpoints. Remaining: PostgreSQL
execution and mobile/keyboard/legacy drawer acceptance; no DONE promotion.

## Faculty Course Attendance — DONE (2026-10-14)

Registered Section attendance uses current Faculty teaching assignment and exact active roster, marking by Schedule Event under `/teacher/courses/[deliveryId]/attendanceDetail`. The server enforces a persisted attendance policy window, optimistic millisecond marking token, meaningful correction reason, changed status requirement, foreign/wrong-role denial, and audited counts. The UI restores saved absences on session selection, explicitly distinguishes unmarked/upcoming from absent, offers a monthly class-health summary and per-learner detail overlay, and uses Asia/Kolkata time labels.

**Executed proof:** [Faculty Course Attendance acceptance run 38623132225](https://github.com/42Students/lms-vnext/actions/runs/38623132225) at source commit `51ae3b8ea492baed125f80b222374660c914cd02` passed **6/6 PostgreSQL tests** in `faculty-c4-reports-audit-contact.test.ts` (including positive first mark, reasoned correction, stale/unchanged version/foreign/role denial and persisted append-only activity history), **20/20 unit tests** across attendance edit-state/grid/learner detail, and **2/2 desktop/mobile Chromium tests** in `faculty-course-attendance.spec.ts` (persisted create → mark → correction, recorded monthly percentage, student detail drawer and foreign-scope denial). Both independent jobs were successful. The test fixture fixes use a genuinely short invalid correction reason and the registered `activity_events.occurred_at` field. This is an Attendance surface closure, not a claim of global CI green, off-policy admin override or file-backed functionality.

## 2026-10-15 Faculty report drill-in strict selectors — PARTIAL
Assignment submission and Quiz attempt drill-in pages now validate their full
search objects instead of silently accepting the first of duplicate Section,
filter or page selectors. Path-owned assessment IDs cannot be overridden from
query parameters, and unknown scope fields fail closed with existing recovery
links. The Quiz review drawer now formats attempt timestamps in IST too.
Pure tests cover duplicate/forged selectors, path ownership and valid defaults.
Fresh Section PG fixtures feed parsed selectors into real grading/attempt
readers and cover role/foreign-scope denial. GET-only; no stale write token.
Existing DONE report/assessment evidence is retained. Remaining: executed
PostgreSQL and browser/mobile acceptance for these strict drill-in boundaries.

## 2026-10-15 Faculty reschedule no-op and precision fence — PARTIAL
Attendance rescheduling now checks the locked version before no-op detection,
returns dedicated stale/no-change errors, and does not increment versions or
append audit events for unchanged metadata/windows. The editor disables an
unchanged reschedule and displays actionable errors. Untouched minute controls
preserve original seconds/milliseconds; metadata-only server updates omit
unchanged timestamp columns, preserving PostgreSQL sub-millisecond precision.
New error codes are declared in the Courses union and use its existing 409 map.
Pure tests cover semantic equality, real edits, precision and safe error copy.
Fresh Section PG fixtures assert stale-before-no-op, unchanged version and the
same two actual-change audits alongside scope/role denial. Remaining: executed
PostgreSQL and browser/mobile reschedule acceptance. DONE evidence is preserved.

## 2026-10-15 Faculty route boundary — PARTIAL
Added a shared active-Faculty plus central `courses.read` predicate and an authenticated `/teacher` layout redirecting other roles, disabled users, and inactive memberships to `/dashboard`. Unit fixtures cover granted/denied actors. This is a source-authored boundary; browser/PG run and independent acceptance remain outstanding. No DONE promotion.

## 2026-10-15 Legacy /teach role parity — PARTIAL
The legacy `/teach` subtree now uses the exact `/teacher` active Faculty and central college-scoped read predicate, so disabled members cannot keep access merely through a cached FACULTY role. Shared unit fixtures cover the predicate. Runtime browser role redirects and persisted membership revocation are pending independent acceptance; not DONE.

## 2026-10-15 /teach Course detail hidden-Section 404 — PARTIAL
The alternate Faculty Course detail validates UUID before lookup and maps missing/foreign/unassigned learning deliveries to `notFound()` through a typed, tested service-error classifier. Genuine database errors still reach the error boundary. This is a source-authored privacy/route safeguard; exact PostgreSQL and desktop/mobile browser acceptance remain open.

## 2026-10-15 Faculty Quiz choice-type transitions — PARTIAL
The quiz builder now normalizes changing an authored multiple-choice question to single choice: exactly one prior selected answer (or the first incomplete option) remains correct, without mutating stored state. A pure model and unit regression tests cover normalization and schema-valid output. Browser keyboard/mobile and PG command acceptance remain open; All Quizzes stays PARTIAL.

## 2026-10-15 Faculty Quiz metadata editor lifecycle lock — PARTIAL
Quiz title, instructions, due date, attempt limit, question add/remove and selection are disabled while loading/saving, and published/closed/archived quizzes render metadata read-only rather than offering unsaveable edits. A pure-model unit suite asserts draft-only editing. Lifecycle writes still validate persisted status and optimistic timestamps. Executed browser/PG evidence and legacy modal ergonomics remain outstanding.

## 2026-10-15 Faculty notification deep-link boundary — PARTIAL
Faculty inbox destinations are now normalized through a pure same-origin Faculty-path policy. External, protocol-relative, wrong-account and control-character links are suppressed; authorized items can still be marked read. Unit tests cover valid Course links and malicious/wrong-role cases. Existing persisted membership-scoped feed and same-origin write route are unchanged. Producer audit and real PG/browser acceptance remain open.

## 2026-10-15 Faculty inbox strict query parsing — PARTIAL
The existing 50-row persisted Faculty notification feed now rejects duplicate `view` values, unknown URL selectors, malformed unread filters and incomplete/forged cursor pairs with a recoverable newest-page link instead of silently widening scope. A pure Zod model and unit cases cover valid cursor and denial states. Real Faculty PG/browser verification and producer/deep-link parity remain open.
