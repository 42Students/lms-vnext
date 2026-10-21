-- job_application had no index on application_status, applied_at, or status_updated_at, and job
-- had none on college_id/is_deleted — every admin query filtering/sorting on these (the pipeline
-- table, the dashboard metrics, the retention report) was a full table scan. These are a direct
-- prerequisite for the SQL-pushed pagination/aggregation queries added alongside this migration
-- (PlacementJobServiceImpl.getApplicationsForJobPaginated, AdminJobServiceImpl.getHiringMetrics/
-- getCompanyWiseHiringReport) — without them those queries just move the scan from Java to MySQL.

SET @idx1 = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_application' AND INDEX_NAME = 'idx_job_application_job_status');
SET @add1 = IF(@idx1 = 0, 'CREATE INDEX idx_job_application_job_status ON job_application (job_id, application_status)', 'SELECT 1');
PREPARE stmt FROM @add1; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx2 = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_application' AND INDEX_NAME = 'idx_job_application_job_applied_at');
SET @add2 = IF(@idx2 = 0, 'CREATE INDEX idx_job_application_job_applied_at ON job_application (job_id, applied_at)', 'SELECT 1');
PREPARE stmt FROM @add2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx3 = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_application' AND INDEX_NAME = 'idx_job_application_status_updated_at');
SET @add3 = IF(@idx3 = 0, 'CREATE INDEX idx_job_application_status_updated_at ON job_application (status_updated_at)', 'SELECT 1');
PREPARE stmt FROM @add3; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx4 = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job' AND INDEX_NAME = 'idx_job_college_deleted');
SET @add4 = IF(@idx4 = 0, 'CREATE INDEX idx_job_college_deleted ON job (college_id, is_deleted)', 'SELECT 1');
PREPARE stmt FROM @add4; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx5 = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_application_status_history' AND INDEX_NAME = 'idx_jash_application_status');
SET @add5 = IF(@idx5 = 0, 'CREATE INDEX idx_jash_application_status ON job_application_status_history (application_id, new_status)', 'SELECT 1');
PREPARE stmt FROM @add5; EXECUTE stmt; DEALLOCATE PREPARE stmt;
