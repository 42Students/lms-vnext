# Faculty / Mentor — Remaining Parity Gaps

Source snapshot: `docs/planning/account-surface-parity.md`, `docs/parity/faculty.md`, and `docs/parity/mentor.md` as reconciled on chat-4, 2026-10-14.

This is a **tracker of every Faculty and Mentor master-parity row not marked DONE** (including intentionally RETIRED rows), not a claim of completed legacy parity. **PARTIAL** means implementation and/or tests are still unverified; an authored test is not a passed test. The source table has 29 PARTIAL and 7 RETIRED rows. The Courses list and Mentor Projects list are DONE and intentionally omitted.

Blocker vocabulary:
- **buildable**: current migrated tables can support the remaining implementation or validation; no table change is established as necessary.
- **missing migrated table**: specific legacy data/schema is absent from the currently promoted vNext shape.
- **owner decision**: privacy/product permissions, feature retirement, or storage-provider activation must be decided or confirmed before claiming parity.

Primary blockers can coexist with browser/DB evidence gaps, and the listed evidence is not proof that a feature is production-ready. Do not change row status from PARTIAL based solely on source commits.

## Faculty — every row not DONE

| Master parity row | Status | Primary blocker | Outstanding work / proof |
| --- | --- | --- | --- |
| Course Overview | PARTIAL | buildable | Verify exact legacy summary/actions, progress signals and browser states using current migrated Course deliveries. |
| Blueprint | PARTIAL | owner decision | Storage-backed file/video/live-class workflows require an approved provider and product semantics; remaining lesson/assessment controls are buildable. |
| Course Attendance | PARTIAL | buildable | Execute month/session/correction-policy and IST boundary browser/DB tests; reconcile legacy overlay and audit metadata. |
| Course Discussions | PARTIAL | buildable | Verify full Faculty post/reply/moderation keyboard, disabled/history and exact Section isolation in browser and PostgreSQL. |
| Course Students | PARTIAL | owner decision | Private learner profile/photo fields need a visibility and storage decision; current roster/detail behavior still needs browser proof. |
| Contacts — All | PARTIAL | owner decision | Decide public contact profile/photo depth versus private identity fields; verify pagination/deep links and mobile layouts. |
| Contacts — Teachers | PARTIAL | owner decision | Specify Faculty-to-Faculty profile/contact action visibility; private sections are deliberately not exposed. |
| Contacts — Students | PARTIAL | owner decision | Specify student contact/profile disclosure and photo policy; keep sensitive documents excluded. |
| Notifications | PARTIAL | buildable | Verify scoped announcement producers, recipient read/unread deep links, stale states and authenticated browser behavior. |
| Class Schedule | PARTIAL | owner decision | Confirm source/college timezone policy before closing IST/locale-boundary parity; browser mobile navigation remains. |
| All Quizzes | PARTIAL | buildable | Complete legacy create/edit/question drawer, attempt/result workflows and positive DB/browser verification. |
| All Assignments | PARTIAL | buildable | Complete legacy create/edit/delete/view-submissions modal and grading interactions with browser/DB validation. |
| Assignment report | PARTIAL | buildable | Run exact-Section CSV GET, distribution, grading drill-down, empty/error and real download browser/DB acceptance. |
| Quiz report | PARTIAL | buildable | Run exact-Section CSV GET, question accuracy, per-attempt analysis, result masking and browser/DB acceptance. |
| Self Profile | PARTIAL | missing migrated table | Rich Faculty self-document sections (resume, social, qualifications, certifications, awards, verification) lack promoted Faculty document storage; new live teaching-assignment subpage covers registered subset only. |
| File Explorer | RETIRED | owner decision | RETIRED by product decision: legacy redirects to Courses, so do not build a standalone explorer. |
| `/teacher` redirect | RETIRED | owner decision | RETIRED redirect-only route; ensure redirect behavior but no new page. |

## Mentor — every row not DONE

