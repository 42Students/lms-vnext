# DB06 submitted assessment immutability and retention contract

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE  
**Queue task:** DB-038 · **Worker:** Chat 1  
**Status:** source-only staging; not registered or runtime verified.

Candidate:
`docs/planning/sql/db06-assessment-history-retention-candidate.sql`

## Source decision

The target model is **immutable retained submitted history**, not legacy-style soft delete.

Pinned legacy behavior:

- `QuizAttempt.status` defaults to `SUBMITTED`; the current submit path does not persist another attempt lifecycle state.
- legacy quiz deletion soft-deletes the quiz specifically to preserve questions/attempts for grading history.
- no active pinned producer was found that deletes/restores quiz attempts or answers.
- legacy `is_deleted` on attempt/answer rows is inherited generic `BaseModel` infrastructure rather than an observed active assessment-history lifecycle.

Current vNext behavior is stronger and simpler:

- `submitCourseQuiz` computes the final score before INSERT;
- it INSERTs one attempt and all answer snapshots in one transaction;
- attempt/answer rows are subsequently read, not edited;
- assignment submission learner payload is insert-once; only grading/feedback/publication/version fields are legitimate post-submission mutations.
- pinned `AssignmentServiceImpl` / `AssignmentController` expose submit/read/grade/publish paths but no submission delete/restore producer; `StudentAssignmentRepository` only carries inherited `is_deleted` read filters.

Accordingly DB-038 updates the DB06 field ledger:

- `quiz_attempts.status` → derived metadata, not persisted;
- `quiz_attempts.is_deleted` / `quiz_answers.is_deleted` → normalized immutable history;
- `student_assignment.is_deleted` → normalized immutable retained assignment history; no active pinned delete/restore producer was found;
- mutable legacy `updated_at` on attempt/answer rows → unnecessary because the target history cannot UPDATE.

## Attempt and answer immutability

Promotion rejects UPDATE, DELETE and TRUNCATE of:

- `quiz_attempts`;
- `quiz_attempt_answers`.

This includes score, max-score, attempt number, submitted time, selected options, prompt/options snapshots, correctness and awarded points.

Corrections to a submitted quiz result must be a future explicit correction/audit workflow; rewriting the historical row is not allowed.

## Assignment learner payload immutability

`assignment_submissions` remains partly mutable because grading is an active workflow.

The following learner-submission identity/payload fields become immutable after INSERT:

- assignment;
- delivery;
- learner membership;
- submission type;
- text payload;
- link payload;
- submitted time;
- created time.

The following remain mutable through the authorized/audited grading path:

- points awarded;
- feedback;
- grading status;
- grade publication;
- grader;
- graded time;
- optimistic version;
- updated time.

Hard DELETE/TRUNCATE of assignment submission history is rejected.

DB-035 separately stages the immutable grade-event ledger; DB-038 does not duplicate that design.

## Quiz definition freeze

Current service semantics already refuse question rewrites once the quiz is not DRAFT or once attempt history exists. DB-038 closes direct SQL bypass.

Question and option INSERT/UPDATE/DELETE are permitted only while:

- parent quiz is `DRAFT`; and
- no attempt exists.

Question `quiz_id` and option `question_id` are immutable; the live authoring service replaces rows rather than reparents an existing historical identity.

After attempts exist, `max_attempts` and `total_points` are also immutable.

Title, description, due date and sequence remain editable metadata. They are intentionally not frozen by DB-038 because both pinned legacy and current vNext separate those fields from the submitted answer definition; quiz status/results publication remain lifecycle state.

## Scoring coherence

### Sequential attempt number / max attempts

The candidate uses the **same advisory lock namespace as the active service**:

`pg_advisory_xact_lock(hashtext(quizId + ':' + membershipId), 6206001)`

Every direct SQL attempt INSERT must therefore serialize with `submitCourseQuiz` for that learner+quiz and satisfy:

- existing attempt count < quiz max attempts;
- new attempt number = existing count + 1.

This prevents direct SQL gaps and max-attempt bypass while preserving cross-learner concurrency.

### Quiz total points

Deferred constraint triggers require:

`course_quizzes.total_points = SUM(quiz_questions.points)`

and the sum must be positive.

The check is deferred because create/update code may replace the question set and update the quiz denominator in either order within one transaction.

## Authoring option-set integrity

The active quiz validator requires:

- 2–20 options per question;
- option sequence uniqueness;
- case-insensitive option text uniqueness;
- SINGLE_CHOICE → exactly one correct option;
- MULTIPLE_CHOICE → at least one correct and at least one incorrect option.

Base schema already owns option sequence uniqueness. DB-038 stages:

