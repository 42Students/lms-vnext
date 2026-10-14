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
