-- [chat-14] Historical student request mapping; does not auto-approve or send escalation.
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_request_id bigint;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_job_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_application_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_request_type varchar(64);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_status varchar(24);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_decision_actor_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_decision_actor_type varchar(32);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS escalate_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_general_request_escalation_idx ON placement_learner_general_requests(college_id,status,escalate_at);
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_learner_general_requests ADD CONSTRAINT placement_general_request_legacy_status_ck CHECK (legacy_status IS NULL OR legacy_status IN ('PENDING','APPROVED','REJECTED','AUTO_APPROVED'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
