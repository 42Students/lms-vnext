-- MySQL DDL can remain committed after a failed migration. V148 may therefore be
-- retried with template_snapshot already present, even though Flyway recorded a
-- failed attempt. Preserve existing snapshots and backfill only NULL values.
-- MySQL 8 has no ADD COLUMN IF NOT EXISTS; choose one statement using the
-- actual schema metadata and fail closed if an incompatible column exists.
SET @lms_v148_snapshot_ddl = (
    SELECT CASE
        WHEN COUNT(*) = 0 THEN
            'ALTER TABLE `project_workspace` ADD COLUMN `template_snapshot` JSON NULL AFTER `template_id`'
        WHEN SUM(DATA_TYPE = 'json' AND IS_NULLABLE = 'YES') = 1 THEN
            'SELECT 1'
        ELSE
            'SELECT 1 FROM `__lms_v148_invalid_template_snapshot_column_definition__`'
    END
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'project_workspace'
      AND COLUMN_NAME = 'template_snapshot'
);
PREPARE lms_v148_snapshot_stmt FROM @lms_v148_snapshot_ddl;
EXECUTE lms_v148_snapshot_stmt;
DEALLOCATE PREPARE lms_v148_snapshot_stmt;
SET @lms_v148_snapshot_ddl = NULL;

-- Freeze pre-existing workspaces at the template contents visible at migration
-- time. Never replace already-frozen snapshots on a retried partial migration.
-- New workspaces/rebinds are populated by the application from its exact DTO.
UPDATE project_workspace pw
JOIN project_template pt ON pt.id = pw.template_id
SET pw.template_snapshot = JSON_OBJECT(
    'id', pt.id,
    'slug', pt.slug,
    'title', pt.title,
    'summary', pt.summary,
    'courseLabel', pt.course_label,
    'status', pt.status,
    'templateVersion', pt.template_version,
    'lifecycleStatus', pt.lifecycle_status,
    'publishedAt', IF(pt.published_at IS NULL, NULL, CAST(pt.published_at AS CHAR)),
    'archivedAt', IF(pt.archived_at IS NULL, NULL, CAST(pt.archived_at AS CHAR)),
    'phase', pt.phase,
    'organizationId', pt.organization_id,
    'collegeId', pt.college_id,
    'createdBy', pt.created_by,
    'overview', pt.overview,
    'sprints', pt.sprints,
    'tasks', pt.tasks,
    'resources', pt.resources,
    'delivery', pt.delivery,
    'meetings', pt.meetings,
    'activity', pt.activity
)
WHERE pw.template_id IS NOT NULL
  AND pw.template_snapshot IS NULL;
