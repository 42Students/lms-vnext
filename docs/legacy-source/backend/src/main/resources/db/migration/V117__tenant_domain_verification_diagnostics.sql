-- A failed domain verification collapsed every failure reason (no TXT record, wrong value, DNS
-- timeout) to the same silent "still unverified" state, with no record of when it was last tried
-- or what was actually found — a superadmin re-clicking "Check Now" had nothing to debug against.
--
-- Guarded (matches the pattern established in V118/V119) — see V116 for why.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'tenant_domain' AND column_name = 'last_checked_at'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE tenant_domain ADD COLUMN last_checked_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'tenant_domain' AND column_name = 'last_check_result'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE tenant_domain ADD COLUMN last_check_result VARCHAR(32) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'tenant_domain' AND column_name = 'last_found_values'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE tenant_domain ADD COLUMN last_found_values VARCHAR(512) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
