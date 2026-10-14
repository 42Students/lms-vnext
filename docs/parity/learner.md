**2026-10-15 chat-7 round-4 Project list sorting (PARTIAL):** Learner Projects can sort by persisted most-recent update, alphabetical title, or lowest measured progress with unknown progress last; archived projects remain last. The chosen sort survives pagination and mobile filters without affecting Mentor controls. Pure regression authored; source/PG/browser verification open.

**2026-10-15 chat-7 round-3 selected schedule day calendar export (PARTIAL):** Learners can download an iCalendar (.ics) file for the selected IST calendar day, restricted to the same authorized course/section-filtered sessions shown in the agenda, with an explicit 100-event export cap. The pure model validates day/instants and escapes text to prevent iCalendar property injection; no external sending or extra read. Unit tests authored; live calendar-client/browser acceptance outstanding.

**2026-10-15 chat-7 round-3 quiz unanswered navigation (PARTIAL):** Standalone learner quiz attempts show answered/unanswered totals and a keyboard-accessible jump to the first unanswered question. The pure model counts only answer-option IDs actually present on the loaded quiz; invalid/stale draft IDs do not masquerade as answers. Existing submission confirmation uses the same model. Pure tests authored; browser/mobile and PG acceptance outstanding.

**2026-10-15 chat-7 round-3 Attendance export (PARTIAL):** Learner Attendance adds a capped (200-row) CSV download for the currently selected, authorized course/month/status history. It includes no learner contacts; session metadata is escaped and spreadsheet formula prefixes are neutralized, with explicit truncation disclosure. Export reads the existing scoped workspace only. Pure CSV tests authored; runtime/PG/browser/privacy review outstanding.

**2026-10-15 chat-7 round-3 Project Activity export (PARTIAL):** Learners can download a capped CSV of the currently visible and already authorized Project activity page (up to 100 events), reflecting category/IST-date filters. CSV cells are length-capped, quoted, and spreadsheet-formula-neutralized, with no contact fields or extra tenant reads; pagination still explicitly limits history. Pure CSV tests authored, PG/browser/privacy acceptance outstanding.

**2026-10-15 chat-7 round-3 Board task workflow navigation (PARTIAL):** The learner task-details dialog now offers an explicit deep link to the actual scoped Board task card and its existing submission/status controls. The link keeps active filters, removes the modal token, uses an anchor to the real task element, and avoids the dialog onClose navigation race; read-only preview remains read-only. Pure URL regression authored; PG/browser verification pending.

**2026-10-15 chat-7 round-3 Board status drill-in (PARTIAL):** The learner Board now shows mobile-friendly counts for persisted task statuses; clicking a count filters tasks while retaining sprint, release, search, and priority. Counts derive exclusively from the already authorized project workspace. Pure model/unit tests authored; PostgreSQL/browser acceptance outstanding.

**2026-10-15 chat-7 round-3 assessment sorting (PARTIAL):** All Assignments and All Quizzes can sort the authorized filtered set by earliest due deadline, most recently created, or title before the existing 20-item pagination. Missing/malformed deadlines sort last instead of being presented as urgent; source is not mutated. Pure sorting regressions authored, runtime/PG/browser verification open.

**2026-10-15 chat-7 round-3 Course next-step shortcut (PARTIAL):** Active Course cards retain their Course Home entry but expose a separate direct link to the exact learner-visible next published lesson/content/assessment item; historical or unpublished paths have no misleading shortcut. UUID-validated pure link model and tests authored; server membership scope remains on the existing Course route. PostgreSQL/browser acceptance outstanding.

**2026-10-15 chat-7 Course list Continue learning filter (PARTIAL):** The Courses page adds a responsive pressed-state `Continue learning only` filter, showing only active courses with a published learning path and a real persisted next lesson or assessment. Historical/unpublished courses are not mislabelled as actionable; switching semester clears the filter and show-more resets. Pure-model regression authored, runtime/PG/browser acceptance open.

**2026-10-15 chat-7 Attendance session status filter (PARTIAL):** Learner Attendance history adds a validated URL-persisted status selector for present, absent, unmarked, future scheduled, and other marked sessions, while preserving all original monthly totals/threshold calculations. An empty filtered result differs from a truly empty month, and changing course/month preserves the selected state. Pure-model tests authored; PG and responsive browser gates remain open.

**2026-10-15 chat-7 Class Schedule session details (PARTIAL):** Learner Class Schedule cards expose already-authorized authored session descriptions in an accessible expandable disclosure, including section-wide events without a course link. The disclosure is outside the course Link to avoid nested interaction targets; text is rendered as text rather than HTML. Pure normalization model/test authored; browser/PG verification open.

**2026-10-15 chat-7 Class Schedule section filter (PARTIAL):** Learners with multiple authorized sections can filter the month/week/day schedule by their specific section. Filtering happens over the server-returned scoped event set after course selection and applies to Today/Next summaries, with an all-sections recovery choice. Zod-backed model tests authored; runtime tenant/role fixtures and mobile verification remain open.

**2026-10-15 chat-7 Project tab filter continuity (PARTIAL):** Switching learner Project sections preserves bounded, explicitly allowlisted Board and Activity filter parameters, so returning to a previous section does not silently reset an investigation. Transient task-modal IDs and activity pagination cursors are deliberately dropped. A pure URL-model test is authored; browser/back-forward acceptance is outstanding.

**2026-10-15 chat-7 filtered Board deep-link guard (PARTIAL):** Task-detail deep links now resolve only against the learner's already authorized **and currently visible** filtered task collection, so manually adding a task UUID cannot silently bypass active Board status/sprint/priority filters. The generic recovery notice does not disclose task existence; unit regression authored, PG/browser acceptance open.

**2026-10-15 chat-7 assessment state filters (PARTIAL):** Learner All Assignments/All Quizzes now filter already-authorized cards into needs-action, submitted/attempted, and published-feedback/results buckets, with the immutable assessment clock determining quiz deadline eligibility. Filter changes reset pagination; unpublished results remain hidden. Pure model tests authored, PostgreSQL fixtures and browser verification pending.

**2026-10-15 chat-7 assessment list search (PARTIAL):** All Assignments and All Quizzes now search authorized loaded cards by title, lesson, description, course name and code, combined with course filtering; changing search resets 20-item pagination. Pure model/unit cases authored; PG fixture, mobile and browser acceptance remain open.

**2026-10-15 chat-7 Schedule filter summary correctness (PARTIAL):** On learner Class Schedule, Today and Next class cards now consume the same selected-course event set as the calendar. Deselected course sessions no longer inflate those counts or future sessions; authentic section-wide events remain included. Pure model regression authored using fixed UTC instants and IST date grouping, runtime/PG/browser acceptance outstanding.

**2026-10-15 chat-7 Project Board stale task deep links (PARTIAL):** When an authenticated learner opens a valid task UUID that no longer belongs to the authorized project workspace, the Board renders a recoverable, non-leaking notice instead of silently showing nothing. Malformed IDs are ignored and do not disclose project/task existence. The action returns to the Board with active filters retained. Pure-model test authored; browser/PG verification outstanding.

**2026-10-15 chat-7 Blocked Project filter (PARTIAL):** Both desktop and mobile learner Project lists support a scoped `Has blocked tasks` filter derived only from persisted BLOCKED task counts, not an invented project blocker field. Archived projects are excluded; empty/filter-empty messaging and pagination remain intact. Pure-model check authored, tenant/role PG + browser acceptance still open.

**2026-10-15 chat-7 Project list mentor search (PARTIAL):** Learner Project search includes the display name of the mentor from the same previously authorized project-team summary, without a global people directory or contact fields. Bounded pure matching model and unit test authored; persisted learner/foreign-team PG and browser proof remain open.

**2026-10-15 chat-7 Semester-switch recovery (PARTIAL):** Switching the learner Course list semester now clears the prior search, resets the 48-card window, and crucially clears an elective-only filter. This avoids a hidden filter with no visible selector in a semester without electives. Pure-model regression authored; browser acceptance remains pending.

**2026-10-15 chat-7 Course list instructor search (PARTIAL):** The learner Course list search now matches the already scoped course's instructor display names alongside code, name, section, programme and period. It does not retrieve or reveal contact information; the trimmed bounded pure model has authored unit checks. Scoped course PG and responsive browser acceptance remain open.

**2026-10-15 chat-7 Course cards fallback media (PARTIAL):** Course tiles now render a bundled local decorative course illustration rather than a media-empty header, with a pure, tested fallback source. This does not claim authored course thumbnail parity: the canonical course image field and producer, runtime/PG acceptance, and legacy visual comparison remain open.

**2026-10-15 chat-7 Board status filter (PARTIAL):** Learner project Board now filters its already authorized task set by persisted TODO/IN_PROGRESS/BLOCKED/IN_REVIEW/DONE status, alongside search, sprint, release, and priority. Invalid URL status values fail closed to no filter, existing modal deep links retain valid filter state, and mobile controls expose the same selector. Source/unit verification authored; executed PG/browser gates still open.

## 2026-10-05 current-oracle L0 re-audit

The current production learner sidebar does not expose Projects/Placements statically. Projects follows hierarchical optional-module access; Placements additionally requires the college-level paid-module switch and learner placement eligibility (learner/class/batch in legacy, membership/section/cohort in vNext). vNext now models and resolves both layers and feeds them into the shared shell with optional links failing closed when current access cannot be trusted. Conditional Drive Day is still open because its coordinator producer and learner workspace are not yet cloned.

# Learner — Detailed Page Parity Spec

