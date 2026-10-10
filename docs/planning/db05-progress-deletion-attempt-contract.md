# DB05 learner progress tombstone and latest-attempt semantics

**Worker:** Chat 6 / DB-008 · **Phase:** DATABASE · **State:** source-based candidate, NOT executed/registered or verified.  
**Legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.  
**vNext:** `src/db/schema/courses.ts`.  
**Companion draft:** `scripts/sql/db05-version-progress-attempts.draft.sql`.

## Source behavior is not one universal deletion policy

- Legacy `LearnerContentProgress.java` extends `BaseModel.java`; the mapped superclass persists `is_deleted` (default false). It also owns `attempt`, `first_completed_at`, `completed_at`, `duration_seconds` and watch position.
- Legacy `LearnerContentProgressRepository.countCompletedPerLearner` counts only `completed_at IS NOT NULL` and `(p.is_deleted = 0 OR p.is_deleted IS NULL)`, **after** restricting `p.attempt` to the MAX attempt for the learner/content, where the MAX subquery does **not** exclude deleted attempts.
- Legacy `findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc` reads the highest attempt without an `is_deleted` clause. `findByLearnerIdAndLessonContentIdIn` also chooses the latest without a soft-delete filter. These paths need distinct parity decisions; do not claim every legacy read excludes tombstones.
- Legacy `startNewAttempt` writes new rows with `is_deleted = 0`. Old attempts remain as historical runs, while `first_completed_at` is immutable within a run.
- Current vNext `learner_content_progress` has no tombstone and unique `(membership_id, lesson_content_id)`; therefore it cannot yet represent multiple attempts or soft-delete status. The existing unregistered attempt draft proposes an attempt-aware uniqueness swap.

## Critical invariant — select latest attempt *before* visibility filter

With `attempt 1` completed and active, `attempt 2` deleted and completed, legacy admin completed-item counts report **zero** because they select attempt 2 first, then filter out deletion. A query filtering non-deleted rows before computing max would select attempt 1 and incorrectly resurrect a completed history item into the current run.

This is a source-observed rule for **that counting query only**, not an authorization to copy it indiscriminately across user progress reads or audit history.

## Staged normalized storage and blockers

`deleted_at timestamptz` is proposed as a nullable tombstone. It is greenfield, so no legacy data copy is required. However, SQL alone does not prove parity:
1. Confirm the exact progress delete/restore producer paths, and whether deletion can be reversed; don't silently hard-delete attempts.
2. Confirm current progress reads, course completion counts, admin aggregate, and rewatch start each independently, including absent/deleted runs.
3. Use trusted tenant-scoped membership and lesson-content relationships. Independent FKs do not guarantee the same college. Add DB protection or prove parent scope immutability and run negative cross-college tests.
4. Preserve `first_completed_at` within an attempt even after resetting `completed_at`; new attempts must start without inherited completion.
5. Make `(membership_id, lesson_content_id, attempt)` the unique key atomically with attempt-aware application writers and readers; test concurrent `startNewAttempt` races and upsert conflicts.
6. Do not treat `deleted_at IS NULL` as a DB-level default for every aggregate without confirming legacy source and desired vNext behavior.
7. Chat 1 must register numbered migration/schema barrel only after actual disposable PostgreSQL replay, negative tenant/race tests, and application consumer integration evidence.

**Current disposition:** the legacy field remains MISSING_OR_UNPROVEN in the 92-field semantic review despite source evidence; this proposal **does not** mark it VERIFIED or DONE_VERIFIED. The review/decisions/manifest counters are managed independently on latest main to avoid a concurrent overwrite.
