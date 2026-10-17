-- from faculty-assessments-participation-zero-points.sql
-- FAC-assessments-R08: participation assignments may be worth zero points.
-- Registered migrations are managed by the orchestrator; this proposal is not a numbered migration.
ALTER TABLE course_assignments
  DROP CONSTRAINT IF EXISTS course_assignments_points_ck;
--> statement-breakpoint
ALTER TABLE course_assignments
  ADD CONSTRAINT course_assignments_points_ck
    CHECK (max_points BETWEEN 0 AND 10000);
--> statement-breakpoint
-- from tpo-team-drive-owner.sql
-- TPO-inbox-team-33: explicit, college-scoped placement drive owner.
-- Proposed only. Orchestrator must register a numbered migration and deploy it.
ALTER TABLE placement_jobs
 ADD COLUMN IF NOT EXISTS owner_membership_id uuid
 REFERENCES college_memberships(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_jobs_owner_college_idx
 ON placement_jobs (college_id, owner_membership_id, status);
--> statement-breakpoint
-- A membership from another college must never become this drive's owner.
ALTER TABLE placement_jobs
 ADD CONSTRAINT placement_jobs_owner_college_fk
 FOREIGN KEY (owner_membership_id,college_id)
 REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT;
--> statement-breakpoint
-- from chat7-mentor-meeting-facilitation.sql
-- MEN-projects-meetings-27: notes, retrospective, action items and follow-up
-- accompany the existing authoritative project meeting and remain tenant scoped.
ALTER TABLE project_meetings ADD COLUMN IF NOT EXISTS facilitation jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_facilitation_object_ck;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_facilitation_object_ck
 CHECK (jsonb_typeof(facilitation)='object');
--> statement-breakpoint
-- MEN-projects-meetings-27: Drafts are not yet scheduled or announced;
-- Rescheduled is a persisted scheduled state with normal meeting permissions.
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_status_ck;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_status_ck
 CHECK (status IN ('DRAFT','REQUESTED','SCHEDULED','RESCHEDULED','COMPLETED','CANCELLED'));
--> statement-breakpoint
ALTER TABLE project_meetings DROP CONSTRAINT IF EXISTS project_meetings_schedule_shape_ck;
--> statement-breakpoint
ALTER TABLE project_meetings ADD CONSTRAINT project_meetings_schedule_shape_ck
 CHECK (status NOT IN ('SCHEDULED','RESCHEDULED','COMPLETED')
   OR (scheduled_by_user_id IS NOT NULL AND meeting_url IS NOT NULL));
--> statement-breakpoint
-- from learner-vendor-assessment-deadline.sql
-- LEARNER-placements-41: distinct vendor assessment submission cutoff.
-- Submit to orchestrator for numbered registration; results_due_at is NOT a take-by deadline.
ALTER TABLE placement_job_rounds
  ADD COLUMN IF NOT EXISTS assessment_due_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_rounds_assessment_due_idx
  ON placement_job_rounds (assessment_due_at)
  WHERE assessment_due_at IS NOT NULL AND kind IN ('TEST', 'VENDOR_TEST');
--> statement-breakpoint
-- from chat-12-0134-general-requests-correction.sql
ALTER TABLE placement_learner_general_requests
 DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests
 ADD CONSTRAINT placement_general_request_kind_ck CHECK (
  kind IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
   'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE')
 );
--> statement-breakpoint
-- from chat15-general-request-acceptance-kind.sql
-- LEARNER-placements-43: 0134 created the request table with a five-kind CHECK.
-- Its later CREATE TABLE IF NOT EXISTS includes OFFER_ACCEPTANCE_DISPUTE, but is
-- a no-op once the first definition exists. Correct the registered constraint.
-- Orchestrator: register as a new numbered migration (never edit 0134).
-- A pending externally reported acceptance dispute must be persistable.
ALTER TABLE placement_learner_general_requests
  DROP CONSTRAINT IF EXISTS placement_general_request_kind_ck;
