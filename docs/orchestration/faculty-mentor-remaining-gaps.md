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
