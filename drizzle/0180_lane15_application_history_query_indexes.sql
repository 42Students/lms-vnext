-- Optimizes per-application status filters and stable chronological reports.
CREATE INDEX IF NOT EXISTS placement_application_history_state_time_idx
 ON placement_application_status_history(application_id,to_status,created_at);
CREATE INDEX IF NOT EXISTS placement_application_history_time_idx
 ON placement_application_status_history(created_at,id);
CREATE INDEX IF NOT EXISTS placement_legacy_status_visible_timeline_idx
 ON placement_legacy_application_status_events(application_id,changed_at,id)
 WHERE source_deleted=false;
