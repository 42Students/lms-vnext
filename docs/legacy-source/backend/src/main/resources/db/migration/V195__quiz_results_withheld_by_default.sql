-- New quizzes must not expose scores/correct answers merely because a learner finished early.
-- Keep every existing row exactly as-is; only change the database default for future inserts.
ALTER TABLE quizzes
    MODIFY COLUMN is_grade_published BOOLEAN NOT NULL DEFAULT FALSE;
