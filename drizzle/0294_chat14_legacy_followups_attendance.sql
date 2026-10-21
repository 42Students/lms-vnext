-- [chat-14] New bounded college pending follow-up and marked-session date paths.
CREATE INDEX IF NOT EXISTS placement_tpo_followups_pending_due_idx ON placement_tpo_followups(college_id,due_at,id) WHERE done_at IS NULL;
CREATE INDEX IF NOT EXISTS attendance_sessions_marked_at_idx ON attendance_sessions(marked_at,schedule_event_id) WHERE status='MARKED';