| Master parity row | Status | Primary blocker | Outstanding work / proof |
| --- | --- | --- | --- |
| Mentor landing / Projects-disabled state | PARTIAL | buildable | Verify module enable/disable routing, notifications fallback, and role-denied browser behavior. |
| Project Overview | PARTIAL | buildable | Complete existing workspace review/feedback/read-only presentation and browser acceptance; do not invent archived history. |
| Project Team | PARTIAL | owner decision | Confirm allowed Mentor/team lifecycle writes, group-managed assignments and identity privacy; registered history/coverage reads exist. |
| Project Sprints | PARTIAL | buildable | A scoped, confirmation-gated sprint title/description PATCH now exists using migrated project_sprints, same-origin, transaction + audit, and optimistic locking; tests are authored. Sprint date/goal fields are not independently persisted and must not be invented. Verify permitted legacy semantics, full lifecycle/release linkage, positive/negative PostgreSQL execution, concurrency and mobile browser states. |
| Project Tasks / Board | PARTIAL | missing migrated table | Legacy task assignee/workload fields are not persisted in vNext DB07; Board status/review parity also needs verification. |
| Mentor pending task reviews | PARTIAL | buildable | Complete legacy task detail and review-control parity; confirm positive DB/role-denial and browser evidence. |
| Project Resources | PARTIAL | owner decision | Storage-backed uploads depend on an approved live provider; link/resource metadata can be built, but files cannot be invented. |
| Project Meetings | PARTIAL | buildable | Reconcile schedule/confirm/reschedule/decline/cancel/complete, expired requests, timezone and meeting notes in browser/DB. |
| Project Delivery / review | PARTIAL | buildable | Check review/approve/reopen/revision transitions, archived states and full feedback history against legacy. |
| Project Activity | PARTIAL | buildable | New exact-project sanitized activity history added; verify event producers, detail parity, paging and legacy browser evidence. |
| Global Meetings calendar | PARTIAL | buildable | Verify requested past-date behavior, client clock/timezone and real responsive calendar; use persisted meetings. |
| Mentor Notifications | PARTIAL | buildable | Inbox page already exists; verify producers, reopen deduplication, unread actions, deep links and full legacy/browsers parity. |
| Mentor delivery review queue | PARTIAL | buildable | Confirm exact pending/delivery transitions and scoped browser/DB status recovery; workspace owns writes. |
| Mentor portfolio activity | PARTIAL | buildable | Cross-project safe timeline exists; audit complete registered producer coverage and browser/tenant checks. |
| Mentor Courses routes | RETIRED | owner decision | RETIRED redirect stub by established product decision; no Course feature to build. |
| Mentor Contacts routes | RETIRED | owner decision | RETIRED redirect stub; no Mentor directory surface to build. |
| Mentor All Quizzes | RETIRED | owner decision | RETIRED redirect stub; no Mentor aggregate Quiz feature to build. |
| Mentor File Explorer | RETIRED | owner decision | RETIRED redirect stub; no standalone storage explorer to build. |
| Mentor Profile | RETIRED | owner decision | RETIRED redirect stub by explicit product design; not a missing Mentor profile page. |

## This chat-4 implementation slice

- `/teacher/profile/teaching` — registered current teaching assignments and read-only college employment fields; the rich profile document does not exist in a promoted Faculty storage model.
- `/mentor/projects/[projectId]/activity-history` — current assigned Mentor's exact-project safe event timeline; it does not restore missing producers or prior history.
- Both pages use loading/error/empty recovery, strict Zod inputs, central permission checks, and authored pure-model + disposable PostgreSQL denial tests. **No write endpoint** was added; `isSameOriginRequest` remains mandatory on pre-existing and any future mutations.

## Closure gates

1. Check legacy behavior with product/domain owner for every owner-decision row; explicitly record storage and disclosure decisions.
2. For missing migrated table rows, assign the DB/schema owner and obtain migrations/authoritative contracts first; do not spoof missing fields.
3. For buildable rows, execute scoped positive/negative PostgreSQL integration, unit tests, TypeScript, ESLint and the authenticated mobile/browser suite against an exact commit.
4. Only promote a parity row to DONE with traced behavior, role/tenant isolation, user-facing recovery states, and preserved legacy acceptance evidence; otherwise leave PARTIAL.

## Positive-path database tests and Mentor review audit — chat-4 (2026-10-14)

**Exact batch revision:** Resolve the current `chatgpt/chat-4` commit after
review. These tests are executable PostgreSQL integration specifications,
not independently executed success evidence; do **not** mark any row DONE
until CI/DB logs demonstrate results at an exact SHA.

