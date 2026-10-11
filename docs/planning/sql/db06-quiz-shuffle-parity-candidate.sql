-- DB-041 / DB06 SOURCE-ONLY CANDIDATE. DO NOT REGISTER INDEPENDENTLY.
-- Frozen legacy Quiz has two active persisted presentation controls:
--   shuffle_questions boolean default false
--   shuffle_options   boolean default false
-- QuizServiceImpl writes them on create/update and reads them when rendering
-- learner quiz questions/options. They do not change authored sequences or
-- correctness and remain editable metadata in the pinned legacy service.
--
-- vNext currently has no equivalent columns. API presentation/cutover is a
-- later phase; this DATABASE candidate only stages durable state parity.

ALTER TABLE course_quizzes
  ADD COLUMN shuffle_questions boolean NOT NULL DEFAULT false,
  ADD COLUMN shuffle_options boolean NOT NULL DEFAULT false;

-- Promotion preflight is intentionally simple: both columns are additive,
-- non-null and backfill historical vNext quizzes to legacy's disabled default.
-- Do not infer "true" for old rows; legacy deliberately defaults these flags
-- off because silently reordering an existing assessment is surprising.

-- Required promotion witnesses:
-- 1. zero-to-head replay adds both NOT NULL boolean columns.
-- 2. an existing quiz reads false/false after migration.
-- 3. create with true/false persists exact values once API cutover is added.
-- 4. update may toggle either flag without rewriting question/option sequence.
-- 5. DB-038 submitted-history/definition-retention guards remain unaffected.
