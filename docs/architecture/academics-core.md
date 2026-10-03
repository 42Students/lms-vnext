# Academics core architecture

Status: A1 implementation baseline.

LMS vNext is greenfield. Legacy LMS academics are a behavior/reference oracle only; no legacy academic data will be migrated.

## Goal

Provide the relational academic structure that Courses, Projects, attendance, schedules and learner progression can depend on without coupling those modules together.

A1 covers Programs, Academic Periods, Cohorts / Batches, and Sections.

A2 will add learner program enrollments, section rosters, faculty section assignments, and schedule/calendar primitives.

Course catalogs, course offerings, lessons and learning content belong to the Courses phase and must not be embedded in Academics A1.

## Ownership model

College owns Academic Periods and Departments.
Department owns Programs.
Program owns Cohorts.
Cohort owns Sections.
Each Section also references one Academic Period.

A Program belongs to exactly one Department.
A Department belongs to exactly one College.
An Academic Period belongs directly to a College.
A Cohort belongs to exactly one Program and names its start period plus optional expected end period.
A Section binds one Cohort to one Academic Period.

The service layer rejects cross-college period/cohort/section combinations.

## Program

Fields:
- id
- department_id
- name
- code
- duration_terms
- status ACTIVE or ARCHIVED
- created_at
- updated_at

Rules:
- active name unique inside a department, case-insensitive
- active code unique inside a department, case-insensitive
- duration_terms between 1 and 24
- archive is blocked while any non-archived cohort exists
- department ownership is immutable

Duration is term-based rather than year-based so semester, trimester or other calendars do not require schema redesign.

## Academic Period

Fields:
- id
- college_id
- name
- code
- start_date
- end_date
- status PLANNED, ACTIVE or CLOSED
- created_at
- updated_at

Rules:
- code unique inside a college, case-insensitive
- end date cannot precede start date
- editable only while PLANNED
- lifecycle is PLANNED -> ACTIVE -> CLOSED
- CLOSED is terminal in A1

Multiple periods may exist for a college. A1 does not impose a single globally-active term because different academic structures may overlap.

## Cohort / Batch

Fields:
- id
- program_id
- name
- code
- start_period_id
- expected_end_period_id optional
- status PLANNED, ACTIVE, COMPLETED or ARCHIVED
- created_at
- updated_at

Rules:
- code unique inside a program, case-insensitive
- start and expected-end periods must belong to the same college as the Program
- expected end cannot precede the start window
- editable only while PLANNED
- lifecycle: PLANNED -> ACTIVE -> COMPLETED
- PLANNED or COMPLETED may be archived
- ACTIVE cohorts cannot be archived directly

Learner movement/promotion is intentionally not stored as a mutable current-semester integer on the Cohort. A2 will model learner enrollment/section history explicitly.

## Section

Fields:
- id
- cohort_id
- academic_period_id
- name
- code
- capacity optional
- status ACTIVE or ARCHIVED
- created_at
- updated_at

Rules:
- active name unique per Cohort + Academic Period
- active code unique per Cohort + Academic Period
- capacity must be positive when supplied
- period must belong to the Cohort's College
- period must fall inside the Cohort's configured academic window
- sections can be prepared while a Cohort is PLANNED or ACTIVE
- sections cannot be created in CLOSED periods
- archive is terminal in A1

A Section is period-specific. This avoids the legacy ambiguity where one Class row mixed a long-lived roster concept with current batch/semester state.

## Authorization

Central policy permissions:
- academics.read
- academics.manage

Rules:
- SUPER_ADMIN follows selected safety scope
- any active same-college membership may read academic structure
- only COLLEGE_ADMIN may mutate academic structure inside their own college
- client-supplied IDs never establish ownership; services resolve stored relationships first

## Boundary with Courses

Academics answers:
- what Program exists?
- which College/Department owns it?
- what academic Period exists?
- what Cohort is progressing through the Program?
- what Section exists for that Cohort in that Period?

Courses will answer:
- what Course exists?
- what Course Offering is taught in a Period/Section?
- which Faculty teach it?
- which content/learning path belongs to it?
- what progress does a learner have?

Do not add Course IDs to Program/Cohort/Section as JSON blobs.

## Legacy behavior retained intentionally

Useful concepts retained from the legacy product:
- Program
- Semester/term
- Batch
- Class/Section
- elective structures
- class schedules

Intentionally not copied:
- Batch.currentSemester as the source of truth
- class rows that mix section and group-backed roster semantics
- program structures containing raw course ID JSON
- faculty/course authorization mixed into academic structure
- migration/backfill machinery

## Testing requirements

A1 integration tests must prove:
- Program -> Period -> Cohort -> Section creation
- same-college Faculty read access
- College Admin mutation access
- cross-college period/cohort rejection
- scoped Super Admin safety rails
- lifecycle transitions
- uniqueness and database check constraints
- readiness fails if the Academics migration is absent

A2 extends this with enrollment/assignment isolation.


## A2 — progression, rosters and section operations

A2 makes learner progression and section operations explicit history instead of mutable pointers.

### Learner Program Enrollment

One active Program enrollment is allowed per college membership.

Fields include membership, Program, Cohort, lifecycle status, admitted time, and terminal completion/withdrawal timestamps.

Rules:
- membership must be ACTIVE and carry LEARNER
- membership College must equal the Program's College
- Cohort must belong to the Program
- Cohort must be PLANNED or ACTIVE when admitting the learner
- only one active Program enrollment per membership
- ending the Program enrollment also closes any active Section placements

### Section Enrollment history

Section placement is append-only history.

Rules:
- target Section must belong to the learner's Cohort
- target Section must be ACTIVE
- target Academic Period must not be CLOSED
- same-period moves close the previous placement as MOVED
- forward-period placement closes earlier active placements as COMPLETED
- moving backward to an earlier Academic Period is rejected
- assigning the same learner to the same Section/Period is idempotent
- Section capacity is checked while the target Section row is locked inside the transaction
- concurrent duplicate placement is additionally blocked by a partial unique index

This replaces legacy learner.class_id / Batch.currentSemester mutation as the progression source of truth.

### Section Faculty responsibilities

A2 supports Section-level responsibilities only:
- ADVISOR
- COORDINATOR

The membership must be ACTIVE, contain FACULTY, and belong to the same College as the Section.

Course teaching/instructor assignment is intentionally deferred to the Courses phase.

### Section schedule events

A2 provides generic Section calendar events.

Rules:
- event belongs to one Section
- optional Faculty membership must be active FACULTY in the same College
- start/end must fall inside the Section's Academic Period
- end must be after start
- new/edited events cannot target a CLOSED Academic Period
- cancellation is explicit and retained as history

Course-specific class meetings may later reference/extend this boundary rather than duplicating tenant and time validation.

### A2 database constraints

PostgreSQL enforces:
- one active Program enrollment per membership
- unique membership + Program + Cohort enrollment identity
- one active Section placement per learner enrollment + Academic Period
- Section enrollment terminal rows require ended_at
- active Section Faculty responsibility uniqueness
- schedule event end > start

Service-level tenant/role checks remain authoritative for cross-table College ownership.
