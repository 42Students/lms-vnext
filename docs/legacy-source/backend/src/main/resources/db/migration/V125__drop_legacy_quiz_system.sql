-- Removes the legacy quiz system entirely. Quizzes are now created and taken exclusively
-- through the first-class Quiz/QuizQuestion/QuizOption/QuizAttempt/QuizAnswer tables (V66) via
-- POST /api/v1/quizzes; the old embedded-in-lesson-content quiz (LessonContents.quizDTO /
-- StudentAssignment.quizDTO, submitted through /api/v1/assignment/submit with a "responses"
-- array) had no live users on this platform and is fully retired in application code as of this
-- migration. This is a one-way cleanup -- there is no migration path back to the legacy system.
--
-- lesson_contents.quiz_content_data and student_assignment.quiz_contents predate this repo's
-- tracked migration history (created by Hibernate ddl-auto=update against the entities, not by
-- any earlier Flyway migration), so -- like V47's ADD COLUMN calls -- the DROP COLUMN calls below
-- must be conditional: a database that never had the legacy quiz feature exercised (e.g. a fresh
-- environment) may never have had these columns materialize at all.

DROP PROCEDURE IF EXISTS V125_drop_col;
CREATE PROCEDURE V125_drop_col(IN p_table VARCHAR(64), IN p_column VARCHAR(64))
BEGIN
  SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
                     WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column);
  IF @col_exists > 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP COLUMN `', p_column, '`');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

-- 1. The quiz JSON payload columns themselves.
CALL V125_drop_col('lesson_contents', 'quiz_content_data');
CALL V125_drop_col('student_assignment', 'quiz_contents');

-- 2. lesson_contents.max_attempts (V47) existed only to bound legacy quiz re-attempts; assignments
--    have always been single-submission (enforced via existsByStudentIdAndLessonContentId) and
--    never read this column. The first-class Quiz system has its own maxAttempts column (V66).
CALL V125_drop_col('lesson_contents', 'max_attempts');

DROP PROCEDURE IF EXISTS V125_drop_col;

-- 3. quiz_draft: auto-save/partial-progress table for the legacy quiz only. No FKs reference it.
DROP TABLE IF EXISTS quiz_draft;
