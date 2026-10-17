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
create index if not exists tpo_company_team_messages_college_company_time_idx
 on placement_tpo_company_team_messages(college_id,company_id,created_at);
create table if not exists placement_tpo_company_team_follows (
 college_id uuid not null references colleges(id),
 company_id uuid not null references placement_companies(id),
 membership_id uuid not null,
 followed_at timestamptz not null default now(),
 constraint tpo_company_team_follows_pk primary key(college_id,company_id,membership_id),
 constraint tpo_company_team_follow_member_college_fk foreign key(membership_id,college_id)
   references college_memberships(id,college_id)
);
-- A database-wide wildcard team access grant is intentionally NOT created.