- `tests/integration/faculty-mentor-positive-projects.test.ts` creates a
  dedicated Project template, materializes a Project with an active Mentor
  and Learner, then verifies successful Mentor team history/coverage,
  sprint/task status, exact-project activity, pending review discovery,
  task review decision history, owned notification delivery/unread
  acknowledgment, and audit rows for both APPROVED and CHANGES_REQUESTED.
  A re-review must reject and must not create a duplicate event. Fixture
  cleanup is restricted to `chat4-positive-*` records.
- `tests/integration/faculty-mentor-positive-courses.test.ts` builds a
  Program, period, cohort, Section, Course offering/delivery, current
  Faculty teaching grant, active Learner enrollment, published Assignment
  and Quiz inside the test. It verifies successful Faculty teaching profile,
  same-college contact detail, exact Section assessment-health/aggregate
  results and server-scoped CSV GET report regeneration, with genuine
  no-response rows and an honest no-due-date follow-up state.
  Fixture cleanup is restricted to `C4POS-*` records.
- The existing `POST /api/projects/[projectId]/tasks/[taskId]/submissions/
  [submissionId]/review` retains its same-origin guard and Zod decision
  validator. Its existing locked, conditional state update now records
  `projects.task.reviewed` inside the **same transaction** using the
  authenticated actor, exact college, project/task/version/decision,
  a review-specific dedupe key and *no feedback or submission URL* in metadata.
  The safe Mentor history label is fixed to `Task review decision recorded`.
  Existing project-lifecycle and Mentor portfolio unit assertions now
  cover the new event, rather than using a stale event enum.

**Outstanding:** No disposable TEST_DATABASE_URL, local checkout,
executed Vitest/TypeScript/ESLint, GitHub CI or browser proof was available
in this chat. Run the new integration files with a migrated and seeded
disposable PostgreSQL database, reconcile any runtime failures, and verify
that all prior suites remain green. Faculty/Mentor parity remains PARTIAL.

### Mentor Task Board write — chat-4 (2026-10-14)

The `Project Tasks / Board` row gains a source-authored, confirmation-gated
task metadata edit for title/description/acceptance criteria/priority using
only registered P6 columns. `PATCH /api/projects/[projectId]/tasks/[taskId]/details`
requires strict Zod, central permission and persisted current Mentor assignment,
the enabled Projects module, a same-origin request, an optimistic update token,
transaction locks and a single safe actor/college audit per real change.
`tests/integration/mentor-task-details-update.test.ts` creates unique
template/project fixtures and includes PostgreSQL success, actor audit,
foreign/forged/stale/no-op denial and full cleanup. Unit/route tests are
authored. A **missing migrated assignee/workload field** still blocks complete
legacy Board parity; fresh PostgreSQL, ESLint, TypeScript and browser execution
are not claimed. PARTIAL only.

## 2026-10-14 Mentor Sprint CREATE and status lifecycle

Built a migrated-field Sprint CREATE service and signed-in Mentor confirmation
form, plus optimistic START/COMPLETE/REOPEN endpoints. Both use same-origin
checks, Zod, exact active Mentor project scope, registered project/release/sprint
rows, row locks, and transactional actor-college audit metadata. A new test case
extends the isolated, uniquely named sprint PostgreSQL fixture with successful
create/transition history and stale/foreign-role denials. Date values are
explicitly rejected until promoted migration columns exist. This partial
implementation does not claim complete legacy date semantics.

## 2026-10-14 Mentor inbox acknowledgment hardening (PARTIAL)

A dedicated Mentor-only, currently persisted role-grant and college-scoped
personal inbox is wired to same-origin, strict-empty-body POST controls for
single and bulk mark-read. The changed-recipient rows and sanitized audit
are transactional and idempotent. The isolated fresh-user PostgreSQL fixture
covers success, cross-college exclusion, wrong-role, suspended actor, no-op
and clean teardown; tests have been authored, not independently executed.
Final mobile/browser and legacy producer parity remain open.

## Mentor task creation and assignment blocker (2026-10-14)

