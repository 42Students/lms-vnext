-- Courses and their content are core LMS capabilities, not optional modules.
-- Retire only the two former module-availability settings at every hierarchy scope.
-- Soft deletion retains the previous values for investigation and manual rollback.
-- Re-running this statement is safe; existing migration files must not be edited.
UPDATE app_setting
SET is_deleted = 1
WHERE LOWER(TRIM(setting_key)) IN ('module.courses.enabled', 'module.courses.locked')
  AND (is_deleted = 0 OR is_deleted IS NULL);
