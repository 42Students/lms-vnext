-- [chat-14] Retain bounded, non-authorizing historic activity/notification copy.
-- Convert legacy local timestamps to UTC during import with an explicit IANA zone.
ALTER TABLE activity_events ADD COLUMN legacy_action_label varchar(160);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_target_name varchar(160);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_source_time_zone varchar(80);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_occurred_local timestamp;
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_event_original_code varchar(120);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE INDEX activity_events_college_event_time_idx ON activity_events(college_id,event_type,occurred_at,id);
--> statement-breakpoint
CREATE INDEX activity_events_event_time_idx ON activity_events(event_type,occurred_at,id);
--> statement-breakpoint
CREATE INDEX activity_events_group_stable_time_idx ON activity_events(group_key,occurred_at,id);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_original_title text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_context_type varchar(80);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_context_id text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_was_read boolean;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_source_time_zone varchar(80);
--> statement-breakpoint
CREATE INDEX in_app_notifications_user_history_idx ON in_app_notifications(user_id,created_at,id)
 WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX in_app_notifications_user_unread_idx ON in_app_notifications(user_id,created_at,id)
 WHERE read_at IS NULL AND deleted_at IS NULL;
