-- LEARNER-placements-51 / LEARNER-placements-52
-- Proposal only: orchestrator assigns a numbered migration and replays on disposable PostgreSQL.
CREATE TABLE IF NOT EXISTS placement_learner_general_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 kind varchar(40) NOT NULL,
 target_key text NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'PENDING',
 reason text NOT NULL,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 requested_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 requested_at timestamptz NOT NULL DEFAULT now(),
 version uuid NOT NULL DEFAULT gen_random_uuid(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 decided_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 decided_at timestamptz,
 decision_note text,
 CONSTRAINT placement_learner_general_kind_ck CHECK
 (kind IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')),
 CONSTRAINT placement_learner_general_status_ck CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
 CONSTRAINT placement_learner_general_reason_ck CHECK (length(trim(reason)) BETWEEN 3 AND 2000)
);
CREATE UNIQUE INDEX IF NOT EXISTS placement_learner_general_pending_target_uq
 ON placement_learner_general_requests(college_id,membership_id,kind,target_key) WHERE status='PENDING';
CREATE INDEX IF NOT EXISTS placement_learner_general_college_status_idx
 ON placement_learner_general_requests(college_id,status,requested_at);
CREATE INDEX IF NOT EXISTS placement_learner_general_member_idx
 ON placement_learner_general_requests(college_id,membership_id,requested_at);
CREATE TABLE IF NOT EXISTS placement_learner_general_request_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES placement_learner_general_requests(id) ON DELETE RESTRICT,
 prior_status varchar(16),
 next_status varchar(16) NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 note text,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_learner_general_events_status_ck
 CHECK(next_status IN ('PENDING','APPROVED','REJECTED','CANCELLED'))
);
CREATE INDEX IF NOT EXISTS placement_learner_general_events_request_idx
 ON placement_learner_general_request_events(request_id,occurred_at);
