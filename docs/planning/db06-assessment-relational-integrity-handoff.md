# DB06 — assessment cross-parent integrity staging and PostgreSQL acceptance

**2026-10-11 IST, DATABASE phase.** Independent peer-review batch; no assignment to a six-chat worker and no registered migration. Existing registered snapshot: Drizzle `0040`. Legacy oracles: `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` and `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

**Staged only:** `docs/planning/sql/db06-assessment-parent-scope-candidate.sql` (five PostgreSQL guard functions/five triggers). **Source guard:** `tests/db028-assessment-parent-scope.test.mjs` (seven assertions). Function prefix `db28_` and the historical test filename are source identifiers and **not shared queue task DB-028**; that task is already assigned to an unrelated browser test-target guard. A separately numbered queue task is required for integration.

## Discovered gap

Registered `quiz_attempts`, `assignment_submissions` and `quiz_attempt_answers` have individual FKs to their separately existing parent rows, but snapshot 0040 does not enforce that their parent objects share the same offering/section/learner tenant/quiz. A buggy or privileged direct SQL writer can link a valid quiz to a valid *different* delivery, or an answer to an existing question from another quiz. Current application checks do not establish *database-level* invariants.

### Source-only candidate guards

| Guard | Proposed enforcement |
|---|---|
| `db28_guard_assessment_definition` | Quiz/assignment's optional fixed delivery and source lesson belong to one offering; refuse retargeting after learner attempts/submissions exist |
| `db28_guard_learner_delivery` | Active learner platform user + college membership + LEARNER role + exact active section enrollment; learner college equals teaching-section college |
| `db28_guard_quiz_attempt_parent` | Quiz attempt delivery matches quiz's offering and fixed delivery where provided |
| `db28_guard_assignment_submission_parent` | Submission delivery matches its assignment; points never exceed assignment max; historical grade-only update does not require newly active enrollment |
| `db28_guard_quiz_answer_parent` | Question's quiz matches the quiz of the recorded attempt |

**Not yet solved:** parent retargeting via `course_lessons.learning_path_id`, `course_learning_paths.offering_id` and `quiz_questions.quiz_id`; simultaneous enrollment revocation vs attempt insert; simultaneous section/cohort/delivery reassignment vs submission insert; cross-role grader privilege; legacy grade correction retention; existing invalid seed rows. W01 must reconcile this with DB02/DB05 drafts before registration, standardize parent lock order or use stable composite scoped FKs, verify table/enum/trigger syntax on PostgreSQL, and emit one numbered Drizzle migration and snapshot. Do **not** execute this SQL standalone.

## Independent PostgreSQL acceptance matrix — ALL NOT_EXECUTED

| Witness | Case | Expected |
|---|---|---|
| PG01 | Quiz lesson offering A + fixed delivery offering B | Denied `23514` |
| PG02 | Assignment lesson A + delivery B | Denied `23514` |
| PG03 | Attempt's delivery offering differs from quiz lesson offering | Denied `23514` |
| PG04 | Fixed-delivery quiz attempted in a different section/delivery | Denied `23514` |
| PG05 | Existing learner membership from another college | Denied `23514` |
| PG06 | Same-college learner not enrolled in assigned teaching section | Denied `23514` |
| PG07 | Revoked LEARNER role or disabled platform user | Denied `23514` |
| PG08 | Submission references valid assignment but wrong delivery | Denied `23514` |
| PG09 | Grade > assignment.max_points | Denied `23514` |
| PG10 | Quiz answer references question from another quiz | Denied `23514` |
| PG11 | Valid full quiz/assignment submission and grading path | Accepted |
| PG12 | Grade-only update after valid historical enrollment ends | Accepted without allowing parent retarget |
| PG13 | Concurrent section enrollment revocation vs attempt insert | No invalid new attempt after committed revocation |
| PG14 | Concurrent offering/lesson/question reassignment vs child insert | No mismatched parentage regardless of commit order |
| PG15 | Cross-college Faculty impersonating grading actor | Rejected by DB grants and service authorization |
| PG16 | Preflight over deliberately poisoned existing rows | Reports conflicts before migration, no silent destructive cleanup |

## Executed evidence versus unfinished requirements

- **7/7 source-only assertions passed** using the actual connected GitHub SQL/test/Drizzle file contents in an isolated V8 test harness on 2026-10-11. This was **not** `node --test`, PostgreSQL or real migration replay.
- **0/16 PostgreSQL witnesses executed**. No table/field/runtime parity certification has occurred.
- **Needed for completion:** review source conflicts, real SQL parsing/replay on a disposable PG, transactional negative/positive tests, concurrency tests, and independent verification with exact commit/test output.
- Do not count a committed draft or a source test as `DONE_VERIFIED`.

**Coordination:** Existing workers' claims and shared migrations were left unchanged. This is additional unclaimed database design evidence; a worker may later pick its separate integration task when eligible. Only Chat 1 may register numbered Drizzle migrations and touch the schema barrel.
