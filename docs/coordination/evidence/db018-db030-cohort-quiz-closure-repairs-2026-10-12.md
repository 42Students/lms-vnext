# 2026-10-12: DB018, DB030 and DB005 real PostgreSQL failure repair

**Repository:** `42Students/lms-vnext@main`  
**Scope:** close actual failing PostgreSQL witness preconditions and an academic enrollment race; retain the original database-task denominator. This is not itself DATABASE certification.

## Source of diagnosis — executed native PostgreSQL baseline

GitHub Actions [run 38250543374](https://github.com/42Students/lms-vnext/actions/runs/38250543374), PostgreSQL job 114815749817, produced a real PostgreSQL 17 database and successfully replayed 43 registered migrations from empty, seeded data, checked migration idempotence and read-only catalog acceptance. Its broader integration suite was still red (275 passing / 99 failing / 83 skipped), so no full-database acceptance was inferred.

The actual failing database messages in that run exposed independent *test fixture setup failures*:

- **Four DB018 quiz/assignment negatives** (the wrong delivery, wrong quiz, and grade-above-max witnesses) were failing at `learner_program_enrollments_active_membership_uq`, before intended cross-parent/grade checks.
- **Two DB030 PG10/PG14C cases** were failing at `course_quizzes_generic_active_sequence_uq` because the helper created two generic quizzes with `sequence=0` in the same lesson.
- **DB018 P5-R02** failed at `LEARNER_ALREADY_ENROLLED` because its seeded learner was already enrolled, hiding the actual cohort-completion race.

Do not weaken any of those valid uniqueness constraints to make tests pass.

## Committed repair set

| SHA | Change |
| --- | --- |
| [7e947454](https://github.com/42Students/lms-vnext/commit/7e9474549655af44b5ec175a9dd69c85d374d309) | DB018 rollback-only academic fixture now inserts a unique learner, college membership and LEARNER role, and uses that membership in the negative assessment cases |
| [6bf43fdb](https://github.com/42Students/lms-vnext/commit/6bf43fdbed38281782af040790a6b1fb2a608f36) | DB030 quiz helper allocates distinct sequence values for each test-owned quiz, preserving generic quiz ordering uniqueness |
| [10b02a15](https://github.com/42Students/lms-vnext/commit/10b02a151ec47e17fe9b3be21cca704f8b3e3a61) | DB018 P5-R02 fixture gets its own initially unenrolled learner and idempotent cleanup |
| [58328a48](https://github.com/42Students/lms-vnext/commit/58328a483b97ededf83fa22428e6c6913ee46bd9) | Real DB005 enrollment service re-reads status/program of the cohort inside its write transaction under PostgreSQL `FOR SHARE`; no stale active precheck can authorize an insert after a committed cohort COMPLETE |
| [96243989](https://github.com/42Students/lms-vnext/commit/96243989674e40303e66fe618e510eacaeafd689) | P5-R02 two-session race now holds the cohort UPDATE row lock, starts enrollment, waits for its cohort SHARE recheck, commits completion first, then expects `COHORT_NOT_MUTABLE`; removed a table-exclusive-lock design that would deadlock a correctly locked implementation |
| [725531c3](https://github.com/42Students/lms-vnext/commit/725531c353f0040bab43b7d133b4527b2900dfc2) | Restores defined Academics permission-to-HTTP-403 map, fixing a TypeScript compilation error; subsequent parallel edits expanded the denied-code list |
| [32caf398](https://github.com/42Students/lms-vnext/commit/32caf3986217fdfe04445b41c8397aa362933c97) | Preserves `NodeJS.ProcessEnv` index typing when explicitly deleting `DATABASE_URL` before destructive E2E test target preflight |

## Evidence classification

Read-only exact-current-main GitHub source checks were executed with isolated JavaScript assertions, verifying transaction lock ordering, persisted cohort rejection, fresh fixture account ownership, one-active-enrollment handling, quiz uniqueness and unchanged E2E target cleanup. **21/21 structural assertions pass** after accounting for the concurrent expansion of academic error codes. This is NOT a substitute for native Node/Vitest, TypeScript compilation, or PostgreSQL regression proof.

Native PostgreSQL run **38250543374 was a red baseline from *before* these fixes**. Ongoing high-frequency parallel commits are triggering cancellation/queueing of subsequent CI runs, so no passing post-fix PostgreSQL result was available when this document was written. Do not claim DB018/DB030/DB005 `DONE_VERIFIED` from this report.

## Next required direct acceptance

1. On a clean exact SHA, run `npm ci` and native typecheck/source suites; confirm the two compile failures corrected above do not recur.
2. Run `npx vitest run --config vitest.db.config.ts tests/integration/db18-registered-negative-witnesses.test.ts tests/integration/db18-known-race-gaps.test.ts tests/integration/db06-assessment-parent-scope.test.ts` on the **disposable, accurately migrated** PG17 test database using the same guard-accepted environment flags as the canonical DB test job.
3. Record pass/fail and exact job/run/SHA, separately for DB018 4 negative cases, P5-R02 two-transaction timing, and DB030 PG10/PG14C.
4. DB018 also has other authored negative and race suites; do not close DB018 unless **all** required acceptance is executed and accepted, and not just these focused fixed cases. Reconcile newly registered DB02/DB05 migrations and repeat affected tests.
5. Keep all six worker lanes on DATABASE until core eleven gates actually meet queue acceptance. No migration journal, schema-barrel or shared workflow files were edited in this batch.

Coordination handoff posted in GitHub worker issues #21, #24, #25.
