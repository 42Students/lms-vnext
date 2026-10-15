-- STAGED: do not register until college-scope FKs and active-member checks are reviewed.
-- Internal-only; recruiter grants must never authorize these tables.
create table placement_tpo_internal_threads (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id),
 started_by_membership_id uuid not null references college_memberships(id),
 invited_membership_id uuid not null references college_memberships(id),
 topic varchar(160) not null check(length(btrim(topic))>0),
 created_at timestamptz not null default now(),
 check(started_by_membership_id<>invited_membership_id)
);
create index tpo_internal_threads_college_idx on placement_tpo_internal_threads(college_id,created_at);
create table placement_tpo_internal_messages (
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references placement_tpo_internal_threads(id),
 author_membership_id uuid not null references college_memberships(id),
 body text not null check(length(btrim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index tpo_internal_messages_thread_idx on placement_tpo_internal_messages(thread_id,created_at);
-- Orchestrator prerequisite: composite college/member foreign keys and private
-- author/participant policy at the SQL boundary; auth in app alone is insufficient.