A confirmation-gated Mentor task creation endpoint and UI are authored using registered project_tasks and an exact live Mentor project/sprint scope. Assignment/workload balancing remains blocked because no migrated assignee/effort field exists, and extra Zod keys are denied. The isolated positive/denial test intentionally retains append-only activity history and cleans mutable fixture records only. Real PostgreSQL and browser evidence and legacy edit/control parity remain open.

## Mentor team/meeting log read (2026-10-14)

Exact assigned-project read combines registered role-backed active team counts with project_meetings status-filtered history. A unique-fixture disposable PostgreSQL test inserts a real requested meeting, checks positive scoped coverage and wrong-role/foreign selector denials, and removes mutable fixtures without deleting immutable audit rows. No raw meeting outcomes, URLs or private member contacts are exposed. Existing scheduling/assignment writes, executed CI and browser acceptance remain PARTIAL.

## 2026-10-14 A–D source batch (all PARTIAL)

- **A — buildable:** `/teacher/courses/[deliveryId]/assignments/manage` adds
  confirmed, teaching-Section-only, text-based draft creation, draft editing,
  deadline-guarded publish and soft archive. Registered assignment table,
  locked optimistic timestamps, same-origin POST and transaction-coupled
  `courses.assignment.created/updated/published/archived` events.
  No irreversible hard delete and no file attachment flow.
- **B — buildable:** `/teacher/courses/[deliveryId]/quizzes/manage` uses
  registered Quiz/question/option rows for confirmed question builder draft
  create/edit/publish. Zod validates option uniqueness, correct answers,
  points and the question-count/points caps. Edit rejects published quizzes
  and quizzes with attempts, with one safe activity event per accepted write.
- **C — buildable:** `/teacher/live-classes` reads registered published
  LIVE_CLASS content from exact Faculty-owned Sections. View/Section filters,
  bound pages, error/empty states, IST display, and HTTPS-only links; no
  raw URLs in audit or logs.
- **D — missing migrated table:** No registered task comment/reply store
  exists. Exact-project Mentor task feedback is available read-only through
  `project_task_submissions.feedback`. The page explicitly blocks threaded
  messages and does not invent a write path. DB owner must register comment
  records and product owner must approve privacy/lifecycle before implementing
  threaded conversations.
- New pure model tests and an isolated positive/forged/stale PostgreSQL suite
  are authored. **Do not mark any item DONE** until disposable PostgreSQL,
  ESLint, TypeScript, mobile UI and legacy behavior are independently verified.

## A — Faculty discussion moderation history (2026-10-14)

Source-authored read-only Section audit view over migrated activity_events,
requiring current Faculty teaching scope. Pin/unpin history is attributable to
a moderator, but existing delete audit has no actor-role snapshot and may be
learner self-deletion; the view labels it neutrally. No message content
reconstruction and no write route. PARTIAL until successful PG/browser checks.


## B — Faculty Reports hub (2026-10-14)

Read-only per-delivery Reports hub linking registered Assignment, Quiz,
Attendance and published Gradebook. Exact current Faculty teaching scope,
bounded five-report pagination and clear unknown semantics. No inferred
weighted final grades and no writes. PARTIAL until independent PostgreSQL,
lint/TypeScript and responsive browser proof.


## C — Faculty own alternate contact edit (2026-10-14)

**BLOCKED: missing migrated table/columns plus owner decision.** Faculty
profile_contacts are not registered; faculty_profiles stores academic fields
only. Do not update users.email or users.phone_e164 (login identifiers) or
write to staged faculty profile documents. A role-scoped read-only status
page is provided, with loading/error states and exact blocker. Follow-up
requires DB migration, privacy policy, optimistic version and transaction
audit specifications. No fake create/edit action is enabled. PARTIAL.


## D — Mentor project review overview (2026-10-14)

Read-only exact assigned Mentor project review/feedback completeness view over
migrated project_submissions and project_submission_reviews, with no raw
feedback or private learner data, 20-version pagination and explicit gaps.
No invented history, no new write route. PARTIAL pending executed PostgreSQL,
browser and full legacy project overview acceptance.

## 2026-10-14 chat-4 A — live classes

