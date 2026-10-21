-- Hard-deleting a learner (LearnerServiceImpl.deleteLearner does a genuine JPA delete, unlike
-- the soft-delete pattern used almost everywhere else) used to either fail outright when the
-- learner had any Interview row (no ON DELETE behavior on that FK — a hard FK violation), or
-- succeed but leave learner_saved_job rows pointing at a learner_id that no longer exists
-- (that table has no FK at all). Add ON DELETE CASCADE consistently across all three placement
-- tables that reference learner_id, so deleting a learner cleanly removes their placement
-- footprint instead of failing unpredictably or leaving orphans.

-- interview.learner_id
SET @fk_name = (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND COLUMN_NAME = 'learner_id'
      AND REFERENCED_TABLE_NAME = 'learner'
    LIMIT 1
);
SET @drop_fk = IF(@fk_name IS NOT NULL,
    CONCAT('ALTER TABLE interview DROP FOREIGN KEY ', @fk_name),
    'SELECT 1');
PREPARE stmt FROM @drop_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE interview
    ADD CONSTRAINT fk_interview_learner_cascade FOREIGN KEY (learner_id) REFERENCES learner(id) ON DELETE CASCADE;

-- job_application.learner_id
SET @fk_name2 = (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'job_application'
      AND COLUMN_NAME = 'learner_id'
      AND REFERENCED_TABLE_NAME = 'learner'
    LIMIT 1
);
SET @drop_fk2 = IF(@fk_name2 IS NOT NULL,
    CONCAT('ALTER TABLE job_application DROP FOREIGN KEY ', @fk_name2),
    'SELECT 1');
PREPARE stmt FROM @drop_fk2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE job_application
    ADD CONSTRAINT fk_job_application_learner_cascade FOREIGN KEY (learner_id) REFERENCES learner(id) ON DELETE CASCADE;

-- learner_saved_job.learner_id had no FK at all — orphans were possible with nothing to catch
-- them. Remove any rows that already reference a deleted/missing learner first, so the new FK
-- below can actually be added without failing on pre-existing orphans.
DELETE lsj FROM learner_saved_job lsj
LEFT JOIN learner l ON l.id = lsj.learner_id
WHERE l.id IS NULL;

SET @fk_name3 = (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'learner_saved_job'
      AND COLUMN_NAME = 'learner_id'
      AND REFERENCED_TABLE_NAME = 'learner'
    LIMIT 1
);
SET @add_fk3 = IF(@fk_name3 IS NULL,
    'ALTER TABLE learner_saved_job ADD CONSTRAINT fk_learner_saved_job_learner_cascade FOREIGN KEY (learner_id) REFERENCES learner(id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @add_fk3; EXECUTE stmt; DEALLOCATE PREPARE stmt;