--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE placement_learner_general_requests
  ADD CONSTRAINT placement_general_request_kind_ck
  CHECK (kind IN (
    'OFF_CAMPUS_OFFER', 'REGISTRATION_CHANGE', 'ABSENCE_DISPUTE',
    'CORRECTION_WITH_PROOF', 'PLACEMENT_AFTER_PLACEMENT',
    'OFFER_ACCEPTANCE_DISPUTE'
  ));
--> statement-breakpoint
-- from chat15-round-assessment-submission-deadline.sql
-- LEARNER-placements-41: persist the vendor test SUBMISSION deadline separately
-- from results_due_at (which is the expected result publication deadline).
-- Existing rounds are unknown/null; never invent a due date from result timing.
-- Orchestrator must register as a numbered migration and replay in PostgreSQL.
ALTER TABLE placement_job_rounds
  ADD COLUMN IF NOT EXISTS assessment_due_at timestamptz;
--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE placement_job_rounds
  ADD CONSTRAINT placement_job_rounds_assessment_due_ck
  CHECK (assessment_due_at IS NULL OR kind IN ('TEST','VENDOR_TEST'));
--> statement-breakpoint
-- from recruiter-message-email-bridge.sql
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS recruiter_message_mail_owner_idx ON placement_recruiter_message_mail_state(recruiter_user_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS recruiter_message_mail_token_uq
 ON placement_recruiter_message_mail_state(reply_token_hash) WHERE reply_token_hash IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_recruiter_inbound_email_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 message_id_hash varchar(64) NOT NULL UNIQUE,
 thread_id uuid NOT NULL REFERENCES placement_tpo_message_threads(id) ON DELETE RESTRICT,
 message_id uuid NOT NULL REFERENCES placement_tpo_messages(id) ON DELETE RESTRICT,
 received_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT recruiter_inbound_email_hash_ck CHECK(message_id_hash ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS recruiter_inbound_email_thread_idx
 ON placement_recruiter_inbound_email_events(thread_id,received_at);
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD COLUMN IF NOT EXISTS delivery_channel varchar(8) NOT NULL DEFAULT 'APP';
--> statement-breakpoint
ALTER TABLE placement_tpo_messages ADD CONSTRAINT placement_tpo_messages_delivery_ck
 CHECK(delivery_channel IN ('APP','EMAIL'));
--> statement-breakpoint
-- from chat15-course-assignment-material-links.sql
-- LEARNER-course-detail-03 and LEARNER-learning-misc-02:
-- Faculty-authored links for each published assignment, separate from
-- learners' own submission files and from lesson-level RESOURCE materials.
-- Orchestrator: register a numbered migration, then PostgreSQL replay.
CREATE TABLE IF NOT EXISTS course_assignment_materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 assignment_id uuid NOT NULL REFERENCES course_assignments(id) ON DELETE RESTRICT,
 kind varchar(12) NOT NULL DEFAULT 'LINK',
 title text NOT NULL,
 external_url text NOT NULL,
 sequence integer NOT NULL,
 created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT course_assignment_materials_link_ck CHECK
   (kind='LINK' AND length(trim(title)) BETWEEN 1 AND 160
    AND length(external_url) BETWEEN 10 AND 2048),
 CONSTRAINT course_assignment_materials_sequence_ck CHECK (sequence BETWEEN 0 AND 19),
 CONSTRAINT course_assignment_materials_sequence_uq UNIQUE(assignment_id,sequence)
);
--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS course_assignment_materials_parent_idx
 ON course_assignment_materials(assignment_id);
--> statement-breakpoint
-- from tpo-company-team-conversations.sql
-- TPO-inbox-team-16 / TPO-companies-05 / TPO-inbox-team-18
-- PROPOSAL ONLY: the orchestrator registers a numbered Drizzle migration.
-- One durable private-to-the-college, whole-TPO-thread per company relationship.
-- Do not grant any access to company/recruiter accounts.
CREATE TABLE IF NOT EXISTS placement_tpo_company_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 relationship_id uuid NOT NULL,
 created_by_membership_id uuid NOT NULL,
 topic varchar(200) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_company_threads_college_relationship_fk FOREIGN KEY
  (relationship_id,college_id)
  REFERENCES placement_company_relationships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_threads_college_creator_fk FOREIGN KEY
  (created_by_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_threads_topic_ck CHECK (length(btrim(topic)) BETWEEN 1 AND 200),
 CONSTRAINT tpo_company_threads_one_per_relationship_uq UNIQUE (college_id,relationship_id),
 CONSTRAINT tpo_company_threads_id_college_uq UNIQUE (id,college_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_company_threads_college_created_idx
 ON placement_tpo_company_threads(college_id,created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_tpo_company_thread_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL,
 college_id uuid NOT NULL,
 author_membership_id uuid NOT NULL,
 body text NOT NULL,
 idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_company_message_thread_college_fk FOREIGN KEY
  (thread_id,college_id)
  REFERENCES placement_tpo_company_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_message_author_college_fk FOREIGN KEY
  (author_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_message_body_ck CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
 CONSTRAINT tpo_company_message_dedupe_uq UNIQUE (thread_id,author_membership_id,idempotency_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_company_message_thread_history_idx
 ON placement_tpo_company_thread_messages(thread_id,created_at DESC,id DESC);
--> statement-breakpoint
-- from chat7-sa-course-catalogue-metadata.sql
-- SA-academics-people-50: selected-college course display metadata.
-- Existing catalogues retain their official internal code and original title.
-- These columns do not make private binaries uploadable.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_title varchar(120);
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS official_code varchar(64);
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_color varchar(7);
--> statement-breakpoint
ALTER TABLE courses ADD COLUMN IF NOT EXISTS takeaways text;
--> statement-breakpoint
UPDATE courses SET short_title=left(name,120) WHERE short_title IS NULL;
--> statement-breakpoint
ALTER TABLE courses ADD CONSTRAINT courses_card_color_hex_ck
 CHECK (card_color IS NULL OR card_color ~ '^#[0-9A-Fa-f]{6}$');
--> statement-breakpoint
-- from chat3-tpo-company-team.sql
-- TPO-companies-05. PROPOSED ONLY: orchestrator must register numbered migration.
-- Safe: the tables are private to placement-team members; every request must
-- verify college membership, company relationship and active TPO permissions.
create table if not exists placement_tpo_company_team_messages (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id),
 company_id uuid not null references placement_companies(id),
 author_membership_id uuid not null,
 body text not null,
 decision boolean not null default false,
 ask_assignee_membership_id uuid,
 ask_due_at timestamptz,
 ask_status text,
 edited_at timestamptz,
 deleted_at timestamptz,
 created_at timestamptz not null default now(),
 constraint tpo_company_team_author_college_fk foreign key(author_membership_id,college_id)
   references college_memberships(id,college_id),
 constraint tpo_company_team_assignee_college_fk foreign key(ask_assignee_membership_id,college_id)
   references college_memberships(id,college_id),
 constraint tpo_company_team_message_body_ck check(length(btrim(body)) between 1 and 4000),
 constraint tpo_company_team_ask_status_ck check(ask_status is null or ask_status in ('OPEN','DONE','CANCELLED')),
 constraint tpo_company_team_ask_assignee_status_ck check(
   (ask_assignee_membership_id is null and ask_status is null) or
   (ask_assignee_membership_id is not null and ask_status is not null))
);
--> statement-breakpoint
create index if not exists tpo_company_team_messages_college_company_time_idx
 on placement_tpo_company_team_messages(college_id,company_id,created_at);
--> statement-breakpoint
create table if not exists placement_tpo_company_team_follows (
 college_id uuid not null references colleges(id),
 company_id uuid not null references placement_companies(id),
 membership_id uuid not null,
 followed_at timestamptz not null default now(),
 constraint tpo_company_team_follows_pk primary key(college_id,company_id,membership_id),
 constraint tpo_company_team_follow_member_college_fk foreign key(membership_id,college_id)
   references college_memberships(id,college_id)
);
--> statement-breakpoint
-- from chat15-attendance-parent-sms-outbox.sql
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS attendance_parent_sms_queue_idx
 ON attendance_parent_sms_outbox(status,created_at);
--> statement-breakpoint
-- from chat13-public-company-share-code-and-columns.sql
ALTER TABLE placement_company_applicant_shares
 ADD COLUMN IF NOT EXISTS code_hash varchar(64),
 ADD COLUMN IF NOT EXISTS code_salt varchar(32),
 ADD COLUMN IF NOT EXISTS wrong_code_count integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS wrong_code_window_start timestamptz,
 ADD COLUMN IF NOT EXISTS locked_until timestamptz,
 ADD COLUMN IF NOT EXISTS selected_columns jsonb NOT NULL DEFAULT '["APPLICATION_ID","NAME","EMAIL"]'::jsonb,
 ADD COLUMN IF NOT EXISTS shortlist_by timestamptz;
--> statement-breakpoint
UPDATE placement_company_applicant_shares SET revoked_at=clock_timestamp()
 WHERE revoked_at IS NULL AND (code_hash IS NULL OR code_salt IS NULL);
--> statement-breakpoint
UPDATE placement_company_applicant_shares SET code_hash=repeat('0',64),code_salt=repeat('0',32)
 WHERE code_hash IS NULL OR code_salt IS NULL;
--> statement-breakpoint
ALTER TABLE placement_company_applicant_shares
 ALTER COLUMN code_hash SET NOT NULL,
 ALTER COLUMN code_salt SET NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_company_applicant_shares
 ADD CONSTRAINT pcas_code_hash_ck CHECK (code_hash ~ '^[a-f0-9]{64}$' AND code_salt ~ '^[a-f0-9]{32}$'),
 ADD CONSTRAINT pcas_wrong_code_count_ck CHECK (wrong_code_count BETWEEN 0 AND 10),
 ADD CONSTRAINT pcas_selected_columns_ck CHECK (
   jsonb_typeof(selected_columns)='array' AND
   jsonb_array_length(selected_columns) BETWEEN 1 AND 11
 );
--> statement-breakpoint
ALTER TABLE placement_company_applicant_share_views
 DROP CONSTRAINT IF EXISTS pcas_views_kind_ck;
--> statement-breakpoint
ALTER TABLE placement_company_applicant_share_views
 ADD CONSTRAINT pcas_views_kind_ck CHECK (event_kind IN ('VIEW','CSV','LOCKED'));
--> statement-breakpoint
-- from chat13-learner-round-attendance-confirmation.sql
-- LEARNER-placements-35; TPO's confirmed_at records slot assignment, not a
-- learner's own acceptance. Keep these two consent facts independent.
ALTER TABLE placement_round_candidate_slots
 ADD COLUMN IF NOT EXISTS learner_confirmed_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS prcs_learner_confirmed_at_idx
 ON placement_round_candidate_slots(application_id, round_id, learner_confirmed_at)
 WHERE status='BOOKED';
--> statement-breakpoint
-- from tpo-outside-drive-participants.sql
-- TPO-drives-31. Proposed; orchestrator assigns a numbered migration.
-- A record-only outside drive never becomes a published job or an offer.
CREATE UNIQUE INDEX IF NOT EXISTS outside_drives_id_college_uq
 ON placement_outside_drive_records(id,college_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_outside_drive_participants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 outside_drive_id uuid NOT NULL REFERENCES placement_outside_drive_records(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 result varchar(20) NOT NULL DEFAULT 'PARTICIPATED',
 updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT outside_drive_participant_result_ck CHECK
  (result IN ('PARTICIPATED','PASSED','FAILED','SELECTED','HIRED')),
 CONSTRAINT outside_drive_participant_record_college_fk
  FOREIGN KEY(outside_drive_id,college_id) REFERENCES placement_outside_drive_records(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT outside_drive_participant_learner_college_fk
  FOREIGN KEY(membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS outside_drive_participant_once_uq
 ON placement_outside_drive_participants(outside_drive_id,membership_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS outside_drive_participant_college_idx
 ON placement_outside_drive_participants(college_id,outside_drive_id);
