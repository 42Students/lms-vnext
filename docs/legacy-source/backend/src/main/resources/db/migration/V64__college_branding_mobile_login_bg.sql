-- Add separate mobile login background support for college branding.
-- Mobile apps and small-screen web can use this to avoid awkward cropping of desktop images.

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'college_branding'
    AND COLUMN_NAME = 'login_background_url_mobile'
);

SET @ddl = IF(
  @column_exists = 0,
  'ALTER TABLE college_branding ADD COLUMN login_background_url_mobile VARCHAR(1024) NULL AFTER login_background_url',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
