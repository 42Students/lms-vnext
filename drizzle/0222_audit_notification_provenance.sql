-- [chat-14] Historical audit and in-app notifications import projections.
-- Do not retain full phone/IP/UA without privacy review; hash IP with a secret.
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS legacy_audit_id bigint;
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS legacy_action_key varchar(120);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS legacy_entity_type varchar(80);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS legacy_entity_id text;
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS actor_role_snapshot varchar(64);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS actor_contact_last4 varchar(4);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS source_ip_hash varchar(64);
--> statement-breakpoint
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS source_user_agent_family varchar(128);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activity_events_legacy_audit_id_idx ON activity_events(legacy_audit_id)
 WHERE legacy_audit_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE activity_events ADD CONSTRAINT activity_events_source_ip_hash_ck
 CHECK (source_ip_hash IS NULL OR source_ip_hash ~ '^[0-9a-f]{64}$')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE activity_events ADD CONSTRAINT activity_events_actor_last4_ck
 CHECK (actor_contact_last4 IS NULL OR actor_contact_last4 ~ '^[0-9]{4}$')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_notification_id bigint;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_recipient_type varchar(24);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_class_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_course_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_job_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_application_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_interview_id integer;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_assessment_url text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_course_slug text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_course_name text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS delivery_status varchar(24);
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS delivery_error text;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS legacy_created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS in_app_notifications_user_legacy_uq ON in_app_notifications(user_id,legacy_notification_id)
 WHERE legacy_notification_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS in_app_notifications_schedule_status_idx ON in_app_notifications(delivery_status,scheduled_at)
 WHERE scheduled_at IS NOT NULL;
