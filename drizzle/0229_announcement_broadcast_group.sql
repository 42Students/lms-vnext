-- [chat-14] Source broadcast groups; not a scheduled notification provider.
CREATE TABLE announcement_broadcast_groups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 author_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 legacy_placement_announcement_id bigint,
 legacy_college_id integer,
 audience varchar(20),
 audience_kind varchar(20),
 audience_json jsonb,
 audience_label varchar(255),
 recipient_count integer,
 legacy_job_id integer,
 send_at timestamptz,
 sent_at timestamptz,
 show_until timestamptz,
 send_email boolean NOT NULL DEFAULT false,
 undo_group varchar(64),
 last_reminded_at timestamptz,
 legacy_was_deleted boolean,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT announcement_broadcast_groups_recipients_ck CHECK (recipient_count IS NULL OR recipient_count >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX announcement_broadcast_groups_legacy_uq ON announcement_broadcast_groups(organization_id,legacy_placement_announcement_id) WHERE legacy_placement_announcement_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX announcement_broadcast_groups_scope_idx ON announcement_broadcast_groups(organization_id,created_at);
--> statement-breakpoint
ALTER TABLE announcements ADD COLUMN broadcast_group_id uuid REFERENCES announcement_broadcast_groups(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE announcements ADD COLUMN legacy_announcement_id bigint;
--> statement-breakpoint
ALTER TABLE announcements ADD COLUMN legacy_receiver_value bigint;
--> statement-breakpoint
ALTER TABLE announcements ADD COLUMN legacy_sender_id bigint;
--> statement-breakpoint
ALTER TABLE announcements ADD COLUMN legacy_was_deleted boolean;
--> statement-breakpoint
CREATE UNIQUE INDEX db10_announcements_broadcast_college_uq ON announcements(broadcast_group_id,college_id) WHERE broadcast_group_id IS NOT NULL;
