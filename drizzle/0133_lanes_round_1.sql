-- from rec-home-drives-51-selection-lists.sql
-- REC-home-drives-51 proposal ONLY. Do not register without TPO review.
-- New recruiter-proposed selection lists require TPO approval, not direct offers.
-- All identifiers and applicant rows must be verified against persisted employer
-- grant, candidate sharing, college, job, and current application state in TX.
-- Create composite parent identities for tenant-safe FKs in the real migration.
CREATE TABLE placement_recruiter_selection_lists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
 recruiter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 submission_id uuid NOT NULL,
 kind varchar(24) NOT NULL CHECK (kind IN ('OFFER','LETTER_OF_INTENT')),
 ctc_lpa numeric(8,2) CHECK (ctc_lpa IS NULL OR ctc_lpa > 0),
 package_description varchar(500),
 status varchar(32) NOT NULL DEFAULT 'SENT_FOR_VERIFICATION'
   CHECK(status IN ('SENT_FOR_VERIFICATION','SENT_BACK','VERIFIED','DECLINED','WITHDRAWN')),
 decision_note varchar(500),
 decided_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (recruiter_user_id,college_id,submission_id),
 UNIQUE (id,job_id),
 CONSTRAINT selection_lists_job_tenant_fk
 FOREIGN KEY (job_id,college_id) REFERENCES placement_jobs(id,college_id)
);
--> statement-breakpoint
CREATE INDEX placement_recruiter_selection_tpo_queue_idx
 ON placement_recruiter_selection_lists(college_id,status,created_at DESC);
--> statement-breakpoint
CREATE TABLE placement_recruiter_selection_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 selection_list_id uuid NOT NULL,
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 job_id uuid NOT NULL,
 status varchar(24) NOT NULL DEFAULT 'PROPOSED'
   CHECK(status='PROPOSED'),
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 UNIQUE(selection_list_id,application_id),
 CONSTRAINT selection_items_parent_fk FOREIGN KEY(selection_list_id,job_id)
 REFERENCES placement_recruiter_selection_lists(id,job_id),
 CONSTRAINT selection_items_application_fk FOREIGN KEY(application_id,job_id)
 REFERENCES placement_applications(id,job_id)
);
--> statement-breakpoint
-- from chat-6-sa-video-actor-ownership.sql
-- Proposal for SA-academics-people-59 (NOT registered by chat-6).
-- Do not deploy until the orchestrator registers a migration and upgrades the
-- first-party R2 grant, completion, thumbnail, and read-attestation contracts.
-- Existing member-owned video assets remain valid and unchanged.
ALTER TABLE lesson_video_assets
  ADD COLUMN uploader_user_id uuid REFERENCES users(id),
  ALTER COLUMN uploader_membership_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE lesson_video_assets
  ADD CONSTRAINT lesson_video_assets_uploader_actor_ck
  CHECK (num_nonnulls(uploader_membership_id, uploader_user_id) = 1);