Source-authored live class CREATE, EDIT, CANCEL for exact current Faculty
teaching delivery and registered lesson, using migrated lesson_contents,
status ARCHIVED for cancellation and no unsupported recording fields. HTTPS
meeting URL only, explicit confirmation, same-origin POST, strict Zod,
IST period-window check, overlap detection per teaching actor,
optimistic timestamp and transaction audit. Unit and isolated PostgreSQL
fixture tests are authored, not run locally. Blocker: positive DB/CI/browser
evidence, product conflict policy for co-teachers, full legacy live-room
workflow. Course Blueprint and Class Schedule remain PARTIAL.

## 2026-10-14 B — attendance schedule

Buildable migrated Section schedule events support confirmed Faculty
CREATE/RESCHEDULE with exact teaching Section, same-college permission,
class/faculty conflict detection, IST period bounds, optimistic token,
transaction audit and separate attendance marking lifecycle. No new table.
Unit/PG success and denial tests are authored, not executed. Marked sessions
cannot be rescheduled. Browser and classroom-policy acceptance still open.

## 2026-10-14 C — bounded Quiz result export

Buildable and source-authored: same GET Section report authorization plus
a 500-learner-result CSV export cap, numeric omitted-row footer and HTTP
notice headers; formula escaping preserved, UI warns of partial files.
Remaining: execute PostgreSQL and browser export tests; verify product-approved
large-export strategy and full question-level legacy output.

## 2026-10-14 D — team coverage polish

Existing migrated Project member and role grant tables support registered
active team coverage; revoked-role rows are now excluded. The view separates
no assigned projects from filter no-match, adds aggregate counts and links
to the scoped registered meeting log. No new write, no audit. Pure/PG tests
authored, not executed; owner approval of staffing rules remains blocked.

## 2026-10-14 Faculty published gradebook learner breakdown — PARTIAL

The read-only gradebook now links to an exact-current-Section, per-learner
breakdown of published assignment/quiz scores. Nonpublished or missing grades
are Unknown rather than zero; unauthorized learner identifiers do not
reveal cross-Section records. An isolated PostgreSQL fixture already creating
its own Learner and Faculty membership exercises positive and role/foreign/
forged-input denials. Pure-model tests were extended. Runtime PostgreSQL,
TypeScript, lint and responsive browser evidence still required; no DONE row.

## 2026-10-14 Faculty attendance create/reschedule editor polish — PARTIAL

The UI no longer offers other co-teachers' Section events as reschedulable.
Existing owned sessions prefill metadata and local clock values; invalid,
empty or reversed windows are rejected before confirmation, and success/error
messages are accessible. Server-side permission/scope/version/audit and the
previously authored PostgreSQL schedule test remain unchanged. Runtime/browser
evidence and final conflict-policy acceptance remain open.

## 2026-10-14 A — JavaScript/PostgreSQL optimistic token precision audit (PARTIAL)

Checked all `faculty-*.ts` under courses and attendance and all `mentor-*.ts`
under projects for direct `eq(table.updatedAt, Date)` predicates: **none found**.
Their existing row-lock + `getTime()` millisecond checks do not compare a
microsecond-precision SQL column with an unrepresentable JavaScript Date.
Hardened the Mentor task-details UPDATE with a second normalized, server-side
`date_trunc('milliseconds', updated_at) = expectedIso::timestamptz` predicate
to defend the read/write boundary. A disposable PostgreSQL test inserts its
own temporary row with SQL `DEFAULT now()` and checks first write success,
stale replay denial, and unchanged record. Existing Mentor task-details
service-level PG success/foreign/stale coverage remains in place.
No independent PostgreSQL execution or tsc/eslint evidence in this chat;
do not promote any parity row to DONE.

## 2026-10-14 B — Faculty read-first incremental rows (PARTIAL)

- **Course Discussions:** newly registered-message participation overview
  (own Section, role counts and latest 12 timestamps), no inferred reply tree,
  unanswered-learner flag or deleted text.
- **Course Attendance:** Section session-status coverage (marked/ended-unmarked/
  upcoming) with bounded 40-row display and explicit truncation, no invented
  individual marks or final attendance percentages.
- **Skipped Faculty Section notices:** DB10 announcement and Section-targeting
  tables not registered. Existing notice screen remains transparently blocked.
- PostgreSQL fixtures use unique Course and created Faculty-only/Learner members;
  read success plus role/foreign/forged selectors authored. No execution
  evidence in this session; legacy acceptance and browser states remain PARTIAL.

