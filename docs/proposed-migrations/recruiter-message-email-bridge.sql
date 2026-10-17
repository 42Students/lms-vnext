-- REC-calendar-messages-profile-R01. Proposed only; orchestrator assigns migration number.
-- Do not enable RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED until registered and
-- ZeptoMail worker/inbound provider credentials and routing are installed.
CREATE TABLE IF NOT EXISTS placement_recruiter_message_mail_state (
 thread_id uuid PRIMARY KEY REFERENCES placement_tpo_message_threads(id) ON DELETE RESTRICT,
 recruiter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 last_sent_at timestamptz,
 last_notified_message_id uuid REFERENCES placement_tpo_messages(id) ON DELETE RESTRICT,
 reply_token_hash varchar(64),
 reply_token_expires_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT recruiter_message_mail_token_pair_ck CHECK (
   (reply_token_hash IS NULL AND reply_token_expires_at IS NULL) OR
   (reply_token_hash ~ '^[a-f0-9]{64}$' AND reply_token_expires_at IS NOT NULL)
 )
);
CREATE INDEX IF NOT EXISTS recruiter_message_mail_owner_idx ON placement_recruiter_message_mail_state(recruiter_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS recruiter_message_mail_token_uq
 ON placement_recruiter_message_mail_state(reply_token_hash) WHERE reply_token_hash IS NOT NULL;
CREATE TABLE IF NOT EXISTS placement_recruiter_inbound_email_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 message_id_hash varchar(64) NOT NULL UNIQUE,
 thread_id uuid NOT NULL REFERENCES placement_tpo_message_threads(id) ON DELETE RESTRICT,
 message_id uuid NOT NULL REFERENCES placement_tpo_messages(id) ON DELETE RESTRICT,
 received_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT recruiter_inbound_email_hash_ck CHECK(message_id_hash ~ '^[a-f0-9]{64}$')
);
CREATE INDEX IF NOT EXISTS recruiter_inbound_email_thread_idx
 ON placement_recruiter_inbound_email_events(thread_id,received_at);
ALTER TABLE placement_tpo_messages ADD COLUMN IF NOT EXISTS delivery_channel varchar(8) NOT NULL DEFAULT 'APP';
ALTER TABLE placement_tpo_messages ADD CONSTRAINT placement_tpo_messages_delivery_ck
 CHECK(delivery_channel IN ('APP','EMAIL'));