> **Freshness gate:** this detailed spec contains historical checks from the earlier oracle. Current Learner final verification is governed by `docs/planning/clone-parity-protocol.md` + `docs/planning/learner-family-verification.md`. Current observed legacy FE/BE heads are newer than the original spec baseline; checked boxes are not final-release proof until the matching family is VERIFIED.

Legacy navigation: Courses, Quizzes, Assignments, Class Schedule, Attendance, My Placements, Projects, Notifications, Profile.

**Operational execution ledger:** `docs/planning/learner-ui-surface-ledger.md`.

Use the ledger for row-by-row work and status. This file remains the detailed behavioral contract. A checked item here does not automatically make a ledger row `CLOSED`; closure requires the ledger's second comparison / verification rule.

## Clone-first learner naming and route lock

The legacy learner information architecture is canonical in vNext. Use the exact legacy sidebar labels and canonical routes before deeper page reconstruction. Do not rename learner surfaces to vNext alternatives such as "My Courses", "/learn/quizzes", "/learn/assignments", "/learn/placements", or a shared "/notifications" entry. Those older vNext routes may exist only as compatibility redirects.

Layer-0/Layer-1 shell parity materializes the sidebar, legacy route tree and nested Course/Placement/Project navigation. It does **not** close the deeper checklists below; each page still needs section/action/modal/state/backend verification.

## Page: Courses list

**2026-10-14 Course Overview progress-availability warning (PARTIAL,
L2-027):** the Home tab now distinguishes an unpublished learning path,
a published path with no lessons, and lessons with no trackable items.
When there is no completion denominator, the Overview shows a warning
instead of a measured `0%`. When persisted learning items exist, it
retains their actual tracked percentage. The pure model has unit tests;
legacy screenshot/browser comparison remains open.


**Mobile/source parity pass:** course-type filters use equal responsive columns on narrow screens, with pressed-state semantics. The mixed All view renders the Electives heading as a separate full-grid-width row rather than widening the first elective card. Browser/mobile acceptance and course thumbnail mapping are still open.

**Legacy route:** `/learn/courses`  
**vNext:** `/learn/courses`

Legacy contract:
- course cards for the learner's enrolled/active and historical semesters;
- program/semester metrics and semester switcher;
- Regular/Elective filter, search and 48-card show-more behavior;
- course name/code, instructor, section, credits and elective context;
- legacy course thumbnail with fallback image;
- progress/continue-learning signal in vNext;
- navigation into course detail;
- shape-matched loading, empty and request-failure states.

Closure checklist:
- [x] Course list membership/enrollment scope exactly matches legacy expectations.
- [x] Course card metadata and progress/continue-learning information are present.
- [x] Course click/deep-link behavior lands on the correct delivery/course context.
- [x] Loading, empty and error states are explicitly implemented.
- [x] Unauthorized/non-learner access is fenced server-side.
- [x] Instructor, mixed Electives grouping and 48-card show-more behavior are implemented.
- [ ] Legacy thumbnail/fallback-image parity remains open because the vNext Course domain has no canonical image field yet.
- [ ] Mobile card/list behavior is browser-verified.
- [x] Historical semester courses remain browseable and are explicitly read-only.
- [ ] Regression coverage executes successfully.

## Page family: Course detail
**Legacy routes:** `/learn/courses/[courseId]`, `/learn/courses/[courseId]/[...courseTab]`  
**Legacy tabs:** Overview, Learning Path, Attendance, Discussions.

### Overview

**Priority correction (2026-10-13):** Upcoming due assignments/quizzes
take precedence over live sessions even when the live session is earlier,
and a due assessment cannot be hidden by the six-item activity-feed limit.
Within a type, choose the earliest deadline. Next published content is
the fallback, linked to the exact lesson and item. Source/unit implementation
is FIXED pending cross-role/browser verification.

**Time-consistency fix:** Upcoming activity uses the course-service load
snapshot for content availability and quiz deadlines, instead of an impure
React-render-time clock call. Regression and browser proof remain outstanding.

**Source-only implementation update:** sanitized course descriptions use legacy 350-character Read more / Show less, and long discussion-backed course updates can independently expand. Full browser and family acceptance remain outstanding.

Legacy contract:
- course identity/teacher/class context;
- course summary and learner progress;
- obvious route into the next learning item;
- correct not-found/access-error behavior.

- [x] Overview content is compared section-by-section: About/learning takeaways, faculty/class context, next action, progress, upcoming assessments/live sessions, and course-team updates are represented. Exact faculty-side announcement authoring UI is tracked in the Faculty parity pass.
- [x] Class/course context cannot leak another section's data.
- [x] Continue/next-learning action matches the learner's real progress.
- [x] Loading/not-found/access-error states are implemented.

### Learning Path
Legacy contract:
- ordered lessons;
- lesson expand/collapse;
- content rows for video/resource/live class/assignment/quiz;
- locked/scheduled/available/completed state;
- content open/play/read actions;
- assignment/quiz interaction and progress refresh.

- [x] Lesson ordering and grouping match.
- [x] Expand/collapse state and deep links work.
- [x] Every legacy content type has a vNext representation.
- [x] Availability/schedule/locked/completed states are represented and future live-class URLs are withheld.
- [ ] Video/resource/live-class actions are implemented end-to-end: YouTube progress, authenticated range-capable Cloud Storage video streaming, protected resource open/download and scheduled live-class links are wired. Final browser verification still requires a configured GCS bucket.
- [x] Assignment submit/view state is verified including late submission.
- [x] Quiz attempt/result state is implemented with attempt/deadline/result policy.
- [x] Progress updates without stale cross-lesson state are protected by monotonic progress writes.
- [x] Empty and partial-content states are implemented.
- [x] Roadmap lesson headers now expose current/completed/in-progress state plus per-lesson lecture/resource/assessment/live counts.
- [x] Roadmap rows expose assignment overdue, expired-unattempted quiz, and partial video/YouTube watched-percentage cues from the same progress/deadline data used by the interaction controls.
- [ ] Exact legacy compact-row → content modal/drawer interaction remains open; vNext still expands the rich interaction inline.

### Attendance tab
Legacy contract:
- course/class attendance summary;
- session/day detail;
- present/absent/percentage presentation;
- no-data and error states.

- [x] Course-level attendance domain exists.
- [x] Attendance summary and percentage are month-scoped like legacy.
- [x] Previous/direct month picker/next navigation is implemented.
- [x] Future classes remain visible as Scheduled and are excluded from held/percentage math.
- [x] Threshold messaging includes legacy-style can-miss / must-attend recovery guidance.
- [x] Session/day detail is implemented.
- [x] No-data/error/loading states are implemented through the Course route boundary.
- [x] Learner cannot mutate attendance.
- [ ] Responsive mobile cards are implemented but await browser verification.

### Discussions tab
Legacy contract:
- classroom discussion feed;
- post/reply interaction where allowed;
- author/time context;
- empty/loading/error states;
- class/course isolation.

- [x] Discussion read model exists.
- [x] Create/delete-own actions match the learner permissions of the legacy flat discussion feed.
- [x] Author/time/Faculty context is preserved.
- [x] Empty/loading/error states are implemented.
- [x] Cross-class isolation is covered by integration regression tests.
- [x] Consecutive messages from the same sender are visually grouped within the legacy five-minute window and day boundaries are preserved.
- [x] Initial load lands on the newest message; background polling keeps the reader in place and shows a new-message counter while they read history.
- [x] Multiple pinned messages expose count/context and the composer keeps the legacy persistent invitation/help cue.
- [ ] Responsive/mobile discussion behavior still needs browser verification.

## Page: All Assignments

**2026-10-13 implementation improvement:** aggregate assignment due/late
labels now use an immutable service snapshot, with pure-model unit tests
for overdue-but-submittable, due-soon, submitted-late and unpublished-grade
states. Browser/file-backed submission parity remains open.

**Legacy:** `/learn/allAssignments`  
**vNext:** `/learn/allAssignments`

Legacy contract audited from `AssignmentsContent`:
- page header;
- aggregate assignment list across courses;
- course filter;
- pagination;
- course/created/due metadata;
- learner states: Not submitted, Due soon, Overdue + late submission allowed, Submitted, Submitted late, Graded;
- primary card action to view/submit;
- assignment submission/view drawer;
- metrics/summary pills;
- loading skeleton, request error, zero-assignments and filtered-empty states.

- [x] Aggregate list includes every published assignment in learner scope.
- [x] Course filter behaves like legacy and resets pagination appropriately.
- [x] Legacy 20-row pagination behavior is implemented.
- [x] Created/due metadata and Not submitted / Due soon / Overdue / Submitted / Submitted late / Graded labels are represented.
- [x] Published overdue assignments remain submittable.
- [x] Aggregate assignment cards open an in-page right-side assignment drawer with due/status/instructions, existing learner submission, published grade/feedback and a secondary exact Learning Path deep link.
- [x] Written-response and HTTPS-link submission/view flows are available directly in the drawer.
- [ ] File-backed assignment submission remains BLOCKED on the shared secure Cloud Storage workflow; do not treat text/link parity as file parity.
- [x] Grade visibility is masked until published.
- [x] Metrics use the full aggregate set rather than page-only counts.
- [x] Loading/error/first-run/filtered-empty states are implemented.
- [x] Deep link identifies the exact lesson + assignment under the Assessments filter.
- [ ] Mobile behavior is verified.

## Page: All Quizzes
**Legacy:** `/learn/allQuizzes`  
**vNext:** `/learn/allQuizzes`

Legacy contract:
- aggregate published quizzes across courses;
- course filter + pagination;
- attempt/result state;
- due/close timing;
- primary open/take/view-result action;
- loading/error/empty states.

