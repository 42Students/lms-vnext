-- Stage 1: turn project_milestone into a real Scrum sprint time box, and give
-- project_workspace a cadence to generate sprints from. Additive only — every
-- column is nullable or defaulted, and project_milestone/milestone_key are kept
-- as the storage-layer name (see ProjectMilestone.java for why).

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_workspace' AND column_name = 'start_date'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_workspace ADD COLUMN start_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_workspace' AND column_name = 'end_date'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_workspace ADD COLUMN end_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_workspace' AND column_name = 'sprint_length_weeks'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_workspace ADD COLUMN sprint_length_weeks INT NULL DEFAULT 4', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_workspace' AND column_name = 'estimation_unit'
);
SET @sql := IF(@col_exists = 0, "ALTER TABLE project_workspace ADD COLUMN estimation_unit VARCHAR(20) NULL DEFAULT 'POINTS'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- project_milestone -> sprint fields
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'start_date'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_milestone ADD COLUMN start_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'end_date'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_milestone ADD COLUMN end_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- PLANNED | ACTIVE | COMPLETED. Distinct from milestone_status (which tracks
-- task-derived progress: UPCOMING/IN_PROGRESS/COMPLETED/OVERDUE) — sprint_state
-- is the lifecycle a mentor drives explicitly via start/complete actions.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'sprint_state'
);
SET @sql := IF(@col_exists = 0, "ALTER TABLE project_milestone ADD COLUMN sprint_state VARCHAR(20) NULL DEFAULT 'PLANNED'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'sprint_number'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_milestone ADD COLUMN sprint_number INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'goal'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_milestone ADD COLUMN goal TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Non-null only on the 4th sprint of a semester in our own seeded templates;
-- read as "this sprint ships a numbered release" when present. Stage 1 decision:
-- a flag on the sprint rather than a separate release entity (matches the
-- underwriting doc's 48-sprint/12-release structure with one added column).
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND column_name = 'release_label'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_milestone ADD COLUMN release_label VARCHAR(160) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Stage 3 fields land now too (additive, unused until Stage 3 wires them) so
-- this migration is the only schema change Stage 1-3 needs.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_task' AND column_name = 'estimate_points'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_task ADD COLUMN estimate_points INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_task' AND column_name = 'task_type'
);
SET @sql := IF(@col_exists = 0, "ALTER TABLE project_task ADD COLUMN task_type VARCHAR(20) NULL DEFAULT 'STORY'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_task' AND column_name = 'acceptance_criteria'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_task ADD COLUMN acceptance_criteria TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- carried_over_from_sprint_key: set when a task returns to the backlog at sprint
-- close and is later pulled into a new sprint — the honest carry-over trail
-- (Stage 3), distinct from milestone_key which is just "current sprint, if any".
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_task' AND column_name = 'carried_over_from_sprint_key'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_task ADD COLUMN carried_over_from_sprint_key VARCHAR(120) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Stage 6: ceremony type on the existing meeting entity.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_meeting' AND column_name = 'meeting_type'
);
SET @sql := IF(@col_exists = 0, "ALTER TABLE project_meeting ADD COLUMN meeting_type VARCHAR(20) NULL DEFAULT 'GENERAL'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_meeting' AND column_name = 'retro_went_well'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_meeting ADD COLUMN retro_went_well TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_meeting' AND column_name = 'retro_didnt_go_well'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_meeting ADD COLUMN retro_didnt_go_well TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_meeting' AND column_name = 'retro_actions'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_meeting ADD COLUMN retro_actions TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Only one ACTIVE sprint per project at a time — enforced in the service layer
-- (a partial unique index on sprint_state='ACTIVE' isn't portable to MySQL 5.7,
-- which this project still targets elsewhere per V91/V93's optimistic-locking
-- pattern), so this index just makes that lookup and the backlog/board queries fast.
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'project_milestone' AND index_name = 'idx_project_milestone_sprint_state'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_project_milestone_sprint_state ON project_milestone (project_id, sprint_state, is_deleted)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
