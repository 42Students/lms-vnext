-- Follow-up to V141: the same key rename, for JSON that is stored double-encoded.
--
-- V141 rewrote keys matching `"milestoneKey":`. That covers every column holding a real JSON
-- object, but project_template_version.snapshot_json holds a JSON *string* whose contents are
-- themselves JSON, so its keys are escaped -- `\"milestoneKey\":` -- and V141's pattern could not
-- match them. Ten archived snapshots were left carrying the old vocabulary.
--
-- V141 is already applied and checksummed, so this is a separate migration rather than an edit to
-- it. Same idempotent shape: matching on the key plus its colon means only key positions are
-- touched, and a title that merely contains the old word is left alone as user-authored content.
--
-- Applied to every JSON column V141 covered, not just snapshot_json: any of them could hold a
-- double-encoded payload, and on a column that has none this is a no-op.

DROP PROCEDURE IF EXISTS V142_rewrite_escaped_json_keys;
CREATE PROCEDURE V142_rewrite_escaped_json_keys(IN p_table VARCHAR(64), IN p_col VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = p_table
        AND column_name = p_col AND data_type = 'json') > 0 THEN
    -- '\\"' in a MySQL string literal is the two characters \ and ", which is how an escaped
    -- quote appears inside a double-encoded payload.
    SET @ddl = CONCAT(
      'UPDATE `', p_table, '` SET `', p_col, '` = CAST(',
      'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(',
      'CAST(`', p_col, '` AS CHAR)',
      ', ''\\"linkedMilestoneKey\\":'', ''\\"linkedSprintKey\\":'')',
      ', ''\\"linkedMilestoneLabel\\":'', ''\\"linkedSprintLabel\\":'')',
      ', ''\\"milestoneKey\\":'', ''\\"sprintKey\\":'')',
      ', ''\\"milestoneId\\":'', ''\\"sprintId\\":'')',
      ', ''\\"milestoneLabel\\":'', ''\\"sprintLabel\\":'')',
      ', ''\\"milestoneStatus\\":'', ''\\"sprintStatus\\":'')',
      ', ''\\"milestones\\":'', ''\\"sprints\\":'')',
      ', ''\\"milestone\\":'', ''\\"sprint\\":'')',
      ', ''\\"milestone-'', ''\\"sprint-'')',
      ' AS JSON) WHERE `', p_col, '` IS NOT NULL',
      ' AND CAST(`', p_col, '` AS CHAR) LIKE ''%milestone%''');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END;

CALL V142_rewrite_escaped_json_keys('project_template_version', 'snapshot_json');

CALL V142_rewrite_escaped_json_keys('project_template', 'sprints');
CALL V142_rewrite_escaped_json_keys('project_template', 'tasks');
CALL V142_rewrite_escaped_json_keys('project_template', 'overview');
CALL V142_rewrite_escaped_json_keys('project_template', 'resources');
CALL V142_rewrite_escaped_json_keys('project_template', 'meetings');
CALL V142_rewrite_escaped_json_keys('project_template', 'activity');
CALL V142_rewrite_escaped_json_keys('project_template', 'delivery');

CALL V142_rewrite_escaped_json_keys('project_workspace', 'sprints');
CALL V142_rewrite_escaped_json_keys('project_workspace', 'tasks');
CALL V142_rewrite_escaped_json_keys('project_workspace', 'overview');
CALL V142_rewrite_escaped_json_keys('project_workspace', 'resources');
CALL V142_rewrite_escaped_json_keys('project_workspace', 'delivery');
CALL V142_rewrite_escaped_json_keys('project_workspace', 'meetings');
CALL V142_rewrite_escaped_json_keys('project_workspace', 'activity');

CALL V142_rewrite_escaped_json_keys('project_activity_event', 'metadata_json');
CALL V142_rewrite_escaped_json_keys('project_meeting_history', 'before_json');
CALL V142_rewrite_escaped_json_keys('project_meeting_history', 'after_json');
CALL V142_rewrite_escaped_json_keys('project_meeting_history', 'changed_fields');
CALL V142_rewrite_escaped_json_keys('project_resource_audit', 'before_json');
CALL V142_rewrite_escaped_json_keys('project_resource_audit', 'after_json');
CALL V142_rewrite_escaped_json_keys('project_resource_audit', 'changed_fields');
CALL V142_rewrite_escaped_json_keys('project_meeting', 'attendees');
CALL V142_rewrite_escaped_json_keys('project_meeting', 'action_items');
CALL V142_rewrite_escaped_json_keys('project_delivery', 'attachments');

DROP PROCEDURE IF EXISTS V142_rewrite_escaped_json_keys;
