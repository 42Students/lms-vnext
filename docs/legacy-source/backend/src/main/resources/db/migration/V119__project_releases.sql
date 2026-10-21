-- Real Release entity, replacing the free-text project_milestone.release_label "flag on
-- the sprint" workaround from V118. A release now groups sprints (one-to-many via
-- project_milestone.release_id) and carries its own lifecycle (PLANNED/IN_PROGRESS/SHIPPED),
-- so it can be reported on and gated ("ship" requires every linked sprint COMPLETED) instead
-- of being a label nobody could even set from the UI.

CREATE TABLE IF NOT EXISTS project_release (
    id INT NOT NULL AUTO_INCREMENT,
    project_id INT NOT NULL,
    release_key VARCHAR(64) NOT NULL,
    title VARCHAR(220) NOT NULL,
    target_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    sort_order INT NULL DEFAULT 0,
    notes TEXT NULL,
    created_by INT NULL,
    updated_by INT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    version BIGINT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_project_release_key UNIQUE (project_id, release_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'project_release' AND index_name = 'idx_project_release_project_id'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_project_release_project_id ON project_release (project_id, is_deleted)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Soft link from sprint to the release it ships. Kept alongside the old release_label
-- (untouched, still readable) rather than dropping it, since it's not this migration's job
-- to delete historical data — the merge/backfill below just stops release_label being the
-- only source of truth going forward.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'release_id'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_milestone ADD COLUMN release_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND index_name = 'idx_project_milestone_release_id'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_project_milestone_release_id ON project_milestone (release_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill: any sprint that already carries a release_label but no distinct project_release
-- row yet gets one created (keyed off a slugified label, unique per project) and linked. This
-- runs every deploy but is idempotent — INSERT ... WHERE NOT EXISTS, and the UPDATE only
-- touches rows still missing release_id, so re-running finds nothing left to do.
INSERT INTO project_release (project_id, release_key, title, status, sort_order, created_at, updated_at, version, is_deleted)
SELECT DISTINCT
    m.project_id,
    LOWER(REPLACE(REPLACE(REPLACE(TRIM(m.release_label), ' ', '-'), '/', '-'), '\\', '-')) AS release_key,
    TRIM(m.release_label) AS title,
    'PLANNED',
    0,
    NOW(),
    NOW(),
    0,
    0
FROM project_milestone m
WHERE m.release_label IS NOT NULL
  AND TRIM(m.release_label) <> ''
  AND m.is_deleted = 0
  AND NOT EXISTS (
      SELECT 1 FROM project_release r
      WHERE r.project_id = m.project_id
        AND r.release_key = LOWER(REPLACE(REPLACE(REPLACE(TRIM(m.release_label), ' ', '-'), '/', '-'), '\\', '-'))
  );

UPDATE project_milestone m
JOIN project_release r
  ON r.project_id = m.project_id
 AND r.release_key = LOWER(REPLACE(REPLACE(REPLACE(TRIM(m.release_label), ' ', '-'), '/', '-'), '\\', '-'))
SET m.release_id = r.id
WHERE m.release_label IS NOT NULL
  AND TRIM(m.release_label) <> ''
  AND m.release_id IS NULL;