## 2026-10-14 C — Mentor task board review slice (PARTIAL)

Selected **Project Tasks / Board**, since Release/Sprint timeline already
has a scoped read and DB evidence authored. Added persisted task status/priority/
sprint read with 20-row paging, search and responsive cards. The full Board
still lacks assignee/workload source fields in promoted DB07 and may not be
declared DONE. Legacy board interaction, real PG and browser acceptance open.

## 2026-10-14 D — explicit A–D skipped-row disposition, no parity promotion

**Scope:** A audited existing optimistic token readers/writers, B improved two
Faculty read-first slices (Course Discussions and Course Attendance), and C
improved the Mentor Project Tasks / Board read. The rows below are **every
other unresolved or intentionally retired Faculty/Mentor master-matrix row**
from the authoritative tables above. A row is not DONE because a page exists
or because an integration test has been authored. This work does not alter any
existing DONE parity row.

### Faculty rows deliberately skipped (15)

| Skipped row | Current status | Primary blocker | Why skipped / required proof |
| --- | --- | --- | --- |
| Course Overview | PARTIAL | buildable | Verify exact legacy summary/actions, progress signals and browser states using current migrated Course deliveries. |
| Blueprint | PARTIAL | owner decision | Storage-backed file/video/live-class workflows require an approved provider and product semantics; remaining lesson/assessment controls are buildable. |
| Course Students | PARTIAL | owner decision | Private learner profile/photo fields need a visibility and storage decision; current roster/detail behavior still needs browser proof. |
| Contacts — All | PARTIAL | owner decision | Decide public contact profile/photo depth versus private identity fields; verify pagination/deep links and mobile layouts. |
| Contacts — Teachers | PARTIAL | owner decision | Specify Faculty-to-Faculty profile/contact action visibility; private sections are deliberately not exposed. |
| Contacts — Students | PARTIAL | owner decision | Specify student contact/profile disclosure and photo policy; keep sensitive documents excluded. |
| Notifications | PARTIAL | buildable | Verify scoped announcement producers, recipient read/unread deep links, stale states and authenticated browser behavior. |
| Class Schedule | PARTIAL | owner decision | Confirm source/college timezone policy before closing IST/locale-boundary parity; browser mobile navigation remains. |
| All Quizzes | PARTIAL | buildable | Complete legacy create/edit/question drawer, attempt/result workflows and positive DB/browser verification. |
| All Assignments | PARTIAL | buildable | Complete legacy create/edit/delete/view-submissions modal and grading interactions with browser/DB validation. |
| Assignment report | PARTIAL | buildable | Run exact-Section CSV GET, distribution, grading drill-down, empty/error and real download browser/DB acceptance. |
| Quiz report | PARTIAL | buildable | Run exact-Section CSV GET, question accuracy, per-attempt analysis, result masking and browser/DB acceptance. |
| Self Profile | PARTIAL | missing migrated table | Rich Faculty self-document sections (resume, social, qualifications, certifications, awards, verification) lack promoted Faculty document storage; new live teaching-assignment subpage covers registered subset only. |
| File Explorer | RETIRED | owner decision | RETIRED by product decision: legacy redirects to Courses, so do not build a standalone explorer. |
| `/teacher` redirect | RETIRED | owner decision | RETIRED redirect-only route; ensure redirect behavior but no new page. |

### Mentor rows deliberately skipped (18)

