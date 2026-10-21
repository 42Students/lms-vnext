SET @project_delivery_file_name_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_delivery'
      AND column_name = 'file_name'
);
SET @sql := IF(
    @project_delivery_file_name_exists = 0,
    'ALTER TABLE project_delivery ADD COLUMN file_name varchar(255) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @project_delivery_file_size_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_delivery'
      AND column_name = 'file_size'
);
SET @sql := IF(
    @project_delivery_file_size_exists = 0,
    'ALTER TABLE project_delivery ADD COLUMN file_size bigint NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @project_delivery_file_mime_type_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_delivery'
      AND column_name = 'file_mime_type'
);
SET @sql := IF(
    @project_delivery_file_mime_type_exists = 0,
    'ALTER TABLE project_delivery ADD COLUMN file_mime_type varchar(160) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @storage_key_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_delivery'
      AND column_name = 'storage_key'
);
SET @sql := IF(
    @storage_key_exists = 0,
    'ALTER TABLE project_delivery ADD COLUMN storage_key text NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @source_url_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_delivery'
      AND column_name = 'source_url'
);
SET @sql := IF(
    @source_url_exists = 0,
    'ALTER TABLE project_delivery ADD COLUMN source_url text NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
