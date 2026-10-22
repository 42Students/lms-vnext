-- [chat-14] Historic Interview fields and cross-round uniqueness; inspect existing bookings before journal registration.
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_interview_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_organization_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_job_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_application_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_interview_type varchar(24);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_interview_status varchar(24);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_interview_mode varchar(24);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_location text;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_round_description text;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_interviewer_name varchar(255);
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_duration_minutes integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_scheduled_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_scheduled_hour_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_previous_scheduled_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_schedule_changed_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_created_by_id integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_source_version integer;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS legacy_reschedule_history jsonb;
--> statement-breakpoint
ALTER TABLE placement_round_candidate_slots ADD COLUMN IF NOT EXISTS interview_outcome varchar(16);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_round_candidate_slots_one_live_application_uq ON placement_round_candidate_slots(application_id) WHERE status = 'BOOKED' AND application_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_round_candidate_slots_legacy_source_idx ON placement_round_candidate_slots(job_id,legacy_interview_id) WHERE legacy_interview_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_legacy_type_ck CHECK (legacy_interview_type IS NULL OR legacy_interview_type IN ('SCREENING','TECHNICAL','HR','MANAGERIAL','FINAL'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_legacy_status_ck CHECK (legacy_interview_status IS NULL OR legacy_interview_status IN ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED','COMPLETED','CANCELLED','NO_SHOW'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_outcome_ck CHECK (interview_outcome IS NULL OR interview_outcome IN ('COMPLETED','NO_SHOW'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_round_candidate_slots ADD CONSTRAINT placement_round_candidate_slots_duration_ck CHECK (legacy_duration_minutes IS NULL OR legacy_duration_minutes BETWEEN 15 AND 480)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
