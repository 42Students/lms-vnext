# DB-041 — quiz shuffle persistence parity

**Phase:** DATABASE  
**Task:** DB-041  
**Status:** source-only staging; no registered migration or runtime verification  
**Frozen legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Source contract

Legacy `Quiz` persists:

- `shuffle_questions` — boolean, default `false`;
- `shuffle_options` — boolean, default `false`.

These are active product fields, not dead columns. `QuizServiceImpl.applyQuizFields` writes both flags during create and update, and quiz responses expose both flags.

For learner presentation, the pinned service:

- leaves faculty/admin authoring order unchanged;
- shuffles questions only when `shuffle_questions=true`;
- shuffles each question's options only when `shuffle_options=true`;
- uses a deterministic seed derived from quiz ID + learner/viewer ID, and question ID for option shuffling;
- does not mutate persisted authored `sequence` fields or correctness.

The legacy service deliberately defaults both flags off so existing quizzes are not silently reordered. It does not freeze these flags after attempts; they are presentation metadata independent of submitted answer identity.

## vNext gap

Current `course_quizzes` has no equivalent persisted fields. The DB06 field ledger therefore correctly identified both legacy fields as active target gaps.

Canonical source-only SQL:
`docs/planning/sql/db06-quiz-shuffle-parity-candidate.sql`

It stages two additive columns:

- `course_quizzes.shuffle_questions boolean NOT NULL DEFAULT false`
- `course_quizzes.shuffle_options boolean NOT NULL DEFAULT false`

Existing vNext rows backfill to `false/false`; no inference to `true` is safe.

## Phase boundary

DB-041 does **not** implement API/UI shuffling. During the later API phase, create/update/read contracts must expose these flags and learner quiz rendering must reproduce the deterministic learner-specific permutation semantics without changing canonical question/option IDs or authored sequence.

The later UI phase may expose authoring controls. No UI work belongs in DB-041.

DB-038 retention remains orthogonal: toggling shuffle metadata does not rewrite submitted answer snapshots, question definitions, option definitions or grading history.

## Promotion acceptance

Before journal registration:

1. zero-to-head replay adds both boolean columns;
2. existing rows read `false/false`;
3. columns are `NOT NULL`;
4. direct inserts omitting both values persist `false/false`;
5. true/false and false/true combinations persist exactly;
6. toggling either flag does not alter question/option `sequence`;
7. DB-038 assessment-history guards still install and behave independently.

No PostgreSQL execution is claimed by this source-only task.
