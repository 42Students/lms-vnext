# DB06 — assessment cross-parent integrity promotion and PostgreSQL acceptance

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE · **Queue task:** DB-030 · **Worker:** Chat 1  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

## Current promotion state

The original DB06 source candidate has now been independently reviewed and promoted as two forward-only trigger migrations:

- `0041_db06_assessment_parent_scope` — baseline same-offering, exact-delivery, learner-scope, answer/question and reverse-parent history guards.
- `0042_db06_assessment_scope_hardening` — elective-roster parity, immutable attempt/submission attribution, historical-grade/max-points protection and current grader authorization.

Both migrations are registered in `drizzle/meta/_journal.json`. Both are trigger/function-only, so snapshots `0041` and `0042` intentionally preserve the same Drizzle table shape while advancing snapshot identity.

**Registration is not runtime verification.** No disposable PostgreSQL replay or DB-030 transactional witness is claimed in this handoff.

Canonical reviewed source remains:

- `docs/planning/sql/db06-assessment-parent-scope-candidate.sql`
- `tests/db028-assessment-parent-scope.test.mjs`
- `tests/db06-assessment-parent-scope-migration.test.mjs`
- `tests/db06-assessment-parent-scope-hardening-migration.test.mjs`

The historical `db28_` function names and test filename are source identifiers only; they are unrelated to queue task DB-028.

## Invariants now represented in the migration chain

### Assessment definition and parent history

Quiz/assignment definitions resolve through lesson → learning path → offering. Optional fixed delivery must belong to that same offering. Child writes take explicit `FOR SHARE` locks, while parent reparenting guards prevent committed history from being silently reinterpreted.

0041 also guards reverse movement of:

- lesson → learning path;
- learning path → offering;
- question → quiz;
- delivery → offering/section;
- section → cohort/academic period;
- offering → course/cohort/period.

0042 additionally prevents lowering `course_assignments.max_points` below any persisted `points_awarded`.

### Core learner assessment access

For an ordinary delivery, a new quiz attempt or assignment submission requires:

- ACTIVE platform user;
- ACTIVE same-college membership;
- persisted LEARNER role;
- ACTIVE learner-program enrollment;
- ACTIVE section enrollment for the **exact delivery section and academic period**;
- learner cohort matching the delivery section cohort.

The membership/user/role and enrollment rows are SHARE-locked so revocation/withdrawal races serialize against the child insert.

### Group-backed elective assessment access

A delivery with any `elective_offerings.backed_delivery_id` binding is group-owned. It never falls back to host-section access, including when the elective binding is archived.

A new attempt/submission requires the current persisted state to satisfy the same core predicate used by `src/modules/groups/roster-access.ts`:

- delivery type ELECTIVE;
- delivery/course/section active and academically coherent;
- ACTIVE, non-deleted COLLEGE-owned ELECTIVE group;
- ACTIVE, non-deleted elective slot/offering;
- group/slot/course/college identity agrees with the delivery;
- ACTIVE `lms_group_members` learner row for the exact group;
- current primary academic eligibility for the elective program/period.

Group/slot/offering/member and academic eligibility rows are SHARE-locked so leave/archive/eligibility-loss races cannot both commit with a new assessment child based on stale state.

### Historical attribution

- Quiz attempt `quiz_id / delivery_id / membership_id` is immutable after insert.
- Assignment submission `assignment_id / delivery_id / membership_id` is immutable after insert.
- Quiz-answer question must belong to the attempt's quiz, with attempt/question rows locked during child write.
- Existing historical learner rows may outlive active enrollment; migrations do not require past learners to still be active.

### Grading

A grade write may occur after the learner has graduated; learner ACTIVE roster is therefore not rechecked during grade correction.

Whenever grade content or `graded_by_user_id` is newly persisted/changed while status is GRADED, 0042 requires the referenced grader to be one of:

1. an ACTIVE SUPER_ADMIN user;
2. an ACTIVE same-college COLLEGE_ADMIN membership;
3. an ACTIVE same-college FACULTY membership with an active `course_teaching_assignments` row for the exact delivery.

This matches current service authorization: `courses.manage` for College Admin/Super Admin, otherwise exact-delivery faculty mutation access.

Two limits are intentionally explicit:

- `grade_published` has no publisher actor column, so publication authorization remains service-owned until immutable grade-history/publisher persistence is promoted.
- a row trigger can validate that `graded_by_user_id` is an authorized identity; it cannot cryptographically prove which human/SQL session supplied that otherwise-valid ID. Normal application identities must not receive arbitrary SQL write privileges.

