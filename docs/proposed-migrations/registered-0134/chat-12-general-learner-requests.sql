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
create unique index if not exists placement_general_request_one_pending_target_uq
 on placement_learner_general_requests(membership_id,kind,target_key) where status='PENDING';
create index if not exists placement_general_request_college_queue_idx
 on placement_learner_general_requests(college_id,status,requested_at);
create index if not exists placement_general_request_member_idx
 on placement_learner_general_requests(college_id,membership_id,requested_at);
create table if not exists placement_learner_general_request_events (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references placement_learner_general_requests(id) on delete restrict,
 prior_status varchar(20),next_status varchar(20) not null,
 actor_user_id uuid not null references users(id) on delete restrict,
 note text,occurred_at timestamptz not null default now(),
 constraint placement_general_request_events_status_ck check(next_status in ('PENDING','APPROVED','REJECTED','CANCELLED'))
);
create index if not exists placement_general_request_events_parent_idx
 on placement_learner_general_request_events(request_id,occurred_at);
