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
create unique index if not exists tpo_prep_member_offering_uq
 on placement_tpo_prep_assignments(membership_id,offering_id);
create index if not exists tpo_prep_college_due_idx on placement_tpo_prep_assignments(college_id,due_at);
