-- DB07 acceptance witness, NOT a numbered Drizzle migration.
-- Requires the DB07 history + tenant/project draft to have been promoted.
-- Execute only against an explicitly disposable PostgreSQL test database,
-- with psql -X -v ON_ERROR_STOP=1 -f <this file>.
-- No legacy data migration. No result is claimed until actually executed.
-- The enclosing transaction always rolls back; the witness deliberately
-- attempts TRUNCATE to prove row-level immutable DELETE triggers are not enough.

BEGIN;

DO $db07$
DECLARE
  tbl text;
  trigger_name text;
  expected_table text;
  definition text;
  rejected boolean;
BEGIN
  -- Static PostgreSQL catalog proof: all expected triggers are enabled and
  -- attached to the intended canonical table, rather than just present in SQL.
  FOR trigger_name, expected_table IN
    SELECT * FROM (VALUES
      ('w03_meeting_history_immutable','project_meeting_history'),
      ('w03_resource_history_immutable','project_resource_audit'),
      ('w03_delivery_history_immutable','project_delivery_events'),
      ('w03_meeting_history_no_truncate','project_meeting_history'),
      ('w03_resource_history_no_truncate','project_resource_audit'),
      ('w03_delivery_history_no_truncate','project_delivery_events'),
      ('w03_task_comments_no_delete','project_task_comments'),
      ('w03_task_comments_no_truncate','project_task_comments'),
      ('w03_task_comments_identity_immutable','project_task_comments')
    ) AS v(name, table_name)
  LOOP
    SELECT pg_get_triggerdef(t.oid)
      INTO definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = expected_table
       AND t.tgname = trigger_name
       AND t.tgenabled = 'O'
       AND NOT t.tgisinternal;
    IF definition IS NULL THEN
      RAISE EXCEPTION 'DB07 required enabled trigger missing: %.%',expected_table,trigger_name;
    END IF;
    IF trigger_name LIKE '%no_truncate%'
       AND definition NOT ILIKE '%BEFORE TRUNCATE%FOR EACH STATEMENT%' THEN
      RAISE EXCEPTION 'DB07 TRUNCATE trigger has incorrect shape: %', trigger_name;
    END IF;
    IF trigger_name = 'w03_task_comments_no_delete'
       AND definition NOT ILIKE '%BEFORE DELETE%FOR EACH ROW%' THEN
      RAISE EXCEPTION 'DB07 DELETE trigger has incorrect shape: %', trigger_name;
    END IF;
  END LOOP;

  -- No fixtures required: BEFORE TRUNCATE fires on an empty table.
  FOR tbl IN
    SELECT unnest(ARRAY[
      'project_meeting_history','project_resource_audit',
      'project_delivery_events','project_task_comments'
    ])
  LOOP
    rejected := false;
    BEGIN
      EXECUTE format('TRUNCATE TABLE public.%I',tbl);
    EXCEPTION WHEN SQLSTATE '23514' THEN
      rejected := true;
    END;
    IF NOT rejected THEN
      RAISE EXCEPTION 'DB07 history/comment TRUNCATE incorrectly succeeded: %',tbl;
    END IF;
  END LOOP;
END
$db07$;

ROLLBACK;
