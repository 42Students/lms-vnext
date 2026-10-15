-- PROPOSED ONLY. Orchestrator must register, replay and approve.
-- A slot books capacity as an aggregate: NEVER store learner identities in
-- recruiter-visible slots. Candidate assignment requires separate TPO controls.
-- Composite round/job identity is required to reject a foreign round.
create unique index if not exists hr_interview_round_job_parent_uq
 on placement_job_rounds(id,job_id);
create table placement_hr_interview_slots (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id),
 job_id uuid not null references placement_jobs(id),
 round_id uuid not null references placement_job_rounds(id),
 start_at timestamptz not null,
 end_at timestamptz not null,
 timezone varchar(64) not null,
 mode varchar(24) not null check (mode in ('ON_CAMPUS','VIRTUAL')),
 meeting_location text,
 panel_label varchar(160),
 capacity integer not null check (capacity between 1 and 100),
 booked_count integer not null default 0,
 status varchar(24) not null default 'PROPOSED' check (status in ('PROPOSED','OFFERED','BOOKED','CANCELLED')),
 version integer not null default 1 check (version > 0),
 created_by_user_id uuid not null references users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint hr_slot_count_ck check (booked_count between 0 and capacity),
 constraint hr_slot_end_ck check (end_at > start_at),
 constraint hr_slot_status_book_ck check (status <> 'BOOKED' or booked_count > 0),
 constraint hr_slot_job_college_fk foreign key (job_id,college_id)
  references placement_jobs(id,college_id),
 constraint hr_slot_round_job_fk foreign key (round_id,job_id)
  references placement_job_rounds(id,job_id)
);
create unique index hr_interview_slots_round_start_uq on placement_hr_interview_slots(round_id,start_at);
create index hr_interview_slots_college_round_idx on placement_hr_interview_slots(college_id,round_id,start_at);
-- Before promotion: run journal replay, foreign-college/round negative tests,
-- audit and concurrent overlap/capacity tests; job write locks serialize collisions.
