-- [chat-14] TPO conversation history. Raw inbound reply tokens must NOT be stored.
--> statement-breakpoint
ALTER TABLE placement_tpo_message_threads ADD COLUMN reply_token_hash varchar(64);
--> statement-breakpoint
ALTER TABLE placement_tpo_message_threads ADD COLUMN recruiter_emailed_at timestamptz;
--> statement-breakpoint
CREATE UNIQUE INDEX placement_tpo_message_threads_reply_token_uq ON placement_tpo_message_threads(reply_token_hash) WHERE reply_token_hash IS NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_tpo_message_threads ADD CONSTRAINT placement_tpo_message_threads_reply_token_ck CHECK (reply_token_hash IS NULL OR reply_token_hash ~ '^[0-9a-f]{64}$');
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD COLUMN kind varchar(16) NOT NULL DEFAULT 'MESSAGE';
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD COLUMN event varchar(80);
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD COLUMN change_request_id uuid REFERENCES placement_drive_change_requests(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD COLUMN via varchar(12) NOT NULL DEFAULT 'APP';
--> statement-breakpoint
CREATE INDEX placement_tpo_messages_change_request_idx ON placement_tpo_messages(change_request_id,created_at);
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD CONSTRAINT placement_tpo_messages_kind_ck CHECK (kind IN ('MESSAGE','EVENT'));
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD CONSTRAINT placement_tpo_messages_via_ck CHECK (via IN ('APP','EMAIL'));
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD CONSTRAINT placement_tpo_messages_event_shape_ck CHECK (kind <> 'EVENT' OR (event IS NOT NULL AND change_request_id IS NOT NULL));
--> statement-breakpoint
CREATE INDEX placement_tpo_share_events_action_time_idx ON placement_tpo_share_events(action,created_at);
