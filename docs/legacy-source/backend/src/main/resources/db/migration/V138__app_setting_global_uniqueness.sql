-- app_setting's unique key is (scope_type, scope_id, setting_key), and scope_id is NULL for every
-- GLOBAL row. MySQL never treats NULLs as equal, so that constraint has never applied to GLOBAL
-- settings at all: two concurrent writes both INSERT and the table ends up holding two active rows
-- for one logical key.
--
-- The failure that follows is silent and unrepairable from the console:
--   * findActive returns Optional over a 2-row result and throws. getString swallows it, so every
--     read of that key reports "unset" and quietly falls back to the code default — including a
--     platform-wide module kill switch.
--   * upsert and delete call findActive directly with no catch, so every future write to that key
--     500s. Re-setting it from the admin UI cannot fix it.
--
-- Fixed with a generated column that maps NULL to a sentinel, and a unique index over that. This
-- keeps scope_id NULL-able (so no application code has to change how it reads or writes GLOBAL)
-- while giving the natural key a value the index can actually compare.

-- 1. Remove any duplicates that already exist, keeping the most recently updated row.
--    Correlated delete rather than a window function, so this works on MySQL 5.7 as well as 8.
DELETE a FROM app_setting a
INNER JOIN app_setting b
    ON a.scope_type = b.scope_type
   AND a.setting_key = b.setting_key
   AND a.scope_id IS NULL
   AND b.scope_id IS NULL
   AND (
        a.updated_at < b.updated_at
        OR (a.updated_at = b.updated_at AND a.id < b.id)
        OR (a.updated_at IS NULL AND b.updated_at IS NOT NULL)
   );

-- 2. Generated column: the real scope id, with NULL collapsed to a sentinel no real id can take.
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_setting' AND COLUMN_NAME = 'scope_id_key'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE app_setting ADD COLUMN scope_id_key INT AS (IFNULL(scope_id, -1)) STORED',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. The unique key that actually covers GLOBAL.
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_setting'
      AND INDEX_NAME = 'uq_app_setting_scope_key_v2'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE app_setting ADD UNIQUE KEY uq_app_setting_scope_key_v2 (scope_type, scope_id_key, setting_key)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Drop the index V63 created that duplicates the original unique key exactly
--    (same columns, same order). It was never used for reads the unique key couldn't serve, and
--    cost write amplification on every settings change. The original uq_app_setting_scope_key is
--    left in place: it still constrains every non-GLOBAL row, and dropping it would need a
--    rewrite of the table for no benefit.
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_setting'
      AND INDEX_NAME = 'idx_app_setting_scope_key'
);
SET @sql = IF(@idx_exists > 0, 'DROP INDEX idx_app_setting_scope_key ON app_setting', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
