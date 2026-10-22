-- [chat-14] Drive-change source snapshots; preflight existing OPEN duplicates before registration.
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS current_value text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS answer_value text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS reply_text text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS creator_name_snapshot text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS creator_type_snapshot varchar(20);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS legacy_request_id bigint;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS legacy_college_id integer;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS legacy_field varchar(32);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS legacy_kind varchar(16);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS legacy_direction varchar(20);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_drive_changes_target_open_idx ON placement_drive_change_requests(job_id,target_party,status,field);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_drive_changes_one_open_field_uq ON placement_drive_change_requests(job_id,field,proposer_party,target_party) WHERE status='OPEN' AND field <> 'OTHER';