- [x] Aggregate list scope matches legacy published/closed learner quiz scope.
- [x] Course filter and 20-row pagination are implemented.
- [x] Not attempted / attempted / missed / result-published states are represented.
- [x] Attempt limit and close/deadline behavior are represented.
- [x] Deep link opens the exact quiz + delivery in the standalone attempt/review flow.
- [x] Loading/error/empty/filtered-empty states are implemented.
- [ ] Mobile behavior is verified.

## Page: Standalone Quiz Attempt

**2026-10-13 implementation improvement:** session-storage answers and
question index are restored with validation after quiz data loads and before
autosave begins. Missing/invalid drafts no longer block quiz loading, and
the quiz deadline clock advances while the page stays open. Unit/browser
reverification remains required, especially multi-tab and refresh races.

**Legacy:** `/quiz`

Legacy contract:
- full-screen/no-layout attempt experience;
- question navigation;
- answer state;
- submit/confirm;
- result/error handling;
- inline error boundary with retry.

- [x] Question rendering supports the legacy Single and Multiple choice types.
- [x] Previous/next/question navigation is preserved.
- [x] Answer state survives question navigation and refresh through session-scoped persistence.
- [x] Submission confirmation includes the legacy unanswered-question warning plus in-memory/session duplicate-submit locks; the database unique attempt-number constraint is the final race guard.
- [x] Result visibility follows publish policy.
- [x] Fatal render/request error gives a recoverable retry state.
- [x] Back behavior returns to prior context with All Quizzes fallback, and successful submission returns after the legacy-style short confirmation window.
- [ ] Mobile layout is implemented responsively but still needs browser verification.

## Page: Class Schedule
**Legacy:** `/learn/calendar`

Legacy contract:
- learner class schedule;
- course/class filtering where exposed;
- calendar navigation/current period;
- session details;
- loading/empty/error.

- [x] Derive schedule only from learner's active section(s); no arbitrary section-id access.
- [x] Calendar/date navigation is implemented.
- [x] Course/class filters match legacy.
- [x] Session title/time/course/faculty/location details are represented.
- [x] Today/upcoming cues are equivalent.
- [x] Loading/no-sessions/error states are implemented.
- [x] Timezone/date handling is implemented with browser-local calendar grouping and offset-aware persisted timestamps.
- [x] Mobile agenda/list fallback is implemented in the responsive component; final browser verification remains.
- [x] Schedule route has explicit loading and retryable error boundaries, distinct from true empty/filtered-empty states.
- [x] Event links land directly on Course Overview without an intermediate redirect.
- [ ] Regression coverage executes successfully in CI/browser.

## Page: Attendance Summary

**2026-10-14 per-course attendance-history drill-down (PARTIAL):**
`/learn/courses/[deliveryId]/attendance-summary` is a read-only course
details view linked from the canonical Course workspace. It groups only
existing held, marked/unmarked, and scheduled sessions by IST month;
displays the stored college threshold and no-data/filtered-empty states,
and never treats missing records as absences. Zod validates the delivery UUID
and optional month, central `academics.read` plus persisted active learner
membership protect the data, and the existing delivery-scoped attendance
reader supplies the authorized course records. No mutations or unregistered
tables. Browser parity and executed DB results remain outstanding.

**Legacy:** `/learn/attendance`

- [x] Overall attendance summary exists.
- [x] Per-course attendance breakdown exists.
- [x] Eligibility/threshold messaging matches configured policy where legacy shows it.
- [x] Present/absent/session totals are correct.
- [x] Empty/loading/error states are implemented; route failure is explicitly distinct from a zero-record month and exposes Retry.
- [x] Server-resolved course choices eliminate the legacy raw-course-id hydration flash and auto-select the first valid course.
- [x] Desktop table and responsive mobile attendance cards are implemented; final browser verification remains.
- [x] Learner view is read-only and tenant scoped.
- [ ] Attendance regression coverage is authored but must actually execute successfully in CI/browser verification.

# My Placements

## Page: Placements Home

**2026-10-14 activity addition (PARTIAL):** recent placement activity now
projects up to eight persisted events from the learner's own journey:
application submissions/withdrawals, published screening decisions and
applied round results. No staged/internal results, inferred dates or
fabricated history. The responsive dashboard section displays IST dates,
links to the owned application and keeps a truthful no-events state.
Exact legacy card layout, deep-link/browser proof and executed DB tests
remain open.


**2026-10-13 source parity expansion:** a real learner-scoped dashboard
now summarizes distinct open drives, active applications, scheduled
assessments/interviews and issued offers. Its next action prefers assessments
in the coming seven days, then interviews, then the next real scheduled event,
then Browse Drives. The same timeline powers a chronological seven-day
preview and actionable alerts. Effective approved reschedules override the
original slot. A first-run browse hero appears when no applications exist.
A source-independent, testable model covers ordering, counts, and edge cases.
Legacy funnel/status segmentation, partial-source failures, responsive/browser
evidence and all cross-route workflows remain open; do not count this page DONE.

**Legacy:** `/learn/my-placements`

Legacy contract includes:
- hero/next action;
- placement funnel/status breakdown;
- applications/offers metrics;
- "needs attention" assessments/interviews;
- rolling career-calendar preview;
- first-run vs failure distinction;
- navigation into jobs/applications/assessments/interviews/calendar.

- [ ] Hero/next-action logic is recreated without false urgency.
- [ ] Funnel/stage breakdown matches source states.
- [ ] Application/offer metrics use the correct denominator/time window.
- [ ] Needs-attention prioritization is reproduced.
- [ ] Calendar preview and upcoming counts are reproduced.
- [ ] First-run, partial-load and hard-error states are distinct.
- [ ] Every dashboard CTA lands on the intended filtered subpage.

## Page: Applications

**2026-10-14 confirmed self-withdrawal (PARTIAL, related to L14-015):**
The existing Applications detail drawer now offers **Withdraw application**
only for a submitted own-member application. A responsive confirmation
dialog displays employer and role, describes the immediate status change,
requires a trimmed reason of 5–500 characters, and supports safe cancel,
pending, validation error, server failure and confirmed-success feedback.
The existing `POST /api/placements/applications/[applicationId]/actions`
now uses a strict Zod action/confirmed/reason payload and same-origin
protection; the existing transactional write rechecks central
`can(..., "placements.read")`, active persisted Learner membership, user
and role, and own application ID in the conditional update. It stores
the reason in private application-status history and the existing
withdrawn activity audit event only records whether a reason was given,
not its text. Duplicate POSTs are idempotent. Page-specific loading
and retryable error boundaries distinguish read failure from no data.

**Parity limitation:** the legacy **withdrawal request** (approval-driven)
is not the same as immediate `WITHDRAWN` status mutation. The Job Detail
request-for-review workflow is separate. The legacy modal/request semantics
and whether to consolidate or keep both actions still need explicit
product-owner disposition before L14-015 can be CLOSED. The Applications
parent remains PARTIAL. Authored unit and disposable PostgreSQL tests
cover real success/history/audit, idempotence, forged-college, suspended,
wrong-role and bad-input denial; executable/browser acceptance remains open.



**2026-10-14 offer expiry visibility (PARTIAL):** `LearnerPlacementOffers` now prioritizes issued actionable offers by the recorded nearest expiry, warns for a response due within 48 hours, and hides Accept/Decline after a recorded expiry while showing why. The action endpoint still transactionally enforces eligibility/status/expiry. The clock is a server-authored ISO snapshot, not `Date.now()` in React render. Pure unit and independent learner PostgreSQL tests cover timing and own-member denials. Remaining: execution of typecheck/lint/unit/PG, responsive browser test of an expiry boundary, offer history/legacy modal comparison.

**2026-10-14 offers-browse addition (PARTIAL):** a dedicated
`/learn/my-placements/offers` page lists all persisted offers belonging
to the authenticated learner and provides All/Awaiting/Accepted/Closed
views with honest first-run/filtered empty states. Applications and the
placements dashboard link to it; existing offer-response actions are
reused without adding a write endpoint. No unregistered notice or
saved-job persistence is read. Full legacy offers modal and browser
verification remain open.


**2026-10-14 application detail extension (PARTIAL):** the existing
applications drawer now links to separate read-only Application History and
Company Preview pages. History reads only registered
`placement_application_status_history` (migration 0021), showing actual status
transitions or a truthful no-records state without private actor/reason fields.
Company Preview reads registered company/relationship records (migration 0016)
only for an application owned by the authenticated learner, sanitizes HTTPS
website links and shows honest no-biography/logo states. Both preserve central
learner placement access checks, explicit `placements.read`, UUID validation,
loading/retry, responsive layouts and unknown/cross-member not-found. These
pages do not yet reproduce legacy in-page modals; executed browser and
database acceptance remain open.

**2026-10-13 implementation update:** learner's application list now has
URL-aware search, All/In Progress/Completed views, stage filters,
recent-activity/company/oldest sort and 20-row pages. Each Journey
card offers an explicit application-ID link that opens a detail drawer,
including screening feedback, confirmed round history and routes to
assessment/interview workspaces. The labels derive only from persisted
journey status, with deterministic unit tests. Full legacy history modal,
employer company preview, withdrawal-request dialog, offer confirmations,
and browser/edge-state verification remain open.

**Legacy:** `/learn/my-placements/applications`

