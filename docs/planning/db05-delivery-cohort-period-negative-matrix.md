# DB-008 — same-college is not enough: delivery cohort/academic-period integrity

**Phase:** DATABASE · **Chat:** 6 · **Observed:** 2026-10-11 · **Status:** source-backed SQL drafts only, unregistered/unexecuted.  
**Important:** This is **not** evidence of a PostgreSQL test passing or an enabled API path. Chat 1 owns the registered migration/schema barrel.

## Structural source evidence

Current vNext `src/db/schema/courses.ts` gives `course_offerings` independent `cohort_id` and `academic_period_id` foreign keys, and `course_section_deliveries` its own independent `offering_id` and `section_id` foreign keys. `src/db/schema/academics.ts` gives each `sections` row a `cohort_id` and `academic_period_id`. None of those independent FKs alone guarantees that the section and offering belong to the **same cohort and same exact academic period**.

Before this batch, four DB05 companion guards generally compared course/offering/section **college** and often verified delivery.offering_id, but overlooked the *section-vs-offering cohort and exact period identity*. That permits a same-college delivery pointing at the wrong cohort/term to slip through the downstream child guard even though a delivery's basic foreign keys are valid. Other DB02 source guards may reject the delivery itself, but DB05 acceptance must not assume those separate migrations exist or have already run.

The following unregistered DB05 candidates now independently check cohort and academic-period identity:

| Candidate | Protected child write | Old accepted mismatch | New source check |
| --- | --- | --- | --- |
| `db05-classroom-chat-parity.draft.sql` | `course_discussion_messages` | Sender in correct college, delivery's section from wrong cohort/period | `offering_cohort_id <> section_cohort_id`; `offering_period_id <> section_period_id` |
| `db05-lesson-discussions-same-college.draft.sql` | `lesson_content_discussions` | Content has delivery from correct offering+college but wrong section cohort/period | `section_cohort_id <> offering_cohort_id`; `section_period_id <> offering_period_id` |
| `db05-progress-same-college.draft.sql` | `learner_content_progress` | Progress attaches to content whose optional delivery has wrong section cohort/period | Same optional-delivery checks |
| `db05-course-receipt-college-scope.draft.sql` | `course_upload_receipts` | Private receipt creation or submission consumption through same-college wrong cohort/period | **Both** target-content/assignment delivery and consumed-submission delivery require matching cohort/period |

The actual draft code uses nullable-safe PostgreSQL `IS DISTINCT FROM` checks, not the ordinary `<>` shown in the table for readability.

## Disposable PostgreSQL acceptance matrix — ALL UNEXECUTED

For each candidate, insert realistic vNext fixtures into a fresh disposable DB *after* the matching Chat 1 migration is registered and compiled, then verify the following. Never execute this draft as a standalone production migration.

| ID | Fixture / action | Expected |
| --- | --- | --- |
| CP-01 | Offering and section share college, cohort and academic period; authorized sender/content/receipt | Accept |
| CP-02 | Same college but section cohort differs from offering cohort | Reject with SQLSTATE `23514` |
| CP-03 | Same college and cohort but section academic period differs | Reject with `23514` |
| CP-04 | Same college, same period, different offering ID for optional content delivery | Reject `23514` |
| CP-05 | Section's academic period belongs to another college | Reject `23514` |
| CP-06 | Course department's college differs from offering academic-period college | Reject `23514` |
| CP-07 | Sender/author/learner membership belongs to another college | Reject `23514` |
| CP-08 | Classroom chat delivery uses wrong cohort (same college), including delivery foreign keys that individually exist | Reject `23514` |
| CP-09 | Per-lesson discussion has no optional delivery but valid author/course period/department | Accept (if read authorization permits) |
| CP-10 | Per-lesson discussion has invalid optional delivery cohort/period | Reject `23514` |
| CP-11 | Progress for generic content (NULL delivery), same-college learner membership | Accept (after learning access and role checks) |
| CP-12 | Progress content has wrong optional delivery cohort/period | Reject `23514` |
| CP-13 | Private receipt targets delivery whose section cohort/period differs from assignment/content offering | Reject `23514` |
| CP-14 | Private receipt targets generic assignment (NULL assignment delivery) and valid owning course offering | Accept if receipt owner/storage validation pass |
| CP-15 | Private receipt consumption links submission with different section cohort/period, despite matching assignment and owner | Reject `23514` |
| CP-16 | Receipt consumed by a different learner or assignment, even with matching college | Reject `23514` |
| CP-17 | Receipt object key has wrong namespace, owner UUID, extra path segments or fake upload hash | Reject `23514` |
| CP-18 | AFTER valid child INSERT, move upstream offering's cohort or period | Must reject or atomically revalidate existing child records — **currently unproven** |
| CP-19 | AFTER valid child INSERT, move section's cohort/period or parent's department/college | Must reject or revalidate — **currently unproven** |
| CP-20 | Two sessions race between child INSERT and upstream reparent | No cross-cohort/cross-period final committed state; investigate lock order/deadlocks — **currently unproven** |
| CP-21 | Two sessions race between receipt consumption and revocation/expiry/attachment | Exactly one permitted terminal state; no leaked private URL — **currently unproven** |
| CP-22 | Restrict access after suspension/role loss, but retain historical discussion name/deletion audit | Authorization denied, historical attribution retained; API/DB proof **unproven** |

**Important distinctions:** `23514` only describes the candidate explicit guard; if a base FK/unique constraint rejects earlier, record actual SQLSTATE and verify the effective security invariant. API-level authorization is required in addition to any DB guard.

## Integration and safety requirements

1. This batch added no numbered migrations or schema-barrel exports. Four DB05 companion files remain **unregistered**, and registered DB02 delivery integrity must be independently present or accounted for in W01's dependency ordering.
2. Direct child write guards do **not** re-run when a course, offering, lesson, section, period, department, or membership changes later. W01 must pair them with read-committed-compatible ancestor guards, immutable upstream scope where appropriate, or a normalized composite-FK strategy.
3. No acceptance claim follows from source-only assertions. Execute a fresh migration replay, the CP-01..22 matrix, two-connection races, rollback and application integration tests against an exact main SHA. Publish actual SQLSTATE/logs/redacted fixture IDs in Chat 1's journal.
4. GitHub Actions billing is **not** a reason to stop coding or to claim a PostgreSQL test passed. Use an independently available executable runner; retain the missing runtime proof as a separate outstanding gate.
5. This change does not relax private-file attestation/malware scan, assignment receipt consumption semantics, classroom moderation, teaching assignment, or archived/soft-deleted content checks.
6. DB-008 remains **IN_PROGRESS**, and the global phase remains **DATABASE** until the collective gates are executed and accepted.

**Source regression tests:** `tests/db05-delivery-cohort-period-integrity.test.mjs` and `tests/db05-sql-draft-structure.test.mjs`. These tests are authored in GitHub; they are not PostgreSQL substitutes.
