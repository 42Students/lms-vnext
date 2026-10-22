-- All authenticated inbound mail must be retained even when routing cannot post.
-- Ingestion/webhook signature validation and retries are owned by mail service.
ALTER TABLE inbound_mail_messages
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS original_body_plain text,
  ADD COLUMN IF NOT EXISTS body_preview varchar(1000),
  ADD COLUMN IF NOT EXISTS thread_id uuid,
  ADD COLUMN IF NOT EXISTS posted_message_id uuid,
  ADD COLUMN IF NOT EXISTS recruiter_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS learner_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS kind varchar(16) NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS routing_status varchar(24) NOT NULL DEFAULT 'STORED',
  ADD COLUMN IF NOT EXISTS route_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_route_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_route_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_route_error_code varchar(64),
  ADD COLUMN IF NOT EXISTS handled_at timestamptz,
  ADD COLUMN IF NOT EXISTS handled_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE inbound_mail_messages
  ADD CONSTRAINT inbound_mail_kind_ck CHECK (kind IN ('REPLY', 'OTHER')),
  ADD CONSTRAINT inbound_mail_routing_status_ck CHECK (routing_status IN ('POSTED','STORED','NO_THREAD','WRONG_SENDER','NOT_VERIFIED','EMPTY','ACCESS_ENDED','FAILED')),
  ADD CONSTRAINT inbound_mail_route_attempt_count_ck CHECK (route_attempt_count >= 0),
  ADD CONSTRAINT inbound_mail_handled_pair_ck CHECK ((handled_at IS NULL) = (handled_by_user_id IS NULL)),
  ADD CONSTRAINT inbound_mail_body_bounds_ck CHECK (length(body_plain) <= 200000 AND (original_body_plain IS NULL OR length(original_body_plain) <= 200000))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS inbound_mail_kind_route_received_idx ON inbound_mail_messages(kind,routing_status,received_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS inbound_mail_thread_id_idx ON inbound_mail_messages(thread_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS inbound_mail_handled_at_idx ON inbound_mail_messages(handled_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS inbound_mail_retry_due_idx ON inbound_mail_messages(next_route_attempt_at)
 WHERE routing_status IN ('FAILED','NO_THREAD','ACCESS_ENDED');
