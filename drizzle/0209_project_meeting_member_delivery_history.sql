-- [chat-14] Historical meetings, member and delivery snapshots, not runtime grants.
-- Native delivery event author stays mandatory; actorless legacy imports quarantine.
ALTER TABLE project_members ADD COLUMN legacy_user_type varchar(32);
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN legacy_display_name text;
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN legacy_member_status varchar(32);
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN deleted_by_workspace boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE project_members ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN meeting_key varchar(120);
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN deleted_by_workspace boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE project_meetings ADD COLUMN version integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE UNIQUE INDEX project_meetings_project_key_uq
 ON project_meetings(project_id, lower(meeting_key)) WHERE meeting_key IS NOT NULL;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN legacy_delivery_id integer;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN legacy_snapshot text;
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN legacy_status varchar(60);
--> statement-breakpoint
ALTER TABLE project_submissions ADD COLUMN legacy_revision_count integer;
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_action varchar(32);
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_status varchar(60);
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_actor_id integer;
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_actor_name text;
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_actor_type varchar(32);
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_notes text;
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_attachment_url text;
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_feedback text;
--> statement-breakpoint
ALTER TABLE project_delivery_events ADD COLUMN legacy_revision_count integer;
