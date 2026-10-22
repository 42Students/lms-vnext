-- [chat-14] Preserve old request decision/event actor and explicit IST local timestamps.
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_created_local timestamp;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_decided_local timestamp;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_source_time_zone varchar(80);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN IF NOT EXISTS legacy_decision_note text;
--> statement-breakpoint
ALTER TABLE placement_learner_general_request_events ADD COLUMN IF NOT EXISTS legacy_actor_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_request_events ADD COLUMN IF NOT EXISTS legacy_actor_type varchar(32);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_general_request_history_idx
 ON placement_learner_general_requests(membership_id,requested_at,id);
