-- Login page gradient preset per college, chosen by a super admin in Tenant Setup > Look and feel.
-- Holds a preset key (teal, ocean, indigo, violet, rose, amber, forest, slate); NULL means the default (teal).
-- The colours for each key live in the frontend (src/config/loginThemes.js).

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'college_branding'
    AND COLUMN_NAME = 'login_theme'
);

SET @ddl = IF(
  @column_exists = 0,
  'ALTER TABLE college_branding ADD COLUMN login_theme VARCHAR(32) NULL AFTER secondary_color',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
