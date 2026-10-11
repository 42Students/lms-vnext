# DB-008 — Progress consumers: latest-attempt read/aggregate cutover contract

**Status:** SOURCE VERIFIED FOR LEGACY READ PATTERNS; **vNext API NOT IMPLEMENTED**; SQL drafts **NOT REGISTERED**; no PostgreSQL replay. DATABASE phase only. W01 owns numbered migrations/schema barrel. Backend oracle: `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.

## Direct source findings

1. `BaseModel.isDeleted` is inherited by `LearnerContentProgress`; `V36__learner_content_progress.sql` explicitly persists it, default false.
2. `LearnerContentProgressRepository.countCompletedPerLearner` first resolves **MAX(attempt)** over **ALL** rows for that learner/content, then requires `completed_at IS NOT NULL` and `is_deleted = 0 OR is_deleted IS NULL`. A deleted latest attempt suppresses an older completed run.
3. `findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc` and `findByLearnerIdAndLessonContentIdIn` return latest even when it is soft-deleted. They do **not** apply the admin aggregate tombstone predicate.
4. `startNewAttempt` materializes a new run with position zero, carries duration, sets `is_deleted = 0`, and omits both completion timestamps.
5. vNext `src/modules/courses/progress-service.ts` `loadProgressRow` selects `.limit(1)` with no attempt ordering, and `atomicProgressUpdate` updates by membership/content only; inserting attempt 2 would update both runs. Insert-conflict handling still names the old unique key.
6. vNext `src/modules/courses/learner-course-service.ts` builds the learner lesson workspace via a `LEFT JOIN learner_content_progress` on membership/content only. After attempt expansion this can duplicate the content/lesson rows and inflate counts/progress even if individual progress endpoints are fixed.

## Query shapes for API-phase handoff (informative, NOT an executable migration)

**A. Latest attempt for learner detail — may return tombstoned row, matching legacy raw detail:**

```sql
SELECT p.*
FROM learner_content_progress AS p
WHERE p.membership_id = $1 AND p.lesson_content_id = $2
ORDER BY p.attempt DESC
LIMIT 1;
```

API must separately decide whether learner-facing tombstoned progress is shown or hidden; the legacy repository did not filter it.

**B. Admin completed count — latest attempt before deleted filter:**

```sql
WITH latest AS (
  SELECT DISTINCT ON (p.membership_id, p.lesson_content_id)
         p.membership_id, p.lesson_content_id, p.attempt,
         p.completed_at, p.deleted_at
    FROM learner_content_progress AS p
    -- $1 is a server-authorized set of lesson content IDs from one scoped course/delivery;
    -- do NOT trust an arbitrary client list as a permission boundary.
   WHERE p.lesson_content_id = ANY($1::uuid[])
   ORDER BY p.membership_id, p.lesson_content_id, p.attempt DESC
)
SELECT membership_id, count(*)::integer AS completed_count
  FROM latest
 WHERE completed_at IS NOT NULL AND deleted_at IS NULL
 GROUP BY membership_id;
```

**C. Learner course workspace — one joined progress row per content, even after retakes:**

```sql
-- Existing course_lessons/lesson_contents authorization, publication, offering
-- and delivery filters must remain; this shows only the necessary join change.
LEFT JOIN LATERAL (
  SELECT p.last_position_seconds, p.completed_at, p.first_completed_at,
         p.attempt, p.deleted_at
  FROM learner_content_progress p
  WHERE p.membership_id = :trusted_membership_id
    AND p.lesson_content_id = lesson_contents.id
  ORDER BY p.attempt DESC
  LIMIT 1
) latest_progress ON true
```

**D. Historical attempts (authorized staff scope only):**

```sql
SELECT p.attempt, p.last_position_seconds, p.duration_seconds,
       p.completed_at, p.first_completed_at, p.deleted_at,
       p.created_at, p.updated_at
FROM learner_content_progress AS p
WHERE p.membership_id = $1 AND p.lesson_content_id = $2
ORDER BY p.attempt ASC;
```

Must not return private file URLs from historical progress without current resource authorization.

## Coordinated write semantics

- Atomic update targets **one exact attempt** with `WHERE membership_id=? AND lesson_content_id=? AND attempt=?`. Check the update row count and reject stale attempt saves rather than let a late tab update a newer retake.
- New attempt is a deliberate **authorized admin action**, serialized by trusted learner+content scope. Verify the next attempt under transaction lock, then insert a fresh row with `first_completed_at NULL`, `completed_at NULL`, `last_position_seconds=0`; copy only content-duration metadata after source review.
- Keep completion audit immutable within a run. Rewatch clearing `completed_at` may not erase `first_completed_at`; an entirely new attempt must start with neither.
- On a race between attempt advance and stale content save, never write attempt 1 after attempt 2 was created. An attempt-aware read followed by unguarded write is insufficient: compare the expected current attempt under row/transaction lock.
- The 90% video-completion threshold and trusted authored duration are separate semantics from history; preserve them.
- All queries must first enforce college membership/content path and current delivery/course authorization. Independent FKs alone do not provide tenant isolation.

## Mandatory acceptance matrix — NOT EXECUTED

| Case | Legacy source expected | New consumer proof |
|---|---|---|
| attempt 1 completed, attempt 2 incomplete | 0 admin completions | Need API and PostgreSQL |
| attempt 1 completed, attempt 2 deleted and completed | 0 admin completions, **not 1** | Need API and PostgreSQL |
| attempt 1 + attempt 2 in learner workspace | exactly one rendered content row | Need API/React/integration |
| latest attempt soft-deleted; raw detail query | latest row returned, unfiltered | Need per-reader product decision |
| attempt 1 completed + explicit rewatch | `first_completed_at` remains immutable | Need PG trigger and API |
| reset a retake | attempt N+1 starts incomplete with position 0 | Need admin permission + race |
| stale tab writes old attempt after retake | cannot modify a newer or historical run | Need two-session PG |
| foreign-college membership/content or forged receipt | rejected | Need tenant guard + PG |
| vNext unique-key swap | attempts coexist, no old 2-column constraint | Need Chat 1 migration replay |

A separate pure Node reference-model suite at `tests/db05-progress-consumer-reference.test.mjs` protects interpretation of the **source semantics** only; it is not PostgreSQL/API proof.

**Integrator:** Do not mark DB-008 DONE_VERIFIED until these consumer queries are implemented, their actual PostgreSQL and API tests have passed on a recorded SHA, and Chat 1 registers the approved version-progress draft in the single migration journal.