Legacy contract audited from `ApplicationsContent`:
- search with URL state/back-forward hydration;
- stage filter chips and All/In Progress/Completed views;
- sort: recent activity/stage/company;
- attention banner and offered-list CTA;
- application cards + journey visualization;
- contextual actions: assessment/interview/offer/similar roles/details;
- Application Detail modal;
- Application History modal;
- Company Preview modal;
- withdrawal-request modal with reason;
- offer accept/decline confirmation flows;
- empty/filtered-empty/loading/error states.

- [ ] Search, URL-state and browser Back/Forward behavior match.
- [ ] **PARTIAL (L14-003):** stage chips now derive from own persisted application screening, display counts, and update the existing URL-backed filter. In Progress/Completed views already exist. Remaining: executed PostgreSQL/unit, TypeScript/ESLint and mobile/Back-Forward browser parity.
- [ ] Sort options match.
- [ ] Attention banner opens the complete relevant filtered list.
- [ ] **PARTIAL (2026-10-14 — application milestones):** the Applications detail drawer now presents an own-application timeline from real submitted/screening/round-result/withdrawal timestamps, newest first, with an exact link to the existing read-only persisted status-history page. It does not fabricate missing time/outcomes or duplicate append-only records. Pure and independently seeded PostgreSQL tests cover own data and forged-college, suspended, wrong-role denial. Remaining: executed tests, full legacy timeline/modal parity, browser accessibility and history consistency verification.
- [ ] Detail modal contains every legacy section/action.
- [ ] History modal is implemented.
- [ ] Company-data preview modal is implemented with retry/empty states.
- [ ] Withdrawal request modal/validation is implemented.
- [ ] Offer accept/decline confirmation and consequences are implemented.
- [ ] Assessment/interview/job deep links work.
- [ ] Loading/error/first-run/filtered-empty states are verified.

## Page: Assessments

**2026-10-14 assessment due-bucket addition (PARTIAL, L15-005/006):**
The Assessments workspace now provides count-backed "Due today" and
"Due this week" quick filters sourced only from the learner's own
shortlisted, scheduled TEST/VENDOR_TEST rounds in registered tables.
Buckets use effective approved reschedules and Asia/Kolkata days; the
calendar week is Monday–Sunday (including due today), not a rolling seven
days. Past and unscheduled rounds are not in these due buckets. No
scheduled round is inferred to be submitted or employer-completed.
Conflicting generic filters are reset when choosing a quick bucket.
An adapter checks the persisted active learner access and central
`placements.read` before reading rounds. Dedicated route loading/error
with Retry, responsive filter chips and truthful filtered-empty behavior
are authored, as are IST boundary unit and PostgreSQL denial tests.
Employer-submission/other bucket/source parity, executed tests and
browser acceptance remain open.


**2026-10-14 official-results extension (PARTIAL):** linked, read-only
`/learn/my-placements/assessments/results` lists persisted, applied
TEST/VENDOR_TEST results from the Learner's authorized applications.
All/Passed/Not passed/Other views show stored scores and shared candidate
feedback, if any, with actual IST timestamps, application/drive links and
truthful first-run or filtered-empty states. Unpublished results, other round
types and scheduled-but-unreported assessments are not treated as outcomes.
The legacy Pending/Completed employer-submission workflow, browser and
executed DB checks remain outstanding.


**Learner schedule browser update (2026-10-13):** dedicated Assessment rounds
now support employer/round search, Upcoming/Past/Awaiting schedule buckets,
Today/7-day urgency filters, sorting, empty/filter states and a details drawer.
Only existing learner-authorized scheduled rounds are listed; no provider
submission or employer result is inferred from the calendar time. Approved
reschedules replace the original start. A local, membership-scoped mark-submitted reminder with undo is now available
inside Assessment round details. It explicitly does not submit the assessment
or record employer completion; validated browser storage and corruption
fallback are tested. Provider completion and browser acceptance remain open.

**Legacy:** `/learn/my-placements/assessments`

Legacy contract:
- Pending / Completed views;
- search;
- urgency filter;
- buckets: Due today, Due this week, Later, Waiting on employer link, No deadline, Overdue;
- open external assessment;
- local "mark submitted" reminder + undo/dismiss-change behavior;
- safety notice that local marker is not employer submission;
- time-critical confirmation before leaving for provider;
- job/application navigation;
- loading/error/empty/filter-empty states.

- [ ] Pending/Completed views match.
- [ ] Search and urgency filters match.
- [ ] All urgency buckets are represented correctly.
- [ ] Employer-link unavailable state is explicit.
- [ ] External-provider launch confirmation is implemented.
- [ ] Any local reminder state is clearly non-authoritative.
- [ ] Undo/dismiss/change behavior is accounted for or intentionally redesigned.
- [ ] Job/application deep links work.
- [ ] Loading/error/empty states match.

## Page: Interviews

**Learner schedule browser update (2026-10-13):** dedicated Interview/GD
rounds now support company/round search, honest Upcoming/Past/Awaiting
schedule buckets, urgency filtering, sorting and a details drawer with
approved reschedule details and sanitized meeting links. A scheduled time
is not treated as confirmed attendance; learner confirmation and browser acceptance remain open. The Interview
detail drawer now deep-links to the existing real placement request workflow,
preselecting only a round already authorized in the Learner's request workspace.
Creating a request never changes the shared schedule until approved.

**Legacy:** `/learn/my-placements/interviews`

Legacy contract audited from `InterviewsContent`:
- Upcoming / Past;
- search;
- join-state countdown/live/past badges;
- Confirm;
- Join now;
- Details;
- .ics download;
- Google Calendar link;
- Request new slot;
- Cancel reschedule request;
- Decline interview;
- Interview Detail modal;
- designed confirmation modal for destructive/final actions;
- Reschedule Request modal: reason, preferred date/daypart/details;
- Reschedule Summary modal + copy;
- withdrawal-request modal;
- empty/loading/inline-error states.

- [ ] Upcoming/Past partition and countdown logic match.
- [ ] Search and highlight deep link work.
- [ ] Confirm/Join/Details actions match status gating.
- [ ] .ics and Google Calendar actions are supported or explicitly redesigned.
- [ ] Reschedule request form fields/validation match.
- [ ] Cancel-reschedule behavior is implemented.
- [ ] Decline confirmation makes consequences explicit.
- [ ] Detail modal is complete.
- [ ] Reschedule summary/copy behavior is accounted for.
- [ ] Withdrawal request is implemented.
- [ ] Loading/error/empty states are verified.

## Page: Career Calendar

**2026-10-13 source parity improvement:** Career Calendar now has
Agenda / Month / Week / Day modes with period navigation, Today,
event-kind filters, a month/week date grid and a mobile-friendly agenda.
Times are displayed in India timezone using saved UTC instants; an
approved round reschedule replaces the original slot. Export produces
an .ics calendar for the learner-visible rounds and deliberately avoids
invented event duration or protected employer URLs. Calendar date
grouping, leap/edge navigation, rescheduling and escaping are covered
by pure unit tests. Legacy job-deadline, TALK and college BLOCKED event
sources, event detail drawers, full responsive/browser acceptance and
cross-page navigation still remain open.

**Legacy:** `/learn/my-placements/calendar`

Legacy contract:
- Agenda / Month / Week / Day modes;
- previous/today/next navigation;
- date picker;
- event-type filters;
- event chips;
- selected-event detail drawer;
- partial source failure alert + retry;
- empty calendar state.

- [ ] All four calendar modes are implemented.
- [ ] Previous/Today/Next and date picker behavior match.
- [ ] Event-type filters match.
- [ ] Event detail drawer is implemented.
- [ ] Event deep links/actions work.
- [ ] Partial-data errors do not masquerade as empty.
- [ ] Timezone handling is verified.
- [ ] Mobile agenda fallback is verified.

## Page: Jobs

**2026-10-14 closing-soon extension (PARTIAL):** the published Learner
Drives page has an URL-backed seven-day application-deadline toggle. It
uses a single server clock snapshot passed through the authoritative
membership-scoped job service and existing deadline policy, and does not
invent deadlines for unscheduled or already-expired jobs. Pure-model and
DB scope-denial tests are authored; saved-job storage is still unregistered,
and legacy tab/browser parity remain open.


**2026-10-13 browse update:** the dedicated Learner Drives page now
filters the persisted role-option feed by search text, employment type,
location and ability to apply, sorts by deadline/CTC/role title,
and paginates at 20 rows. Filter/search/page values use query parameters
and rehydrate the search field on browser Back/Forward; filtering does
not alter eligibility decisions or application submissions. Source/pure
regression tests were authored. Saved drives, closing-soon facet,
full legacy tab composition and browser acceptance remain open.

**Legacy:** `/learn/my-placements/jobs`

Legacy contract:
- All drives / Saved tabs;
- search with URL state/back-forward;
- sort: deadline/newest/highest CTC;
- job-type filter;
- location filter;
- eligible-only and closing-soon toggles;
- save/unsave;
- pagination;
- not-open/closed grouping;
- deadline urgency labels;
- saved-jobs load failure distinct from all-jobs failure;
- first-run/filtered-empty states.

- [ ] Tabs, search, URL state and Back/Forward match.
- [ ] All sorts and filters match.
- [ ] Eligibility filter is based on authoritative eligibility.
- [ ] Closing-soon semantics match legacy.
- [ ] Save/unsave behavior and failure state are implemented.
- [ ] Pagination and closed/not-open grouping match.
- [ ] Deadline labels match.
- [ ] Loading/partial-failure/empty states are verified.

## Page: Job Detail

