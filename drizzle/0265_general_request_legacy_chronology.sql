-- [chat-14] Preserve old request decision/event actor and explicit IST local timestamps.
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_created_local timestamp;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_decided_local timestamp;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_source_time_zone varchar(80);
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests ADD COLUMN legacy_decision_note text;
--> statement-breakpoint
ALTER TABLE placement_learner_general_request_events ADD COLUMN legacy_actor_id integer;
--> statement-breakpoint
ALTER TABLE placement_learner_general_request_events ADD COLUMN legacy_actor_type varchar(32);
--> statement-breakpoint
CREATE INDEX placement_general_request_history_idx
 ON placement_learner_general_requests(membership_id,requested_at,id);