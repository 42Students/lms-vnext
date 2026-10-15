-- STAGED / requires orchestrator registration and PostgreSQL tenant replay.
-- External events are records of facts, not published learner-visible jobs.
create table placement_outside_drive_records (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id),
 company_relationship_id uuid not null references placement_company_relationships(id),
 title varchar(200) not null check(length(btrim(title))>0),
 external_reference_url text,
 occurred_at timestamptz not null,
 notes text,
 recorded_by_user_id uuid not null references users(id),
 recorded_by_role varchar(16) not null check(recorded_by_role in ('TPO','RECRUITER')),
 created_at timestamptz not null default now()
);
create index outside_drives_college_date_idx on placement_outside_drive_records(college_id,occurred_at);
-- Promote only after composite company-relationship/college FK enforcement,
-- immutable provenance and cross-role isolation tests. No learner records.
