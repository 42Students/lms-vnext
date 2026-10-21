-- [chat-14] Historical student request mapping; does not auto-approve or send escalation.
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_request_id bigint;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_learner_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_job_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_application_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_request_type varchar(64);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_status varchar(24);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_decision_actor_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_decision_actor_type varchar(32);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN escalate_at timestamptz;
--> statement-breakpoint
CREATE INDEX placement_general_request_escalation_idx ON placement_learner_general_requests(college_id,status,escalate_at);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD CONSTRAINT placement_general_request_legacy_status_ck CHECK (legacy_status IS NULL OR legacy_status IN ('PENDING','APPROVED','REJECTED','AUTO_APPROVED'));
