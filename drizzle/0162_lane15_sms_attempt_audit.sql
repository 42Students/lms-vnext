-- SMS provider acceptance and failures. Never store plaintext phone or body.
-- OTP before login legitimately has NULL college / organization IDs.
CREATE TABLE messaging_sms_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid REFERENCES colleges(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  recipient_key varchar(64),
  recipient_suffix varchar(4),
  purpose varchar(160) NOT NULL,
  template_key varchar(160),
  provider_message_id varchar(64),
  outcome varchar(24) NOT NULL,
  error_code varchar(64),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messaging_sms_attempts_outcome_ck CHECK (outcome IN ('PROVIDER_ACCEPTED','FAILED','SUPPRESSED')),
  CONSTRAINT messaging_sms_attempts_suffix_ck CHECK (recipient_suffix IS NULL OR recipient_suffix ~ '^[0-9]{1,4}$'),
  CONSTRAINT messaging_sms_attempts_recipient_key_ck CHECK (recipient_key IS NULL OR recipient_key ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE INDEX messaging_sms_attempts_time_idx ON messaging_sms_delivery_attempts(attempted_at);
--> statement-breakpoint
CREATE INDEX messaging_sms_attempts_suffix_purpose_idx ON messaging_sms_delivery_attempts(recipient_suffix,purpose,attempted_at);
--> statement-breakpoint
CREATE INDEX messaging_sms_attempts_college_time_idx ON messaging_sms_delivery_attempts(college_id,attempted_at);
