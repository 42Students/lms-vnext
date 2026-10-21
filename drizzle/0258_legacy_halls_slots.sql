-- [chat-14] Keep original hall/slot values for safe import without changing current permissions.
ALTER TABLE lecture_halls ADD COLUMN legacy_name_was_null boolean;
--> statement-breakpoint
ALTER TABLE lecture_halls ADD COLUMN legacy_original_capacity integer;
--> statement-breakpoint
ALTER TABLE lecture_halls ADD COLUMN legacy_original_room_type varchar(80);
--> statement-breakpoint
CREATE INDEX lecture_halls_active_college_idx ON lecture_halls(college_id,status,name);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_source_time_zone varchar(80);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_room_label text;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_previous_status varchar(32);
--> statement-breakpoint
CREATE INDEX placement_round_candidate_slots_application_upcoming_idx
 ON placement_round_candidate_slots(application_id,starts_at,id)
 WHERE application_id IS NOT NULL;