--> statement-breakpoint
-- from college-placements-reject-shortlisted.sql
-- COL-placements-01: a College Admin must be able to reject an application that was
-- already shortlisted (legacy "Mark Failed" after Assessment/Interview). The screening
-- history transition check only allowed PENDING/HOLD -> decision and REJECTED -> PENDING.
-- Adds SHORTLISTED -> REJECTED. Must match src/db/schema/placements.ts exactly.
ALTER TABLE "placement_application_screening_history" DROP CONSTRAINT IF EXISTS "placement_application_screening_history_transition_ck";
--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ADD CONSTRAINT "placement_application_screening_history_transition_ck" CHECK (("placement_application_screening_history"."from_status" = 'PENDING'
          and "placement_application_screening_history"."to_status" in ('HOLD', 'SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'HOLD'
          and "placement_application_screening_history"."to_status" in ('SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'SHORTLISTED'
          and "placement_application_screening_history"."to_status" = 'REJECTED')
        or ("placement_application_screening_history"."from_status" = 'REJECTED'
          and "placement_application_screening_history"."to_status" = 'PENDING'));
--> statement-breakpoint
-- from tpo-inbox-team-everyone.sql
-- TPO-inbox-team-15: permanent college-level Everyone channel.
-- Proposed only. Orchestrator registers a numbered Drizzle migration.
-- All membership is evaluated from active TPO roles; no invite table.
CREATE TABLE IF NOT EXISTS placement_tpo_team_everyone_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 author_membership_id uuid NOT NULL,
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_everyone_messages_author_college_fk
  FOREIGN KEY (author_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_everyone_message_body_ck CHECK (length(btrim(body)) BETWEEN 1 AND 4000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_team_everyone_messages_college_time_idx
 ON placement_tpo_team_everyone_messages(college_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_tpo_team_everyone_mutes (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL,
 muted_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_everyone_mutes_pk PRIMARY KEY (college_id,membership_id),
 CONSTRAINT tpo_team_everyone_mutes_member_college_fk
  FOREIGN KEY (membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
--> statement-breakpoint
-- from tpo-drive-workspace-18-cancel-selections.sql
-- TPO-drive-workspace-18
-- Proposed only: orchestrator must register and replay this change before
-- a drive with SELECTED/VERIFIED company selections can be cancelled.
-- Previous released selections remain immutable, attached to their official offers.
ALTER TABLE placement_drive_selections
  DROP CONSTRAINT IF EXISTS placement_drive_selections_status_ck;
--> statement-breakpoint
ALTER TABLE placement_drive_selections
  ADD CONSTRAINT placement_drive_selections_status_ck
  CHECK (status IN ('SELECTED','VERIFIED','RELEASED','CANCELLED'));
--> statement-breakpoint
ALTER TABLE placement_drive_selections
  DROP CONSTRAINT IF EXISTS placement_drive_selections_verified_ck;
--> statement-breakpoint
ALTER TABLE placement_drive_selections
  ADD CONSTRAINT placement_drive_selections_verified_ck
  CHECK (
    (status='SELECTED' AND verified_at IS NULL AND released_at IS NULL AND released_offer_id IS NULL)
    OR (status='VERIFIED' AND verified_at IS NOT NULL AND released_at IS NULL AND released_offer_id IS NULL)
    OR (status='RELEASED' AND verified_at IS NOT NULL AND released_offer_id IS NOT NULL AND released_at IS NOT NULL)
    OR (status='CANCELLED' AND released_at IS NULL AND released_offer_id IS NULL)
  );
--> statement-breakpoint
-- from tpo-inbox-team-read-receipts.sql
-- TPO-inbox-team-R05: per-member conversation read position.
-- Register by orchestrator only; no numbered drizzle files in builder lane.
CREATE TABLE IF NOT EXISTS placement_tpo_internal_reads (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 thread_id uuid NOT NULL,
 membership_id uuid NOT NULL,
 read_through timestamptz NOT NULL,
 following boolean NOT NULL DEFAULT true,
 muted_at timestamptz,
 CONSTRAINT tpo_internal_reads_pk PRIMARY KEY(thread_id,membership_id),
 CONSTRAINT tpo_internal_reads_thread_college_fk
  FOREIGN KEY(thread_id,college_id)
  REFERENCES placement_tpo_internal_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_internal_reads_member_college_fk
  FOREIGN KEY(membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_internal_reads_member_idx
 ON placement_tpo_internal_reads(college_id,membership_id);
--> statement-breakpoint
-- from graceful-telegram-alerting.sql
-- PROPOSAL ONLY. Orchestrator owns migration numbering, replay and schema export.
-- Include full DB10 signature/state/lease definitions for first registration.
CREATE TABLE IF NOT EXISTS log_alert_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment varchar(32) NOT NULL,
  signature_hash varchar(64) NOT NULL CHECK (signature_hash ~ '^[0-9a-f]{64}$'),
  sample_message varchar(500), first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  occurrence_count bigint NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  muted boolean NOT NULL DEFAULT false,
  fix_status varchar(16) NOT NULL DEFAULT 'OPEN' CHECK (fix_status IN ('OPEN','FIXED','EXPECTED')),
  fixed_in_commit varchar(64), fixed_at timestamptz, status_note varchar(500),
  muted_reason varchar(255), issue_public_id varchar(32), last_seen_commit varchar(64),
  regressed_at timestamptz, sample_path varchar(255),
  alerted_at timestamptz, acknowledged_at timestamptz,
  last_spike_alert_at timestamptz, recent_window_at timestamptz,
  recent_window_count bigint NOT NULL DEFAULT 1,
  day_key varchar(10), day_occurrences bigint NOT NULL DEFAULT 1,
  CONSTRAINT db10_log_alert_signature_env_hash_uq UNIQUE (environment, signature_hash),
  CONSTRAINT db10_log_alert_signature_seen_order_ck CHECK (last_seen_at >= first_seen_at),
  CONSTRAINT db10_log_alert_signature_fixed_shape_ck CHECK (fix_status <> 'FIXED' OR fixed_at IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_status_seen_idx ON log_alert_signatures (fix_status, last_seen_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_muted_seen_idx ON log_alert_signatures (muted, last_seen_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS log_alert_signature_accounts (
  signature_id uuid NOT NULL REFERENCES log_alert_signatures(id) ON DELETE CASCADE,
  account_key_hash varchar(64) NOT NULL CHECK (account_key_hash ~ '^[0-9a-f]{64}$'),
  first_seen_at timestamptz NOT NULL, PRIMARY KEY (signature_id, account_key_hash)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_accounts_hash_idx
  ON log_alert_signature_accounts (account_key_hash, first_seen_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS log_alert_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key varchar(64) NOT NULL UNIQUE CHECK (length(trim(state_key)) > 0),
  poll_cursor_at timestamptz, poll_page_token varchar(1024),
  poll_window_start_at timestamptz, poll_window_end_at timestamptz,
  admin_last_viewed_at timestamptz,
  burst_minute_at timestamptz, burst_count bigint NOT NULL DEFAULT 0,
  overflow_count bigint NOT NULL DEFAULT 0, last_digest_day varchar(10)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scheduled_job_leases (
  job_name varchar(120) PRIMARY KEY,
  locked_until timestamptz NOT NULL, locked_by varchar(120) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  fence bigint NOT NULL DEFAULT 1 CHECK (fence > 0)
);
--> statement-breakpoint
-- REQUIRED before deployment: registered SQL replay and DB10_LOG_ALERTS_READY=DB10_VERIFIED.

-- 09:00 IST digest must not lose yesterday's counts when a signature recurs today.
CREATE TABLE IF NOT EXISTS log_alert_daily_counts (
  signature_id uuid NOT NULL REFERENCES log_alert_signatures(id) ON DELETE CASCADE,
  day_key varchar(10) NOT NULL,
  occurrence_count bigint NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  spike_count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (signature_id, day_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS db10_log_alert_daily_day_idx ON log_alert_daily_counts (day_key);
--> statement-breakpoint
-- If W01 registered the original DB10 draft before this proposal, do not rely
-- on CREATE TABLE IF NOT EXISTS to add newly introduced telemetry columns.
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS alerted_at timestamptz;
--> statement-breakpoint
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
--> statement-breakpoint
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS last_spike_alert_at timestamptz;
--> statement-breakpoint
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS recent_window_at timestamptz;
--> statement-breakpoint
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS recent_window_count bigint NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS day_key varchar(10);
--> statement-breakpoint
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS day_occurrences bigint NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS burst_minute_at timestamptz;
--> statement-breakpoint
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS burst_count bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS overflow_count bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS last_digest_day varchar(10);
--> statement-breakpoint
-- A request seen by logError and the Cloud Logging fallback must count once.
-- Store only SHA-256 event identifiers (environment/signature/opaque request id).
CREATE TABLE IF NOT EXISTS log_alert_observed_events (
  event_hash varchar(64) PRIMARY KEY CHECK (event_hash ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS db10_log_alert_observed_at_idx
  ON log_alert_observed_events (observed_at);
--> statement-breakpoint
-- Cloud Logging may return many errors sharing one timestamp. Checkpoint an
-- entire page with a stable query window, never part of a page by timestamp.
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS poll_page_token varchar(1024);
--> statement-breakpoint
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS poll_window_start_at timestamptz;
--> statement-breakpoint
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS poll_window_end_at timestamptz;
--> statement-breakpoint
-- from tpo-batches-finish-without-invite.sql
-- TPO-batches-26: allow a college to retire a batch that was never invited.
-- Proposed only. Orchestrator owns registration and disposable-PostgreSQL replay.
-- Invitations remain unchanged; this does NOT fabricate invited_at.
ALTER TABLE placement_batch_lifecycles
 DROP CONSTRAINT IF EXISTS placement_batch_lifecycles_timeline_ck;
--> statement-breakpoint
ALTER TABLE placement_batch_lifecycles
 ADD CONSTRAINT placement_batch_lifecycles_timeline_ck
 CHECK (finished_at IS NULL OR invited_at IS NULL OR finished_at >= invited_at);
--> statement-breakpoint
-- from tpo-inbox-team-topic-limit.sql
-- TPO-inbox-team-17: legacy Team topics allow 200 characters.
-- Orchestrator registers migration; builders must not edit numbered drizzle files.
ALTER TABLE placement_tpo_internal_threads
 ALTER COLUMN topic TYPE varchar(200);
--> statement-breakpoint
-- from superadmin-placements-company-verification.sql
-- Proposal only. Orchestrator registers the numbered migration (SA-placements-projects-24).
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS verified_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_companies_verified_idx ON placement_companies (verified_at);
--> statement-breakpoint
ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_verifier_ck
 CHECK ((verified_at IS NULL) = (verified_by_user_id IS NULL));
--> statement-breakpoint
-- from superadmin-placements-company-global-edit.sql
-- SA-placements-projects-26. Orchestrator to register; do not place directly under drizzle/.
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS industry varchar(160);
--> statement-breakpoint
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS about text;
--> statement-breakpoint
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS logo_public_url text;
--> statement-breakpoint
-- from chat-12-learner-request-kinds.sql
ALTER TABLE placement_learner_requests
  ADD COLUMN IF NOT EXISTS learner_membership_id uuid;
--> statement-breakpoint
-- Backfill legacy applications without rewriting their immutable effect_payload.
UPDATE placement_learner_requests AS r
SET learner_membership_id = a.membership_id
FROM placement_applications AS a
WHERE r.application_id=a.id AND r.learner_membership_id IS NULL;
--> statement-breakpoint
-- Abort migration if even a single legacy request cannot be matched safely:
DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM placement_learner_requests WHERE learner_membership_id IS NULL)
 THEN RAISE EXCEPTION 'Unmatched historic learner requests; investigate before migrating';
 END IF;
END $$;
--> statement-breakpoint
ALTER TABLE placement_learner_requests
  ALTER COLUMN learner_membership_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_learner_requests
  ALTER COLUMN application_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_learner_requests
  DROP CONSTRAINT placement_learner_requests_type_ck;
--> statement-breakpoint
ALTER TABLE placement_learner_requests
  ADD CONSTRAINT placement_learner_requests_type_ck
  CHECK (request_type IN (
   'APPLICATION_WITHDRAWAL','ROUND_RESCHEDULE','OFFER_EXTENSION',
   'OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
   'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT'
  ));
--> statement-breakpoint
ALTER TABLE placement_learner_requests
  DROP CONSTRAINT placement_learner_requests_target_shape_ck;
--> statement-breakpoint
ALTER TABLE placement_learner_requests
  ADD CONSTRAINT placement_learner_requests_target_shape_ck
  CHECK (
   (request_type='APPLICATION_WITHDRAWAL' AND application_id IS NOT NULL AND round_id IS NULL AND offer_id IS NULL)
   OR (request_type='ROUND_RESCHEDULE' AND application_id IS NOT NULL AND round_id IS NOT NULL AND offer_id IS NULL)
   OR (request_type='OFFER_EXTENSION' AND application_id IS NOT NULL AND round_id IS NULL AND offer_id IS NOT NULL)
   OR (request_type IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE',
       'CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')
       AND round_id IS NULL AND offer_id IS NULL AND jsonb_typeof(effect_payload)='object')
  );
--> statement-breakpoint
-- from superadmin-company-domains-aliases.sql
-- Proposal SA-placements-projects-27/28. Orchestrator registers numbered SQL.
CREATE TABLE placement_company_domains (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES placement_companies(id),
 domain varchar(253) NOT NULL,
 added_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX placement_company_domains_lower_domain_uq ON placement_company_domains(lower(domain));
--> statement-breakpoint
CREATE INDEX placement_company_domains_company_idx ON placement_company_domains(company_id);
--> statement-breakpoint
INSERT INTO placement_company_domains(company_id,domain,added_by_user_id)
 SELECT id,lower(primary_domain),created_by_user_id FROM placement_companies
 WHERE primary_domain IS NOT NULL ON CONFLICT DO NOTHING;
--> statement-breakpoint
CREATE TABLE placement_company_aliases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES placement_companies(id),
 alias varchar(160) NOT NULL,
 added_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX placement_company_aliases_lower_alias_uq ON placement_company_aliases(lower(alias));
--> statement-breakpoint
CREATE INDEX placement_company_aliases_company_idx ON placement_company_aliases(company_id);
--> statement-breakpoint
-- from tpo-inbox-team-away-until.sql
-- TPO-inbox-team-34: temporary away status for active placement-cell members.
-- The orchestrator registers this; builders do not touch numbered migrations.
CREATE TABLE IF NOT EXISTS placement_tpo_team_away (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL,
 away_until timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_away_pk PRIMARY KEY(college_id,membership_id),
 CONSTRAINT tpo_team_away_membership_college_fk
  FOREIGN KEY(membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_team_away_until_idx ON placement_tpo_team_away(college_id,away_until);
--> statement-breakpoint
-- from tpo-team-asks.sql
-- TPO-inbox-team-22/29/31: draft only. Orchestrator registers the numbered migration.
CREATE TABLE IF NOT EXISTS placement_tpo_team_asks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL,
 college_id uuid NOT NULL,
 asker_membership_id uuid NOT NULL,
 assignee_membership_id uuid NOT NULL,
 request_key uuid NOT NULL,
 title varchar(200) NOT NULL,
 due_at timestamptz,
 status varchar(12) NOT NULL DEFAULT 'OPEN',
 done_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_asks_thread_college_fk FOREIGN KEY(thread_id,college_id)
  REFERENCES placement_tpo_internal_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_asks_asker_college_fk FOREIGN KEY(asker_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_asks_assignee_college_fk FOREIGN KEY(assignee_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_asks_dedupe_uq UNIQUE(thread_id,asker_membership_id,request_key),
 CONSTRAINT tpo_team_asks_distinct_people_ck CHECK(asker_membership_id <> assignee_membership_id),
 CONSTRAINT tpo_team_asks_status_ck CHECK(status IN ('OPEN','DONE','CANCELLED')),
 CONSTRAINT tpo_team_asks_title_ck CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 CONSTRAINT tpo_team_asks_note_ck CHECK(done_note IS NULL OR length(done_note) <= 2000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_team_asks_assignee_due_idx
 ON placement_tpo_team_asks(college_id,assignee_membership_id,status,due_at);
--> statement-breakpoint
-- from superadmin-placement-offer-letter.sql
-- SA-placements-projects-05, SA-placements-projects-21; orchestrator registers numbered migration.
ALTER TABLE placement_offers ADD COLUMN IF NOT EXISTS offer_letter_url text;
--> statement-breakpoint
ALTER TABLE placement_offers ADD COLUMN IF NOT EXISTS offer_letter_attached_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_offers ADD COLUMN IF NOT EXISTS offer_letter_attached_by_user_id uuid
 REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
-- from tpo-public-page-content.sql
-- Proposed only. Orchestrator registers as the next numbered migration.
-- Public content is an opt-in college-owned section; no identity or raw offers.
CREATE TABLE IF NOT EXISTS placement_public_page_content (
 college_id uuid PRIMARY KEY REFERENCES colleges(id) ON DELETE RESTRICT,
 about text NOT NULL DEFAULT '',
 metric_keys jsonb NOT NULL DEFAULT '["PLACED","OFFERS","HIRING_COMPANIES"]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_public_about_length CHECK(char_length(about)<=4000),
 CONSTRAINT placement_public_metric_array CHECK(jsonb_typeof(metric_keys)='array')
);
--> statement-breakpoint
-- from mentor-resources-legacy-metadata.sql
-- MEN-projects-meetings-53 / -55 / -57: proposed only, orchestrator registers
-- after cross-checking the existing project_resources journal and replaying
-- against disposable PostgreSQL. Never apply this draft to production directly.
ALTER TABLE project_resources
  ADD COLUMN IF NOT EXISTS resource_type varchar(24) NOT NULL DEFAULT 'LINK',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_notes text,
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES project_sprints(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES project_tasks(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_resources DROP CONSTRAINT IF EXISTS project_resources_status_ck;
--> statement-breakpoint
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_status_ck
  CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED'));
--> statement-breakpoint
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_type_ck
  CHECK (resource_type IN ('FILE', 'LINK', 'DOCUMENT', 'CODE', 'NOTE', 'ENVIRONMENT'));
--> statement-breakpoint
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_access_notes_ck
  CHECK (access_notes IS NULL OR length(access_notes) <= 4000);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_resources_sprint_idx ON project_resources(project_id, sprint_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_resources_task_idx ON project_resources(project_id, task_id);
--> statement-breakpoint
-- Database-enforced project-scope associations: resources must never point to
-- another project's sprint or task, including concurrent direct SQL mutations.
-- The relevant parent composite unique keys are created once in the
-- authoritative migration registered by the orchestrator.
CREATE UNIQUE INDEX IF NOT EXISTS project_sprints_id_project_uq ON project_sprints(id, project_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_tasks_id_project_uq ON project_tasks(id, project_id);
--> statement-breakpoint
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_sprint_project_fk FOREIGN KEY(sprint_id,project_id)
  REFERENCES project_sprints(id,project_id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_resources
  ADD CONSTRAINT project_resources_task_project_fk FOREIGN KEY(task_id,project_id)
  REFERENCES project_tasks(id,project_id) ON DELETE RESTRICT;
--> statement-breakpoint
-- from tracker-authenticated-reporter-owner.sql
-- SA-placements-projects-101 / OD-27: proposed, single-writer registration required.
-- Existing 0076 reports have no authenticated owner provenance; they remain
-- Super-Admin-only until an independent verified owner attribution is possible.
ALTER TABLE bug_reports
  ADD COLUMN reporter_user_id uuid NULL REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX db10_bug_reports_reporter_user_idx
  ON bug_reports(reporter_user_id, created_at);
--> statement-breakpoint
-- from tracker-independent-audit-findings.sql
-- SA-placements-projects-119..122: independent finding model (proposed only).
-- Orchestrator must assign numbered migration, serialize with the schema writer,
-- replay on disposable PostgreSQL and verify rollback constraints before enabling.
CREATE TABLE audit_findings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 external_id varchar(120) NOT NULL UNIQUE,
 title text NOT NULL, summary text NOT NULL,
 area varchar(80) NOT NULL, kind varchar(32) NOT NULL,
 severity varchar(16) NOT NULL, status varchar(24) NOT NULL DEFAULT 'NEW',
 assignee varchar(150), found_by varchar(150), found_at timestamptz,
 source_repo varchar(180) NOT NULL, source_path varchar(500),
 paths jsonb NOT NULL DEFAULT '[]'::jsonb, pages jsonb NOT NULL DEFAULT '[]'::jsonb,
 endpoints jsonb NOT NULL DEFAULT '[]'::jsonb,
 steps text, expected text, actual text, evidence text, suggested_fix text,
 duplicate_of uuid, fix_commits jsonb NOT NULL DEFAULT '[]'::jsonb,
 version integer NOT NULL DEFAULT 0,
 imported_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_audit_findings_status_ck CHECK (status IN (
   'NEW','CONFIRMED','IN_PROGRESS','FIXED_DEV','RELEASED_PROD',
   'VERIFIED','DUPLICATE','WONT_FIX','NEEDS_INFO','CANT_REPRODUCE')),
 CONSTRAINT db10_audit_findings_severity_ck CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
 CONSTRAINT db10_audit_findings_kind_ck CHECK (kind IN (
   'BUG','SECURITY','DATA','UX','COPY','PERFORMANCE','ACCESSIBILITY')),
 CONSTRAINT db10_audit_findings_version_ck CHECK (version >= 0)
);
--> statement-breakpoint
ALTER TABLE audit_findings ADD CONSTRAINT db10_audit_findings_duplicate_fk
 FOREIGN KEY(duplicate_of) REFERENCES audit_findings(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX db10_audit_findings_status_severity_idx
 ON audit_findings(status,severity,found_at);
--> statement-breakpoint
CREATE INDEX db10_audit_findings_area_kind_idx ON audit_findings(area,kind);
--> statement-breakpoint
CREATE TABLE audit_finding_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 finding_id uuid NOT NULL REFERENCES audit_findings(id) ON DELETE RESTRICT,
 actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 action varchar(32) NOT NULL, note text,
 from_status varchar(24), to_status varchar(24),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_audit_finding_events_action_ck CHECK (action IN (
 'STATUS','ASSIGNEE','SEVERITY','DUPLICATE','FIX_COMMIT','COMMENT'))
);
--> statement-breakpoint
CREATE INDEX db10_audit_finding_events_finding_idx
 ON audit_finding_events(finding_id,created_at);
--> statement-breakpoint
CREATE TABLE audit_finding_syncs (
 source varchar(120) PRIMARY KEY, last_synced_at timestamptz,
 last_result varchar(24) NOT NULL DEFAULT 'NOT_CONFIGURED',
 imported_count integer NOT NULL DEFAULT 0,
 refused_files jsonb NOT NULL DEFAULT '[]'::jsonb
);
--> statement-breakpoint
-- from chat13-placement-legacy-posting-details.sql
-- SA-placements-projects-14 proposal; orchestrator must register a numbered migration.
-- The JSONB contains informational legacy terms only: never use it to authorize
-- learner visibility or eligibility, which are governed by college and policy tables.
ALTER TABLE placement_jobs ADD COLUMN IF NOT EXISTS legacy_posting_details jsonb;
