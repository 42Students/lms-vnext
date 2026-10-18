-- 0137: reviewed consolidation of three lane proposals (additive, idempotent where possible).
-- 1) placement_general_request_kind_ck gains OFFER_ACCEPTANCE_DISPUTE (chat-12 correction to 0134).
-- 2) job/role-option ancestry FK on placement_applications (chat-17); NOT VALID so existing rows are not
--    rewritten; new rows are enforced. Validate after auditing occupied DBs.
-- 3) TPO company team messages and follows (chat-3).
ALTER TABLE placement_learner_general_requests
  DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests
  ADD CONSTRAINT placement_general_request_kind_ck
  CHECK (kind IN (
    'OFF_CAMPUS_OFFER',
    'REGISTRATION_CHANGE',
    'ABSENCE_DISPUTE',
    'CORRECTION_WITH_PROOF',
    'OFFER_ACCEPTANCE_DISPUTE',
    'PLACEMENT_AFTER_PLACEMENT'
  ));;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_job_role_options_id_job_uq
  ON placement_job_role_options (id, job_id);
--> statement-breakpoint
ALTER TABLE placement_applications
  DROP CONSTRAINT IF EXISTS placement_applications_role_option_job_fk;
--> statement-breakpoint
ALTER TABLE placement_applications
  ADD CONSTRAINT placement_applications_role_option_job_fk
  FOREIGN KEY (role_option_id, job_id)
  REFERENCES placement_job_role_options(id, job_id)
  ON DELETE RESTRICT NOT VALID;
--> statement-breakpoint
-- 0135 already created the table; the lane model also needs the send-dedupe key.
ALTER TABLE placement_tpo_company_team_messages ADD COLUMN IF NOT EXISTS idempotency_key uuid;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS tpo_company_team_message_send_dedupe_uq
  ON placement_tpo_company_team_messages(college_id,company_id,author_membership_id,idempotency_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_company_team_messages_college_company_time_idx
  ON placement_tpo_company_team_messages(college_id,company_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_tpo_company_team_follows (
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  company_id uuid NOT NULL REFERENCES placement_companies(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL,
  followed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tpo_company_team_follows_pk
    PRIMARY KEY (college_id,company_id,membership_id),
  CONSTRAINT tpo_company_team_follow_member_college_fk
    FOREIGN KEY (membership_id,college_id)
    REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);;
