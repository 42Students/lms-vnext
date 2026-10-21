-- Completes the milestone -> sprint rename at the storage layer.
--
-- The product has called these objects "sprints" since V100 (tabs, labels, activity feed), while
-- the table, columns and stored JSON kept saying "milestone". The entity carried a comment
-- telling the next developer not to "fix" this, on the grounds that renaming the storage layer
-- would mean rewriting the JSON of every template ever saved for no user-visible benefit.
--
-- That trade has been re-decided: the split name is now considered the larger cost, because it
-- invites exactly the class of mistake where someone reads `project_milestone` alongside its own
-- `sprint_number`/`sprint_state` columns and concludes sprints and milestones are two different
-- concepts -- then writes logic for a relationship that does not exist. One word, everywhere.
--
-- So this migration does do the JSON rewrite the old comment warned about. It covers every JSON
-- column on the project tables (not just the obvious ones) because the keys travel inside audit
-- metadata and archived template snapshots as well as the live rows.
--
-- Idempotent throughout, following V136's check-before-acting pattern: every step verifies the
-- current state first, so a re-run after a partial apply is a clean no-op rather than an error.

DROP PROCEDURE IF EXISTS V141_rename_table;
CREATE PROCEDURE V141_rename_table(IN p_old VARCHAR(64), IN p_new VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = p_old) > 0
     AND (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = DATABASE() AND table_name = p_new) = 0 THEN
    SET @ddl = CONCAT('RENAME TABLE `', p_old, '` TO `', p_new, '`');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END;

DROP PROCEDURE IF EXISTS V141_rename_column;
CREATE PROCEDURE V141_rename_column(IN p_table VARCHAR(64), IN p_old VARCHAR(64), IN p_new VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_old) > 0
     AND (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_new) = 0 THEN
    -- RENAME COLUMN (MySQL 8.0+) keeps the existing type, nullability and default, so nothing has
    -- to be restated here and there is no risk of silently narrowing a column.
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` RENAME COLUMN `', p_old, '` TO `', p_new, '`');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END;

DROP PROCEDURE IF EXISTS V141_rename_index;
CREATE PROCEDURE V141_rename_index(IN p_table VARCHAR(64), IN p_old VARCHAR(64), IN p_new VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_old) > 0
     AND (SELECT COUNT(*) FROM information_schema.statistics
          WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_new) = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` RENAME INDEX `', p_old, '` TO `', p_new, '`');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END;

