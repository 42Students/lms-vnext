-- Historical BIGINT reference numbers are not authentication secrets or
-- authorizing route IDs. Preserve source actor names without invented users.
ALTER TABLE bug_tracker_access ADD COLUMN IF NOT EXISTS legacy_reporter_access_id integer;
CREATE UNIQUE INDEX IF NOT EXISTS db10_tracker_access_legacy_uq ON bug_tracker_access(legacy_reporter_access_id)
 WHERE legacy_reporter_access_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS db10_tracker_access_name_active_idx ON bug_tracker_access(lower(display_name),active);
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS legacy_report_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS db10_bug_reports_legacy_id_uq ON bug_reports(legacy_report_id)
 WHERE legacy_report_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS db10_bug_reports_environment_state_time_idx
 ON bug_reports(environment,status,created_at);
ALTER TABLE bug_report_activities ADD COLUMN IF NOT EXISTS legacy_activity_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS db10_bug_report_activity_legacy_id_uq
 ON bug_report_activities(legacy_activity_id) WHERE legacy_activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS db10_bug_report_activity_keyset_idx
 ON bug_report_activities(bug_report_id,created_at,id);
ALTER TABLE bug_report_activities DROP CONSTRAINT IF EXISTS db10_bug_report_activity_actor_ck;
ALTER TABLE bug_report_activities ADD CONSTRAINT db10_bug_report_activity_actor_ck CHECK (
 (actor_user_id IS NOT NULL) <> (actor_access_id IS NOT NULL)
 OR (legacy_activity_id IS NOT NULL AND actor_user_id IS NULL AND actor_access_id IS NULL
  AND length(trim(coalesce(actor_name,'')))>0));
