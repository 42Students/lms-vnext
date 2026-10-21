-- How people sign in on a college's own address, chosen by a super admin in Tenant Setup (set per the
-- college's subscription): EMAIL_PHONE (both, email shown first), PHONE_EMAIL (both, phone first),
-- EMAIL_ONLY or PHONE_ONLY. NULL means the default, EMAIL_PHONE. The global host (42lms.com) is always EMAIL_PHONE.
-- Enforced in PublicMobileAuthController; recruiters can always use email.

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'college_branding'
    AND COLUMN_NAME = 'login_methods'
);

SET @ddl = IF(
  @column_exists = 0,
  'ALTER TABLE college_branding ADD COLUMN login_methods VARCHAR(16) NULL AFTER login_theme',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