| Skipped row | Current status | Primary blocker | Why skipped / required proof |
| --- | --- | --- | --- |
| Mentor landing / Projects-disabled state | PARTIAL | buildable | Verify module enable/disable routing, notifications fallback, and role-denied browser behavior. |
| Project Overview | PARTIAL | buildable | Complete existing workspace review/feedback/read-only presentation and browser acceptance; do not invent archived history. |
| Project Team | PARTIAL | owner decision | Confirm allowed Mentor/team lifecycle writes, group-managed assignments and identity privacy; registered history/coverage reads exist. |
| Project Sprints | PARTIAL | buildable | A scoped, confirmation-gated sprint title/description PATCH now exists using migrated project_sprints, same-origin, transaction + audit, and optimistic locking; tests are authored. Sprint date/goal fields are not… |
| Mentor pending task reviews | PARTIAL | buildable | Complete legacy task detail and review-control parity; confirm positive DB/role-denial and browser evidence. |
| Project Resources | PARTIAL | owner decision | Storage-backed uploads depend on an approved live provider; link/resource metadata can be built, but files cannot be invented. |
| Project Meetings | PARTIAL | buildable | Reconcile schedule/confirm/reschedule/decline/cancel/complete, expired requests, timezone and meeting notes in browser/DB. |
| Project Delivery / review | PARTIAL | buildable | Check review/approve/reopen/revision transitions, archived states and full feedback history against legacy. |
| Project Activity | PARTIAL | buildable | New exact-project sanitized activity history added; verify event producers, detail parity, paging and legacy browser evidence. |
| Global Meetings calendar | PARTIAL | buildable | Verify requested past-date behavior, client clock/timezone and real responsive calendar; use persisted meetings. |
| Mentor Notifications | PARTIAL | buildable | Inbox page already exists; verify producers, reopen deduplication, unread actions, deep links and full legacy/browsers parity. |
| Mentor delivery review queue | PARTIAL | buildable | Confirm exact pending/delivery transitions and scoped browser/DB status recovery; workspace owns writes. |
| Mentor portfolio activity | PARTIAL | buildable | Cross-project safe timeline exists; audit complete registered producer coverage and browser/tenant checks. |
| Mentor Courses routes | RETIRED | owner decision | RETIRED redirect stub by established product decision; no Course feature to build. |
| Mentor Contacts routes | RETIRED | owner decision | RETIRED redirect stub; no Mentor directory surface to build. |
| Mentor All Quizzes | RETIRED | owner decision | RETIRED redirect stub; no Mentor aggregate Quiz feature to build. |
| Mentor File Explorer | RETIRED | owner decision | RETIRED redirect stub; no standalone storage explorer to build. |
| Mentor Profile | RETIRED | owner decision | RETIRED redirect stub by explicit product design; not a missing Mentor profile page. |

### Detailed sub-capabilities skipped despite existing parent rows

| Sub-capability | Parent row | Reason it was not fabricated |
| --- | --- | --- |
| Section notices/announcements for Faculty and learners | Faculty Course Discussions / Notifications | DB10 Section-targeted announcement storage is not promoted; current read-only notice page states the blocker; no fictional posts or sends |
| Faculty reply threads as true parent-child relationships | Faculty Course Discussions | Current discussion reply is encoded in flattened text with short parent prefix, not a migrated parent-message FK; preserve existing reply action, but do not invent a reconstructable tree |
| Faculty rich profile contacts, documents, badges and certificates | Faculty Self Profile | No approved promoted privacy/storage fields for these values; changing email/phone would mutate login identifiers |
| Mentor task assignment, effort estimates and workload balance | Mentor Project Tasks / Board | DB07 has no authoritative assignee/workload columns; the new board read shows only task status, priority and sprint |
| Mentor task comment/reply persistence | Mentor Project Tasks / Board | No promoted task-comments or reply store; registered task submission feedback is read-only evidence, not a threaded write destination |
| Mentor storage-backed file uploads | Mentor Project Resources | Storage provider/owner decision not approved; do not create placeholder attachment URLs |
| Historical mentor staffing adequacy | Mentor Project Team | Registered active member roles exist, but staffing policy, historical snapshots and identity disclosure require owner decisions |

**Still outstanding for the A–C implementation slices:** Execute focused unit,
ESLint and TypeScript checks; independently run disposable PostgreSQL success,
wrong-role, forged/foreign-selector, stale-token and SQL-default-microsecond
cases; then perform authenticated mobile/browser and legacy-oracle acceptance.
These tests have been authored and reviewed as source, but are not claimed as
executed. Existing PARTIAL rows remain PARTIAL, existing RETIRED decisions
remain RETIRED; no DONE parity row was changed.

## 2026-10-14 A2 — All Assignments (PARTIAL)
Hardened the existing Section assignment authoring editor: device-local due date
round-trips the persisted ISO instant, invalid local dates fail client-side,
archived actions are disabled, and mutations give accessible status/error text.
Existing transaction + immutable audit and row-lock optimistic token are
unchanged. Pure model unit test and own-Faculty fixture PostgreSQL
create/edit/stale/foreign/wrong-role/audit checks were added.
Still open: execute tests, real browser create/edit/archive/grade modal and
legacy lesson-order parity; no claim of DONE.