-- Rewrites the old object keys inside one JSON column.
--
-- Matching on the key plus its colon is what keeps this safe: it can only hit a key position, so
-- a sprint whose *title* legitimately contains the old word is left alone. MySQL renders stored
-- JSON as `"key": value`, and the colon sits immediately after the closing quote, so the pattern
-- holds regardless of the space that follows it.
DROP PROCEDURE IF EXISTS V141_rewrite_json_keys;
CREATE PROCEDURE V141_rewrite_json_keys(IN p_table VARCHAR(64), IN p_col VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = p_table
        AND column_name = p_col AND data_type = 'json') > 0 THEN
    SET @ddl = CONCAT(
      'UPDATE `', p_table, '` SET `', p_col, '` = CAST(',
      'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(',
      'CAST(`', p_col, '` AS CHAR)',
      ', ''"linkedMilestoneKey":'', ''"linkedSprintKey":'')',
      ', ''"linkedMilestoneLabel":'', ''"linkedSprintLabel":'')',
      ', ''"milestoneKey":'', ''"sprintKey":'')',
      ', ''"milestoneId":'', ''"sprintId":'')',
      ', ''"milestoneLabel":'', ''"sprintLabel":'')',
      ', ''"milestoneStatus":'', ''"sprintStatus":'')',
      ', ''"milestones":'', ''"sprints":'')',
      ', ''"milestone":'', ''"sprint":'')',
      -- Value position, not a key: the legacy key generator produced values shaped
      -- "milestone-<index>-<title>", and those are stored in the JSON as well as in the key
      -- columns. The opening quote anchors this to the start of a value, so a title that merely
      -- contains the word (e.g. someone's "QA Sweep Test Milestone") is left alone -- that is
      -- user-authored content, not the naming convention being retired.
      ', ''"milestone-'', ''"sprint-'')',
      ' AS JSON) WHERE `', p_col, '` IS NOT NULL',
      ' AND CAST(`', p_col, '` AS CHAR) LIKE ''%milestone%''');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END;

-- Rewrites the auto-generated "milestone-<index>-<title>" prefix on a stored key value.
--
-- These values are the link between a sprint row and the tasks, resources and meetings that point
-- at it, and the legacy key fallback recomputes the same string to find pre-existing rows.
-- Renaming that generator in code without rewriting the stored values would leave the fallback
-- matching nothing -- the rows would not error, they would silently orphan and reappear as
-- duplicates. Both sides move together, or neither does.
DROP PROCEDURE IF EXISTS V141_rewrite_key_prefix;
CREATE PROCEDURE V141_rewrite_key_prefix(IN p_table VARCHAR(64), IN p_col VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_col) > 0 THEN
    -- 11 = LENGTH('milestone-') + 1, i.e. the first character after the old prefix.
    SET @ddl = CONCAT(
      'UPDATE `', p_table, '` SET `', p_col, '` = CONCAT(''sprint-'', SUBSTRING(`', p_col, '`, 11))',
      ' WHERE `', p_col, '` LIKE ''milestone-%''');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END;

-- 1. The table itself. Its foreign key has to be dropped and re-added rather than renamed --
--    MySQL has no RENAME for a constraint -- so it is recreated with the matching new name.
CALL V141_rename_table('project_milestone', 'project_sprint');

SET @fk_old = (SELECT COUNT(*) FROM information_schema.table_constraints
               WHERE table_schema = DATABASE() AND table_name = 'project_sprint'
                 AND constraint_name = 'fk_project_milestone_project');
SET @sql = IF(@fk_old > 0,
  'ALTER TABLE `project_sprint` DROP FOREIGN KEY `fk_project_milestone_project`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_new = (SELECT COUNT(*) FROM information_schema.table_constraints
               WHERE table_schema = DATABASE() AND table_name = 'project_sprint'
                 AND constraint_name = 'fk_project_sprint_project');
SET @sql = IF(@fk_new = 0,
  'ALTER TABLE `project_sprint` ADD CONSTRAINT `fk_project_sprint_project` FOREIGN KEY (`project_id`) REFERENCES `project_workspace`(`id`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Indexes on the renamed table, plus the two on other tables that point at its key.
CALL V141_rename_index('project_sprint', 'idx_project_milestone_project', 'idx_project_sprint_project');
CALL V141_rename_index('project_sprint', 'idx_project_milestone_release_id', 'idx_project_sprint_release_id');
CALL V141_rename_index('project_sprint', 'idx_project_milestone_sprint_state', 'idx_project_sprint_state');
CALL V141_rename_index('project_sprint', 'idx_project_milestone_status', 'idx_project_sprint_status');
CALL V141_rename_index('project_sprint', 'uk_project_milestone_key', 'uk_project_sprint_key');
CALL V141_rename_index('project_resource', 'idx_project_resource_milestone', 'idx_project_resource_sprint');
CALL V141_rename_index('project_task', 'idx_project_task_milestone', 'idx_project_task_sprint');

-- 3. Columns.
--    sprint_status is the derived progress value (UPCOMING/IN_PROGRESS/...). It sits beside the
--    pre-existing sprint_state, which is the lifecycle flag only startSprint()/completeSprint()
--    may move. Two similar names on one table is unfortunate; they are genuinely different fields
--    and both entity properties carry a comment saying so.
CALL V141_rename_column('project_sprint', 'milestone_key', 'sprint_key');
CALL V141_rename_column('project_sprint', 'milestone_status', 'sprint_status');
CALL V141_rename_column('project_task', 'milestone_key', 'sprint_key');
CALL V141_rename_column('project_task', 'milestone_label', 'sprint_label');
CALL V141_rename_column('project_resource', 'milestone_key', 'sprint_key');
CALL V141_rename_column('project_resource', 'milestone_label', 'sprint_label');
CALL V141_rename_column('project_meeting', 'linked_milestone_key', 'linked_sprint_key');
CALL V141_rename_column('project_meeting', 'linked_milestone_label', 'linked_sprint_label');
CALL V141_rename_column('project_template', 'milestones', 'sprints');
CALL V141_rename_column('project_workspace', 'milestones', 'sprints');

-- 4. The JSON payloads. Every JSON column on the project tables, because these keys travel inside
--    archived template snapshots and audit metadata as well as the live template/workspace rows.
CALL V141_rewrite_json_keys('project_template', 'sprints');
CALL V141_rewrite_json_keys('project_template', 'tasks');
CALL V141_rewrite_json_keys('project_template', 'overview');
CALL V141_rewrite_json_keys('project_template', 'resources');
CALL V141_rewrite_json_keys('project_template', 'meetings');
CALL V141_rewrite_json_keys('project_template', 'activity');
CALL V141_rewrite_json_keys('project_template', 'delivery');

CALL V141_rewrite_json_keys('project_workspace', 'sprints');
CALL V141_rewrite_json_keys('project_workspace', 'tasks');
CALL V141_rewrite_json_keys('project_workspace', 'overview');
CALL V141_rewrite_json_keys('project_workspace', 'resources');
CALL V141_rewrite_json_keys('project_workspace', 'delivery');
CALL V141_rewrite_json_keys('project_workspace', 'meetings');
CALL V141_rewrite_json_keys('project_workspace', 'activity');

CALL V141_rewrite_json_keys('project_template_version', 'snapshot_json');
CALL V141_rewrite_json_keys('project_activity_event', 'metadata_json');
CALL V141_rewrite_json_keys('project_meeting_history', 'before_json');
CALL V141_rewrite_json_keys('project_meeting_history', 'after_json');
CALL V141_rewrite_json_keys('project_meeting_history', 'changed_fields');
CALL V141_rewrite_json_keys('project_resource_audit', 'before_json');
CALL V141_rewrite_json_keys('project_resource_audit', 'after_json');
CALL V141_rewrite_json_keys('project_resource_audit', 'changed_fields');
CALL V141_rewrite_json_keys('project_meeting', 'attendees');
CALL V141_rewrite_json_keys('project_meeting', 'action_items');
CALL V141_rewrite_json_keys('project_delivery', 'attachments');

-- 5. Stored key values carrying the auto-generated old prefix, on both sides of every link so
--    nothing is orphaned.
CALL V141_rewrite_key_prefix('project_sprint', 'sprint_key');
CALL V141_rewrite_key_prefix('project_task', 'sprint_key');
CALL V141_rewrite_key_prefix('project_resource', 'sprint_key');
CALL V141_rewrite_key_prefix('project_meeting', 'linked_sprint_key');

-- 6. Activity-feed rows already written under the old vocabulary. Without this the feed keeps
--    serving events whose code and entity type no longer correspond to anything in the code.
UPDATE project_activity_event
   SET event_code = 'PROJECT_SPRINTS_SYNCED'
 WHERE event_code = 'PROJECT_MILESTONES_SYNCED';

-- 26 = LENGTH('PROJECT_MILESTONES_SYNCED') + 1; the suffix after it is a per-event hash.
UPDATE project_activity_event
   SET event_key = CONCAT('PROJECT_SPRINTS_SYNCED', SUBSTRING(event_key, 26))
 WHERE event_key LIKE 'PROJECT_MILESTONES_SYNCED%';

UPDATE project_activity_event
   SET entity_type = 'ProjectSprint'
 WHERE entity_type = 'ProjectMilestone';

UPDATE project_activity_event
   SET source_tab = 'sprints'
 WHERE source_tab = 'milestones';

UPDATE project_activity_event
   SET title = REPLACE(title, 'Milestone', 'Sprint')
 WHERE title LIKE '%Milestone%';

UPDATE project_activity_event
   SET summary = REPLACE(summary, 'Milestone', 'Sprint')
 WHERE summary LIKE '%Milestone%';

DROP PROCEDURE IF EXISTS V141_rename_table;
DROP PROCEDURE IF EXISTS V141_rename_column;
DROP PROCEDURE IF EXISTS V141_rename_index;
DROP PROCEDURE IF EXISTS V141_rewrite_json_keys;
DROP PROCEDURE IF EXISTS V141_rewrite_key_prefix;
