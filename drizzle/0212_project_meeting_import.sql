-- [chat-14] Historical workspace meeting source and optional sync error.
-- Does not claim a functioning third-party calendar sync.
ALTER TABLE project_instances ADD COLUMN legacy_meetings_list jsonb;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN calendar_sync_error varchar(500);
