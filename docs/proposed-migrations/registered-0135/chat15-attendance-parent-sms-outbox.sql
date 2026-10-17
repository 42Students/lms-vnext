-- COL-attendance-R02. PROPOSAL ONLY; orchestrator registers numbered migration.
-- SMS is only queued for independently verified and consented guardian contacts.
CREATE TABLE IF NOT EXISTS attendance_parent_contacts (
 membership_id uuid PRIMARY KEY,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 phone_e164 varchar(20) NOT NULL CHECK (phone_e164 ~ '^\\+[1-9][0-9]{7,14}$'),
 sms_opt_in boolean NOT NULL DEFAULT false,
 consent_evidence_reference text,
 consent_at timestamptz,
 verified_at timestamptz,
 verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT attendance_parent_contact_member_college_fk
  FOREIGN KEY (membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT attendance_parent_contact_consent_ck CHECK (
  sms_opt_in=false OR (consent_at IS NOT NULL AND verified_at IS NOT NULL
   AND verified_by_user_id IS NOT NULL AND length(trim(consent_evidence_reference)) BETWEEN 8 AND 200))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS attendance_parent_sms_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_id uuid NOT NULL REFERENCES activity_events(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL,
 schedule_event_id uuid NOT NULL REFERENCES section_schedule_events(id) ON DELETE RESTRICT,
 kind varchar(16) NOT NULL CHECK(kind IN('ABSENT','CORRECTED')),
 course_name text NOT NULL,
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 status varchar(24) NOT NULL DEFAULT 'QUEUED' CHECK(status IN('QUEUED','ATTEMPTED','ACCEPTED','SKIPPED')),
 attempted_at timestamptz,
 accepted_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT attendance_parent_sms_member_college_fk FOREIGN KEY(membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT attendance_parent_sms_event_unique UNIQUE(event_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS attendance_parent_sms_queue_idx
 ON attendance_parent_sms_outbox(status,created_at);
