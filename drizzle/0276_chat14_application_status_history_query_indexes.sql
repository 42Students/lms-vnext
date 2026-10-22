-- [chat-14] Legacy status-history queries also sort globally by change time.
-- Existing application_id,created_at B-tree already serves application_id-only
-- probes and application-local ascending history. Keep it; do not edit 0021.
CREATE INDEX IF NOT EXISTS placement_application_status_history_created_asc_idx
  ON placement_application_status_history (created_at ASC, id ASC);
