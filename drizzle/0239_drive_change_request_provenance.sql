-- [chat-14] Drive-change source snapshots; preflight existing OPEN duplicates before registration.
ALTER TABLE placement_drive_change_requests ADD COLUMN current_value text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN answer_value text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN reply_text text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN creator_name_snapshot text;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN creator_type_snapshot varchar(20);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN legacy_request_id bigint;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN legacy_college_id integer;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN legacy_field varchar(32);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN legacy_kind varchar(16);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN legacy_direction varchar(20);
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests ADD COLUMN resolved_at timestamptz;
--> statement-breakpoint
CREATE INDEX placement_drive_changes_target_open_idx ON placement_drive_change_requests(job_id,target_party,status,field);
--> statement-breakpoint
CREATE UNIQUE INDEX placement_drive_changes_one_open_field_uq ON placement_drive_change_requests(job_id,field,proposer_party,target_party) WHERE status='OPEN' AND field <> 'OTHER';
