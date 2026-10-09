-- MySQL 8 read-only schema metadata extraction. NO production row data.
-- Run against the intended legacy schema with SELECT-only credentials:
-- mysql --batch --raw --skip-column-names --database=LEGACY_SCHEMA < scripts/sql/legacy-readonly-schema.sql > legacy-schema.jsonl
-- The resulting metadata should be access controlled (definitions/names may be internal).
-- Do not supply passwords on the command line or commit the exported metadata.
-- Each result line is standalone JSON and includes a 'kind' discriminator.
SELECT JSON_OBJECT('kind','table','table_name',TABLE_NAME,'table_type',TABLE_TYPE,'engine',ENGINE,'collation',TABLE_COLLATION)
  FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;
SELECT JSON_OBJECT('kind','column','table_name',TABLE_NAME,'column_name',COLUMN_NAME,
  'ordinal_position',ORDINAL_POSITION,'column_type',COLUMN_TYPE,'data_type',DATA_TYPE,
  'is_nullable',IS_NULLABLE,'column_default',COLUMN_DEFAULT,'extra',EXTRA,
  'generation_expression',GENERATION_EXPRESSION,'column_key',COLUMN_KEY,
  'character_maximum_length',CHARACTER_MAXIMUM_LENGTH,'numeric_precision',NUMERIC_PRECISION,'numeric_scale',NUMERIC_SCALE)
  FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION;
SELECT JSON_OBJECT('kind','constraint','table_name',TABLE_NAME,'constraint_name',CONSTRAINT_NAME,
  'constraint_type',CONSTRAINT_TYPE)
  FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
  ORDER BY TABLE_NAME,CONSTRAINT_NAME;
SELECT JSON_OBJECT('kind','foreign_key_column','table_name',TABLE_NAME,'constraint_name',CONSTRAINT_NAME,
  'column_name',COLUMN_NAME,'ordinal_position',ORDINAL_POSITION,
  'referenced_table_name',REFERENCED_TABLE_NAME,'referenced_column_name',REFERENCED_COLUMN_NAME)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
  ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION;
SELECT JSON_OBJECT('kind','referential_action','table_name',TABLE_NAME,'constraint_name',CONSTRAINT_NAME,
  'update_rule',UPDATE_RULE,'delete_rule',DELETE_RULE)
  FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
  ORDER BY TABLE_NAME,CONSTRAINT_NAME;
SELECT JSON_OBJECT('kind','index_column','table_name',TABLE_NAME,'index_name',INDEX_NAME,
  'non_unique',NON_UNIQUE,'seq_in_index',SEQ_IN_INDEX,'column_name',COLUMN_NAME,
  'sub_part',SUB_PART,'index_type',INDEX_TYPE)
  FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
  ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX;
SELECT JSON_OBJECT('kind','check','table_name',T.TABLE_NAME,'constraint_name',T.CONSTRAINT_NAME,
  'check_clause',C.CHECK_CLAUSE)
  FROM information_schema.TABLE_CONSTRAINTS T
  INNER JOIN information_schema.CHECK_CONSTRAINTS C ON C.CONSTRAINT_SCHEMA = T.CONSTRAINT_SCHEMA
    AND C.CONSTRAINT_NAME = T.CONSTRAINT_NAME
  WHERE T.CONSTRAINT_SCHEMA = DATABASE() AND T.CONSTRAINT_TYPE='CHECK'
  ORDER BY T.TABLE_NAME,T.CONSTRAINT_NAME;
SELECT JSON_OBJECT('kind','trigger','trigger_name',TRIGGER_NAME,'event_object_table',EVENT_OBJECT_TABLE,
  'event_manipulation',EVENT_MANIPULATION,'action_timing',ACTION_TIMING)
  FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() ORDER BY TRIGGER_NAME;
-- Second adversarial sweep: metadata-only objects outside ordinary table lists.
-- Access may be restricted by MySQL grants; an empty result is not proof of absence.
SELECT JSON_OBJECT('kind','view','view_name',TABLE_NAME,'check_option',CHECK_OPTION,'security_type',SECURITY_TYPE)
  FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;
SELECT JSON_OBJECT('kind','routine','routine_name',ROUTINE_NAME,'routine_type',ROUTINE_TYPE,
  'sql_data_access',SQL_DATA_ACCESS,'security_type',SECURITY_TYPE)
  FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()
  ORDER BY ROUTINE_TYPE,ROUTINE_NAME;
SELECT JSON_OBJECT('kind','event','event_name',EVENT_NAME,'status',STATUS,'event_type',EVENT_TYPE)
  FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE() ORDER BY EVENT_NAME;
SELECT JSON_OBJECT('kind','partition','table_name',TABLE_NAME,'partition_name',PARTITION_NAME,
  'partition_ordinal_position',PARTITION_ORDINAL_POSITION,'partition_method',PARTITION_METHOD)
  FROM information_schema.PARTITIONS
  WHERE TABLE_SCHEMA = DATABASE() AND PARTITION_NAME IS NOT NULL
  ORDER BY TABLE_NAME,PARTITION_ORDINAL_POSITION;