## 2026-10-14 B2 — All Quizzes (PARTIAL)
Repaired a broken authoring GET contract: API returns `{quiz:{questions}}`,
not root `questions`. The builder now rejects stale overlapping fetches,
restores correct answers and browser-local due times, validates questions
before the server mutation and prevents editing published quiz questions.
Added model unit and own-Faculty PostgreSQL create/edit/publish/stale/foreign/
wrong-role/audit assertions. No DONE promotion pending execution/browser parity.

## 2026-10-14 C2 — Course Discussions (PARTIAL)
Existing create/reply and moderation were present; **new** required confirmed
client token on PATCH/DELETE and SQL millisecond CAS prevent stale moderation
writes against PostgreSQL microsecond timestamps. Shared Learner own-delete
flow still sends a token; Faculty pin/unpin requires confirmation. Error feedback
is visible without inventing deleted text. Test fixtures authored for create,
pin, stale denial, wrong role, forged delivery and deletion audit. Full
browser/database execution and legacy reply-tree parity remain open.

## 2026-10-14 D2 — Mentor pending task reviews (PARTIAL)
The queue now carries exact persisted task IDs to jump directly into the
authorized project Board, bounds invalid pagination and treats search literally.
Only current SUBMITTED / IN_REVIEW task versions count. Existing review command
owns the transaction and immutable audit; no new writer. Dedicated tests for
actual submit/review/stale replay and scope are authored, not executed.
Remaining: execution, browser/mobile deep-link, legacy review correctness.

## 2026-10-14 Mentor Project Meetings audit decision — PARTIAL
New `mentor-decision` endpoint wires confirmation, optimistic millisecond
version token and same-transaction `projects.meeting.decided` activity event
for Mentor COMPLETE/CANCEL actions. Existing Admin/Learner API unchanged.
PG suite uses test-created Mentor/learner IDs, audit-safe cleanup guards,
and denial/replay assertions. Outstanding: independently execute all tests,
mobile dialog and legacy meeting schedule/reschedule history parity.

## 2026-10-14 Mentor Project Delivery/review command — PARTIAL
Added mentor-only `mentor-decision` route with same-origin, strict confirmation,
row locks, microsecond-safe optimistic CAS, persisted review insert and
immutable activity event. Other roles retain prior workflow. Tests authored
with fresh Mentor/Learner memberships and audit-preserving cleanup.
Remaining: executed test/build and browser/legacy acceptance, revision cycle.

## 2026-10-14 Faculty All Assignments grade publication fence — PARTIAL
No new writer introduced. Existing `gradeAssignmentSubmission` and
`publishAssignmentGrade` now lock the parent Course Assignment and reject
writes unless status remains PUBLISHED at transaction time, including when a
concurrent ARCHIVE starts. Pure policy + unit; own-Section PostgreSQL
grade/publish/stale/foreign/role/archived/audit tests authored. Remains:
executed tests, responsive browser and exact legacy grading modal parity.

## 2026-10-14 Faculty Course Attendance correction state fence — PARTIAL
Added session markedAt optimistic token for repeat marking, leaving first-mark
payload backward compatible. Existing correction-window, roster, schedule,
Faculty-role scope and immutable attendance audit remain authoritative.
Audit now includes before/after markedAt, without private learner identifiers.
New pure unit and self-created Faculty/Learner PG test includes SQL now default,
success/foreign/role/stale/audit. Remaining: execute tests and browser/mobile,
legacy correction modal parity and correction-request storage decision.

## 2026-10-14 Mentor task-review optimistic feedback (PARTIAL)
Existing same-origin review POST now requires Mentor decisions to include a confirmed
submission update token. The stored row lock and SQL millisecond predicate fence
a stale review without bypassing existing immutable task-review audit; Admin
direct calls remain compatible. The responsive review dialog supplies the token.
Added pure model/unit tests and an own-project disposable PostgreSQL test for
default SQL now(), Mentor success, stale replay, wrong-role, non-leaking foreign
scope and single review audit event. Still PARTIAL: CI/PG/browser/mobile and
legacy review-history verification; do not fabricate task-comments storage.

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
