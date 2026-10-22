-- [chat-14] Legacy notification type/deep link/creator projections.
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_notification_type varchar(80);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_context_label text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_creator_faculty_id integer;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE in_app_notifications ADD CONSTRAINT in_app_notifications_legacy_assessment_length_ck
 CHECK (legacy_assessment_url IS NULL OR length(legacy_assessment_url) <= 2048)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE in_app_notifications ADD CONSTRAINT in_app_notifications_delivery_error_length_ck
 CHECK (delivery_error IS NULL OR length(delivery_error) <= 500)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
