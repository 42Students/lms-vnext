-- DB-005 / Chat 4 — UNREGISTERED DB02 staging contract.
-- This file is deliberately NOT a numbered Drizzle migration and is not imported by src/db/schema/index.ts.
-- Legacy evidence pinned at:
--   backend  21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   frontend e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2
-- Runtime PostgreSQL verification: NOT EXECUTED.
--
-- Why this exists:
-- 1) legacy semester is a program-scoped curriculum term (program_id + semester_number + name),
--    while vNext academic_periods is a college-scoped calendar period.
-- 2) legacy semester_course persists curriculum ordering, credits and mandatory/elective semantics.
-- 3) legacy lecture_hall is a college/department resource used by class_schedule; vNext currently
--    stores only free-text section_schedule_events.location.
--
-- Chat 1 owns final migration numbering / Drizzle registration. This staging file is contract evidence only.

create table if not exists program_terms (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete restrict,
  term_number integer not null,
  name text not null,
  total_credits integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_terms_number_ck check (term_number between 1 and 24),
  constraint program_terms_name_ck check (btrim(name) <> ''),
  constraint program_terms_total_credits_ck check (
    total_credits is null or total_credits >= 0
  ),
  constraint program_terms_program_number_uq unique (program_id, term_number)
);

create index if not exists program_terms_program_active_idx
  on program_terms(program_id, is_active, term_number);

create table if not exists program_term_courses (
  id uuid primary key default gen_random_uuid(),
  program_term_id uuid not null references program_terms(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  is_mandatory boolean not null default true,
  credits integer not null default 3,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_term_courses_term_course_uq unique (program_term_id, course_id),
  constraint program_term_courses_credits_ck check (credits between 0 and 30),
  constraint program_term_courses_display_order_ck check (display_order >= 1)
);

create index if not exists program_term_courses_term_order_idx
  on program_term_courses(program_term_id, display_order);

create table if not exists academic_rooms (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete restrict,
  department_id uuid references departments(id) on delete restrict,
  name text not null,
  capacity integer not null default 50,
  room_type text not null,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_rooms_name_ck check (btrim(name) <> ''),
  constraint academic_rooms_capacity_ck check (capacity between 1 and 5000),
  constraint academic_rooms_type_ck check (
    room_type in (
      'CLASSROOM',
      'LECTURE_HALL',
      'LAB',
      'SEMINAR_HALL',
      'AUDITORIUM',
      'CONFERENCE_ROOM'
    )
  )
);

create unique index if not exists academic_rooms_active_college_name_uq
  on academic_rooms(college_id, lower(name))
  where archived_at is null;

create index if not exists academic_rooms_department_idx
  on academic_rooms(department_id)
  where department_id is not null;

-- Preserve the curriculum identity of a concrete offering without replacing the existing
-- course/cohort/period model. Nullable in staging so the integrator can choose rollout order.
alter table course_offerings
  add column if not exists program_term_course_id uuid
  references program_term_courses(id) on delete restrict;

create index if not exists course_offerings_program_term_course_idx
  on course_offerings(program_term_course_id)
  where program_term_course_id is not null;

-- Preserve a first-class room identity while keeping free-text location for external/ad-hoc places.
alter table section_schedule_events
  add column if not exists room_id uuid
  references academic_rooms(id) on delete restrict;

create index if not exists section_schedule_events_room_time_idx
  on section_schedule_events(room_id, starts_at)
  where room_id is not null;

-- Tenant guard: an academic room's department, when supplied, must belong to the same college.
create or replace function db02_assert_academic_room_department_scope()
returns trigger
language plpgsql
as $$
declare
  department_college uuid;
begin
  if new.department_id is null then
    return new;
  end if;

  select d.college_id
    into department_college
    from departments d
   where d.id = new.department_id;

  if department_college is null or department_college <> new.college_id then
    raise exception 'academic room department must belong to room college'
      using errcode = '23514',
            constraint = 'academic_rooms_department_college_ck';
  end if;

  return new;
end;
$$;

drop trigger if exists academic_rooms_department_college_trg on academic_rooms;
create trigger academic_rooms_department_college_trg
before insert or update of college_id, department_id
on academic_rooms
for each row
execute function db02_assert_academic_room_department_scope();

-- Curriculum guard: when an offering names a curriculum row, course and cohort program must agree.
create or replace function db02_assert_course_offering_program_term_scope()
returns trigger
language plpgsql
as $$
declare
  curriculum_course uuid;
  curriculum_program uuid;
  cohort_program uuid;
begin
  if new.program_term_course_id is null then
    return new;
  end if;

  select ptc.course_id, pt.program_id
    into curriculum_course, curriculum_program
    from program_term_courses ptc
    join program_terms pt on pt.id = ptc.program_term_id
   where ptc.id = new.program_term_course_id;

  select c.program_id
    into cohort_program
    from cohorts c
   where c.id = new.cohort_id;

  if curriculum_course is null
     or curriculum_course <> new.course_id
     or curriculum_program is distinct from cohort_program then
    raise exception 'course offering curriculum row must match course and cohort program'
      using errcode = '23514',
            constraint = 'course_offerings_program_term_scope_ck';
  end if;

  return new;
end;
$$;

drop trigger if exists course_offerings_program_term_scope_trg on course_offerings;
create trigger course_offerings_program_term_scope_trg
before insert or update of course_id, cohort_id, program_term_course_id
on course_offerings
for each row
execute function db02_assert_course_offering_program_term_scope();

-- Tenant guard: a scheduled room must belong to the same college as the section's program.
create or replace function db02_assert_schedule_room_scope()
returns trigger
language plpgsql
as $$
declare
  room_college uuid;
  section_college uuid;
begin
  if new.room_id is null then
    return new;
  end if;

  select r.college_id
    into room_college
    from academic_rooms r
   where r.id = new.room_id
     and r.archived_at is null;

  select d.college_id
    into section_college
    from sections s
    join cohorts c on c.id = s.cohort_id
    join programs p on p.id = c.program_id
    join departments d on d.id = p.department_id
   where s.id = new.section_id;

  if room_college is null or section_college is null or room_college <> section_college then
    raise exception 'schedule room must be active and belong to the section college'
      using errcode = '23514',
            constraint = 'section_schedule_events_room_college_ck';
  end if;

  return new;
end;
$$;

drop trigger if exists section_schedule_events_room_college_trg on section_schedule_events;
create trigger section_schedule_events_room_college_trg
before insert or update of section_id, room_id
on section_schedule_events
for each row
execute function db02_assert_schedule_room_scope();

-- Acceptance still required before registration:
-- * clean zero-to-current migration replay in disposable PostgreSQL
-- * duplicate term number / duplicate course mapping negative tests
-- * cross-college department-room rejection
-- * cross-college schedule-room rejection
-- * curriculum mapping mismatch rejection
-- * archive/delete behavior and concurrent room/course assignment tests
