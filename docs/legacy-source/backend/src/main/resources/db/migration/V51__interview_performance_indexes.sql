-- V50: Add composite indexes for interview table performance.
-- All indexes are added idempotently (check information_schema first).
-- Covers the most frequent query patterns:
--   1. Org-level admin listing   → (organization_id, is_deleted, scheduled_date)
--   2. Learner dashboard          → (learner_id, organization_id, is_deleted)
--   3. Application-level queries  → (job_application_id, is_deleted, scheduled_date)
--   4. Overlap check queries      → (learner_id, interview_status, is_deleted)
--   5. Reminder / upcoming jobs   → (scheduled_date, interview_status, is_deleted)

-- Index 1: Org-level listing (most frequent admin query)
SET @idx1_exists = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND INDEX_NAME = 'idx_interview_org_deleted_date'
);
SET @sql1 = IF(@idx1_exists = 0,
    'ALTER TABLE interview ADD INDEX idx_interview_org_deleted_date (organization_id, is_deleted, scheduled_date)',
    'SELECT 1 -- idx_interview_org_deleted_date already exists');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Index 2: Learner dashboard queries
SET @idx2_exists = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND INDEX_NAME = 'idx_interview_learner_org_deleted'
);
SET @sql2 = IF(@idx2_exists = 0,
    'ALTER TABLE interview ADD INDEX idx_interview_learner_org_deleted (learner_id, organization_id, is_deleted)',
    'SELECT 1 -- idx_interview_learner_org_deleted already exists');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Index 3: Application-level interview queries
SET @idx3_exists = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND INDEX_NAME = 'idx_interview_app_deleted_date'
);
SET @sql3 = IF(@idx3_exists = 0,
    'ALTER TABLE interview ADD INDEX idx_interview_app_deleted_date (job_application_id, is_deleted, scheduled_date)',
    'SELECT 1 -- idx_interview_app_deleted_date already exists');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Index 4: Overlap check queries (learner + status)
SET @idx4_exists = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND INDEX_NAME = 'idx_interview_overlap_learner'
);
SET @sql4 = IF(@idx4_exists = 0,
    'ALTER TABLE interview ADD INDEX idx_interview_overlap_learner (learner_id, interview_status, is_deleted)',
    'SELECT 1 -- idx_interview_overlap_learner already exists');
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Index 5: Scheduled date + status (reminder job, upcoming interviews)
SET @idx5_exists = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND INDEX_NAME = 'idx_interview_scheduled_status'
);
SET @sql5 = IF(@idx5_exists = 0,
    'ALTER TABLE interview ADD INDEX idx_interview_scheduled_status (scheduled_date, interview_status, is_deleted)',
    'SELECT 1 -- idx_interview_scheduled_status already exists');
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;
