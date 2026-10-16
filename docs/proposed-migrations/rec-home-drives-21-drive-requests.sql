-- REC-home-drives-21 | PROPOSED, NOT A REGISTERED MIGRATION.
-- Orchestrator must reconcile with TPO-drives-02 and TPO-requests-verification-33/34/35,
-- register a numbered Drizzle migration, replay disposable PostgreSQL and prove tenant/FK/concurrency.
-- This table is intentionally NOT imported by the live schema barrel and must not be queried yet.
create table if not exists placement_recruiter_drive_requests (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id) on delete restrict,
 company_relationship_id uuid not null,
 recruiter_user_id uuid not null references users(id) on delete restrict,
 submission_id uuid not null,
 source_job_id uuid references placement_jobs(id) on delete restrict,
 approved_job_id uuid references placement_jobs(id) on delete restrict,
 status varchar(24) not null default 'REQUEST',
 draft jsonb not null,
 decision_note text,
 decided_by_user_id uuid references users(id) on delete restrict,
 decided_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint placement_recruiter_drive_requests_relationship_fk
   foreign key (company_relationship_id,college_id)
   references placement_company_relationships(id,college_id) on delete restrict,
 constraint placement_recruiter_drive_requests_status_ck
   check (status in ('REQUEST','SENT_BACK','DRAFT','REJECTED','CANCELLED')),
 constraint placement_recruiter_drive_requests_decision_ck
   check ((decided_at is null) = (decided_by_user_id is null)),
 constraint placement_recruiter_drive_requests_draft_ck
   check (jsonb_typeof(draft) = 'object'),
 unique(recruiter_user_id,college_id,submission_id)
);
create index if not exists placement_recruiter_drive_requests_tpo_inbox_idx
 on placement_recruiter_drive_requests(college_id,status,created_at);
create index if not exists placement_recruiter_drive_requests_own_idx
 on placement_recruiter_drive_requests(recruiter_user_id,college_id,created_at);
-- Application must independently re-check a persisted valid grant, company identity,
-- invite verification, company relationship, season, and the authoritative request
-- state inside one transaction. Trusted autoapproval creates an ordinary DRAFT job
-- only AFTER approval; an unapproved REQUEST never enters the student-facing jobs.
-- TPO Requests must share this exact queue; do not implement a second request state.