## Migration preflight

0041 fails closed if existing rows already violate definition, attempt/submission, grade-bound or answer/question structure.

0042 adds a non-destructive historical tenant preflight: persisted attempt/submission learner membership must agree with both the course-owned and section-owned college of the recorded delivery.

Neither migration silently updates or deletes poisoned history.

## Locking / concurrency model

DB06 follows the same explicit row-lock model used by DB02 historical-parent staging:

- child/history writes take SHARE locks on mutable semantic parents;
- parent UPDATEs take conflicting row update locks;
- identity/roster/role changes conflict with assessment inserts that have locked the current eligibility source;
- grader role/teaching-assignment changes conflict with a grade write that has locked its authorization evidence.

DB05's course-parent graph uses a separate advisory lock. DB06 intentionally does **not** acquire that advisory lock, avoiding an advisory-lock/row-lock ordering cycle.

DB02/DB05 still need their own promotion/acceptance; DB06 registration must not be interpreted as certification of all upstream academic/course invariants.

## PostgreSQL witness matrix — NOT EXECUTED

The original 16 witnesses remain the minimum DB-030 runtime gate:

| Witness | Case | Expected |
|---|---|---|
| PG01 | Quiz lesson offering A + fixed delivery offering B | Denied `23514` |
| PG02 | Assignment lesson A + delivery B | Denied `23514` |
| PG03 | Attempt delivery offering differs from quiz lesson offering | Denied `23514` |
| PG04 | Fixed-delivery quiz attempted in a different delivery | Denied `23514` |
| PG05 | Learner membership from another college | Denied `23514` |
| PG06 | Ordinary same-college learner not enrolled in the exact delivery section | Denied `23514` |
| PG07 | Revoked LEARNER role or disabled platform user | Denied `23514` |
| PG08 | Submission references valid assignment but wrong delivery | Denied `23514` |
| PG09 | Grade exceeds assignment.max_points | Denied `23514` |
| PG10 | Quiz answer references a question from another quiz | Denied `23514` |
| PG11 | Valid core quiz/assignment attempt/submission + authorized grading | Accepted |
| PG12 | Grade correction after historical learner enrollment ends, with currently authorized grader | Accepted without parent retarget |
| PG13 | Enrollment/role revocation vs attempt/submission insert in both commit orders | No invalid committed child |
| PG14 | Path/lesson/delivery/question reparent vs child insert in both commit orders | No mismatched committed history |
| PG15 | Cross-college or unassigned FACULTY persisted as grader | Denied `23514` |
| PG16 | Migration over deliberately poisoned existing rows | Fails before guard install; no silent cleanup |

Additional 0042 hardening witnesses:

| Witness | Case | Expected |
|---|---|---|
| PG17 | ACTIVE eligible learner in exact ACTIVE elective group, without host-section membership for the elective delivery | Accepted |
| PG18 | Host-section learner who never joined the bound elective group | Denied `23514` |
| PG19 | Former elective member / archived group-slot-offering / lost program eligibility | Denied `23514` |
| PG20 | Same-college College Admin, exact-delivery Faculty, and Super Admin grader positive cases | Accepted |
| PG21 | Lower assignment max_points below an already awarded grade | Denied `23514` |
| PG22 | Direct parent retarget of existing attempt/submission attribution | Denied `23514` |

## Source evidence completed in this batch

Committed source work includes:

- hardened canonical candidate: `e365e94`, plus INSERT-safe grader branch `cda9d01`;
- expanded source contract: `6c556b6`;
- baseline registered migration 0041 and its migration contract;
- forward hardening migration file: `8463f02`;
- trigger-only 0042 snapshot: `2818d1b`;
- 0042 journal registration: `791e9ed`;
- forward-compatible 0041/0042 migration tests: `2110a32`, `82a66b0`;
- canonical DB parity command wiring: `50960ff`.

These are commit/source facts only. They are not PostgreSQL pass evidence.

## Completion boundary

DB-030 must remain **IN_PROGRESS** until an approved disposable PostgreSQL environment executes:

1. zero-to-head journal replay including 0041 and 0042;
2. the full PG01–PG16 minimum matrix;
3. the PG17–PG22 hardening additions;
4. concurrency cases in both commit orders, with deadlock/serialization behavior reviewed;
5. existing course/quiz/assignment/group integration regression suites;
6. an independent verifier run with exact commit/test evidence.

Do not mark DB-030 `COMPLETED` or `DONE_VERIFIED` solely from registered migrations or source-contract checks.
