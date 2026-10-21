-- job.job_slug's uniqueness has, until now, existed only as a side effect of
-- ddl-auto=update picking up @Column(unique = true) on Job.jobSlug and silently creating
-- `UK_dcaaf53ifr41unjkkwi5ck1p7` on every environment. That's not documented anywhere in
-- migration history, so a fresh environment provisioned with ddl-auto=validate (or any
-- future move away from ddl-auto=update) would silently lose this constraint.
--
-- This migration is a safe no-op everywhere the constraint already exists (dev/uat/prod, all
-- confirmed live via `SHOW CREATE TABLE job` to already have a UNIQUE KEY on job_slug) and only
-- creates it where missing. Checks by column, not by name, since the existing constraint's name
-- was Hibernate-generated (a hash) rather than a fixed name we can rely on.

SET @has_unique_job_slug = (
    SELECT COUNT(1) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'job'
      AND COLUMN_NAME = 'job_slug'
      AND NON_UNIQUE = 0
);
SET @add_unique_job_slug = IF(@has_unique_job_slug = 0,
    'CREATE UNIQUE INDEX uk_job_job_slug ON job (job_slug)',
    'SELECT 1');
PREPARE stmt FROM @add_unique_job_slug; EXECUTE stmt; DEALLOCATE PREPARE stmt;