**Learner detail implementation (2026-10-14):** dedicated role-aware
published-drive detail replaces the generic full-page job cards. Breadcrumb
navigation, company/description/location/work/deadline facts, scoped eligibility
breakdowns (rule pass/fail/missing with actual/required), applicant status and
real role-specific apply/withdrawal actions are composed from the existing
authorized Learner job service. Safe external URLs reject non-web schemes.
Learner job cards now link to the authorized dedicated Drive Detail
route, so details are discoverable from Browse Drives and the placements
dashboard rather than direct URL navigation only.

Job action confirmations now use explicit learner withdrawal request and external
submission dialogs instead of `window.prompt` or an immediate declaration.
Withdrawal text follows the 3–2000-character API contract and does not
change application status until the placement team approves. External
submission is explicitly learner-declared, not independently verified.
Legacy resume attachment/preview, rich employer company facts, receipts and
browser acceptance remain open.

**Legacy:** `/learn/my-placements/jobs/[jobId]`

Legacy contract:
- eligibility panel;
- verified job/company details;
- apply/application-state CTA;
- navigation to Applications/Jobs;
- retry/not-found/access handling.

- [ ] Eligibility checklist/reasons match.
- [ ] Job/company/role/compensation/location/deadline details match.
- [ ] Apply/current-application state is authoritative.
- [ ] Registration/external-action requirements are represented.
- [ ] Retry/not-found/closed/not-eligible states are explicit.
- [ ] Back/navigation behavior matches.

## Page: Placement Cell

**2026-10-14 offer-response preview (PARTIAL, L18-012):**
Acceptance of an ISSUED, still-unexpired persisted offer now requires a
confirmation dialog with the recorded company, role, CTC, joining date and
deadline. The preview is informational; the same existing Zod-validated,
same-origin guarded POST rechecks learner placement permission, persisted
own-membership, status and expiry transactionally. Closed/expired offers
cannot be confirmed in the preview. An empty offer list remains an honest
first-run state on the dedicated Offers page. Decline flow and full legacy
offer/letter parity remain open; do not claim complete workflow parity.


**2026-10-14 personal placement alerts (PARTIAL):** a read-only section on
`/learn/my-placements/placement` shows up to eight actual PLACEMENTS-module
personal notifications for the authorized learner, sourced from registered
activity events and in-app notifications. The service checks persisted active
learner membership, paid placement participation and central
`placements.read`; events must belong to the same college and user.
Unsafe action URLs are removed, and timestamps use IST. The UI explicitly
does not call these records official college-wide notices: a separate
college-published notice/dispute source is still absent, and L18-023/024
remain GAP. No client mutation route was introduced; loading/error/empty
states are explicit.

**Legacy:** `/learn/my-placements/placement`

Legacy contract audited from `PlacementCellContent`:
- debar alerts;
- registration card with choice Placements/Higher Studies/Not Interested + consent;
- Placement Rules link;
- Offers card with Accept and Decline confirmation;
- "Your rounds" with Confirm and Ask to reschedule;
- Requests list + New Request;
- request types: registration change, correction, external offer, absence dispute, offer extension;
- offer-letter/file flow where applicable;
- Notices from placement cell + dispute action;
- New Request modal;
- Reschedule modal;
- Offer acceptance preview modal;
- page-level retry/error/loading/empty.

- [ ] Registration/choice/consent workflow matches.
- [ ] Debar state is explicit and correctly scoped.
- [ ] Offers actions and confirmation consequences match.
- [ ] Round confirm/reschedule workflow matches.
- [ ] Request list and all request types are implemented.
- [ ] New Request modal dynamically shows correct fields.
- [ ] Notice dispute flow is implemented.
- [ ] Offer acceptance preview is implemented.
- [ ] Loading/error/empty states are verified.

## Page: Placement Rules

**2026-10-14 learner rules-preparation parity (PARTIAL):** The existing
`/learn/my-placements/rules` now shows a context-aware Back link, accepting
only the Zod-validated `from=dashboard|cell|drives` values and falling
back to My Placements. Placement Cell and Drives link into this page
with their return context. A read-only personal "Where you stand" panel
shows only real membership-scoped academic evidence (CGPA, backlog count,
gap years) and recorded job preferences. A numeric zero is recorded,
not missing. This is explicitly **not** a global eligibility verdict,
verified academic certification, college-approved placement clearance or
an invented readiness score. The backend validates the current persisted
active LEARNER membership, program/section inheritance, paid placement
participation and central `placements.read` before reading registered
source tables. Missing evidence is an honest unknown state; scoped per-drive
eligibility remains accessible via Drives. Mobile cards, dedicated loading
and error/retry boundaries, pure-model unit and PostgreSQL role/tenant denial
tests are authored. No writes were introduced; actual CI/browser evidence
remains open. College-authored policy and applicability-version wording
remain blocked/partial because there is no registered policy source.


**Learner navigation correction (2026-10-14):** academic evidence and job
preferences links now lead to anchored, working editors on the Learner
Placements workspace, rather than removed Learner Profile panels. The
college-authored policy remains database/product dependent.

**Legacy:** `/learn/my-placements/rules`

- [x] Back action uses validated origin or a safe dashboard fallback; browser verification pending.
- [x] Personal "Where you stand" note uses recorded own-member data only, not invented policy.
- [ ] College placement rules summary uses authoritative current policy.
- [ ] Rule-change applicability wording is preserved.
- [x] Loading/error/retry states are implemented with explicit route boundaries; executed browser proof pending.

# Projects

## Page: Projects list
- [ ] Project cards/rows expose title/status/team/mentor/progress signals present in legacy.
- [ ] Active/archived/attention states match.
- [ ] Empty/loading/error states match.
- [ ] Navigation opens the correct learner project.

## Page family: Project detail
Legacy areas include Overview, Team, Sprints/Board, Tasks, Resources, Meetings, Delivery and Activity.

- [ ] Overview narrative, goals and project status are complete.
- [ ] Team members/roles/mentor information is complete.
- [ ] Sprint list/current sprint/state matches.
- [ ] Task board/list, task detail, status changes and submissions match learner permissions.
- [ ] Resource links/files/pinned/required state match.
- [ ] Meeting list/request workflow/status/timezone handling match.
- [ ] Delivery/final submission/status/review feedback match.
- [ ] Activity/history feed matches meaningful legacy events.
- [ ] Archived/read-only behavior is enforced.
- [ ] Loading/not-found/access/error states are verified.
- [ ] Mobile task/project interaction is verified.

# Notifications

## Page: Notifications

**2026-10-14 placement-notification deep links (PARTIAL):** Personal placement notifications now validate and canonicalize persisted application UUID drawer links and offers status tabs, removing untrusted college/user query selectors. Assessment actions retain their own round validation; all targets still enforce the signed-in learner at the destination. Unit and isolated PostgreSQL tests use a fresh learner and scoped notification, with forged-college/suspended/wrong-role denial. Remaining: test execution, producer-level link coverage, browser navigation and unread/read acceptance.


**2026-10-14 Learner positive-path + scoped acknowledgement addition
(PARTIAL, L29-017):** New disposable PostgreSQL integration fixture
creates a learner user, active college membership and enrollment,
shortlisted application + scheduled test round, a personal PLACEMENTS
notification, and a same-recipient notification originating from a
different college. The tests assert actual Profile academic identity,
assessment round/day bucket, notification history, placement alert
projection, idempotent single mark-read, scoped bulk mark-read, and
cross-college/cross-role denial. The tests are **authored, not yet
executed**, so they are not green evidence.

Learner inbox and keyset history now restrict events to the current
persisted college and revalidate active user/LEARNER membership with
central `academics.read`. Learner mark-read uses strict Zod UUID, own
recipient, current event college, and `readAt` audit timestamp.
Both the Learner-specific and original shared POST endpoints retain
`isSameOriginRequest`; shared routes dispatch Learner contexts to
the strict service (including suspended memberships). Bulk mark-read
is college-scoped for Learners; other roles retain their shared inbox
behavior. This does not implement non-migrated college announcements or
close general Learner Notifications browser/oracle parity.


**2026-10-14 personal notification history (PARTIAL):** added
`/learn/notifications/history`, linked from the main learner inbox.
Uses the existing registered own-recipient keyset pagination reader
(40 records/page), validating the timestamp/UUID cursor and optional
Unread view through strict Zod. Scope checks include current persisted
active Learner role, membership and user plus central `academics.read`.
Only personal notifications paginate here; readiness-gated announcements
remain in the main inbox. Counts are explicitly page-local, not a fabricated
all-history total. Existing read actions use their same-origin-guarded
endpoint. Cross-role/cross-college DB denial tests and cursor/model/source
tests are authored, but runtime test/CI and browser acceptance remain open.


**Learner-only access and recovery:** `/learn/notifications` now checks
the active Learner membership and existing central tenant permission before
fetching personal notifications or scoped announcements. A dedicated loading
skeleton and retryable error boundary distinguish request failure from an
empty inbox. Role/disabled-account negative unit checks are authored.
Browser validation and notification pagination still remain.


**2026-10-13 implementation update:** Learner's two authorized inbox sources
are now consolidated into one chronological feed, with legacy domain tabs
All / Course / Projects / Announcements / Job. Counts and scope derive from
the complete fetched set; announcements cannot receive personal read-state
mutations. Typed module classification and pinned indicators have unit/source
coverage. The legacy-style detail dialog now shows full content, category, and
timestamp, with an optional safe deep link; large-volume pagination and
mobile/browser proof remain open.

