-- MySQL compatibility note:
-- `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` are not supported on many MySQL versions
-- commonly used in dev/UAT. Use INFORMATION_SCHEMA checks + dynamic SQL instead so this migration is
-- idempotent across environments.

-- =====================
-- Columns
-- =====================
SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_domain'
      AND COLUMN_NAME = 'verification_token') = 0,
  'ALTER TABLE tenant_domain ADD COLUMN verification_token VARCHAR(64) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_domain'
      AND COLUMN_NAME = 'verified_at') = 0,
  'ALTER TABLE tenant_domain ADD COLUMN verified_at DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_domain'
      AND COLUMN_NAME = 'is_verified') = 0,
  'ALTER TABLE tenant_domain ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================
-- Index
-- =====================
SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_domain'
      AND INDEX_NAME = 'idx_tenant_domain_verified') = 0,
  'CREATE INDEX idx_tenant_domain_verified ON tenant_domain (is_verified)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
