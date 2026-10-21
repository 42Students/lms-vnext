-- Project templates go from a per-college entity to a single platform-wide catalog: the college
-- that provides these templates (a fixed set of ~10 industrial projects) wants every college
-- using this LMS to draw from the same catalog, not build their own. Only super-admin creates and
-- maintains templates now; college-admin picks one and uses it. See the audit note this pairs
-- with: college-admin previously had full CRUD parity on templates (commit 00d4c401), which is
-- exactly what this change walks back at the data-model level, not just in the UI.
--
-- college_id/organization_id become nullable rather than dropped: dev-2026 has no live templates
-- yet (free rein per the standing note), so there is nothing to migrate, but keeping the columns
-- (always NULL going forward) avoids a second migration if a future, different requirement
-- resurfaces a per-college or per-org template need.
--
-- Idempotent throughout (V47/V125's established pattern in this file): this migration was first
-- applied by hand directly against the shared dev-2026 database while V122 (unrelated, a few
-- versions earlier) was broken and blocking Flyway entirely -- see V122's own bugfix note. Once
-- V122 is fixed and Flyway retries from where it left off, it reaches this migration again with
-- the schema already in its target state; every step here checks before acting so that re-run is
-- a clean no-op instead of an error.
ALTER TABLE project_template MODIFY COLUMN college_id INT NULL;
ALTER TABLE project_template MODIFY COLUMN organization_id INT NULL;

DROP PROCEDURE IF EXISTS V136_drop_index;
CREATE PROCEDURE V136_drop_index(IN p_table VARCHAR(64), IN p_index_name VARCHAR(64))
BEGIN
  SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index_name);
  IF @idx_exists > 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP INDEX `', p_index_name, '`');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

DROP PROCEDURE IF EXISTS V136_add_unique_key;
CREATE PROCEDURE V136_add_unique_key(IN p_table VARCHAR(64), IN p_key_name VARCHAR(64), IN p_columns VARCHAR(255))
BEGIN
  SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_key_name);
  IF @idx_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD UNIQUE KEY `', p_key_name, '` (', p_columns, ')');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

-- The (college_id, slug) uniqueness from V99 assumed every template belongs to exactly one
-- college. With college_id now always NULL, slug uniqueness needs to be global instead.
CALL V136_drop_index('project_template', 'uk_project_template_college_slug');
CALL V136_add_unique_key('project_template', 'uk_project_template_slug', 'slug');

DROP PROCEDURE IF EXISTS V136_drop_index;
DROP PROCEDURE IF EXISTS V136_add_unique_key;