- [ ] Announcement feed behavior matches legacy.
- [ ] Personal notification feed behavior matches legacy.
- [ ] Unread/read semantics are defined and verified.
- [ ] **PARTIAL (L29-009):** recognized assessment notifications retain validated application+round UUID context and show an accurate learner assessment action; destination still enforces own membership. Other notification deep-link types need separate review. Remaining: executed PG/unit/tsc/eslint and browser navigation acceptance.
- [ ] **PARTIAL (L29-016):** personal-feed errors still fail closed; optional announcement failures show a retry alert without hiding the authorized personal inbox. Remaining: executed PostgreSQL/unit, lint/tsc, simulated-announcement-failure and mobile/browser proof.
- [ ] No cross-role or cross-college notifications leak.

# Profile

## Page: Learner Profile

**2026-10-14 career-profile coverage (PARTIAL):** The learner Profile page now reports progress across the 15 non-sensitive career sections, excluding optional Aadhaar/PAN fields from the completion denominator. It recommends an actual missing editable section through a learner-only profile deep link without claiming that fields are verified or that the learner is placement-eligible. The original 16-section detailed checklist remains unchanged. Unit tests and a PostgreSQL read test use a fresh learner and cover foreign-college/suspended/wrong-role denials. Remaining: executed unit/PG/tsc/eslint and responsive/keyboard/browser acceptance, plus separately approved verification-storage workflows.


**2026-10-14 confirmed alternate contact edit (PARTIAL, L30-007):**
The Contacts card now has a mobile-friendly Edit contact details dialog for
the optional **alternate phone** and **contact email** only. It requires a
second confirmation, uses strict Zod and displays pending, safe-cancel, error
and successful-save states. The authenticated
`PATCH /api/profile/me/contacts` is same-origin protected, authorizes
`can(context, "profile.self.manage")` and checks active persisted Learner
membership/user/role in a transaction. It updates only the
`learner_profiles.profile_document.contacts` JSON section rather than
replacing other sections. A transactional
`identity.learner_contact.updated` event records the actor/college and
changed field names **without phone or email values**. Login phone and
account email remain authoritative and unchanged; no verification or
phone/email-change request workflow is implied.

The generic Profile editor no longer offers separate contact text inputs;
its other existing profile sections still use the existing PUT workflow.
A fresh-fixture PostgreSQL integration suite covers saved contacts,
preservation of other sections, audit privacy, forged-college, suspended,
wrong-role, live suspension/role revocation and invalid-input denials.
The tests are authored pending executable PG evidence. Profile image,
resume storage, private identity, verification and browser/oracle
acceptance remain open; parent Profile stays PARTIAL.


**2026-10-14 contact deep-link and completion checklist (PARTIAL,
L30-026):** Profile now accepts strictly validated `?section=contacts`
(and other existing section IDs), scrolls to that actual card on navigation,
and exposes a mobile-responsive 16-section checklist based on the same
persisted `profileDocument` fields already used by the completion badge.
No second score is fabricated, and the checklist updates after successful
profile edits. Aadhaar/PAN details remain optional; checklist completion
does not mean verification. Unsupported Connect Accounts, storage-backed
profile image/resume and Profile Verification are not represented as ready.
Existing Profile loading/retry states and server-owned profile read/update
routes remain in place. Browser and runtime acceptance remain open.


**2026-10-14 academic identity summary (PARTIAL, L30-001):** the Profile
shows the current learner name and, when a single active enrollment is
persisted, the actual program, code, cohort and department. It verifies
the active user, college membership and LEARNER role against registered
tables, checks the program's department is in the same college and denies
ambiguous enrollment. No program is fabricated when none is registered.
The existing Profile completeness/edit workflows remain unchanged.
Unit and disposable PostgreSQL denial tests are authored; browser and
executed test evidence remain open.

**Legacy:** `/learn/profile`

Audited legacy sections:
- user summary;
- profile completeness;
- profile image;
- resume upload/import/remove;
- contacts;
- social profiles;
- address;
- personal details;
- identity;
- Aadhaar/PAN upload/import/replace cleanup;
- experience;
- education/qualifications;
- skills;
- learner projects;
- certifications;
- achievements;
- languages;
- extracurricular activities;
- hobbies;
- metadata;
- Job Preferences intentionally absent from the current learner self-profile;
- Placement Academic Record intentionally absent from the current learner self-profile;
- Profile Verification card for Education and Identity, including incomplete/ready/submitted/sent-back/verified/update-pending states;
- verified-by/date, sent-back reason, changed-since-verification semantics and visible-page refresh;
- marksheet/resume/private identity-document prerequisites for verification;
- deep-link scroll targets for contact/connect-account sections.

Closure checklist:
- [ ] User summary is implemented; profile-image self-service remains BLOCKED on Cloud Storage.
- [x] Profile completeness is calculated and refreshed after edits.
- [ ] Resume upload/import/remove, validation and old-file cleanup remain BLOCKED on Cloud Storage.
- [x] Contacts edit flow is implemented.
- [x] Social profiles edit flow is implemented.
- [x] Address edit flow is implemented.
- [x] Personal details edit flow is implemented.
- [x] Identity edit flow is implemented.
- [ ] Aadhaar/PAN file upload/import/replace remains BLOCKED on secure Cloud Storage; validated masked identity-number editing is implemented.
- [x] Experience add/edit/delete is implemented.
- [x] Education add/edit/delete is implemented.
- [x] Skills add/edit/delete/proficiency is implemented.
- [x] Projects add/edit/delete is implemented.
- [x] Certifications add/edit/delete is implemented.
- [x] Achievements add/edit/delete is implemented.
- [x] Languages add/edit/delete is implemented.
- [x] Extracurricular add/edit/delete is implemented.
- [x] Hobbies edit behavior is implemented.
- [x] Metadata edit behavior is implemented.
- [x] Job Preferences is absent from learner Profile, matching the current production self-profile; placement preferences remain placement-domain data.
- [x] Placement Academic Record is absent from learner Profile, matching the current production self-profile.
- [ ] Profile Verification Education/Identity state machine, learner submit/resubmit actions, verified badge/by/date, sent-back guidance and update-pending semantics remain open.
- [ ] Verification readiness cannot be honestly completed until marksheet/resume/private identity-document storage flows are live; those storage-backed prerequisites remain BLOCKED.
- [ ] **PARTIAL (L30-031):** existing loading and error/retry boundaries remain; returning to a visible Profile tab requests fresh saved data after a cooldown, and new server props never silently overwrite local edits. Remaining: executed PG/unit/tsc/eslint and two-tab/browser concurrent-edit acceptance.
- [x] Role redirect/fence behavior is server-safe.
- [x] Storage-backed items are marked BLOCKED until Cloud Storage is live rather than silently omitted.

## Placement-only notification preferences — chat-4 (2026-10-14)

PARTIAL — New mobile-friendly `/learn/my-placements/notification-preferences` lets the signed-in Learner explicitly confirm updates to the two registered P2 candidate-preferences notification flags. A narrow same-origin PUT uses strict Zod booleans and confirmation, central placements.read, live own-college LEARNER role/paid participation checks, and a single transactional actor audit on real changes. The update preserves role/location/CTC preferences. No-op retries do not generate fake audits. Unique-fixture PostgreSQL tests cover success, suspension, forged college, revoked role and wrong-role denials; they are authored but not executed. This is not a global course/security notification opt-out; producer delivery, browser validation and full legacy parity remain OPEN.

## Learner read-only monthly attendance calendar — chat-4 (2026-10-14)

PARTIAL — Added `/learn/attendance/calendar` alongside the existing
course/month Attendance workspace and Class Schedule day/week/month views.
The new mobile-first seven-day monthly grid shows *registered* attended,
absent, medically/excused/late, unmarked and future scheduled sessions from
the canonical Learner attendance reader, with a filterable per-day list and
links back to Course Attendance. Academic records are restricted to the
signed-in persisted active Learner college membership, role grant and
current authorized course deliveries (central `academics.read`). Zod
restricts month, status and delivery filters; unknown or foreign delivery
identifiers fail closed. India-local day grouping and no-mark denominator
handling are pure and testable. No attendance is changed by this page.

Model unit tests and a fresh-fixture PostgreSQL integration suite are
authored covering present/absent/unmarked/future sessions, pagination-free
month grouping, empty months, forged college, suspended and wrong-role
denials, and test-owned cleanup. Execution, exact legacy browser/mobile
proof and complete canonical attendance evidence remain **OPEN**; neither
Course Attendance nor Attendance summary is marked DONE by this addition.

## Learner placement preparation evidence checklist — chat-4 (2026-10-14)

PARTIAL — A new read-only, mobile-first `/learn/my-placements/preparation`
page links from My Placements and reports **four factual persisted signals**:
active academic program enrollment, at least one profile contact method,
at least one Learner profile skill, and historical placement application
activity (including withdrawn applications). Links return only to existing
authorized Learner profile or application pages. `ALL` / `RECORDED` /
`MISSING` filters use strict Zod and return honest no-match states.
The server requires the canonical persisted active Learner college membership,
role and paid Placements/eligibility scope; it checks central placements.read
and reads only the authorized current user profile/enrollment and own
placement_application rows. It does not expose private identity values,
claim eligibility, invent college requirements, or calculate a subjective
hiring-readiness score. No write route or notification is introduced.

A pure-model unit suite and an isolated fresh-PostgreSQL success/denial
integration test using the same passing Learner fixture as Attendance calendar
were authored for an actual enrolled Learner with a persisted application,
forged college, suspended/disabled account, wrong role, forged actor and
caller-injected membership scopes. Full browser/positive-PG execution
evidence, historic content completeness, and exact legacy acceptance remain
OPEN. The parent Placements dashboard and Self Profile rows remain PARTIAL.


## Chat-7 learner projects — 2026-10-14

