**2026-10-16 file and video backend (PARTIAL, UI pending):** instructor video management is available server side: `POST /api/courses/lessons/{lessonId}/videos` (grant), `POST /api/courses/videos/{id}/complete`, `PATCH`/`DELETE /api/courses/videos/{id}` (title, duration, order, publish, learner visibility, lesson content link), replace via `replaceVideoId`, optional thumbnail, and `GET .../videos?deliveryId=` (drafts and in-flight uploads). Faculty must teach the delivery (`deliveryId` required); college admins may also manage offering-wide videos. Teaching faculty and admins can open submitted assignment files through `GET /api/courses/assignment-submissions/{id}/files` and `POST /api/courses/assignment-submission-files/{id}/download-grant`. Legacy limits kept (5 GiB legacy video cap lowered to 4900 MiB for single-PUT upload; formats mp4, m4v, webm, mov, avi). See `docs/architecture/file-and-video-apis.md`. No UI page changed; the Signed VIDEO playback and Assignment file upload matrix rows stay MISSING.

# Faculty — Detailed Page Parity Spec

Legacy navigation: Courses, Contacts, Notifications, Class Schedule, All Quizzes, All Assignments, Profile.

## Page: Courses list — DONE (2026-10-31)
- [x] Teaching assignments determine visible courses: the persisted active Faculty membership, current assigned delivery, period, college and role are authoritative; revoked/de-roled/disabled/foreign contexts cannot list their retired courses.
- [x] Course/class context is visible: course name/code, credits, offering kind, academic period and assigned Section names; all authorized periods are initially shown rather than silently selecting the first one.
- [x] Course cards/list metadata matches the approved legacy scope: authorized class-specific links, assignment/Section and academic summary, teaching role and content counts; progressive display no longer loses authorized cards after the old 100-card summary cap.
- [x] Loading/empty/error states are verified: loading route and hard-error boundary, explicit zero-assignment administrator guidance, search-no-match, invalid-filter fail-closed reset, and fresh in-place retry for a failed list request.
- [x] Navigation preserves correct class context: a single-class course opens its exact delivery, while a multi-class course requires an explicit Section link and never defaults generic Open/attendance to the first class.

