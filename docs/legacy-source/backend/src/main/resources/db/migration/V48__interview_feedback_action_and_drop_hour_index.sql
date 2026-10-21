-- Sprint 2, Fix 16: Drop the coarse hour-bucket unique index.
-- Overlap is now enforced purely at the application level (InterviewServiceImpl).
--
-- MySQL blocks dropping a unique index if a FK on the same table uses that index
-- as its backing index (to check referential integrity). The FK on learner_id uses
-- idx_interview_learner_slot because it was the first index covering learner_id.
-- Fix: drop the FK, drop the unique index, then re-add the FK (MySQL auto-creates
-- a plain index for it).

-- Step 1: Find and drop the FK constraint on learner_id (name varies by environment).
SET @fk_name = (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND COLUMN_NAME = 'learner_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);
SET @drop_fk = IF(@fk_name IS NOT NULL,
    CONCAT('ALTER TABLE interview DROP FOREIGN KEY ', @fk_name),
    'SELECT 1');
PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Drop the unique index (safe now that FK is removed).
SET @idx_exists = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND INDEX_NAME = 'idx_interview_learner_slot'
);
SET @drop_idx = IF(@idx_exists > 0,
    'DROP INDEX idx_interview_learner_slot ON interview',
    'SELECT 1');
PREPARE stmt FROM @drop_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Re-add the FK (MySQL will auto-create a plain index for learner_id).
SET @fk_missing = (
    SELECT COUNT(1) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND COLUMN_NAME = 'learner_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
);
SET @add_fk = IF(@fk_missing = 0,
    'ALTER TABLE interview ADD CONSTRAINT fk_interview_learner FOREIGN KEY (learner_id) REFERENCES learner(id)',
    'SELECT 1');
PREPARE stmt FROM @add_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Sprint 2, Fix 19: Add feedback_recommend_action (enum-style string) to replace boolean feedback_recommend.
SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND COLUMN_NAME = 'feedback_recommend_action'
);
SET @add_col = IF(@col_exists = 0,
    'ALTER TABLE interview ADD COLUMN feedback_recommend_action VARCHAR(30) NULL AFTER feedback_recommend',
    'SELECT 1');
PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate existing boolean data to the new column (conservative defaults).
-- true (1)  -> PROCEED_NEXT_ROUND (recommend moving forward)
-- false (0) -> REJECT
UPDATE interview
SET feedback_recommend_action = CASE
    WHEN feedback_recommend = 1 THEN 'PROCEED_NEXT_ROUND'
    WHEN feedback_recommend = 0 THEN 'REJECT'
    ELSE NULL
END
WHERE feedback_recommend IS NOT NULL;

-- The old boolean column is kept nullable for zero-downtime rollback.
-- It will be dropped in V49 after confirming V48 is stable in production.
