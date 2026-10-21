-- [chat-14] Legacy notification type/deep link/creator projections.
ALTER TABLE in_app_notifications ADD COLUMN legacy_notification_type varchar(80);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_context_label text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN legacy_creator_faculty_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD CONSTRAINT in_app_notifications_legacy_assessment_length_ck
 CHECK (legacy_assessment_url IS NULL OR length(legacy_assessment_url) <= 2048);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD CONSTRAINT in_app_notifications_delivery_error_length_ck
 CHECK (delivery_error IS NULL OR length(delivery_error) <= 500);
