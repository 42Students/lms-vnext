-- from faculty-assessments-participation-zero-points.sql
-- FAC-assessments-R08: participation assignments may have zero points.
-- Register as numbered migration only after disposable DB verification.
ALTER TABLE course_assignments DROP CONSTRAINT IF EXISTS course_assignments_points_ck;
--> statement-breakpoint
ALTER TABLE course_assignments ADD CONSTRAINT course_assignments_points_ck CHECK (max_points BETWEEN 0 AND 10000);
--> statement-breakpoint
-- from recruiter-private-candidate-ratings.sql
-- REC-home-drives-41: proposal only; orchestrator registers numbered migration.
-- Individual reviewer notes must NEVER become part of company-shared notes.
CREATE TABLE IF NOT EXISTS placement_recruiter_private_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 recruiter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 rating smallint,
 note text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT prpr_rating_ck CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
 CONSTRAINT prpr_note_ck CHECK (length(note) <= 1000),
 CONSTRAINT prpr_recruiter_application_uq UNIQUE (recruiter_user_id, application_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS prpr_application_idx ON placement_recruiter_private_reviews(application_id);
--> statement-breakpoint
-- from chat-12-general-learner-requests.sql
-- PROPOSAL ONLY: Register a numbered migration through the orchestrator. Never apply this file directly.
-- TPO-requests-verification-01: independently scoped requests for the five non-application kinds.
create table if not exists placement_learner_general_requests (
 id uuid primary key default gen_random_uuid(),college_id uuid not null references colleges(id) on delete restrict,
 membership_id uuid not null,kind varchar(40) not null,target_key varchar(150) not null,
 reason text not null,payload jsonb not null,status varchar(20) not null default 'PENDING',
 requested_by_user_id uuid not null references users(id) on delete restrict,
 requested_at timestamptz not null default now(),decided_by_user_id uuid references users(id) on delete restrict,
 decided_at timestamptz,decision_note text,version uuid not null default gen_random_uuid(),
 updated_at timestamptz not null default now(),
 constraint placement_general_request_member_college_fk foreign key(membership_id,college_id)
  references college_memberships(id,college_id) on delete restrict,
 constraint placement_general_request_kind_ck check(kind in ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')),
 constraint placement_general_request_status_ck check(status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
 constraint placement_general_request_reason_ck check(length(btrim(reason)) between 3 and 2000),
 constraint placement_general_request_payload_ck check(jsonb_typeof(payload)='object'),
 constraint placement_general_request_decision_ck check(
  (status='PENDING' and decided_by_user_id is null and decided_at is null) or
  (status<>'PENDING' and decided_by_user_id is not null and decided_at is not null))
);
--> statement-breakpoint
create unique index if not exists placement_general_request_one_pending_target_uq
 on placement_learner_general_requests(membership_id,kind,target_key) where status='PENDING';
--> statement-breakpoint
create index if not exists placement_general_request_college_queue_idx
 on placement_learner_general_requests(college_id,status,requested_at);
--> statement-breakpoint
create index if not exists placement_general_request_member_idx
 on placement_learner_general_requests(college_id,membership_id,requested_at);
--> statement-breakpoint
create table if not exists placement_learner_general_request_events (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references placement_learner_general_requests(id) on delete restrict,
 prior_status varchar(20),next_status varchar(20) not null,
 actor_user_id uuid not null references users(id) on delete restrict,
 note text,occurred_at timestamptz not null default now(),
 constraint placement_general_request_events_status_ck check(next_status in ('PENDING','APPROVED','REJECTED','CANCELLED'))
);
--> statement-breakpoint
create index if not exists placement_general_request_events_parent_idx
 on placement_learner_general_request_events(request_id,occurred_at);
--> statement-breakpoint
-- from chat-12-tpo-prep-assignments.sql
-- PROPOSAL ONLY, register through orchestrator. TPO-students-10.
create table if not exists placement_tpo_prep_assignments (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id) on delete restrict,
 membership_id uuid not null,
 offering_id uuid not null references course_offerings(id) on delete restrict,
 due_at timestamptz not null,
 assigned_by_user_id uuid not null references users(id) on delete restrict,
 created_at timestamptz not null default now(),
 constraint tpo_prep_member_college_fk foreign key(membership_id,college_id) references college_memberships(id,college_id) on delete restrict,
 constraint tpo_prep_due_after_assigned_ck check(due_at>created_at)
);
--> statement-breakpoint
create unique index if not exists tpo_prep_member_offering_uq
 on placement_tpo_prep_assignments(membership_id,offering_id);
--> statement-breakpoint
create index if not exists tpo_prep_college_due_idx on placement_tpo_prep_assignments(college_id,due_at);
--> statement-breakpoint
-- from learner-general-placement-requests.sql
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
 (kind IN ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE')),
 CONSTRAINT placement_learner_general_status_ck CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
 CONSTRAINT placement_learner_general_reason_ck CHECK (length(trim(reason)) BETWEEN 3 AND 2000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_learner_general_pending_target_uq
 ON placement_learner_general_requests(college_id,membership_id,kind,target_key) WHERE status='PENDING';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_learner_general_college_status_idx
 ON placement_learner_general_requests(college_id,status,requested_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_learner_general_member_idx
 ON placement_learner_general_requests(college_id,membership_id,requested_at);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_learner_general_events_request_idx
 ON placement_learner_general_request_events(request_id,occurred_at);
--> statement-breakpoint
-- from chat7-faculty-lesson-content-points.sql
-- FAC-courses-19: educator-assigned points for video, YouTube, resource, and live content.
-- Legacy existing content receives a neutral default rather than missing points.
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE lesson_contents DROP CONSTRAINT IF EXISTS lesson_contents_points_ck;
--> statement-breakpoint
ALTER TABLE lesson_contents ADD CONSTRAINT lesson_contents_points_ck CHECK (points BETWEEN 0 AND 1000);