- **L20-012 PARTIAL** — The learner Projects list now bulk-loads live, learner-scoped team members, displays primary (or available) mentor and the count of distinct active members per assigned project. Pure model and isolated-PostgreSQL tests authored. **Remaining:** execute TypeScript, ESLint, unit and disposable PostgreSQL suites; browser/mobile visual parity, cross-role producer acceptance and actual account clone verification. No DONE claim.

- **L20-013 PARTIAL** — Learner Project cards now calculate actual DONE/total tasks from authorized persisted tasks. Projects without tasks explicitly show untracked, not 0%; blocked tasks are counted separately and not inferred from unrelated states. Unit and own-learner PostgreSQL tests authored. **Remaining:** execute typecheck, lint, unit, isolated PostgreSQL and responsive browser checks; compare current legacy execution/readiness and cross-role producers.

- **L20-016 PARTIAL** — Learner Projects has a shape-matched loading skeleton and accessible error boundary with Retry. A tested pure model distinguishes no assignments from filter-excluded results only after a successful learner-scoped read; database failure cannot be labelled zero Projects. Unit and own-fixture PG tests authored. **Remaining:** execute tsc/eslint/unit/isolated-PG and loading/failure/keyboard/mobile browser assertions, compare legacy failure and filtering states.

- **L20-017 PARTIAL** — Learner-only mobile search/status/attention/rows filters now collapse behind a touch-sized summary with active selection count, clear/apply actions, max-100 search and full-width inputs. Existing shared desktop and Mentor controls are unchanged; pagination touch targets enlarged in the learner view. Pure-model and scoped-PG tests authored. **Remaining:** run tsc/eslint/unit/isolated-PG; mobile 390px and desktop browser comparison, keyboard/details focus, pagination/Back/Forward and legacy visual acceptance.

- **L25-006 PARTIAL (2026-10-14 chat-7):** Learner Board supports URL-backed, 100-character-bounded search of authorized persisted task title/description; filters the actual workspace tasks rather than only hiding visual cards; counts/filtered empty and mobile form provided. Pure-model and unique-learner PG regression tests authored. **Remaining:** execute typecheck/lint/unit/PG and desktop/mobile/browser Back-Forward verification against frozen legacy; no file or external-send support.

- **L25-002 PARTIAL (chat-7):** learner Board priority filter (LOW/MEDIUM/HIGH/CRITICAL) is applied to authorized persisted task rows and composes with title/description search. Pure model, in-test learner PG positive and role/scope denial cases authored. **Remaining:** type/lint/unit/PG execution, IST-neutral responsive browser, current legacy Board comparison and accessibility testing.

- **L25-003 PARTIAL (chat-7):** authorized learner Board now supports persisted project sprint-ID filtering, composed with task title and priority filters. Only scoped workspace sprint choices are rendered; foreign selector matches no task. Unit and own-learner PG denial fixtures authored. **Remaining:** execute static/unit/PG gates, mobile/desktop browser and legacy sprint-scope parity.

- **L25-005 PARTIAL (chat-7):** learner Board now filters real tasks by their persisted sprint→release association, composable with search, priority and sprint. Only authorized project release choices are rendered. Pure model and unique learner PG success/foreign scope/suspended/wrong-role cases authored. **Remaining:** execute static/unit/PG, mobile keyboard and browser parity; no file feature added.

- **L25-013 PARTIAL (chat-7):** Board distinguishes no persisted tasks from valid tasks excluded by search/priority/sprint/release filters; no fabricated empty state on data failures. Pure model and unique-learner PostgreSQL reads/foreign-scope denial authored. **Remaining:** runtime TypeScript/ESLint/Vitest/PG and mobile/browser parity, including stacked release containers when filtered empty.

- **L25-014 PARTIAL (chat-7):** learner Board filters now collapse behind a compact 44px touch summary on narrow screens, report actual active URL-filter count, and display responsive grid controls on desktop with large input/button targets. Existing project task rendering and authorized data unchanged. Pure-model/unit and unique-learner PG denial tests authored. **Remaining:** execute tsc/eslint/unit/PG, mobile (390px) browser keyboard/details and no-horizontal-scroll checks, legacy layout parity.

- **L25-008 PARTIAL (chat-7):** learner Board has exact task links preserving URL filter state and a native modal showing only authorized task detail, sprint, priority, status, description and acceptance criteria. Foreign task IDs cannot resolve from own scoped workspace; no mutation or contact exposure. Pure/unit and unique-learner PG denial tests authored. **Remaining:** run tsc/lint/Vitest/isolated PostgreSQL and browser focus/escape/back-forward/mobile no-horizontal-scroll/legacy drawer parity.

- **L21-012 PARTIAL (chat-7):** learner Project detail now has skeleton/loading, retryable error UI, and a non-enumerating unavailable page. Missing/foreign-college/suspended/role-revoked Project reads map to not-found while unexpected service errors remain retryable; UUID route validated. Unit plus own-learner isolated-PG success and negative tests authored. **Remaining:** typecheck/lint/Vitest/PG execution, browser not-found/loading/retry/access/keyboard/mobile parity.

- **L22-002 PARTIAL (chat-7):** learner Project Overview now reads goal, description and deliverables solely from its authorized immutable assigned project-template version. Empty authored content is explicitly absent; no invented definition-of-done text. Pure model/unit and own-learner PG success and denial fixtures authored. **Remaining:** execute static/unit/isolated-PG and compare exact legacy Overview/mobile and template authoring producer.

- **L21-008 PARTIAL (chat-7):** legacy learner Project URL `?tab=tasks` now renders canonical Board and sets correct active tab without changing project access rules; canonical links remain `?tab=board`. Pure-model unit and self-fixtured PG read/denial tests authored. **Remaining:** typecheck/lint/Vitest/isolated-PG, Back/Forward and mobile/browser parity.

- **L21-009 PARTIAL:** legacy `?tab=meetings` opens the People & Meetings learner workspace. Unit and own-learner PG denial tests authored. Remaining: executed checks, legacy/browser/mobile acceptance.

- **L25-007 PARTIAL:** learner Board task index shows persisted title, status, priority and sprint. Type and story points are not persisted, not fabricated. Unit and own-learner PG positive/scope/role denial tests authored. Remaining: executed tests/browser parity and migrated type/points producer if required.

- **L21-010 PARTIAL (chat-7):** authorized learner Project final delivery now has an explicit canonical tab, so `?tab=delivery` highlights the matching navigation and displays persisted own Project submission/review flow. No new files or external sends. Unit/own-learner PG scope-denial tests authored. **Remaining:** executable test gates, mobile navigation, Back/Forward and legacy delivery workspace parity.

- **L20-014 PARTIAL (chat-7):** Learner Projects list explicitly labels persisted ARCHIVED instances as read-only without treating COMPLETED projects as archived. No write permission or storage changes. Pure model and PG persisted own-learner/foreign-college/suspended checks authored. **Remaining:** execute tsc/lint/Vitest/isolated PG and confirm archived navigation/disabled actions against legacy mobile/browser behavior.

## 2026-10-14 attendance filter correction — PARTIAL

The Attendance workspace now uses IST for record month membership and date/time labels, including UTC month/year boundaries. The current Course/month selection is resolved from the URL on each navigation, so restored history no longer leaves stale local filters. Query months and Course IDs are validated and constrained to the server-authorized Course list. Existing loading/error/empty and mobile views remain in place. Pure boundary/query tests and an own-enrolled-learner PostgreSQL success/foreign-college/suspended/wrong-role test were added. Disposable PG execution is blocked by root-only sandbox user mapping; mobile/browser Back/Forward acceptance remains outstanding. No parity row is marked DONE.

Board Assignee/Mine remains blocked: registered project_tasks has no assignee column. Course thumbnails remain blocked by the absence of a verified canonical image association; no image or ownership data was fabricated.

## 2026-10-14 assessment deadline consistency — PARTIAL

All Assignments and All Quizzes now advance one service-snapshot clock using elapsed monotonic time after mount, including a visibility-return update. Quiz desktop actions, mobile availability, assignment due/late labels and the submission drawer use the same instant. No render-time device wall clock or unpublished score is exposed. Dates display in IST. Pure deadline-transition tests and an own-enrolled-learner PostgreSQL read/denial test were authored; disposable PG remains unavailable in the root-only sandbox. Browser deadline-crossing, background-tab and mobile verification remain open; text/link submission policy is unchanged and files remain blocked.

## 2026-10-14 Project Activity categories — PARTIAL (L27-002..006, L27-008/010)

The learner Activity tab now filters persisted own-project events by Sprint changes, Task changes, Team and meetings, Resources shared, and Submission updates. Task submissions/reviews stay in the task source category; final-delivery/submission events use Submission updates. Project details is also retained from the legacy filter. It shows IST timestamps, actor names and saved subject labels with wrapping mobile cards. Empty source and filtered-empty states are distinct; Apply/Clear retain the exact project/tab. The feed explicitly states its latest-100-event limit rather than implying full archive search. Pure category tests and an independently seeded own-college PG test cover success, foreign-college event exclusion, suspended/wrong-role/foreign-project denial. PG execution and desktop/mobile browser verification remain open. Missing/unemitted historical event types are not fabricated; date range filtering is still outstanding.

## 2026-10-14 Project Activity IST date range — PARTIAL (L27-007)

Activity now supports From/Through calendar dates in IST, inclusive of the whole end date. Zod rejects impossible/repeated/reversed date bounds and unknown categories with a visible validation state. Category and date restrictions are applied in the PostgreSQL query before the 100-result cap, preserving own-college/project authorization; older matching records can therefore be found independently of the default feed. Apply/Clear, dates and categories share the exact Activity URL. Unit boundary/validation tests and an own-fixture PG test with 101 newer unrelated events were added. This supersedes the prior loaded-page-only category limitation. Executed PG evidence, browser/mobile filtering, completeness of historical event producers and pagination beyond 100 matches remain open; no DONE claims.

