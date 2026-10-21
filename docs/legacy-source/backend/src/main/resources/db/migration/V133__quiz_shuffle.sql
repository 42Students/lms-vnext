-- Audit 2.7 (quiz & assessment): no randomisation of question or option order.
--
-- Every learner sees questions and options in the same sequence, which makes answer-sharing during
-- a session trivial — "C, A, D, B" is a complete answer key for everyone in the room.
--
-- Both default FALSE, so every existing quiz behaves exactly as it does today and randomisation is
-- something a faculty member turns on per quiz. Silently reordering existing quizzes would be a
-- surprising change to assessments that may already be mid-term.
--
-- BUGFIX (same typo as V122, found the same way): the table is `quizzes` (plural) — see
-- Quiz.java's @Table(name = "quizzes") and V66__first_class_quiz_tables.sql. `quiz` (singular)
-- has never existed.
ALTER TABLE quizzes
    ADD COLUMN shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN shuffle_options BOOLEAN NOT NULL DEFAULT FALSE;
