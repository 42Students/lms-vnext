# DB06 — assessment cross-parent integrity registration and PostgreSQL acceptance

**2026-10-11 IST, DATABASE phase.** DB-030 is owned by Chat 1. Legacy oracles: `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` and `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

The historical source draft remains at `docs/planning/sql/db06-assessment-parent-scope-candidate.sql` with its original `db28_` source identifiers. Chat 1 independently hardened that design and **registered** `drizzle/0041_db06_assessment_parent_scope.sql` plus `drizzle/meta/0041_snapshot.json` and journal entry `0041_db06_assessment_parent_scope`.

Registered 0041 is trigger-only and contains a non-destructive poisoned-row preflight plus **11 PostgreSQL functions / 11 triggers**. It extends the five original child guards with lesson, learning-path, quiz-question, delivery, section and offering history/reparent guards, and it takes SHARE locks on mutable assessment parents, the offering row, learner identity/role rows and active enrollment rows to serialize the relevant races.

Static contract: `tests/db06-assessment-parent-scope-migration.test.mjs`. Disposable PostgreSQL acceptance: `tests/integration/db06-assessment-parent-scope.test.ts`. The CI-independent verifier exports `DB06_ISOLATED_TEST_DATABASE=1`, so DB06 witnesses are automatically included when the repository can run against its disposable PostgreSQL.

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

**Registration decisions:** 0041 now guards lesson/path/question reparenting, delivery/section/offering history reinterpretation, active learner enrollment races, exact fixed-delivery scope and assignment max-grade bounds. Grade-only corrections deliberately remain allowed after the learner's enrollment becomes historical. Cross-college grader privilege remains enforced by the existing service authorization boundary rather than a user-id-only trigger because legitimate college-admin/scoped-admin grading cannot be represented safely from `graded_by_user_id` alone. DB02/DB05 later registration must preserve the DB06 lock order and must not introduce duplicate/contradictory trigger ownership.

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

- Historical draft source assertions remain source-only evidence.
- Current-main static reconciliation confirms journal head 0041, **11 functions / 11 triggers**, non-destructive preflight, offering-row serialization and all six parent-history guard families. This was connector/source inspection, not PostgreSQL execution.
- PostgreSQL suite is now authored for PG01–PG16, with PG14 tested in both lock/commit directions plus a direct quiz-question history case. **0 PostgreSQL witnesses are claimed executed in this chat.**
- DB-030 must not become `DONE_VERIFIED` until zero-to-head replay and the disposable PostgreSQL suite actually pass.

**Coordination:** Existing workers' claims and shared migrations were left unchanged. This is additional unclaimed database design evidence; a worker may later pick its separate integration task when eligible. Only Chat 1 may register numbered Drizzle migrations and touch the schema barrel.