**Independent executed acceptance — 2026-10-31:** [Faculty Courses list workflow 41126982586](https://github.com/42Students/lms-vnext/actions/runs/41126982586) at exact tested source SHA [`dd02d394acaa2e4ca80c8909eeb4328057755e60`](https://github.com/42Students/lms-vnext/commit/dd02d394acaa2e4ca80c8909eeb4328057755e60); **all three jobs SUCCESS**, `faculty-courses-list-acceptance/pg-browser` commit status **success**. Focused real PostgreSQL 17 Faculty assigned-delivery/revocation/role/tenant test **1/1 PASS** (25 unrelated tests intentionally excluded by the named target). Unit/model/SSR and 144-course progressive regression **11/11 PASS**. Authenticated desktop/mobile Chromium list, invalid filters, search, Section-specific navigation and responsive state **2/2 PASS**.

**Implementation evidence:** [progressive 100-card fix](https://github.com/42Students/lms-vnext/commit/f616aba9aebc28fe7e5739ad2f342d13aeb6584d), [all-period and multi-class navigation fix](https://github.com/42Students/lms-vnext/commit/838fc636bd63b4a13e617d31a83bb094431a98e0), [fresh failure retry](https://github.com/42Students/lms-vnext/commit/09d65a3ea681c6b7df69d5a72c454b7553045d35), and [registered page-family CI](https://github.com/42Students/lms-vnext/blob/main/.github/workflows/faculty-courses-list-acceptance.yml). This closes the **Courses-list UI implementation checklist**, not the distinct five-item Course detail bootstrap/class-chooser group, full Faculty release, or global CI.

## Page family: Course detail
**Legacy tabs:** Overview, Blueprint, Students, Attendance, Discussions.

### Course bootstrap / class chooser behavior — DONE (2026-10-31)
Legacy slug, numeric and class-hint links resolve only against persisted active Faculty teaching grants; ambiguous/unauthorized routes fail closed. Canonical URL is the selected Section delivery UUID.

- [x] Course identifier/canonical URL behavior is defined: active authorized slug/numeric crosswalk resolves unambiguously, with exact Section delivery canonical destinations.
- [x] Active teaching assignment is authoritative: persisted member Faculty role, college, Section, offering and grant dates are checked before course content loads.
- [x] Faculty with multiple class assignments can select/resolve correct class from **all five** tabs; each destination retains its own Section-scoped delivery ID.
- [x] Revoked/remapped assignment invalidates stale page state; focus/visibility/timed refresh revalidates server state, while temporary offline state does not falsely revoke a selected class.
- [x] Access error and retry states match: malformed/ambiguous/foreign routes fail closed, with explicit unauthorized/temporary-failure and back/retry UI.

**Independent executed acceptance — 2026-10-31:** [Faculty course chooser workflow 41128329270](https://github.com/42Students/lms-vnext/actions/runs/41128329270) on exact test SHA [`f073d134008ecb8354a72f9acb82ae4ea889fea0`](https://github.com/42Students/lms-vnext/commit/f073d134008ecb8354a72f9acb82ae4ea889fea0). All three jobs **SUCCESS**, commit status `faculty-course-chooser-acceptance/pg-browser` **success**: PostgreSQL authorized/foreign/revoked roles **1/1** (25 unrelated tests deliberately excluded), unit route/class-selector and safe link contracts **7/7**, authenticated desktop/mobile five-tab exact-delivery navigation and foreign denial **2/2**. The [initial failed browser run 41127996180](https://github.com/42Students/lms-vnext/actions/runs/41127996180) was repaired by awaiting the real Next navigation before parsing the URL; the rerun passed without weakening access checks.



### Overview — DONE (2026-10-14, scoped live acceptance)
- [x] Course/class/faculty summary shows persisted current teaching assignment and exact Section, never another class's draft content.
- [x] Teaching progress/quick actions include pending grading, at-risk learners, grade/performance signals, direct Section reports hub and Student roster actions.
- [x] Learner/content counts use persisted roster and workspace lessons/contents/assessments, published and marked/unmarked distinctions, unknown scores/attendance where missing.
- [x] Loading/empty/error states exist for workspace and reports; desktop/mobile browser exercised correct linked transitions and no page errors/overflow.

### Blueprint
**2026-10-31 scoped non-storage closure:** The final [Faculty Blueprint remaining non-storage acceptance 41149176048](https://github.com/42Students/lms-vnext/actions/runs/41149176048) **PASSED** at exact SHA `fd48936768c4b551c8f1da540bf36c6cf119871a`: registered journal, disposable PostgreSQL migration and Faculty authoring/IST scheduling, Blueprint units (including future Live Class Draft status), YouTube and Live Class create/edit/archive, and real Faculty→Learner publish-and-archive visibility. All actionable Blueprint and persisted Faculty Profile implementation rows in the current scoped closure are now checked. Operator-dependent private scanned object transfers and separate DB05 gated runtime ordering remain **OPEN/BLOCKED**, not production accepted. The global Faculty Account Implementation Green, final legacy parity, Design Green and release certification remain separate gates.

**2026-10-31 closure checkpoint:** Mixed shared/Section lesson-content ordering uses the full server-required set and fixes shared-slot positions ([source fix](https://github.com/42Students/lms-vnext/commit/4c5e2499b1f84f7cdf256de8b6c9c3aad8eb60da)). [Expanded Blueprint PostgreSQL/unit/browser acceptance 41143890971](https://github.com/42Students/lms-vnext/actions/runs/41143890971) **PASSED** at `e01663abb50cf81e741855572fb7f3db8752e0a0` (Assignment/Quiz and IST scheduling); [repeat 41144679412](https://github.com/42Students/lms-vnext/actions/runs/41144679412) **PASSED** at `f7090e36c93e447a96c978c525cf0fe7e386729b` with zero duplicate React-key warnings; and [Resource lifecycle 41145314458](https://github.com/42Students/lms-vnext/actions/runs/41145314458) **PASSED** at `8a00ad30c674c5a93ed18f9d7b9e71dbc3123d9a`. Checklist rows below now distinguish independently verified non-storage functions from pending external URL/learner-visibility browser gates and operator-dependent DB05/scanned private storage. No provider-gated behavior is called green.

- [x] **NOT APPLICABLE to Faculty:** shared syllabus lesson create/edit/delete is a college-admin operation, not an authorized Faculty Section mutation. Legacy `docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/AddLessonDrawer.jsx` explicitly says it is opened only by `AdminCourseSyllabus.jsx`; `src/modules/courses/lesson-service.ts` requires college-admin/superadmin to change shared lesson structure. Faculty can instead author items inside an assigned Section lesson. The disabled + Lesson/Rename affordances now explain this boundary.
- [x] **NOT APPLICABLE to Faculty for shared lessons:** syllabus lesson ordering/reordering is college-managed (legacy `src/pages/superadmin/sections/Lessons.js`). Faculty-specific **content** ordering remains governed by `DB05_CONTENT_ORDER_READY=DB05_VERIFIED` and does not grant shared lesson edit rights.
- [x] **Section Resource metadata (non-storage) create/edit/archive:** authenticated own-Section draft CREATE, persisted notes EDIT after fresh reload, confirmed non-destructive ARCHIVE and absence from current lesson; no other Section's secret content exposed. Verified full [Blueprint PostgreSQL/unit/browser run 41145314458](https://github.com/42Students/lms-vnext/actions/runs/41145314458), exact source SHA [`8a00ad30c674c5a93ed18f9d7b9e71dbc3123d9a`](https://github.com/42Students/lms-vnext/commit/8a00ad30c674c5a93ed18f9d7b9e71dbc3123d9a). No file provider is exercised.
- [x] **Section YouTube and Live Class non-storage lifecycle:** authenticated own-Section draft CREATE, persisted URL/notes EDIT, confirmed non-destructive ARCHIVE and absence after fresh readback, including foreign-Section content isolation. Future Live Class drafts remain **Draft**, with **Scheduled** only after publication. The independent PostgreSQL journal/replay, focused unit, Faculty authoring and scheduling, and YouTube/Live Class plus Faculty→Learner browser journeys **PASSED** in [run 41149176048](https://github.com/42Students/lms-vnext/actions/runs/41149176048) on exact SHA [`fd48936768c4b551c8f1da540bf36c6cf119871a`](https://github.com/42Students/lms-vnext/commit/fd48936768c4b551c8f1da540bf36c6cf119871a). No private video/file transfer is claimed.
- [ ] **BLOCKED — operator dependency:** private VIDEO, thumbnail, Resource FILE upload/replacement, malware scan verdict, short-lived signed preview and revocation need real authorized private object storage/scanner deployment and live provider tests. Neither source tests nor metadata-only browser checks count as provider acceptance.
- [x] Assignment create/edit/delete equivalent: own-Section draft CREATE, persisted DRAFT EDIT, aggregate filtering/report deep link, confirmed PUBLISH and non-destructive ARCHIVE, stale-version and foreign-delivery rejection. The legacy destructive delete is deliberately replaced with audited archive that preserves submitted work. Verified [expanded Faculty Blueprint PostgreSQL/unit/browser acceptance 41143890971](https://github.com/42Students/lms-vnext/actions/runs/41143890971) at source SHA [`e01663abb50cf81e741855572fb7f3db8752e0a0`](https://github.com/42Students/lms-vnext/commit/e01663abb50cf81e741855572fb7f3db8752e0a0).
- [x] Quiz create/edit/delete equivalent: own-Section choice-question CREATE, persisted draft question and metadata EDIT, aggregate filtering/report deep link, confirmed ARCHIVE and foreign-scope denial. Historical attempts/results are preserved rather than destructively deleted. Verified [expanded Faculty Blueprint PostgreSQL/unit/browser acceptance 41143890971](https://github.com/42Students/lms-vnext/actions/runs/41143890971) at source SHA [`e01663abb50cf81e741855572fb7f3db8752e0a0`](https://github.com/42Students/lms-vnext/commit/e01663abb50cf81e741855572fb7f3db8752e0a0).
- [x] **IST schedule controls (non-storage):** real Section schedule inputs, quarter-hour/time validation, linked class context and authorized scheduling persistence passed [expanded Blueprint PostgreSQL/unit/browser run 41143890971](https://github.com/42Students/lms-vnext/actions/runs/41143890971) at source SHA [`e01663abb50cf81e741855572fb7f3db8752e0a0`](https://github.com/42Students/lms-vnext/commit/e01663abb50cf81e741855572fb7f3db8752e0a0). Faculty cannot edit college-admin-owned shared lesson visibility.
- [x] **Published Section Resource learner visibility and archive:** an authenticated Faculty created and published a real own-Section Resource, a separate persisted enrolled Learner read returned that published content, and the same Learner reader no longer returned it after confirmed Faculty archive. Source-SHA PostgreSQL, focused Blueprint units and authenticated Chromium all **PASSED** in [dedicated Faculty→Learner visibility run 41147979334](https://github.com/42Students/lms-vnext/actions/runs/41147979334) at exact SHA [`21cf30bd684ad0a163251218773f4688d92989a3`](https://github.com/42Students/lms-vnext/commit/21cf30bd684ad0a163251218773f4688d92989a3). This does not enable college-admin-owned shared lesson visibility or the DB05 content-order gate.
- [ ] **BLOCKED — DB05 gate:** Section-owned lesson-content reorder runtime requires `DB05_CONTENT_ORDER_READY=DB05_VERIFIED` and operator-verified migration/gate before live acceptance; shared lesson structure/order remains college-admin-owned **N/A**.
- [x] Content validation and destructive confirmations: form validation blocks invalid targets, class ownership is server-enforced, archive/delete uses deliberate confirmation, write/readback and stale-response semantics retain truthful source status. Evidence: [Blueprint units and authenticated browser acceptance 41128467202](https://github.com/42Students/lms-vnext/actions/runs/41128467202) and `faculty-blueprint-write-recovery` / archive receipt tests; no unsafe shared-lesson mutation was enabled.
- [x] Empty and partial-content states: zero-lesson/empty sequence retains no invented content, mixed resource/assessment sequence has deterministic saved order, resource-only lessons are not falsely counted as completion, and class-scoped selected-lesson UI is exercised. Evidence: [21/21 focused Blueprint unit and original screenshot/browser acceptance 41128467202](https://github.com/42Students/lms-vnext/actions/runs/41128467202).
- [x] **Explicit deployment BLOCKER recorded (not falsely implemented):** file/video/thumbnail and private material transfers require a provisioned private object store, CORS, trusted object attestation and malware-scanner verdict. The UI uses the existing gated upload flow and does not claim an unscanned object is published; full live upload/download acceptance is **DEFERRED** until operator-provided storage/scanner integration is ready. This checkbox verifies blocker transparency, **not** live storage readiness.

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

## Page: Contacts — DONE (2026-10-31)
**Legacy:** `/teacher/contacts/[contactsTab]`  
Tabs: All Contacts, Teachers, Students.

- [x] All Contacts tab matches the approved public directory fields and role labels, same-college current memberships, server search and 10/20/50 pagination, public detail and browser/PG acceptance.
- [x] Teachers tab matches the approved public directory fields (name, active role and department; private email/phone/profile withheld), with exact same-college role detail.
- [x] Students tab matches approved public-only Learner directory (name, active Student role, department), same-college scope, search and role-checked detail, without exposing private learner contact details.
- [x] Search/filter/pagination behavior from ContactsGrid is matched in the approved public directory scope: server name/department filtering, literal wildcard search, 10/20/50 paging with stale-page clamping, cross-tab state, real browser Back/Forward and Clear; [exact-SHA Contacts acceptance 41123119280](https://github.com/42Students/lms-vnext/actions/runs/41123119280) passed.
- [x] Contact actions/deep links are matched within the approved public-directory privacy scope: role-specific list → membership detail → context-preserving Back link, plus denied foreign/invalid membership. Legacy Email/Contact values remain intentionally masked. Previously executed [Faculty Contacts acceptance 38608927968](https://github.com/42Students/lms-vnext/actions/runs/38608927968) passed 9/9 registered PG17 and 6/6 desktop/mobile Chromium cases at `8fba44b728c84f59e60c3aeb814930acada5cd38`; deep-link source and authorization contracts are unchanged by the 2026-10-31 retry/search adjustments.
- [x] Empty/loading/error states are verified: real zero results and invalid-filter recovery, dedicated loading/error boundaries, denial distinct from transient failure, nonblocking failure toast, fresh Retry request and no exception disclosure. The same exact-SHA acceptance passed six targeted SSR unit tests and eight desktop/mobile Chromium journeys.

  
**2026-10-31 Contacts bounded recovery pass (executed and accepted):** [d994290](https://github.com/42Students/lms-vnext/commit/d9942904f0b4ac15c432d6bbebcf1683771ead8c) restores URL-owned search after browser Back/Forward; [86b2913](https://github.com/42Students/lms-vnext/commit/86b2913a9967bec51b97f50040e02567a3582dfb) changes failed directory Retry from same-URL linking to an actual App Router refresh; [ecbcfce](https://github.com/42Students/lms-vnext/commit/ecbcfce38f072335025b2a345e0248780c1cf2e7) adds desktop/mobile tab-query and history-navigation assertions, with [0f23286](https://github.com/42Students/lms-vnext/commit/0f23286733e541e0ab74e9e79877d58ec55150ce) covering retained page size and invalid-filter recovery. The final search remount correction is [fc9330b](https://github.com/42Students/lms-vnext/commit/fc9330b1b6cdb9ecb8a5f1be189d7c52b71c2ffb); [37dbe2a](https://github.com/42Students/lms-vnext/commit/37dbe2a9af225af138939967f96908aa469e01f7) replaces synthetic History testing with actual Back/Forward tab navigation. The existing `faculty-contacts-acceptance.yml` push-triggered PostgreSQL/browser gate is the required new executable witness; its post-change result was not accessible through the available GitHub status APIs at this update. That final evidence is now recorded below. This earlier source-only warning is superseded by the exact-SHA executed run; no global Faculty/account release certification is inferred.

**Final 2026-10-31 acceptance gate:** [fc9330b](https://github.com/42Students/lms-vnext/commit/fc9330b1b6cdb9ecb8a5f1be189d7c52b71c2ffb) keys the live-search input to canonical route/search/size, [027dfb5](https://github.com/42Students/lms-vnext/commit/027dfb5c9baf01d7b331275a06561ab919748d58) restores the existing nonblocking error notification, and [04a99fa](https://github.com/42Students/lms-vnext/commit/04a99fab9c6aa8ccc1032536a941208bf585f4e5) adds six SSR unit cases (recovery, privacy, malformed filters, loading). The [77d09fb](https://github.com/42Students/lms-vnext/commit/77d09fbdc498d6a11a2b7599f1cacabb57fd5e2a) workflow runs those tests after three registered PG17 suites and separately runs responsive Chromium, then publishes a **SHA-specific** GitHub commit status under `faculty-contacts-acceptance/pg-browser` (success only if both test jobs pass). [8b62c9f](https://github.com/42Students/lms-vnext/commit/8b62c9fd4af8ba15d73f8dd12577458aaacf8b85) corrects the deliberately malformed-query fixture's TypeScript declaration. Confirm the outcome on the **last affected code/test revision** with the workflow artifact, not an older successful run; record the SHA and successful run URL before checking the final two boxes.

- [x] College scoping is enforced.


**Final independent execution (2026-10-31):** [Faculty Contacts acceptance workflow run 41123119280](https://github.com/42Students/lms-vnext/actions/runs/41123119280) on exact source SHA [`d539635694f3e2264493f6c43b15cb7c60530e26`](https://github.com/42Students/lms-vnext/commit/d539635694f3e2264493f6c43b15cb7c60530e26). All three jobs **SUCCESS**: PostgreSQL 17 **9/9** across All/Teachers/Students, recovery/strict-query UI unit **6/6**, Chromium desktop/mobile **8/8**. Commit status context `faculty-contacts-acceptance/pg-browser` = **success** for this SHA. The previous [failure 41122413600](https://github.com/42Students/lms-vnext/actions/runs/41122413600) was fixed without removing assertions: SSR escaped apostrophe and waiting for tab navigation to complete before clearing the search. All seven Contacts page checklist requirements are now checked. This is **Contacts Implementation Green only**; other Faculty account, full CI, formal Design Green and RELEASE gates stay separate.

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

- [x] Aggregate quiz list, exact active teaching Section, Course/status/title filters and source-owned 20-row pagination are implemented.
- [x] Registered single/multiple-choice quiz CREATE (private draft), answer correctness, point validation and Section lesson selection; browser and PostgreSQL acceptance executed.
- [x] DRAFT quiz question/options and metadata EDIT, plus metadata-only title/description/deadline EDIT after publication or closing, with optimistic version and immutable question history; attempts prohibit changing answer bank or allowed attempt count.
- [x] Confirmed PUBLISH, CLOSE, no-attempt ARCHIVE, stale/foreign denial and transaction audit are exercised in PostgreSQL and the browser.
- [x] Review attempts drawer, no-attempt state, closed-Quiz result publication, report deep link and persisted results view pass real browser tests.
- [x] Due/attempt limits, result publication controls, and 390px mobile quiz builder layout are exercised on actual Chromium.
- [x] Registered migration `0098_academics_legacy_fidelity_columns.sql` persists default-false/NOT NULL `shuffle_questions` and `shuffle_options`; Faculty authoring, reload, and authorized learner-specific deterministic question/option order preserve authored IDs and never expose learner answer keys. After fixing stale flags on re-open, [focused acceptance run 41116305454](https://github.com/42Students/lms-vnext/actions/runs/41116305454) **passed 1/1 registered PostgreSQL 17 shuffle checks, 8/8 Faculty integration checks, and 4/4 desktop/mobile Chromium checks** on revision `66ab4be3cf61c85531cb6cce719cf2d962115fba`.
- [x] Empty/no-submission state, failed authorized question-bank GET (503), guarded save while read state is unknown, successful retry, and real submitted learner attempt appearing in the Faculty review drawer passed the dedicated desktop/mobile Chromium tests. The learner write includes the enforced same-origin Origin check, and attempted-quiz archival is rejected by the domain service. The previous lifecycle suite also exercises save/edit/publish/close/result-release and mobile.

**Quiz-focused completion evidence (2026-10-30):** [run 41116305454](https://github.com/42Students/lms-vnext/actions/runs/41116305454) at `66ab4be3cf61c85531cb6cce719cf2d962115fba` passed **both jobs**: **1/1 registered PG17 shuffle test, 8/8 transactional Faculty integration tests, 4/4 desktop/mobile Chromium tests** (including cross-role learner read, submitted attempt, actual Faculty review, retry after 503, and deny-after-attempt). Earlier [run 38634315601](https://github.com/42Students/lms-vnext/actions/runs/38634315601) passed 8/8 PG and 2/2 browser lifecycle cases. The first two closure-run failures exposed (1) lost persisted shuffle flags on re-open, now fixed in the Faculty editor and server listing, and (2) an E2E-only missing Origin/unstable client redirect, fixed in the test without weakening the CSRF guard. **All Quizzes' eight implementation checklist requirements are now checked. This is a focused-functional acceptance, NOT a formal current-main account Implementation Green, full-suite CI, Design Green, or RELEASE certificate.**

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
- [x] Score distribution uses the legacy 90/80/70/60/below-60 five-bucket model; source and boundary-vector parity checked, current browser reacceptance open.
- [x] Current authorized Section roster determines not-submitted learners; a failed roster read shows unknown rather than invented zero, source-verified.
- [x] Submission preview and grading drill-in link to authorized Section submission/review and grading workspaces; current browser reacceptance open.
- [x] Empty/no-grades, invalid-link, loading skeleton, hard-error retry and partial-roster warning states are implemented; current browser reacceptance open.
- [x] Report resolves exact assigned Section through authoritative Faculty aggregate and reused authorized submission reader; wrong-tenant DB tests OPEN.


**2026-10-30 closure-first source reconciliation — SOURCE-IMPLEMENTED, NOT IMPLEMENTATION GREEN:** The four previously unchecked implementation rows above are now source-verified, not newly built. Legacy oracle `42Students/lms2-fe@lms-dev-2026`, `src/components/Report/AssignmentReportContent.jsx` (blob `447876e8072a3cb1073567ed12284b91fd495091`), `src/utils/scoreDistribution.js` (blob `49088cf13dd5210c3682bf8586e3df01cc9fd970`). vNext `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx` (blob `2e8953f829dc9b057872f6f25d8f624baeb3d2e7`), `loading.tsx` (`10ac3b8c511d6182fdd200d9ff543453f586a601`), `error.tsx` (`0562e40edba69e4528a6b17954891bdf3580c0fc`), `src/components/courses/faculty-prototype-assignment-report.tsx` (`55b27f9bed433e150e55a5bd0b69289c51fe9b40`), `src/modules/courses/faculty-assessment-report-service.ts` (`1ff5b82923bb2bae84c38ddb6c080b5043d8f3aa`) and the existing `/grade` and `/submissions` routes show source-level coverage. An isolated execution compared old and new score bucket functions for five datasets (including 0, 59.5, 69.5, 89.5, empty and 201 half-point boundary values): **5/5 equal** under the legacy report's percentage rounding. Additional desktop/mobile assertions were authored in `tests/e2e/faculty-assignment-report.spec.ts` at commit `f41480a398d4c09904ded1c49851cfb2d5eb17c1`; the automatic focused [Faculty Assignment Report acceptance run 41106574850](https://github.com/42Students/lms-vnext/actions/runs/41106574850) subsequently **PASSED** at that exact commit: **2/2 desktop/mobile Chromium**, and **8/8 disposable PostgreSQL faculty Section authoring/integration tests**. The browser tests include an invalid report ID, empty grading view, ungraded distribution, CSV download and a foreign-delivery CSV denial. This is a scoped passing run, **not** the full CI/browser suite or evidence that graded and late-submission positive cases, interrupted loading/retry, runtime unknown-roster cases or all role/tenant negatives have been accepted. The browser job logs also contain two separate HTTP 500 `Network request failed` application events of unresolved attribution despite its test cases passing; these warrant inspection before page-level green. The checklist `- [x]` rows refer to source-implemented requirements. **Implementation Green remains OPEN**, and the acceptance receipt below records only the scope actually tested.

<!-- page-closure
{
  "id": "faculty:assignment-report",
  "implementation": {
    "status": "open",
    "legacyFeSha": "08db1a76d9ed390bf7ce8706e5b9bb6ea18b815a",
    "legacyBeSha": "94ea965c01f89e688851ead087bee81d4dc3173b",
    "vnextSha": "f41480a398d4c09904ded1c49851cfb2d5eb17c1",
    "inventoryComplete": false,
    "surfaces": [
      "faculty-assignment-summary",
      "five-band-score-distribution",
      "missing-learner-rows",
      "grading-drill-in",
      "partial-roster-state",
      "loading-and-error"
    ],
    "actions": [
      "section-scoped-report-open",
      "csv-download",
      "open-grade-view",
      "invalid-id-return"
    ],
    "states": [
      "draft-with-no-grades",
      "empty-submission-review",
      "invalid-report-id",
      "cross-tenant-csv-denial",
      "desktop",
      "mobile"
    ],
    "evidence": [
      {
        "kind": "browser-desktop",
        "sha": "f41480a398d4c09904ded1c49851cfb2d5eb17c1",
        "result": "passed",
        "url": "https://github.com/42Students/lms-vnext/actions/runs/41106574850"
      },
      {
        "kind": "browser-mobile",
        "sha": "f41480a398d4c09904ded1c49851cfb2d5eb17c1",
        "result": "passed",
        "url": "https://github.com/42Students/lms-vnext/actions/runs/41106574850"
      },
      {
        "kind": "faculty-authoring-postgres",
        "sha": "f41480a398d4c09904ded1c49851cfb2d5eb17c1",
        "result": "passed",
        "url": "https://github.com/42Students/lms-vnext/actions/runs/41106574850"
      }
    ],
    "outstanding": [
      "Real graded and late-submission positive browser journeys and score-bucket verification with persisted grades",
      "Current-Section missing learner and roster-unavailable runtime journeys",
      "Full report authorization/tenant-negative, retry/error and security coverage at a known current SHA",
      "Attribution/remediation or explicit permitted disposition for HTTP 500 server log events in browser acceptance",
      "Independent full CI/browser gates and required release/source freeze"
    ]
  }
}
-->

## Page: Quiz Report — DONE (2026-10-14)

**Legacy:** `/teacher/report/quiz/[quizId]`

- [x] Authorized current-Section quiz summary, attempted/missing learners, latest attempt and normalized scores.
- [x] Score distribution, question-level answered/correct/accuracy from persisted answers and attempts (missing remains unknown).
- [x] Per-learner attempt drill-in, results published/private badges and response filters.
- [x] Printable PDF, capped 500-row formula-neutralized CSV downloads for learner responses and aggregate question accuracy; no private contacts.
- [x] Honest empty, loading and error states; desktop/mobile responsive navigation.
- [x] Strict current active teaching-Section scope; foreign/forged delivery and wrong role rejected.

**Independent evidence:** [Faculty Quiz Report workflow 38618101294](https://github.com/42Students/lms-vnext/actions/runs/38618101294) on commit `1d8d4a9e8bec8571e714bf66efd41af7ba67b8fc`: **7/7 PostgreSQL**, **14/14 unit**, **2/2 authenticated desktop/mobile Chromium**, including real quiz creation, question/filtered learner CSV downloads, foreign delivery denial and no mobile overflow. Both independent jobs passed. Does not imply completion of quiz authoring, private learner PII access or the entire LMS CI.
## Page: Notifications — DONE (2026-10-31)
- [x] Faculty announcements/personal notifications match the approved legacy feed: persisted same-college personal activity and college/department/faculty announcements in one newest-first, source-disambiguated view; five legacy category tabs, read-state-free announcements, and independently paginated older notices.
- [x] Read/unread/deep-link behavior is verified: personal unread/all, self-owned mark-read and mark-all, no bulk acknowledgment from announcement-only tabs, strict Faculty-safe internal destinations, and desktop/mobile category navigation.
- [x] Empty/loading/error/stale states are verified: route skeleton/error boundary, disabled-announcement and partial-service warnings, retry with a fresh source read, malformed-cursor fail-closed recovery, and truthful exhausted-page treatment.
- [x] College and role scoping is enforced: active Faculty membership before feed access, server-side announcement audience/tenant filters, recipient/college-scoped read mutations, and tested exclusion of foreign, expired and scheduled notices.

**Independent executed acceptance — 2026-10-31:** [Faculty Notifications workflow 41125418573](https://github.com/42Students/lms-vnext/actions/runs/41125418573) on exact source [`181797b2b77d22542ac16d483153ee9210b0b122`](https://github.com/42Students/lms-vnext/commit/181797b2b77d22542ac16d483153ee9210b0b122). All three jobs **SUCCESS**. Disposable PostgreSQL 17 **2/2 PASS** (cross-college recipient read/acknowledgment and 101+ announcement keyset/audience/expiry/schedule acceptance), focused unit/link/access/query/UI **18/18 PASS**, authenticated Chromium desktop/mobile **2/2 PASS** with real personal and college announcement records. Commit status `faculty-notifications-acceptance/pg-browser` = **success**. The earlier [failed run 41125035746](https://github.com/42Students/lms-vnext/actions/runs/41125035746) was fixed by rendering the empty-state action in the focused SSR test mock; no behavioral assertion or access constraint was removed.

**Implementation boundary:** Announcement reads require the registered DB10 schema and deliberate `DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED` enablement after migration; the browser acceptance exercised that enabled path. Notifications Implementation Green is scoped to this page family, **not** whole-Faculty current-main global CI, Design Green or RELEASE.

## Page: Faculty Profile

**Executed exact-SHA closure evidence (2026-10-31):** [run 41131298991](https://github.com/42Students/lms-vnext/actions/runs/41131298991) on [`a567b3d5723b95ea9e8c3ea0aefbd9d4e7ba6919`](https://github.com/42Students/lms-vnext/commit/a567b3d5723b95ea9e8c3ea0aefbd9d4e7ba6919) completed **SUCCESS**, with `faculty-profile-closure-acceptance/pg-browser` exact-commit status **success**. The dedicated gate executes real PostgreSQL migration and Faculty self-document scope tests, profile page/completeness/social/privacy unit tests, and authenticated desktop/mobile profile browser journeys. The 13 persisted section/completeness rows below are closed against that gate; photo, Aadhaar/PAN private-object transfers and full loading/visibility lifecycle remain OPEN pending separate live evidence. This does not certify object-store/scanner readiness or full account release.

**2026-10-31 closure-first implementation pass (final browser gate pending):** The 13 editable profile sections have a shared persisted completeness model; successful versioned section saves refresh the server header, and the self-profile identity header survives a failed optional private-document source without pretending empty data. Contacts, social links, address, personal details, experience, education, skills, certifications, languages, publications, awards and metadata have dedicated persisted self-edit/CRUD checks, including legacy coding-link preservation. The full-identity reader now respects the explicitly selected Faculty role even when the persisted membership also contains Mentor/Admin, while the request-context role gate, persisted Faculty membership, owner, and tenant checks remain enforced. [Focused PostgreSQL/unit/browser workflow](https://github.com/42Students/lms-vnext/actions/workflows/faculty-profile-closure-acceptance.yml) includes a disposable Faculty-only editing actor and a separate selected-Faculty/multi-role negative browser check. Check each source verification below only after the **new** exact-SHA run reports success.

**Still externally BLOCKED (not implementation-green):** real profile photo/import and private identity evidence upload, scan verdict, preview/revocation and signed retrieval require an approved private object provider, malware scanner and operator-managed storage environment. Retain the photo and Aadhaar/PAN rows OPEN until those live flows are exercised using authorized test identities; neither source-only checks nor disposable database receipt tests prove the provider is live. The unrelated Faculty resume remains correctly N/A. The official visual acceptance/release gates stay separate.


**Closure implementation and acceptance evidence in progress:** `/teacher/profile` now has Faculty-only
membership-scoped reads, basic identity/teaching details, Faculty navigation and
loading/error/retry states. It deliberately does **not** let Faculty edit
college-owned academic title, employment type or department assignments.
The rich About, personal/contact/social/address, repeatable professional sections and
versioned private-document CAS are implemented and covered by PostgreSQL integration.
The strict [Profile acceptance workflow](https://github.com/42Students/lms-vnext/actions/workflows/faculty-profile-closure-acceptance.yml) tests full editor role/scope, browser saves/reloads (About, Contacts, Address, Social, Experience), stale denial and private-field safety on a disposable Faculty-only identity. Profile photo/Aadhaar/PAN and private attachment transfer success still require real authorized storage/scanner readiness. **Do not mark the remaining checklist rows green until matching tests pass; provider-dependent release acceptance stays separate.**

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

- [ ] **BLOCKED — provider-dependent:** user summary/profile image edit and live private photo upload/scan/preview/revocation require provisioned, authorized private object storage and malware-scanner evidence.
- [x] Profile completeness refresh matches.
- [x] Resume upload/import/remove is **Learner-only**, not a Faculty UI requirement. Legacy `src/components/profile/about.js` wraps its Resume card in `!isFacultyProfileSchema`; vNext correctly does not expose learner resume editing. Classified **NOT APPLICABLE**, not a newly implemented upload.
- [x] Contacts edit.
- [x] Social edit.
- [x] Address edit.
- [x] Personal details edit.
- [ ] **BLOCKED — provider-dependent:** identity evidence edit plus Aadhaar/PAN private upload, scan, preview and signed retrieval require real authorized storage/scanner acceptance. No mock provider is release evidence.
- [x] Experience add/edit/delete.
- [x] Education add/edit/delete.
- [x] Skills add/edit/delete/proficiency.
- [x] Certifications add/edit/delete.
- [x] Languages add/edit/delete.
- [x] Publications add/edit/delete.
- [x] Awards add/edit/delete.
- [x] Metadata edit.
- [x] Partial endpoint failures do not blank unrelated sections: a failed private-document read retains the authenticated Faculty identity and teaching surface, disables unverified editing, and exposes a fresh retry without leaking backend text. The focused SSR failure/ready-state tests passed in [run 41130479588](https://github.com/42Students/lms-vnext/actions/runs/41130479588); the run's separate browser job did not pass.
- [x] Loading/hard-error/retry/visibility-refresh behavior: profile route loading and non-leaking hard-error Retry are unit-tested, failed optional-source SSR retains verified identity, and authenticated desktop/mobile browser confirms Refresh and visibility return retain persisted edits without page exceptions. Evidence: [dedicated Faculty Profile PostgreSQL + unit + browser run 41144015762](https://github.com/42Students/lms-vnext/actions/runs/41144015762) **SUCCESS** on exact source SHA [`018ebb998733c6c155c607dc3aaf46d65ec8b3c3`](https://github.com/42Students/lms-vnext/commit/018ebb998733c6c155c607dc3aaf46d65ec8b3c3).
- [x] Learner/Admin/Mentor/TPO role misroutes are safely redirected/fenced: targeted role and suspended-membership negative SSR tests passed in [run 41130479588](https://github.com/42Students/lms-vnext/actions/runs/41130479588), without calling Faculty profile storage. Whole-run/browser acceptance remains open.

## Retired route: File Explorer
Legacy `/teacher/fileExplorer` only redirects to Courses.

- [x] Classified RETIRED in master matrix; do not recreate as a product page.

**2026-10-30 current-source check:** Legacy `src/pages/teacher/fileExplorer.js` (blob `058d5184eb33a1a6e3d2baceef0a0c5b26dc08b3`) redirects to `/teacher/courses`. vNext `src/app/(authenticated)/teacher/fileExplorer/page.tsx` (blob `2d2cdc6e8bef7005a7619179529010195d36081d`) does the same without creating an unrelated file-manager screen. Desktop and mobile authenticated redirect/responsive assertions were added to `tests/e2e/faculty-courses.spec.ts` in commit `c7fd8d1437e87b24f9e99716ba4b4fd1517f024d`. **Browser acceptance was not executed on the present revision, and this source-level classification is not an Implementation Green receipt.**

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

## Faculty Course Attendance — DONE (2026-10-14)

Registered Section attendance uses current Faculty teaching assignment and exact active roster, marking by Schedule Event under `/teacher/courses/[deliveryId]/attendanceDetail`. The server enforces a persisted attendance policy window, optimistic millisecond marking token, meaningful correction reason, changed status requirement, foreign/wrong-role denial, and audited counts. The UI restores saved absences on session selection, explicitly distinguishes unmarked/upcoming from absent, offers a monthly class-health summary and per-learner detail overlay, and uses Asia/Kolkata time labels.

**Executed proof:** [Faculty Course Attendance acceptance run 38623132225](https://github.com/42Students/lms-vnext/actions/runs/38623132225) at source commit `51ae3b8ea492baed125f80b222374660c914cd02` passed **6/6 PostgreSQL tests** in `faculty-c4-reports-audit-contact.test.ts` (including positive first mark, reasoned correction, stale/unchanged version/foreign/role denial and persisted append-only activity history), **20/20 unit tests** across attendance edit-state/grid/learner detail, and **2/2 desktop/mobile Chromium tests** in `faculty-course-attendance.spec.ts` (persisted create → mark → correction, recorded monthly percentage, student detail drawer and foreign-scope denial). Both independent jobs were successful. The test fixture fixes use a genuinely short invalid correction reason and the registered `activity_events.occurred_at` field. This is an Attendance surface closure, not a claim of global CI green, off-policy admin override or file-backed functionality.

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

## 2026-10-15 Faculty Quiz attempt report private 404 — PARTIAL
Malformed Quiz path IDs now use `notFound()` rather than a generic report error, and missing/foreign/mismatched Quiz or teaching-Section service errors become a non-leaking 404. Invalid pagination and delivery queries retain a recoverable inline error; genuine database errors propagate. New typed pure-model tests cover the error boundary. Exact PostgreSQL positive/foreign/role and mobile browser acceptance remain open; All Quizzes is still PARTIAL.

## 2026-10-15 Faculty gradebook CSV privacy correction — PARTIAL
The existing Section gradebook CSV no longer outputs learner email or uses email as a missing-name fallback. Name, roll number and published score cells remain formula-neutralized. Pure export regression assertions cover the omitted private-contact column; exact current teaching-Section authorization remains upstream. Source-authored only, with DB and browser export acceptance pending.

## 2026-10-15 Faculty gradebook CSV bounded export — PARTIAL
Server-owned gradebook CSV now caps export at 500 learner rows, appending a formula-neutralized row identifying the omitted count (not silently implying completeness); private learner email remains excluded. Pure tests cover 522-member bounds and contact redaction. PG scale fixture and browser download acceptance remain open; no DONE promotion.

## 2026-10-15 Faculty published Quiz metadata editor parity — PARTIAL
The Quiz builder now exposes confirmed, optimistic EDIT of title/instructions/IST deadline for PUBLISHED and CLOSED Section quizzes while keeping the question bank and attempt limit locked. The UI omits sealed questions in metadata-only writes; ARCHIVED remains immutable. Pure tests cover lifecycle and Zod commands. PG positive/denial and mobile browser verification remain pending.

## 2026-10-15 Faculty Section Reports strict URL selectors — PARTIAL
The Section reports hub rejects duplicate or unknown query parameters instead of selecting the first value and silently widening a filter. Typed Zod query parsing preserves legitimate assessment-type and bounded page selectors; existing per-Section scope remains authoritative. Unit tests authored; PG and mobile browser acceptance not executed.

## 2026-10-15 Faculty Discussion history strict URL selectors — PARTIAL
The same-Section moderation history viewer now rejects duplicate actions/pages, forged scope IDs and invalid page strings rather than selecting one value. Existing audited event, pagination and role-scope readers are unchanged; pure parsing tests authored. Browser/PG acceptance remains open.

## 2026-10-15 Faculty individual Gradebook private 404 — PARTIAL
Learner gradebook drill-ins validate both UUID path IDs and map unassigned Section or absent learner membership to `notFound()` without leaking learner presence. Unexpected service errors still reach the boundary; pure classifier tests authored. PostgreSQL foreign/role and browser verification remain pending.

## 2026-10-15 Faculty Assignment report private route boundary — PARTIAL
The Assignment report now rejects malformed, duplicate or forged exact-Section parameters, validates the assessment path UUID, and maps unavailable/foreign-Section records to a non-leaking 404. Database faults still propagate; pure tests cover both parsed and denied selectors. Existing DONE report workflow untouched, new guard remains PARTIAL pending executed PG/browser acceptance.

## 2026-10-15 Faculty Quiz report private route boundary — PARTIAL
The Quiz summary/report now validates the path-owned Quiz UUID and entire Section query, refusing duplicate or extra user-provided scope selectors; unassigned, missing or wrong-Section Quiz reports respond with a private 404 instead of leaking identity. Does not alter published-score visibility; pure tests authored. Actual PG/browser validation remains outstanding.

## 2026-10-15 Faculty Quiz single-choice correct-answer fence — PARTIAL
The Quiz choice editor prevents unchecking the sole correct option for single-choice questions while letting Faculty switch the correct answer atomically. Multi-choice editing remains flexible pending the existing Zod save-time rule. Pure single/multiple interaction tests authored; no DB/browser acceptance claimed.

## 2026-10-15 Faculty Quiz option deletion answer consistency — PARTIAL
Removing a correct option from a single-choice quiz draft now transfers correctness to the first remaining option rather than leaving an impossible unanswered selection. Two-option minimum and unchanged source state are preserved; multi-choice options keep their remaining correctness. Pure model and regression test authored. Executed PG/browser acceptance remains open.

## 2026-10-15 Faculty Quiz metadata no-op audit fence — PARTIAL
A locked, version-checked Faculty Quiz metadata-only EDIT now returns a typed 409 for semantically unchanged values instead of bumping the version or writing a misleading immutable activity event. Comparing due dates uses the same instant across IST/UTC inputs; the client shows a helpful no-change error. Typed pure tests authored; real PG stale-token/audit count and mobile/browser validation remain open.

## 2026-10-15 R4 published Quiz question-bank denial fixture — PARTIAL
The integration fixture now asserts that replacing the question bank after publication is forbidden, while metadata-only edits remain legal. Existing stale-token, learner-role and wrong-Section expectations remain. Awaiting executed PostgreSQL verification.

## 2026-10-15 R4 teaching-list fixture role alignment — PARTIAL
The integration fixture now filters by its actual CO_TEACHER assignment, verifies another user's PRIMARY assignment is not returned, and retains the persisted revocation and foreign-college checks. Awaiting executed PostgreSQL verification.

## 2026-10-15 R4 persisted Faculty user-status teaching-list fence — PARTIAL
The Faculty Courses list now joins the persisted `users` row and requires `platform_status=ACTIVE` even if a cached RequestContext still claims ACTIVE. The PostgreSQL fixture disables the actual Faculty user and checks an empty delivery list after reactivating a teaching assignment. No other role reads are changed. PG execution pending.

## 2026-10-15 R4 Faculty persisted-role revocation test — PARTIAL
The PostgreSQL acceptance fixture now removes a real persisted FACULTY membership-role row while retaining the stale caller role, asserts the Course list is empty, then restores the role and checks that the authorized Section returns. This verifies the existing SQL join rather than trusting cached role claims. Execution pending.

## 2026-10-15 R4 transactional persisted Faculty Quiz actor fence — PARTIAL
The Section Quiz authoring transaction now checks persisted ACTIVE user, ACTIVE exact-college membership, FACULTY role and live teaching assignment before any CREATE/EDIT/PUBLISH/ARCHIVE write or audit. It no longer relies exclusively on a cached active role plus assignment alone. A PostgreSQL fixture revokes the actual membership-role row and expects a teaching-scope denial. Execution pending.

## 2026-10-15 R4 Quiz multiple-choice answer interaction fence — PARTIAL
The Faculty Quiz question editor now refuses a toggle that would leave multi-choice with zero correct answers or with every option correct. Normal changes to multiple correct options remain allowed, and the existing strict save schema still validates the final question. Pure regression tests cover both two-option boundaries and a valid three-option transition. Browser/PG run pending.

## 2026-10-15 R4 Quiz multiple-choice deletion consistency — PARTIAL
Removing a multi-choice option now preserves the server's requirement for at least one correct and at least one incorrect remaining option. If Faculty removes the sole selected or sole unselected option, the editor repairs the two-option draft deterministically without mutating its original data. New pure regression cases authored; browser confirmation pending.

## 2026-10-15 R4 published Faculty Quiz attempt-limit contract — PARTIAL
Faculty Quiz authoring now forbids changing a published, closed or archived Quiz's maximum attempt count even before the first learner attempt. This matches the locked Faculty editor and preserves the announced learner attempt policy; DRAFT changes remain allowed. A pure status matrix and a PostgreSQL published-Quiz denial were authored. Live PG/browser acceptance pending.

## 2026-10-15 Round 5 Faculty Contacts strict selectors — PARTIAL
Faculty Contacts now refuses duplicate, malformed, unknown or forged directory query selectors rather than silently truncating search terms or resetting page and size. A recoverable in-tab filter error preserves role/tab scope; tests cover valid defaults and rejected selectors. Executed browser/PG acceptance pending.

## 2026-10-15 Round 5 private Faculty Contact drill-in — PARTIAL
Faculty directory details now validate their route IDs and produce the same non-leaking 404 for missing, foreign or tab-incompatible memberships. Unrelated database failures still reach the error boundary; pure classifier tests authored. Registered service scoping is unchanged. PG and browser acceptance pending.

## 2026-10-15 Round 5 Faculty Course default-route ID guard — PARTIAL
The `/teacher/courses/[deliveryId]` landing route validates the Section UUID before canonicalizing to Overview, preventing malformed/legacy arbitrary segments from becoming misleading instructor links. Tests cover valid and invalid IDs. Persisted teaching-scope authorization remains enforced on the destination; browser acceptance pending.

## 2026-10-15 Round 5 Faculty Quiz metadata reconfirmation — PARTIAL
Editing Quiz title, instructions, IST deadline, max attempts or a new draft's lesson selector now invalidates the previous confirmation. The server continues requiring explicit confirmed writes. Pure confirmation-state regression tests added; browser keyboard/mobile acceptance pending.

## 2026-10-15 Round 5 Faculty Quiz question structure — PARTIAL
Quiz add/remove-question actions now invalidate earlier confirmation and enforce at least one and at most 100 questions, using pure immutable helpers. Unit test authored; PG and browser verification remain pending.

## 2026-10-15 Round 5 Quiz unavailable question-bank write fence — PARTIAL
If the selected draft's persisted question bank fails to load, Faculty cannot EDIT or PUBLISH it until an explicit fresh load succeeds; the server's own scope and version checks remain authoritative. Published metadata-only edits remain possible. Pure action matrix tests authored; browser retry acceptance pending.

## 2026-10-15 Round 5 Faculty Courses concurrent-revocation recovery — PARTIAL
After the initial persisted Faculty Course list is resolved, a single concurrently revoked/ended Section no longer crashes all Course cards when its workspace is read. Only typed missing/unassigned delivery errors are omitted; genuine database failures still surface. Pure error-boundary tests added. Pagination can require refresh during concurrent revocation; PG/browser acceptance pending.

## 2026-10-15 Round 5 Faculty Quiz metadata preflight — PARTIAL
Quiz CREATE and EDIT now validate title, instructions, bounded integer attempt count and exact IST due-date calendar values before the destructive confirmation/API call; invalid values show field-specific guidance instead of generic write failure. Server-side Zod and persisted authorization remain mandatory. Unit cases authored; mobile and PG acceptance pending.

## 2026-10-15 Round 5 Contacts Zod 4 default typing repair — PARTIAL
Contacts selector defaults now use input-side Zod prefault values before numeric transforms, so the parser still returns numeric page/size without a mismatched output-default type. Unit/default and browser verification pending.

## 2026-10-15 R6 Faculty Course page strict decimal selectors — PARTIAL
The Course list now accepts only bounded positive integer page selectors (or ordinary URL decimal strings), rejecting duplicate array values, booleans, exponent notation and leading-zero aliases that Zod number coercion would silently admit. Existing validated query links are unchanged. Unit regressions authored; executed page/PG acceptance pending.

## 2026-10-15 R6 Faculty Course invalid-filter recovery — PARTIAL
Unknown/duplicated/malformed Course filters now show an explicit reset action rather than allowing a generic Zod exception or silently loading a widened Section list. Only the pure query parser is used for recovery; valid requests still traverse the same persisted Faculty teaching reader. Unit tests authored; browser verification open.

## 2026-10-15 R6 Faculty Quiz write-denial messages — PARTIAL
A pure model now translates typed stale-version, attempt, lifecycle, deadline and no-op failures into actionable feedback while deliberately giving the same message for missing and foreign teaching scope. Unit tests authored; UI integration and browser acceptance remain pending.

## 2026-10-15 R6 Faculty Quiz write-error UI integration — PARTIAL
The confirmed Quiz editor now uses the typed, non-leaking denial-message model at the actual POST response handler. A stale version prompts reload, while immutable/expired/no-change states display distinct guidance without exposing server errors. Unit coverage for the model is included; browser execution still pending.

## 2026-10-15 R6 Faculty Quiz failed-load retry — PARTIAL
When a selected Quiz's question-bank fetch fails, the Faculty editor now exposes an explicit retry that reloads only that Quiz within its original delivery-scoped API, and disables retry while loading. Failed drafts remain non-editable/non-publishable until their bank is retrieved. Pure retry-state tests authored; real browser/network failure acceptance remains pending.

## 2026-10-15 R6 Faculty Quiz unsaved-draft publish fence — PARTIAL
The editor now marks metadata and question edits as unsaved and refuses PUBLISH until the current draft has been saved. This prevents a confirm/publish request from silently publishing an older stored question bank while unsaved changes remain on screen. A clean loaded DRAFT is still publishable; pure tests cover dirty/failed/immutable states. PostgreSQL and browser acceptance pending.

## 2026-10-15 R6 Faculty Quiz persisted version reconciliation — PARTIAL
The Quiz editor now consumes the authoritative `{quiz}` response after successful CREATE/EDIT/PUBLISH/CLOSE/ARCHIVE, preserves the exact persisted `updatedAt`, status and generated ID, and overrides stale server-rendered dropdown records. It does not invent next versions or permit a second write using the pre-save optimistic token. Pure parsing/reconciliation tests authored; authenticated multi-action browser and PG acceptance pending.

## 2026-10-15 R6 Faculty Contacts detail return context — PARTIAL
Public Contact cards now preserve only validated directory search, page and page-size selectors in their details link, and the Back to Contacts action restores the same filtered directory. Duplicate, foreign or malformed query fields are discarded instead of being propagated. No private contact fields or role claims are included in URLs. Pure URL tests authored; browser acceptance pending.


## 2026-10-15 Faculty scoped follow-up — PARTIAL, not accepted

- **Lesson visibility:** staged pure reader policy and administrator-only command input under `src/modules/courses/faculty-lesson-visibility-model.ts`; column `lesson_contents.visible_to_students` is registered as migration `drizzle/0061_faculty_lesson_visibility.sql`. No routes or production reads are wired, and no learner/faculty browser acceptance exists. Leave Blueprint scheduling/visibility unchecked.
- **Persisted Faculty scope:** the shared delivery-access reader now checks live user status, college membership and persisted FACULTY role before authorizing a teaching assignment. A disposable PostgreSQL revocation/suspension test was authored, but not run; it must pass before claims of complete revocation coverage.
- **Report accuracy and bounds:** source-only fractional percentage bucketing, average calculation, CSV row cap and report page-size guards have targeted unit tests authored. No UI/mobile or full export acceptance claimed.
- **Quiz and Contacts:** tightened draft title length, unknown-status draft failure guard, and contact detail selectors with targeted unit tests. Still not full authoring/Contacts page parity.
- **Unverified:** no local test, typecheck, database migration or browser gate was executed in this tool environment. All existing unchecked Faculty page criteria remain OPEN; no DONE changes.

## 2026-10-15 Faculty follow-up round — PARTIAL (source only, orchestrator gates pending)

Faculty lane branch `chatgpt/chat-4` merged latest `main` at `1ddd538312f8dface515268d475a5ef396a914ad` before these commits.

- **Student-visible lesson content (PARTIAL):** learner list readers now consult the proposed `visible_to_students` column when present, with a PostgreSQL readiness guard and existing published/read-scope checks. Before migration, legacy published content remains visible. No admin visibility write route was added; no registered migration/verified browser gate. Do not mark Blueprint visibility DONE.
- **Assignment authoring/grading (PARTIAL):** persisted Faculty-user/member/teaching checks were added inside Assignment authoring and grade/publish transactions. Decimal-only whole-number score editor input rejects scientific/hex formats. In-test PostgreSQL denial cases authored but not executed. Do not mark full grading parity DONE.
- **Attendance (PARTIAL):** transaction-time active delivery and platform user checks now reject stale user or ended-class assignment snapshots, alongside existing `expectedMarkedAt` and correction reason rules. No evidence of end-to-end correction browser parity was produced here.
- **Discussions (PARTIAL additional hardening):** pin/delete moderation revalidates persisted Faculty scope inside mutations. Existing Discussion DONE evidence is historical; this batch needs its own executable gate before being treated as verified.
- **Assessment reports (PARTIAL):** CSV rows reject learner email properties; report table and PDF names do not fall back to learner email, and report pages use explicit IST display with ISO timestamps retained for client props. Focused unit tests added, but no browser/PDF export review performed.
- **Open dependencies:** administrator-only visibility editing + migration promotion, remaining Faculty quiz shuffle, full Profile workflows, report browser/mobile QA, assignment file permissions and independent PostgreSQL verification. No other checkbox changed to DONE.

**Verification status:** GitHub commits were pushed; repository tests, typecheck, build and browser gates were not run by this chat. Owner/orchestrator remains responsible for final gates and acceptance.

## 2026-10-15 Faculty Self Profile staged section editors — PARTIAL

This chat-4 batch starts from current `main` and implements the next Faculty Self Profile gaps as a staged, migration-aware path. **No Faculty parity row becomes DONE on source-only evidence.**

- **Storage proposal:** `docs/proposed-migrations/faculty-profile-document.sql` proposes JSON document + optimistic version fields on the existing `faculty_profiles` table. No migration is registered or executed here and no `src/db/schema` or migration-journal files were changed. The optional columns are checked before any staged read/write; absent columns show an explicit unavailable panel and no save control.
- **Scoped persistence API:** `GET/PATCH /api/people/faculty-self-document` uses authenticated context, same-origin PATCH, exact persisted user/membership/FACULTY-role authorization from `assertPersistedPlatformPermission`, full-document Zod revalidation, version conflict denial, and a same-transaction readiness check. Client state preserves unsaved text on network failure and distinguishes an unregistered storage blocker from optimistic conflicts.
- **Profile page:** `/teacher/profile/details` is linked from the Faculty Profile. It has real loading/error/retry and a mobile-responsive editor available only after registered storage is detected.
- **Editor sections implemented:** About description; self-reported personal details (gender/date of birth/blood group); current/permanent address; public professional social links; repeatable Skills with add/remove/proficiency. Each section saves through the same versioned backend; private login identity, college-owned academic title/employment, Aadhaar/PAN, profile files, private contact-editing and administrator-controlled fields are not modified.
- **Tests authored:** focused strict-section validation and duplicate/invalid fields; a disposable PostgreSQL integration fixture covering save/version, foreign college, wrong role and revoked role after migration. When storage remains unregistered, the DB test asserts the documented readiness denial instead of inventing a passing persistence path.
- **Still OPEN:** orchestrator migration registration and full PostgreSQL execution; desktop/mobile authenticated browser acceptance; Education, Experience, Certifications, Publications, Awards, Languages and Metadata UI; section-scoped upload receipts, identity verification and full legacy profile completeness. The existing contact editing blocker is unchanged.

**Status: PARTIAL only.** Do not relabel the shared matrix or claim live persistence until W01 registers the migration and independent gates verify exact SHA.

## 2026-10-15 source reconciliation against main ea1172d2

The current main/lane comparison and safe integration targets are recorded in the final reconciliation section of `docs/planning/account-surface-parity.md`; it is a source snapshot, not another tracker or runtime acceptance. Existing checkbox evidence is preserved. No required page/family becomes closed from this review.

Earlier follow-up notes saying the visibility migration/admin writer are absent are historical: main now contains registered migration 0061 and `college-content-visibility-service.ts`, its route, confirmed College Admin control and exports. Do not duplicate them. Executed acceptance of the complete producer-to-learner workflow remains required. Main now merged the first staged self-profile editors/API/tests and storage proposal via af54f5b. Chat-4's sampled head `1ecc15ef41f963003383eb47494c78cde199f3c1` still has later repeatable editors/row factories and follow-up section tests. Reconcile the integrated storage proposal with DB-007 before promotion; do not rebuild the integrated first sections. Full profile acceptance remains open.

## 2026-10-15 Faculty profile repeatable sections — PARTIAL, orchestrator gate outstanding

The next Faculty backlog round added independent section-authoring workflows to the migration-aware `/teacher/profile/details` editor. Every item has an individual pushed commit. No master parity row or legacy-delta section was edited.

- **Shared responsive repeatable editor:** explicit add/edit/remove draft controls, maximum record limits, required-field checks, per-record stable UUIDs and Save confirmation. Deletions are only persisted after Save; complete document Zod revalidation and optimistic versioning remain server authoritative.
- **Languages:** language name and proficiency, up to 30 entries, including duplicate-ID denial.
- **Education:** institution, education/degree/program/specialization, year range, in-progress status, grade, qualifying exam, rank and score. Switching to currently pursuing clears and disables the completion year. Preserves existing approved certificate receipt IDs without uploading a file.
- **Certifications:** name, authority, issue/validity dates, public verification URL and notes. Date chronology checked by the existing Zod section.
- **Experience:** organization, designation, dates, category, location, paid flag, salary and notes, with date chronology validation. Existing receipt identifiers are preserved unchanged.
- **Publications:** title, journal, year, DOI, public URL, authors and description; capped at 100.
- **Awards:** title, issuer, year and description; capped at 100.
- **Metadata:** editable text attributes only; existing number, boolean and null fields are retained. Secret/identity-name restrictions apply at the UI and server PATCH boundary (cannot be bypassed by hand-written request JSON).
- **Draft independence:** saving one section updates its revision without remounting forms for other dirty sections. Error and conflict handling retain unsaved edits until the user retries or reloads.
- **Test coverage authored:** unit tests for all new sections, collection uniqueness, private metadata protection, chronology, cross-section preservation, and a disposable PostgreSQL scenario that updates Languages, Education, Certifications, Experience, Publications and Awards with optimistic versions. Its revoked-role denial uses the latest token, rather than receiving a false pass from a stale token.

**Still PARTIAL / not production-ready:** proposed Faculty private-document columns are not registered through the canonical migration journal; the editor displays an explicit storage unavailable state until deployment. No GitHub CI, real PostgreSQL or authenticated mobile/browser gate was run by this chat. Faculty contact changes, sensitive identification, photo/document uploads and exact legacy Profile completeness remain blocked. Blueprint scheduling/visibility and persisted Quiz shuffle (DB06) are independent PARTIAL surfaces and are not claimed finished.

**Release rule:** no DONE promotion until migration registration, success and negative database tests, and mobile browser acceptance for this exact SHA.

## 2026-10-15 Faculty Blueprint live-class follow-up — PARTIAL (chat-4)

This round used the current Faculty PARTIAL Blueprint row as the next unbuilt work; the existing MISSING rows in section 8 belong to other account lanes. No master matrix status was changed.

- The live-class editor interprets all `datetime-local` fields as **IST**, regardless of browser timezone. Opening a published session preloads its title, sanitized HTTPS meeting link, and start/end instants; switching back to CREATE clears previous-session values.
- The client validates a complete strict create/edit/cancel command **before** asking for confirmation. Dropdown options identify course + Section, and destructive cancellation explicitly names the selected live class and its course/Section. A successful mutation resets the draft, refreshes the page and shows an accessible success message.
- Server writes now verify persisted active Faculty status, actual teaching assignment and non-ended delivery **inside the write transaction**, in addition to existing read-time checks. Revocation denies are non-leaking; the PostgreSQL integration test restores the exact seeded role ID after mutation.
- Transaction advisory locks serialize co-teachers scheduling on the same delivery. The conflict preflight now rejects occupied registered Section schedule events and conflicting instructor events, as well as existing published LIVE_CLASS overlaps. Concurrency across independent scheduling write systems still needs an executed acceptance gate.
- Edit/cancel actions are restricted to published live content. Stale version tokens return the existing typed `LESSON_CONTENT_STALE_VERSION` error, distinguished in UI from schedule conflict and permission revocation. Audit metadata continues to exclude meeting URLs.
- Authored tests: fixed-IST conversion, persisted revocation, timetable conflict, published-only mutation policy, edit hydration, strict pre-confirm validation, Section disambiguation, exact cancellation, typed recovery messages, create-form resets and success feedback.

**PARTIAL, not DONE:** no local TypeScript, unit, database, CI or authenticated 375px browser gates were executed in this chat. Exact legacy Blueprint content authoring, recorded multi-instructor/room scheduling edge cases and registered student-visibility end-to-end acceptance are still outstanding. The independently blocked Quiz shuffle and private profile-document migrations were not altered.

## 2026-10-15 Faculty Self Profile security and recovery — PARTIAL (chat-4 next lane batch)

This batch targets the remaining PARTIAL Faculty Self Profile row rather than reopening already accepted Faculty reports/attendance/contacts. It begins after merging latest `main`; the registered DB08 migration was preserved without changes. Section 8 contains no Faculty-specific MISSING row.

- **Metadata:** protected legacy string metadata keys are retained unchanged when public keys are edited, rather than silently erased. Keys that could mutate object prototypes or use whitespace aliases are rejected before saving. Protected metadata cannot be overwritten through hand-written PATCH requests.
- **Receipt boundaries:** a Faculty self-profile section PATCH cannot insert, replace or reassign education certificates, certification receipts, experience certificates or offer-letter document IDs; receipt-bearing entries cannot be deleted until a college-managed document revocation workflow exists. The editor explains why its Remove control is disabled for those records.
- **Professional links:** any new/changed link must be HTTPS without embedded credentials or localhost targeting; unchanged historical values are not silently destroyed.
- **Request safety:** PATCH bodies are streamed and capped at 1 MiB before JSON parsing, including requests without a Content-Length header; excessive requests receive HTTP 413. Existing same-origin requirements remain.
- **Optimistic-save recovery:** a ref-based in-flight guard prevents rapid duplicate submits using the same version; typed failure messages distinguish storage unavailability, stale profile (with explicit user-triggered reload), oversized requests and access loss. Unrelated unsaved section drafts remain untouched by a successful save.
- **Testing:** focused unit tests authored for protected legacy metadata preservation, prototype-key rejection, private receipt injection, managed-file deletion protection, HTTPS updates, oversize/malformed request bodies, duplicate-save fencing and conflict recovery.

**Acceptance outstanding:** no independent TypeScript, lint, disposable PostgreSQL or authenticated browser/mobile gates were executed. Self Profile stays PARTIAL while its private-document migration, signed upload receipts and contact privacy policy are unresolved. Quiz shuffle and remaining Blueprint browser acceptance are independent blockers and unchanged. No matrix row was promoted to DONE.


## 2026-10-15 Faculty Quiz question editor round — PARTIAL

The `chatgpt/chat-4` round beginning at `c0f9c23c00c5e73666bca6aefd31f16f5e24bd41` extends the existing, authorized Faculty choice-Quiz creator/manager without changing any registered database schema or other account lane.

- **Question authoring:** Faculty can move questions up/down and duplicate one into a separate in-memory draft, capped at the existing 100-question command limit. The existing validated CREATE/EDIT route receives the visible ordering after explicit renumbering.
- **Answer authoring:** Faculty can move answer options without changing correctness and duplicate an answer as unchecked; the existing 20-option limit and single-choice semantics are preserved.
- **Unsaved work safety:** Selecting a different Quiz while a draft is dirty prompts before discard. The editor provides an explicit confirmed reset to its persisted version, blocks unchanged metadata saves, and uses a synchronous ref-based write lock against duplicate POST submissions.
- **Pre-publication review:** A live, accessible summary shows question count, option count, total possible points, and questions with no correct choice. A permitted Quiz can also be copied into a new *unsaved* draft without changing its original version or attempt history.
- **Scope and persistence:** The existing POST route, backend Zod command, persisted Faculty teaching checks and question/option sequence constraints remain authoritative. New unit coverage exercises these local flows; an additional disposable PostgreSQL integration case exercises actual reordered saves and foreign-Section denial via `commandFacultyQuiz`.
- **Important metadata distinction:** Published/CLOSED metadata-only edits remain possible even if the immutable question-bank GET fails; failed DRAFT question-bank edits remain blocked.

**PARTIAL / acceptance pending:** no TypeScript, lint, PostgreSQL or authenticated desktop/mobile browser gate was executed at this batch SHA. Database-persisted legacy `shuffleQuestions`/`shuffleOptions` and randomized learner rendering still require orchestrator DB06 registration and follow-through; the staged-only SQL is not production parity. No master matrix row was promoted to DONE. The sole DATABASE tracker remains unchanged pending its independent gates.

## 2026-10-15 Faculty Quiz question-bank usability round — PARTIAL (chat-4)

The latest `chatgpt/chat-4` round merged the current main before implementation and authored ten separate, pushed Faculty Quiz editor changes. This remains **PARTIAL**; it does not represent registered database shuffle parity or acceptance.

- Search the Faculty Quiz selector by title or lifecycle state while retaining the currently selected Quiz so edits are not lost by filtering.
- Search long question banks by question number, prompt or answer text. This only filters the rendered editor; the persisted order and full bank remain intact.
- Show shared-Zod question validation beside each question and a live correct-answer count.
- Insert a new choice question after any existing question and move any question directly to the first or last position while preserving the save-time sequence normalization.
- Insert an unchecked answer after a selected option without modifying existing correctness flags.
- Confirm deletion of an option marked correct before the grading key is adjusted, and confirm deletion of an authored question with a bounded prompt preview.
- Paste separated answer choices through an explicit input action, rejecting blanks, duplicates, overlength and a 20-answer overflow. A brand-new empty question gets exactly one marked-correct first answer.
- Ten dedicated `tests/unit/faculty-quiz-round7-*.test.ts` files cover these models and negative boundaries.

**Acceptance not claimed:** no repo-local TypeScript/ESLint/Vitest/PostgreSQL or authenticated browser checks have executed for these commits; repository GitHub Actions for the branch have not been observed. The existing command route remains the sole write boundary and its prior role/tenant checks were not changed. Full legacy choice Quiz parity still depends on orchestrator-owned DB06 persisted shuffle registration, learner-visible randomized rendering, and current browser/attempt recovery evidence. Do not mark Faculty All Quizzes DONE on this evidence alone.

## 2026-10-15 Faculty Quiz read/review recovery and bounded write requests — PARTIAL (chat-4 round 8)

After merging the current `main` into `chatgpt/chat-4`, this round pushed 12 individual Faculty Quiz parity improvements with source-authored regression tests, remaining within the Faculty lane:

- Question and answer options are hydrated from persisted `sequence` ordering without mutating the server result. A DRAFT with an empty loaded bank is treated as a retryable failure, never a safe publishable empty Quiz.
- Retrying an unsuccessful question fetch warns before discarding dirty metadata; arbitrary parsing/network exception strings are redacted, with a safe retry path retained.
- The Quiz command preflights same-Section title collisions; the server remains authoritative for uniqueness, stale token and scope.
- Shared question Zod validation now feeds a total-points/invalid-question review, with an invalid-only display filter that never reduces the full bank sent on save.
- Pasted answer lists accept trailing clipboard newlines but reject blank interior choices and oversized inputs; correct-option deletion confirmations distinguish single versus multiple-answer behavior.
- Publish remains disabled if the loaded DRAFT bank is empty/invalid, dirty, unavailable, or not in DRAFT status.
- The existing same-origin authenticated Faculty POST endpoint now streams with a 16 MiB byte cap and rejects oversized/malformed bodies or unsupported media types with explicit 413/400/415 JSON errors *before* reaching the transaction service. The existing Zod command, exact teaching-scope checks and transactional audit remain authoritative.

**Evidence limits:** dedicated `tests/unit/faculty-quiz-round8-1.test.ts` through `round8-12.test.ts` are authored, not run in this chat. No new database migration, repository-local TypeScript/ESLint/Vitest/PostgreSQL run, or desktop/mobile browser execution was available for this branch revision; do not promote the Quiz matrix from PARTIAL. Full legacy parity still depends on orchestrator-owned registered DB06 shuffle fields plus learner-side rendering and independent attempt-bearing/empty-error browser acceptance.

## 2026-10-15 Faculty Self Profile authoring recovery and navigation — PARTIAL (chat-4)

**Before → after:** Faculty Profile `/teacher/profile/details` already had a versioned self-section API and repeated editors, but unsaved draft recovery was inconsistent, large collections were hard to navigate, and some invalid section changes were not explained until a failed write. This branch adds tangible in-page controls while preserving the exact existing Faculty-only API/service and administrator-owned document fields.

- Confirmed discard now restores persisted snapshots independently in About, Personal details, Address, Social profiles, Skills, Metadata, and all repeatable collections. No discard triggers a write.
- Repeatable section deletion confirms the exact row and cannot remove entries with a managed document receipt. Authoring duplication creates a fresh record UUID and clears all certificate/offer-letter document receipts, avoiding accidental private-receipt reuse.
- Repeatable collections permit order changes, field-search over authored (not private receipt) values, and per-record collapse; these are presentation/draft transformations, and `onSave` still receives the entire unfiltered collection with stable IDs.
- Client validation reuses the **existing complete Faculty profile Zod document** before submitting education/certification/experience chronology or other repeatable data. Invalid fields prevent writes and have an actionable inline explanation. The server remains the source of truth.
- Skills deletion is confirmed, and Metadata now displays protected/duplicate-key errors before a network write using the existing metadata writer contract. Metadata reset restores only authorized text keys; protected typed keys remain in the persisted snapshot and are retained by the writer.
- A responsive jump navigation links all 12 existing edit sections with distinct anchors; no new routes, API permissions or database columns were introduced.
- Focused unit tests were authored for 13 features in `tests/unit/faculty-profile-round9-1.test.ts` through `round9-13.test.ts`; tests remain **unexecuted** in this chat. A separate typed-anchor cleanup commit carries no new acceptance claim.

**Open / not DONE:** Faculty private-profile document columns still require orchestrator-owned **registered migration** and disposable PostgreSQL success/denial acceptance. Live persistence, signed private document receipt/upload flows, Faculty contact/privacy disposition, legacy-source comparison, and authenticated desktop/mobile browser evidence remain unresolved. The master matrix currently labels Faculty Self Profile DONE despite those open checks; this note records the discrepancy and does **not** treat the row as release-verified. Do not count source-only UI work as a tracker closure or full Faculty profile parity.

## 2026-10-15 Faculty Profile client recovery and validation — PARTIAL (chat-4 round 10)

**Scope:** after merging the refreshed `main` first, chat-4 implemented 12 independently pushed Faculty Profile improvements through the existing `/teacher/profile/details` page and `/api/people/faculty-self-document` contract. This is follow-through on the Self Profile ledger; no unrelated account or database schema files were touched.

- Text-section saves now prevalidate the existing full Faculty Zod document contract (About, Personal details, Address and Social profiles), give field-specific errors, and prevent invalid saves before PATCH. Changed professional links also enforce HTTPS, no embedded credentials and no localhost, matching the pre-existing write-service guard. Unchanged legacy links are preserved.
- A reusable unload warning now protects unsaved Faculty text, repeatable, Skills, and Metadata edits when the browser reloads or navigates away with a full document unload. This does not claim complete client-side SPA-navigation interception or multi-tab conflict resolution; those remain browser-acceptance checks.
- Skills now run through the existing document Zod schema before save, with clear error feedback for invalid or duplicate-id records, search across a long Skills collection without truncating the saved array, and reorder preserving stable record IDs.
- Metadata now supports searching editable text keys/values without filtering the underlying write payload, and confirms removal of a precisely identified draft key; the existing metadata writer continues protecting identity and other typed values.
- `tests/unit/faculty-profile-round10-1.test.ts` through `round10-12.test.ts` were authored alongside the changes. All components remain linked to existing authenticated and same-origin-guarded service endpoints; no new mutation route, tenant permission or storage claim was introduced.

**Evidence and closure:** GitHub pushes are verified, but no executed TypeScript/ESLint/Vitest, disposable PostgreSQL, authenticated desktop/mobile, browser unload/SPA, or legacy-oracle acceptance was available for this commit. The Faculty profile document remains conditional on runtime column readiness; successful registered migration replay and privacy/receipt disposition must be independently verified before release acceptance. The shared Faculty matrix currently labels Self Profile DONE despite missing full legacy profile evidence; **this round makes no new DONE claim**. DB and release tracker statuses remain unchanged.

## 2026-10-15 Faculty Self Profile filtered-collection safety — PARTIAL (chat-4 round 11)

**Before → after:** Repeatable Faculty profile records, Skills, and editable Metadata had search controls that disappeared at five or fewer entries while leaving an invisible active filter behind. Adding or duplicating a blank record could also create an editor hidden by the old search query. Reorder buttons operated on absolute positions even when some records were filtered away, making the result difficult to anticipate.

This branch adds **11 separately committed and pushed Faculty editor changes** using existing authenticated Self Profile page components and pure model helpers. All write calls still send their **complete original section draft** to `PATCH /api/people/faculty-self-document`; no server authorization, validation, private receipts, storage migrations, or other accounts were modified.

- Search is disabled automatically once a repeatable section, Skills, or Metadata has five or fewer records, preventing invisible stale-query results.
- Moving repeatable records or Skills is disabled when a search hides any entries; original record identities and order are preserved until the full list is visible.
- Adding/duplicating a repeatable section entry, adding a Skill, and adding a Metadata field clear the active search so the newly created draft input is immediately visible.
- A filtered result count with a named clear-search action is available in repeatable sections, Skills, and Metadata, including zero matches.
- Eleven focused, **authored but unexecuted** tests live in `tests/unit/faculty-profile-round11-1.test.ts` through `round11-11.test.ts`, exercising each pure search/reorder recovery helper.

**Parity status: PARTIAL.** These user-facing editor controls improve the Faculty Self Profile backlog but do not certify the whole legacy feature. A real registered private-profile database migration/replay, role/tenant denial and optimistic concurrency tests on disposable PostgreSQL, authenticated desktop/mobile browser checks (including search and a saved section), SPA navigation loss prevention, and approved private-document/contact privacy workflows still need independent proof. The shared matrix already marks Faculty Self Profile DONE despite describing missing acceptance; this branch does not change that matrix or the sole database tracker. Runtime source pushes and test authorship must not be counted as acceptance evidence.

## 2026-10-15 Faculty Self Profile validated-save receipts and conflict recovery — PARTIAL (chat-4 round 12)

**Before → after:** The Faculty Profile editor directly trusted the JSON shape and optimistic version of a successful PATCH response, potentially overwriting the local profile with an incomplete or malformed receipt. Errors from untyped server envelopes and uncertain writes were presented as generic validation/network failures. This round adds 14 individually committed and pushed Faculty changes within the existing Self Profile editor and pure response/error models.

- Successful PATCH responses now pass `facultyProfileSaveReceipt` before any document or version state is replaced. The parser requires an object response, every persisted top-level document section, all fields in nested identity/contact/address/social/profile sections, valid Zod schema values, and **exactly** the next safe-integer optimistic version. Incomplete private fields cannot silently default to empty.
- A malformed 2xx receipt is treated as **uncertain commit status** (not a guaranteed rollback). The editor keeps the local draft, flags a safe reload path, and warns against immediately retrying. No raw server exception bodies or private profile values are shown.
- Non-2xx error JSON is treated as unknown and must expose an uppercase, length-bounded machine code to be used. HTTP 401, 403, 409, 413, 429, and gateway/service outages now have distinct non-leaking recovery guidance. An uncoded 409 still prompts stale-version reload rather than implying a field error.
- Reloading an inconsistent/stale profile requires explicit confirmation that unsaved work across **all** sections will be discarded. No unsolicited page reload, silent overwrite, or forced migration is introduced.
- A live `role="status"` reports the section currently saving; a successful verified response shows only the section name and confirmed revision, not personal values.
- Fourteen focused unit tests are authored at `tests/unit/faculty-profile-round12-{1..14}.test.ts`. Changes use the pre-existing authenticated, same-origin checked `PATCH /api/people/faculty-self-document` and the existing transactional permission and optimistic-token service. No database schema, migration, shared tracker or unrelated account route was changed.

**Acceptance limits:** These commits and unit tests are source-authored; repository-local TypeScript/ESLint/Vitest, disposable PostgreSQL, authenticated desktop/mobile browser, response corruption and multi-tab concurrency scenarios were **not independently executed** in this chat. Profile storage remains conditional on registered columns and approved private-document/identity handling. Faculty Self Profile cannot be declared fully legacy-complete based on this source work; existing master matrix DONE text does not remove the listed open gates. Database/release tracker remains untouched.

## 2026-10-15 Faculty manual assignment grading response and conflict hardening — PARTIAL (chat-4 round 14)

**Before → after:** The existing authenticated Faculty assignment report and its persisted `PATCH /api/courses/assignment-submissions/[submissionId]/grade` and `POST .../publish` routes were already responsible for manual scoring, optimistic version enforcement, and activity events. However, the review client trusted untyped successful mutation JSON and could display a false success after accepting a malformed, stale or foreign submission response.

This round adds **12 independently committed, pushed Faculty-only manual grading improvements**:
- Authoritative grade-save and publish receipts are Zod-validated against the exact persisted submission, assignment, delivery, membership, next optimistic version, correct grading status and gradePublished transition before replacing local state.
- The returned points and feedback must match the Faculty-confirmed grading values; publish responses must preserve the previously saved points/feedback. The maximum-point guard remains enforced on both service and client response boundary.
- A synchronous ref lock prevents overlapping save/publish commands on one submission, avoiding duplicate stale-token writes.
- A timeout, invalid success payload or other unknown result is reported as a potentially committed operation; no assertion of rollback or automatic retry is made.
- Publication confirmation quotes the exact saved score with a bounded feedback excerpt, makes learner visibility explicit, and still uses the existing human confirmation.
- HTTP 409 exposes an explicit re-query action for the current submission revision (save **and** publish). A verified save says `saved privately`; only a verified publish reports learner visibility.
- Twelve focused tests are authored at `tests/unit/faculty-manual-grading-round14-{1..12}.test.ts`. All grade/publish requests continue through existing authenticated, same-origin-guarded, tenant-scoped, transactional routes; this round changed no permission definitions, schema, migration, or other account.

**Acceptance limits:** the remote code was pushed and source wiring inspected, but TypeScript/ESLint/Vitest, disposable PostgreSQL role denial, grading concurrency, and authenticated browser acceptance were not executed here. Source-only assertions are not independent acceptance evidence. Existing tracker and release gate statuses remain unchanged.

## 2026-10-15 Faculty assessment results and overdue follow-up parity — PARTIAL (chat-4 round 15)

**Before → after:** Faculty's existing `/teacher/results` and `/teacher/response-followups` pages relied on fixed 5-row report expansion, limited filter/sort controls, silently accepted duplicate query selectors, lacked a bounded aggregate export, and treated a forged/stale teaching-Section selector as an empty result rather than a scoped denial. This round begins with the latest `main` merged to `chatgpt/chat-4` and uses the current persisted teaching-scope report readers.

**15 separately pushed Faculty feature commits** add:
- Both pages reject repeated and unexpected URL selectors rather than silently accepting the first. Invalid filters have a clear reset path.
- Assessment results support stable title/due-date sorting, exact course-code/Section-code search, published overdue versus upcoming/undated filters, and 5/10-row bounded pagination. Legacy result links keep their defaults; the report reader honors the chosen page size without reading extra assessments.
- Overdue follow-ups support filtering by a persisted current teaching Section, oldest/recent-due or title sorting, and 5/10 assessment expansion without unbounded missing-roster queries.
- Both report readers now refuse unknown, foreign or stale teaching-Section IDs against the current authorized teaching-section list, with a non-leaking `FACULTY_TEACHING_SCOPE_REQUIRED` denial. The established report readers continue a second authorization check per assessment.
- New **GET-only** CSV endpoints export **the visible bounded page only**, with active Faculty Section checks and no learner names, rolls, emails, phones, individual grades, feedback or submission content. Explicit no-store/nosniff headers and formula-cell escaping protect spreadsheet imports. Exports reflect the same applied sort, filter, page and page size as the visible report; their CSV tests also verify that incidental private roster preview fields are not emitted.
- Focused new unit tests live in `tests/unit/faculty-results-round15-{1..8,14}.test.ts` and `tests/unit/faculty-followups-round15-{9..13,15}.test.ts`. The suite files are source-authored and **not executed** in this chat. No new database tables, background processing, outbound notifications, grade writes or migration changes were added.

**Still open:** 375px mobile/browser verification of filter and export controls, real authenticated PostgreSQL positive and forged/foreign role denials, test/lint/typecheck/build execution at the final SHA, and legacy page-by-page visual and interaction comparison. The sole tracker and existing DONE/PARTIAL matrix statuses were not advanced. The previously retired assessment-only route remains excluded. This is a functional source improvement, **not acceptance closure**.


## 2026-10-15 chat-4 source-hardening round — PARTIAL, not acceptance
After merging main at `99b89077`, fifteen individually pushed Faculty results and response-follow-up fixes address canonical page and page-size validation, bounded pagination and learner previews, CSV malformed timestamps/control characters/counts and grade averages, distinct zero/unknown handling, filtered/unassigned empty states and invalid due-date ranking. Unit regressions were authored for each source fix. The report services continue to use the existing current Faculty membership/teaching-Section authorization and authorized aggregate read paths; no outbound messages, private learner CSV fields or new tables were introduced. These are **source changes only** in a connector-only session: no Vitest, typecheck, ESLint, PostgreSQL or authenticated desktop/mobile browser suite was executed here. The related Faculty Results/Follow-ups parity is therefore **PARTIAL**, and no page, master matrix row, tracker task or release gate is newly CLOSED. Required next evidence: actual test/build execution at this branch SHA, live tenant/role denial and revoked-Section negative paths, browser empty/filter/CSV/mobile checks and legacy oracle comparison.


## 2026-10-15 chat-4 Blueprint and assignment editor hardening — PARTIAL (round 16)
After merging main, this branch pushed 14 separate item commits, each paired with a focused unit regression (tests/unit/faculty-blueprint-round16-{1..14}.test.ts).
- Faculty Blueprint content edit rejects credential-bearing and loopback HTTPS URLs and noncanonical YouTube durations in the existing client form; server-side authorization remains authoritative.
- Unsaved content edit detection disables no-op writes, requires confirmation to discard unsaved data, prevents dismissal during save, and verifies the exact persisted content-edit receipt before reporting success.
- Section content ordering now uses bounded stable-ID movement, no-op detection, restoration of original persisted order, complete ID-set validation, and exact API receipt verification before success and refresh.
- Quiz metadata editor no longer offers mutations of immutable published/closed attempt limits.
- Assignment publishing now prompts Faculty to save unsaved form changes first; draft title, text length and point validations happen before mutation.
All changes use pre-existing Faculty-authorized services/route guards. PARTIAL, not DONE: this source-only round has not executed TypeScript/ESLint/Vitest, PostgreSQL scope-denial and optimistic-version tests, authenticated mobile/desktop flows, or frozen legacy comparison. Content order still depends on its DB05 registered-runtime gate. No new database tables were introduced, and no tracker or shared matrix acceptance status was changed.


## 2026-10-15 Faculty authoring transaction and uncertainty recovery — PARTIAL (chat-4 round 17)

**Scope and owner decisions:** Continue parity only for Faculty Courses, Blueprint metadata, assignments and quiz metadata. Automated assessment features remain retired. Video storage/signing is owned by a separate backend agent; this round does not call unregistered upload APIs or claim video-management parity.

This branch contains twelve new, independently pushed source items: scoped assignment mutation receipt verification, synchronous duplicate-command lock, confirmation reset on edits, unsaved-draft switch confirmation, explicit archive confirmation, expired-deadline preflight, safe machine-coded error recovery, no-op draft-save prevention, synchronous Blueprint content-save lock, archive-action visibility and truthful labels, assessment metadata edit receipt verification, and assessment archive receipt verification. Each has a corresponding `tests/unit/faculty-assignment-round17-*.test.ts`, `faculty-content-round17-9.test.ts` or `faculty-assessment-round17-*.test.ts` test.

**Acceptance remains OPEN:** Unit tests were authored but have not executed in this connector workflow; no TypeScript, ESLint, disposable PostgreSQL, cross-role or browser/mobile acceptance was executed. Existing server authorization, mutation/origin checks and DB constraints are unchanged. A malformed response is an uncertain write, not proof of rollback; refresh before retrying. All affected parity rows remain PARTIAL, and no master matrix row or official task was promoted.


## 2026-10-15 Faculty grading review and lesson-video UI contracts — PARTIAL (chat-4 round 18)

**Before → after:** Assignment submission review now checks every returned row against the exact requested assignment and Section before rendering, distinguishes review-filter empty states, and invalidates in-flight fetch results when the review drawer closes. These improvements reuse existing authenticated service and GET routes, without introducing new permissions or mutation handlers.

**Video management preparation (pure models only):** The new `src/modules/courses/faculty-video-management-model.ts` defines the future backend adapter: strict secret-free video metadata (content, lesson, Section, processing and publication statuses, duration and optimistic timestamp), own-lesson shared/Section listing, status badges, safe title/status filters, stable ordering, no-video/processing/no-match messages, replace eligibility and confirmation, upload-session-only replacement intent, history-preserving archive confirmation, effective visibility labels, gated visibility intent, compact action availability, spreadsheet-safe scoped metadata export, and rejection of stale status replies. `tests/unit/faculty-video-round18-4.test.ts` through `faculty-video-round18-17.test.ts` cover these contract behaviors; assignment-review tests are `faculty-review-round18-1.test.ts` through `round18-3.test.ts`.

**Integration contract:** These shapes are provisional UI projections, not a storage API declaration. The storage owner must provide an authenticated, college/role- and current-teaching-Section-scoped list/replace/archive/visibility service, authoritative status vocabulary and updated-at version, short-lived signed playback/upload flow, persisted asset lineage, activity audit, and deny-by-default learner access. Adapt actual backend responses to the strict projection once those services exist. This builder did not touch `src/modules/storage`, upload/signing endpoints, database migrations, or production storage. No live upload or playback actions are claimed.

**Evidence:** All items are remote source commits and unit tests are authored, not executed here. TypeScript/ESLint/Vitest, disposable PostgreSQL, permission-denial verification, responsive authenticated browser journeys, video upload and playback acceptance, and full legacy comparison remain open. All Faculty parity rows and the official tracker stay unchanged; no DONE claim is made.


**Round 18 follow-up:** The submission review drawer now maps authentication, scope-denial, throttling and outage statuses to bounded non-leaking messages. The video list filter is a strict, length-bounded model contract. These are independently committed tests (items 18 and 19); acceptance remains PARTIAL.


## 2026-10-15 Faculty report drill-down filtering — PARTIAL (chat-4 round 19)

The existing exact-delivery Faculty Quiz attempt page now validates canonical pagination and supports oldest/newest ordering, scoped learner-name search, and the authorized latest-per-learner versus all-attempts view. The page preserves these selectors through reset, sort and pagination while question-accuracy metrics remain based on the latest attempt per learner. Four focused Vitest regression files are authored under `tests/unit/faculty-quiz-round19-{1..4}.test.ts`.

The existing exact-Section Assignment submissions report now validates canonical pagination without changing its API drawer schema, supports oldest/newest ordering, name search of authorized submissions, private-versus-published grade visibility, more specific no-result descriptions, responsive/wrapping navigation, and truthful text about which filters the existing server-authorized CSV includes. Six focused unit regressions are authored at `tests/unit/faculty-submissions-round19-{5..10}.test.ts`. The CSV still re-evaluates Section permissions server-side and does not accept the page-only name/grade-visibility/sort fields.

**PARTIAL acceptance:** These are source-authored, separately pushed page/model changes with tests written but not executed in this connector session. Do not mark any Faculty parity row or tracker task DONE until Vitest, TypeScript, ESLint, auth/foreign Section database checks, desktop/mobile browser and legacy UI parity are independently proven. No AI code, storage backend or migration was modified.


## 2026-10-16 chat-7 faculty private submission review and lesson videos — source PARTIAL

The Faculty assignment grading drawer and Section submissions report now list `GET /api/courses/assignment-submissions/{submissionId}/files`, show `fileStatusDescriptor` badges and issue `POST /api/courses/assignment-submission-files/{fileId}/download-grant` only for READY files, checking both submission and file IDs before opening an ephemeral signed URL.

Every Faculty Blueprint lesson now offers a video manager on the registered backend: `/api/courses/lessons/{lessonId}/videos` grant/list, exact-header browser PUT with progress, video complete, optional thumbnail grant/complete, replacement upload, publish/unpublish, learner-visibility toggle, collision-free order swap, delete, and grant-only staff preview. Linked VIDEO lesson content is created with `storageKey = video-asset/{videoId}`, then linked with PATCH and published through the lesson-content transition API. Offering-wide videos are previewable but not editable by Faculty in a delivery-specific workspace. Backend remains the authority for teaching scope, scanning and publication. Client tests were authored for protocol, grants, status, management route wiring, private review reachability and ordering.

**Acceptance not executed:** npm typecheck, ESLint, Vitest, real disposable PostgreSQL teaching/foreign-delivery denials, R2 PUT/GET and malware-scanner release gate, multi-file viewing, video replacement/concurrent order mutation, desktop/mobile/screen-reader and frozen-legacy browser comparison. Source code pushed only to chat-7; no Faculty row CLOSED, no release certification and no tracker DONE claimed.


## 2026-10-28 nested coursework source checkpoint — Faculty (NOT ACCEPTED)

Legacy FE pinned to `9d56bb7a347b06f242ef615c19fdc298f83329e0`; supporting wave-3 source evidence: `docs/audit/legacy-dev-census/2026-10-28-wave3-source-reconciliation.md`. Treat the following as additions to **existing coursework/assessments/section** acceptance contracts, not new independent page families:

- Legacy `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx` is a nested submission review UI distinct from the route file. Validate source and actual vNext Faculty private-file viewer, attachment statuses, preview/download grant, cross-section denial, retry/error and keyboard/close behavior with executed storage/DB/browser tests; prior authored tests are not acceptance.
- Legacy `src/components/Quiz/quizpanel.js` and the newly surfaced `src/components/Quiz/leftpanel.js` require quiz creation/edit/navigation/question-state/invalid-save flow tracing through their actual parent course and all-assessments routes. Do not equate a quiz route to a complete builder.
- Legacy `src/components/Global/Offcanvas/Syallabus/videoform.js`, `src/components/Global/RichTextEditor/RichTextEditor.jsx`, `src/components/Global/SortableLessonContentList/SortableLessonContentList.jsx` and the newly reachable `src/components/Global/Offcanvas/Syallabus/preview.js` require video/resource editor, reorder, cancel/unsaved, upload/error, content preview and mobile overlay parity checks. The richer vNext video flow remains subject to real-scoped tests, not copying legacy implementation structure.

**Implementation Green is withheld pending concrete focused execution and scope/security tests.** The official task tracker was not changed by this source-only audit.


## 2026-10-28 imported assessment, attendance and report descendants — source-only

Pinned legacy FE `9d56bb7a347b06f242ef615c19fdc298f83329e0`. Wave-4/5/6 discovery traced nested `src/components/Quiz/Table/{table,action,quizeTitle,submission}.js`, `src/pages/Dashboard/course/Attendance/{TakeAttendance,TeacherAttendanceView,StudentAttendanceView}.js/jsx`, `src/components/Report/{AssignmentReportContent,QuizReportContent,ReportStudentTable,QuestionAccuracyList,SubmissionTimingCard,ScoreDistributionBars}.jsx` and other course content descendants. Full details: `docs/audit/legacy-dev-census/2026-10-28-wave4-6-reconciliation.md`.

Verify each interactive subview's create/edit/mark/submit, attendance correction, feedback/report filters, downloadable content, role/section authorization, stale conflicts, empty/failed states and responsive/keyboard behavior against actual vNext implementations. Prior source tests and route existence are not a runtime acceptance gate; no new Faculty page or Implementation Green is claimed here.