## 2026-10-15 continued batch: Activity pagination — PARTIAL

Learner Activity now offers Older matching events and Newest matching events while retaining category and IST date bounds. The read queries 101 rows to prove whether a next page exists and returns at most 100. Validated paired timestamp/UUID cursors use exact PostgreSQL microseconds plus event-ID ordering, avoiding JavaScript millisecond truncation and equal-timestamp gaps. The shared array reader retains its existing shape and 100-row contract. Cursor URL/pair validation units and an independently dated own-fixture PG pagination/role/tenant test were added. This supersedes the earlier pagination blocker. PG execution, browser Back/Forward/mobile acceptance and historical producer completeness remain outstanding; no DONE rows were changed.

## 2026-10-15 learner assignment private-file UI — PARTIAL (L6-015)

The aggregate drawer, exact assignment page and course Learning Path now expose File upload only when the existing server runtime-readiness guard enables it. The client validates allowed metadata/50 MB limit, obtains a same-origin assignment receipt, validates the signed HTTPS grant, PUTs bytes without app cookies, and requires explicit final confirmation before posting the receipt to the existing audited submission service. Upload alone never claims assignment submission. Failed PUTs, expired/mismatched grants, security-attestation failure, concurrent clicks and unmount cancellation are handled; scan failures retain the receipt for a retry and show no false success. Existing storage code, environment, schema and migration files were untouched.

Remaining: `course_upload_receipts`/`assignment_submission_files` are still staged rather than in the registered Drizzle journal; `DB06_ASSIGNMENT_FILES_READY=DB06_VERIFIED` and a real CLEAN scanner attestation are required by the existing APIs. This batch does not activate or bypass either guard. Pure metadata/grant/transfer tests were added, plus own-learner persisted assignment read/denial PG coverage. A real file upload/consume/read PostgreSQL+R2 positive path remains blocked by schema/scanner activation, and all PG execution remains blocked here because useradd fails with `Cannot open audit interface` in the UID-0-only sandbox. Mobile/browser/CORS and submitted-file viewing verification remain open. No DONE claims.

## 2026-10-15 submitted assignment private-file viewing — PARTIAL

The aggregate assignment drawer, exact assignment detail and course Learning Path now provide a guarded submitted-file control through the existing authorized read-grant endpoint. Responses must contain a short-lived, credential-free HTTPS URL and valid saved file metadata. Links are transient component state, expire automatically, suppress referrers and are checked again before opening; request locking and unmount aborts prevent stale drawer responses. Controls are keyed by exact submission ID. No raw object key/public bucket URL, storage edit or browser persistence is introduced. Own-file scan-attestation failures reuse the declared ASSIGNMENT_FILE_NOT_READY message. Unit tests reject expired/overlong/unsafe grants.

Remaining: registered receipt/file tables, runtime readiness and real scanner attestation still gate both upload and viewing. The prior own-enrolled-learner PG read/denial fixture applies to the parent assignment workspace; actual private-file read/denial and R2/CORS/browser acceptance are still blocked on schema/scanner activation and this sandbox's non-root PostgreSQL restriction. No claim of executed file persistence or DONE parity.

## 2026-10-15 Class Schedule day/week IST correction — PARTIAL

Learner day/week desktop grids, mobile agendas, Today count/highlighting and initial calendar month now use the same IST event-day grouping as the month view and displayed times. The server supplies an explicit calendar-day anchor so a device east or west of India cannot shift it across a month/day boundary. Pure tests execute UTC, Tokyo and Los Angeles device timezone cases and midnight/year boundaries; an own-enrolled-learner persisted class/denial PG test was authored. The shared schedule component retains its existing default for other callers; no Faculty route or other lane file was edited. PG execution and browser/device verification remain open. No DONE claims.


**2026-10-15 chat-5 L17-009 PARTIAL:** Month/week desktop calendar cells display up to two real scoped rounds as labelled chips plus an honest overflow count. The entire day opens its schedule; direct chip-to-drawer action and runtime/mobile/browser parity remain to verify. Pure-model and own-fixture PostgreSQL tests authored; not executed.


**2026-10-15 chat-5 L17-002 PARTIAL:** Agenda now spans 30 days starting from the chosen IST day (not a disguised month mode) and Previous/Next move 30-day windows. Events remain scoped through the existing own-learner PostgreSQL read. Runtime and browser verification outstanding.


**2026-10-15 chat-5 L17-003 PARTIAL:** Month view now shows the precise scoped round totals by kind for its IST month alongside the day grid; no missing job-deadline or college events are fabricated. Unit and own-fixture PostgreSQL cases authored, runtime/browser acceptance outstanding.


**2026-10-15 chat-5 L17-004 PARTIAL:** Mobile Week view now preserves seven daily slots (including explicitly empty dates) instead of skipping unscheduled days. Scheduled items still come from the learner-scoped read. Browser/device and executed test acceptance outstanding.


**2026-10-15 chat-5 L17-005 PARTIAL:** Day mode includes a scoped IST-day timeline summary with real first/last scheduled times, distinct from week/month. Tests authored; execute PG, static and browser acceptance before closing.


**2026-10-15 chat-5 L17-006 PARTIAL:** Previous/Next respect view-specific increments and disable when the resulting date is outside the validated 2000–2100 calendar range, avoiding an invalid URL reset to Today. The Today control remains explicit. Tests authored, browser/runtime acceptance pending.


**2026-10-15 chat-5 L17-014 PARTIAL:** Calendar export now respects the visible validated IST date window and event-kind selector, preserving UTC schedule instants in the .ics payload rather than exporting unrelated months. Sensitive round meeting URLs remain excluded. Unit and own-fixture PG coverage authored; execution and real calendar import remain open.


**2026-10-15 chat-5 L11-002 PARTIAL:** First-run Learner Placements now offers explicit mobile-friendly next steps to review placement rules, browse published drives and open the existing job-preferences editor. It appears only with confirmed empty own application history, never when journey availability is unknown; completion state is not invented. Unit and fresh-learner PG authorization coverage authored; execution/browser/source comparison outstanding.


**2026-10-15 chat-5 L29-010 PARTIAL:** Learner inbox interview actions now require either the generic interview route or a strict UUID application+round pair. Cross-college/user query selectors are stripped; malformed/duplicate selectors fail closed. The interview destination still verifies persisted owned round scope. Pure-model and self-seeded learner PostgreSQL tests authored. Executed static/PG and browser navigation remain outstanding.


**2026-10-15 chat-5 L29-011 PARTIAL:** Personal notification actions now support strict direct links to the persisted application detail and its status-history page, not only the generic Applications drawer. Only UUID IDs survive; user/college selectors and unregistered path suffixes are rejected. Destination rechecks own learner scope. Existing owned-application PG tests expanded; static, PostgreSQL and browser acceptance pending.


**2026-10-15 chat-5 L29-012 PARTIAL:** Learner notifications now canonicalize the course list, persisted delivery detail and course home actions, rejecting malformed delivery IDs and unexpected course paths while removing caller-supplied scope parameters. Existing course delivery routes enforce enrollment and learner membership. New pure-model/own-course PostgreSQL tests authored; runtime and mobile navigation acceptance pending. Course feature files remain under chat-7 ownership.


**2026-10-15 chat-5 L29-013 PARTIAL:** Notification project actions now recognize the own Projects directory and exact project instance UUID with a single permitted legacy tab (including Board and Delivery). Arbitrary tenant/actor selectors are stripped; forged/duplicate tabs and unexpected project URLs fail closed. The destination still enforces learner project-membership access. Unit and independent own-membership PostgreSQL denial evidence authored; project producer-to-inbox and browser verification outstanding. No chat-7 Projects files changed.


**2026-10-15 chat-5 L14-005 PARTIAL:** Applications Recent Activity sorting now uses the saved withdrawn timestamp alongside submission, screening decision and round-result activity, so an actual later withdrawal is not incorrectly sorted by the older submission date. Stable tie breaks and tenant-scoped source remain unchanged. Pure model/own-learner DB denial coverage authored; executed tests and browser Back/Forward acceptance pending.


**2026-10-15 chat-5 L29-018 PARTIAL:** Learner Notifications mobile filter tabs now wrap into a two-column layout rather than requiring horizontal scrolling, expose a concise active-filter/result summary, and constrain long notification text and action links at 375px. Only the learner inbox wrapper changes; other role lists are unaffected. Pure model and own-inbox PG tests authored; device/browser/keyboard execution pending.


**2026-10-15 chat-5 L30-023 PARTIAL:** Learner Profile now makes legacy publications/awards discoverable without inventing a dedicated verified publication entity: it labels saved achievements as possible awards and only explicitly publication-labelled, learner-authored metadata as publications. Full section editors remain the canonical authorship workflow, with no promotion to verified status. Pure model and self-seeded own-profile PostgreSQL role/tenant/suspension tests authored. Exact legacy data entry, storage migration, runtime and mobile/browser parity remain open.


**2026-10-15 chat-5 L30-033 PARTIAL:** Learner Profile on narrow screens now has direct quick links to up to four unfinished, non-sensitive career sections; verified/identity status is not inferred. Profile cards/long names wrap within their grid cells, and collection edit/delete actions use full-width minimum-44px mobile hit targets. Unit and own-profile PostgreSQL access/denial tests authored; 375px, keyboard, dialog resizing and browser/mobile verification pending.
