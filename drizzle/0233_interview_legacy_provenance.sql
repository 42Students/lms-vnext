-- [chat-14] Historic Interview fields and cross-round uniqueness; inspect existing bookings before journal registration.
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_interview_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_organization_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_job_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_application_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_interview_type varchar(24);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_interview_status varchar(24);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_interview_mode varchar(24);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_location text;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_round_description text;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_interviewer_name varchar(255);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_duration_minutes integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_scheduled_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_scheduled_hour_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_previous_scheduled_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_schedule_changed_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_created_by_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_source_version integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN legacy_reschedule_history jsonb;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN interview_outcome varchar(16);
--> statement-breakpoint
CREATE UNIQUE INDEX placement_round_candidate_slots_one_live_application_uq ON placement_round_candidate_slots(application_id) WHERE status = 'BOOKED' AND application_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX placement_round_candidate_slots_legacy_source_idx ON placement_round_candidate_slots(job_id,legacy_interview_id) WHERE legacy_interview_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_legacy_type_ck CHECK (legacy_interview_type IS NULL OR legacy_interview_type IN ('SCREENING','TECHNICAL','HR','MANAGERIAL','FINAL'));
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_legacy_status_ck CHECK (legacy_interview_status IS NULL OR legacy_interview_status IN ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED','COMPLETED','CANCELLED','NO_SHOW'));
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_outcome_ck CHECK (interview_outcome IS NULL OR interview_outcome IN ('COMPLETED','NO_SHOW'));
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_duration_ck CHECK (legacy_duration_minutes IS NULL OR legacy_duration_minutes BETWEEN 15 AND 480);
