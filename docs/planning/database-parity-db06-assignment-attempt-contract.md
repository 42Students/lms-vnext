# DB-044 — assignment re-attempt persistence decision

**Phase:** DATABASE  
**Task:** DB-044  
**Status:** source-backed retirement/no-op staging; no migration registration

## Decision

Do **not** add `attempt_number` or a submission-level `semester_number` to vNext assignment submissions.

The active frozen production contract is **one submitted row per learner per assignment**, and vNext already enforces the equivalent normalized uniqueness.

## Frozen legacy evidence

### One-submission is the current active behavior

Migration `V28__student_assignment_unique_submission.sql`:

1. deletes duplicate `student_assignment` rows by `(student_id, lesson_content_id)`;
2. adds `UNIQUE(student_id, lesson_content_id)`.

Current `AssignmentServiceImpl.submit()` independently enforces the same rule:

- checks `existsByStudentIdAndLessonContentId(studentId, lessonContentId)`;
- returns “Already submitted for this assignment” when a row already exists;
- catches `DataIntegrityViolationException` from the unique-key race and maps it to the same duplicate-submission error.

The current lifecycle tests exercise the one-row submission path.

### Dormant attempt/semester fields

`StudentAssignment` still declares:

- `attempt_number`, default 1, comment “for re-attempt support”;
- `semester_number`, nullable, added by `V57__student_assignment_semester.sql`.

However, the pinned current submit implementation does not read or write either field. The repo census found no current `setAttemptNumber` / `getAttemptNumber` / `setSemesterNumber` / `getSemesterNumber` producer or consumer. The semester-scoped repository counter remains compatibility residue and has no current caller in the active assignment submission path.

Therefore the entity comments and V57 migration intent do **not** override the later/current enforced one-submission behavior.

## vNext normalization

Current vNext already has:

`assignment_submissions_assignment_membership_uq(assignment_id, membership_id)`

and `submitAssignment` maps that constraint to `ASSIGNMENT_ALREADY_SUBMITTED`.

This is the correct normalized counterpart of legacy V28 + current `AssignmentServiceImpl.submit()`.

### Why semester_number is not copied

vNext has immutable academic scope through:

`assignment -> delivery -> offering -> academic_period_id`

With only one active submission row per assignment+membership, copying a scalar semester number onto the submission is redundant and can drift from the relational academic-period scope.

## Ledger disposition

- `student_assignment.attempt_number` → **DERIVED_CONSTANT_NOT_PERSISTED**. Under the current active contract every accepted assignment submission is effectively attempt 1.
- `student_assignment.semester_number` → **NORMALIZED_RELATION_OR_DERIVED** using the submission delivery/offering academic period; no attempt-reset behavior survives in current prod.

Neither field is runtime-verified until global DB acceptance executes, but neither requires a new target column.

## Future product change

If assignment re-attempts are deliberately introduced later, do not revive the old scalar fields ad hoc. Treat it as a new product/API design:

- immutable attempt rows with explicit attempt number;
- defined whether grades attach to each attempt or a selected/current attempt;
- receipt/file ownership per attempt;
- explicit maximum-attempt policy;
- academic-period behavior;
- learner/faculty UI semantics;
- grading/audit history and result selection;
- concurrency-safe sequential numbering.

That future capability belongs to a product/API change, not legacy parity restoration.

## Acceptance

Before final DATABASE certification:

1. registered schema still has unique `(assignment_id,membership_id)`;
2. concurrent duplicate inserts are rejected;
3. assignment submission service maps duplicate-key races to the correct domain error;
4. no migration adds `attempt_number` or redundant `semester_number`;
5. assignment delivery remains locked to the correct academic-period/tenant graph;
6. DB-035 grade history and DB-038 immutable submission payload remain compatible.

No PostgreSQL execution is claimed by DB-044.