- `quiz_options_question_lower_text_uq` on `lower(trim(option_text))` for the same trim + case-insensitive uniqueness used by the live validator;
- deferred question/option shape triggers so multi-row DRAFT rewrites may occur in any order inside one transaction, but invalid final option sets cannot commit.

These constraints are required because the answer-snapshot validator derives correctness from the persisted option set. A malformed direct-SQL authoring state must not become a valid scoring oracle.

## Snapshot fidelity

A subtle race exists in the current application shape: `submitCourseQuiz` loads questions/options before opening its write transaction. An authoring transaction can theoretically commit after that read but before the attempt write.

DB-038 therefore does not rely on locking alone. Every `quiz_attempt_answers` INSERT validates its stored snapshot against the committed question/options definition at INSERT time:

- question belongs to the attempt quiz;
- question type, prompt and points match;
- options snapshot equals the current ordered option set;
- selected option IDs are unique and belong to the question;
- SINGLE_CHOICE does not select multiple options;
- persisted `correct` and `points_awarded` equal the result implied by the committed correct-option set.

Question/option authoring also takes a row-update lock on the parent quiz. Registered DB06 attempt guards already take a shared parent quiz lock during attempt INSERT. This serializes the database write phase, while snapshot validation rejects any stale definition that was loaded before the transaction.

## Complete-attempt invariant

A DEFERRABLE INITIALLY DEFERRED constraint trigger on attempt INSERT requires at COMMIT:

- quiz has at least one question;
- exactly one answer row exists per quiz question, including unanswered questions represented by an empty selected-option array;
- sum(answer.points_awarded) = attempt.score;
- sum(answer.points_possible) = attempt.max_score;
- attempt.max_score = quiz.total_points.

This means a direct SQL attempt cannot commit without its complete answer snapshot set.

## Non-destructive preflight

Promotion must refuse existing inconsistent history rather than silently repairing it.

The staged preflight checks:

- answer count vs question count;
- answer score/max totals vs attempt score/max;
- attempt max score vs quiz total points;
- answer question belongs to attempt quiz;
- answer question type/prompt/points match current definition;
- answer options snapshot matches the canonical current option set;
- option count, trimmed/case-insensitive option-text uniqueness and correct-option cardinality;
- selected option uniqueness/membership, SINGLE_CHOICE selection cardinality and persisted correctness/points.

These are source-only staged checks until the candidate is registered and executed on disposable PostgreSQL.

## Explicitly outside this candidate

`course_upload_receipts` and `assignment_submission_files` still live in the staged `src/db/schema/course-upload-receipts-staged.ts` surface and are not exported from the canonical schema barrel. DB-038 therefore does not create triggers against those unregistered tables. When that private-file schema is promoted, consumed receipt/file attestation must receive equivalent immutable-history protection without weakening DB-038.

## Interaction with registered 0041/0042

DB-038 is a forward source candidate. It assumes and complements:

- DB06 same-offering/exact-delivery scope;
- learner delivery/roster scope;
- quiz-attempt and assignment-submission attribution immutability;
- assignment grader checks;
- parent history/reparent guards.

Do not copy old 0041 functions into a new migration. Promotion should only add the new retention/definition/snapshot/sequence constraints after reconciling current main.

## PostgreSQL acceptance required

At minimum execute these witnesses before registration:

1. valid application-style attempt + complete snapshots commits;
2. attempt UPDATE of score/max/submission time fails;
3. attempt DELETE and TRUNCATE fail;
4. answer UPDATE/DELETE/TRUNCATE fail;
5. assignment grade/feedback/version update remains allowed;
6. assignment learner payload update fails;
7. assignment submission DELETE/TRUNCATE fails;
8. attempt-free DRAFT question/option authoring remains allowed;
9. non-DRAFT question/option mutation fails;
10. post-attempt question/option mutation fails;
11. question/option parent reparent fails;
12. post-attempt max-attempt/total-point mutation fails;
13. direct SQL attempt-number gap fails;
14. max-attempt overflow fails;
15. simultaneous service/direct attempts serialize through advisory lock 6206001;
16. quiz total-points mismatch fails at COMMIT;
17. stale question prompt/type/points snapshot fails;
18. stale options snapshot fails;
19. duplicate/foreign selected option fails;
20. incorrect persisted correctness/points fails;
21. attempt with missing answer snapshot fails at COMMIT;
22. attempt score/max mismatch vs answers fails at COMMIT;
23. authoring-first vs attempt-first concurrency leaves one coherent committed history;
24. poisoned existing history makes the preflight fail without mutation;
25. duplicate option text differing only by case fails;
26. invalid option count/correct-option cardinality fails at COMMIT.

Until those execute successfully on a disposable PostgreSQL replay, DB-038 is source-complete at most and must not be `DONE_VERIFIED`.
