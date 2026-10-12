# DB-074: project submission review/evaluation ancestry integrity

**Chat 2 | DATABASE / DB-074 | Source/staging, not registered or DB verified**

## Reproduced source gap

`src/db/schema/projects.ts` persists both `project_submission_reviews.project_id` and `submission_id`, and likewise `project_evaluations.project_id` and `submission_id`. Each column independently references an existing project or submission; PostgreSQL cannot currently verify they belong to the **same project**. A malicious/buggy direct SQL write could attach a review or evaluation of B's submission to A's project, risking cross-project history contamination. Ordinary service-layer owner checks do not remove that structural hole.

DB-074 is separate from DB-073 (release/sprint/task/submission lineage), DB-068 (template-version owner), DB-070 (append-only template versions), and DB-071 (template pointers). No currently registered migration is modified. No imported production data is required.

## Exact proposed protection

One unique target on `project_submissions(project_id,id)` and two immediate composite FKs:

| Child | Constraint | Scoped parent |
| --- | --- | --- |
| `project_submission_reviews` | `project_submission_reviews_project_submission_fk` | `(project_id,submission_id) → project_submissions(project_id,id)` |
| `project_evaluations` | `project_evaluations_project_submission_fk` | `(project_id,submission_id) → project_submissions(project_id,id)` |

`docs/planning/sql/db07-review-evaluation-parent-fks-staging.sql` has two read-only mismatch probes, an aborting `DO` guard with SQLSTATE `23514`, the unique target and both FKs with `ON DELETE RESTRICT`. No dangerous row rewrite, no `NOT VALID`, no cascading deletion, no drop of existing single-column FKs. Keep historic review/evaluation ancestry even when submissions are approved, revised or archived.

## Explicitly out of scope

An FK ensures parent ownership only. It does **not** ensure a reviewer was a member of the same college/tenant when the review happened, had permission to review, was active, or that the review's decision matched the submission's updated status. Those checks require separately coordinated domain service and transaction evidence. Do not conflate authored constraints with security acceptance.

## Tests and gating

Static contract checks: `node --test tests/db074-review-evaluation-source.test.mjs` (**12 authored cases**). Source tests confirm two mismatch scans, fail-close guard, one exact unique target, two constrained FKs, no destructive operations and explicit non-registration.

PostgreSQL opt-in suite (must remain skipped until Chat 1 registers schema and prepares a disposable DB):

```bash
export TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_test
export DB074_REVIEW_EVALUATION_ENFORCED=1
npx vitest run --config vitest.db.config.ts tests/integration/db074-review-evaluation-parent-fks.test.ts
```

This suite requires the canonical disposable-target guard, queries `pg_constraint` for both validated FK definitions, and executes 6 rollback-only positive and negative INSERT/UPDATE witnesses.

**Completion semantics:** DB-074 may be `COMPLETED` for merged source staging with executed source-level verification; it is **not** `DONE_VERIFIED` until Chat 1 generates/replays migrations and actual PostgreSQL tests and project review/evaluation service regression pass. The global DATABASE phase remains active.
