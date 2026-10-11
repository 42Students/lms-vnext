# DB02 academic progression and timetable persistence contract

**Task:** DB-005 · **Worker:** Chat 4 · **Phase:** DATABASE · **Status:** SOURCE-BACKED DESIGN, NOT RUNTIME VERIFIED  
**Legacy backend oracle:** `42Students/lms@prod-2026` pinned at `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@prod-2026` pinned at `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**vNext snapshot reviewed:** `drizzle/meta/0040_snapshot.json`

This contract records the **minimum persisted semantics** DB02 must expose before DB02 or dependent DB03 elective eligibility can be certified. It does not require legacy table names and it does not authorize Chat 4 to register numbered Drizzle migrations.

## 1. Canonical cohort progression state

Legacy `BatchServiceImpl` proves that a batch/cohort has mutable persisted academic progression state, not merely a derivable display value:

- new batches start at semester 1;
- `academicYear` is persisted and normalized as `YYYY-YY`, or calculated from the batch start date using the July boundary;
- promotion advances **exactly one semester** at a time;
- promotion is compare-and-set on the previous semester to reject concurrent stale promotions;
- program duration bounds the maximum semester as `durationYears * 2`;
- promotion checks that the destination program semester exists, is active, and has mapped curriculum;
- prior-semester teaching assignments are deactivated in the same transaction as promotion;
- direct semester correction is intentionally disabled because the legacy product has no reliable history-backed reversal;
- the academic year normally advances after an even semester, but the API may accept an explicit normalized year.

Therefore `cohorts.start_period_id`, `cohorts.expected_end_period_id`, active section enrollment and college-scoped `academic_periods` do **not** by themselves preserve the legacy contract.

### Required vNext canonical state

Use one persisted, college-safe source of truth for each cohort:

- `current_term_number` — 1-based, bounded by `programs.duration_terms`;
- `current_academic_year_start` — nullable integer start year (e.g. `2024` represents legacy `2024-25`);
- optional `current_period_id` — references a concrete college academic period when the college models terms as dated periods;
- optimistic `version` — every promotion must compare the caller's expected version and increment exactly once;
- immutable progression history rows recording old/new term, year, optional period, actor, reason and timestamp.

A college academic period is a **calendar object**. A program term is a **curriculum identity**. Do not use a period UUID as a substitute for a program-specific semester number.

The progression journal is database-owned audit history. Application roles must not directly insert, update, delete **or truncate** event rows. Identity cleanup may null an event's actor FK without altering any other event field; that FK cleanup must not trigger the promotion state machine or create a synthetic progression event.

### Cohort lifecycle dates remain distinct from calendar periods

Legacy batch `startDate` / `endDate` are nullable and independently editable. The production admin API can clear or change them without changing a college-wide academic period. Therefore `cohorts.start_period_id` / `expected_end_period_id` are not exact replacements.

DB02 stages nullable `cohorts.start_date` and `cohorts.end_date` with `end_date >= start_date` when both are present. Period references continue to bound academic scheduling; the dates preserve the existing batch CRUD contract.

Legacy batch status is also a persisted editable contract: `ACTIVE | INACTIVE | COMPLETED`. `INACTIVE` is reversible through ordinary admin update, so vNext `ARCHIVED` cannot stand in for it. DB02 stages `INACTIVE` as an additional cohort status while retaining vNext's `PLANNED` and `ARCHIVED` states for richer lifecycle workflows. Compatibility producers must preserve re-activation from `INACTIVE`.

### Class/section CRUD state

Legacy class CRUD still persists:

- `description`;
- `lower_limit` with minimum 0;
- `upper_limit` with range 1..500 and `lower_limit <= upper_limit`.

DB02 maps `upper_limit -> sections.capacity` and stages `sections.minimum_capacity` plus `sections.description`. The old class `start_date/end_date` fields are compatibility metadata for older callers and are not a second source of academic scheduling truth. Because the current backend still accepts and preserves explicit values, DB02 stages nullable `sections.start_date/end_date` solely for compatibility round-trip; academic periods and schedule events remain authoritative for teaching-calendar behavior.

## 2. Program-specific semester / curriculum identity

Legacy `SemesterServiceImpl`, `SemesterRepository` and `SemesterCourseRepository` prove these active persisted semantics:

- semester identity is unique by `(program_id, semester_number)`;
- semester name is required and persisted;
- active/inactive is persisted;
- total credits is persisted;
- semester-course mapping is persisted and ordered;
- each mapping carries mandatory/elective, credits and display order;
- a semester with course mappings cannot be deleted;
- promotion queries the exact program+semester and refuses promotion when it is missing/inactive or has no mapped courses.

The current vNext `academic_periods` table is college-scoped and therefore cannot replace this program-specific identity. `course_offerings` captures delivery configuration for cohort+period, not the full reusable program-term curriculum contract.

### Required vNext structures

A normalized design should provide:

- `program_terms(program_id, term_number, name, is_active, total_credits, ...)` with unique `(program_id, term_number)`;
- `program_term_courses(program_term_id, course_id, type, credits, display_order, ...)` with unique term+course membership and deterministic ordering.

Delivery tables may continue to materialize offerings for a particular cohort/period, but DB03 and promotion logic must read the canonical program-term identity rather than infer term number from a period code.

### Stable term identity on course offerings

Every `course_offerings` row must retain a stable `program_term_id` in addition to `academic_period_id`:

- `academic_period_id` answers **when** the delivery happens on the college calendar;
- `program_term_id` answers **which program curriculum term** the delivery belongs to;
- the term's program must equal the cohort's program;
- course, cohort and period must remain in one college;
- a `CORE` offering must have a matching `program_term_courses` row;
- an `ELECTIVE` offering remains term-bound but is not forced to have a fixed curriculum row, matching the legacy elective path where the selected course can be outside the fixed semester-course list.

This link is also the historical semester anchor for delivery-bound teaching assignments. A cohort's mutable current progression state cannot reconstruct an old assignment's semester after promotion.

## 3. DB03 elective dependency

Legacy `ElectiveService.classEligibilityError` requires all of the following for a learner's primary section:

1. program matches the elective slot program;
2. the section is attached to a batch;
3. `batch.currentSemester == slot.semesterNumber`;
4. when both academic years are present, their **start years** match.

This makes DB02's cohort progression state an explicit dependency of DB03. DB03 must not invent a second semester/year source, and simple equality between section/course `academic_period_id` values is not equivalent to the legacy check.

The canonical read contract for DB03 should expose, for the learner's active primary cohort:

`{ programId, currentTermNumber, currentAcademicYearStart, currentPeriodId? }`

and it must be tenant scoped through program → department → college.

## 4. Lecture halls are persisted locked resources

Legacy `LectureHall`, `LectureHallRepository` and `ClassScheduleServiceImpl` prove that a lecture hall is not just display text:

- persisted fields include college, optional/required department relation, name, capacity, description and room type;
- list/query is college and department scoped;
- name uniqueness is enforced case-insensitively at application level;
- schedule creation/update validates same-college class/faculty/hall/course references;
- the lecture-hall row is locked during schedule writes;
- overlapping schedules are rejected for the same faculty, class and hall;
- schedule deletion is soft/history-preserving because attendance remains linked.

The current vNext `section_schedule_events.location text` cannot enforce hall FK, hall capacity/type, tenant scope or double-booking.

### Required vNext behavior

Persist `lecture_halls` as a tenant-owned resource and optionally attach `section_schedule_events.lecture_hall_id`. Keep `location` for free-form/off-campus locations. Database constraints/triggers must prevent cross-college hall linkage. The final registered migration should use a PostgreSQL-safe overlap invariant (e.g. exclusion constraints with reviewed `btree_gist` support) or an equally strong serializable/locking design.

Hall archival must also serialize with booking creation: an active booking validates and locks the hall row, while an ACTIVE→ARCHIVED transition must reject any active/future `SCHEDULED` event. This prevents a race where both transactions independently observe a valid state and commit an archived hall with a future booking.

## 5. Faculty teaching lifecycle

The pinned legacy source exposes **three different observable contracts**. They must not be collapsed merely because all three contain faculty/course IDs.

### 5.1 Broad faculty-course association

`faculty_course_associations` is an admin-managed **course pool** independent of any class or delivery:

- an association can be created before the faculty member is assigned to a class;
- callers list active courses for a faculty member;
- callers list active faculty candidates for a course;
- deactivation keeps the association identity but removes it from active lookup.

`course_teaching_assignments` cannot represent this contract because it requires an existing delivery. DB02 therefore stages a normalized `faculty_course_associations(membership_id, course_id, started_at, ended_at, ...)` relation with one active pair and a same-college guard. The application producer must require an active FACULTY membership; the database guard owns tenant consistency.

### 5.2 Class-specific faculty-course mapping

Legacy `faculty_course_mapping` binds `faculty + course + class` and uses `active` for create/reactivate/deactivate plus faculty metrics. This is a compatibility shape, not a reason to add a second vNext teaching table.

Its canonical vNext projection is:

`course_teaching_assignments.membership_id -> course_section_deliveries -> { section_id, course_offerings.course_id }`

with `ended_at IS NULL` representing active. Compatibility APIs may project this shape while API parity is maintained. No legacy numeric mapping ID needs preservation because vNext is greenfield.

### 5.3 Rich teaching assignment

Legacy `faculty_teaching_assignment` adds batch/cohort, semester number, academic year, role, start/end and active lifecycle. The canonical vNext mapping is:

- faculty → `course_teaching_assignments.membership_id`;
- class → delivery `section_id`;
- course → delivery's offering `course_id`;
- batch → offering `cohort_id`;
- semester → offering `program_term_id -> program_terms.term_number`;
- calendar/year context → offering `academic_period_id` plus immutable cohort progression history;
- role → `course_teaching_assignments.role`;
- active/start/end → `ended_at IS NULL`, `started_at`, `ended_at`.

Promotion must end outgoing-term assignments through this delivery/offering chain. The delivery's immutable term link is essential: reading the cohort's **current** term after promotion is not historical equivalence.

### 5.4 Section-only faculty assignment

`section_faculty_assignments` remains useful for section-level responsibilities that are not course-specific. It does not replace either the broad faculty-course pool or a course teaching assignment.

## 6. Derived values vs persisted values

The following legacy values may be redesigned as calculated values **only with exact documented filters and tests**:

- `batch.current_students`: legacy response is server-managed and derived from primary class→batch learner membership;
- class counts / usage counts;
- some academic-year display strings when canonical start-year state is persisted.

Calculated redesign does not mean “unmapped.” The producer, filter semantics, tenant scope and race behavior must still be recorded in the DB02 row-level audit.

## 7. Parallel legacy structures still requiring disposition

The second source sweep found legacy persistence that must **not** be retired merely because newer tables exist:

- `new_program_structure` is still read by `NewProgramServiceImpl.fetchProgramDetails`, including name, start/end dates, status and ordered/listed course IDs. Its exact producer path and relationship to the newer `semester` / `semester_course` model still require classification.
- `faculty_course_mapping` is still queried for active faculty→course/class mappings, class instructor lookup and faculty metrics.
- `faculty_course_associations` is still queried for active faculty↔course relationships and supports deactivation.
- `faculty_teaching_assignment` is independently active and carries class, batch, semester, academic-year, role and start/end lifecycle. It cannot be collapsed into the two older mapping tables without a deliberate compatibility decision.

These may ultimately be normalized into `course_teaching_assignments`, deliveries and program-term curriculum, but the active repository/read contracts must first be mapped to equivalent vNext producers/consumers. Until then their DB02 status is **ACTIVE/READ-PATH CONFIRMED, PRODUCER OR RETIREMENT DISPOSITION OPEN**.

## 8. Staged database proposal

`scripts/sql/db02-academic-progression-and-rooms-staging.sql` contains an **unregistered** PostgreSQL proposal for:

- program terms and ordered curriculum mappings;
- stable program-term identity on every course offering, with CORE curriculum enforcement;
- reversible legacy `INACTIVE` cohort state, cohort lifecycle dates, and section description/minimum-capacity parity;
- cohort progression state + immutable history;
- lecture halls and schedule hall linkage;
- broad faculty-course association pool independent of deliveries;
- tenant consistency guards;
- progression monotonic/version checks;
- schedule overlap constraints.

**Chat 1 remains the only worker allowed to register numbered Drizzle migrations or the shared schema barrel.** The staging SQL must be reviewed against current main before registration.

## 9. Acceptance required before DB-005 can be DONE_VERIFIED

DB-005 remains open until all of these are executed and attached to exact SHAs:

1. classify all 125 source candidates as mapped, calculated, redesigned or retired using producer/consumer evidence;
2. register reviewed schema through Chat 1;
3. zero-to-current migration replay on disposable PostgreSQL;
4. negative tests for cross-college program/period/hall/faculty-course links;
5. cohort lifecycle date round-trip/order tests plus class description/minimum/maximum validation;
6. offering-term tests proving program mismatch rejection, CORE curriculum membership enforcement and term-bound ELECTIVE support;
7. broad faculty-course association tests proving pre-delivery association, active-pair uniqueness and historical deactivation;
8. concurrent cohort promotion test proving one winner for the same expected version;
9. term jump/backward rejection plus immutable-journal tests for direct INSERT/UPDATE/DELETE/TRUNCATE and actor-FK cleanup without fake promotion history;
10. program-term uniqueness and ordered curriculum tests;
11. same faculty/section/hall overlap rejection and adjacent non-overlap acceptance, including a concurrent hall-archive vs future-booking race with exactly one valid winner;
12. schedule cancellation/soft-history behavior with attendance retained;
13. re-check current legacy BE/FE heads before final certification.

No source review, staging SQL or authored test alone counts as PASS.

## Direct SQL tenant stability extension (Chat 4)

**Isolated unregistered draft:** `scripts/sql/db02-academic-parent-enrollment-tenant-guards.draft.sql`  
**Source contract test file:** `tests/db02-academic-parent-tenancy-contract.test.mjs`  
**Status:** reviewed at source level; **not registered, executed against PostgreSQL, or runtime-verified**.

The original `0002` academical enrollment tables have independent FKs to membership, program, cohort, section and academic period, but independent UUID references do not by themselves prove these rows share a college, cohort or period.

The additional draft preserves tenant identity and referential semantics:

- college ownership cannot be changed in place for departments, academic periods, memberships or lecture halls;
- programs and courses can change departments **within** the original college; cross-college department switches are rejected;
- a cohort's program and starting calendar period, and a program term's program/term ordinal, remain immutable academic identities;
- a cohort's calendar period and a section's calendar period must belong to their program/cohort college;
- learner program enrollment must match an **ACTIVE LEARNER membership**, matching college and matching cohort program;
- section enrollment must use that learner's cohort and the actual section period;
- section faculty assignment requires an **ACTIVE FACULTY membership** in the section's college;
- enrollment and section-enrollment identity cannot be retroactively replaced by `UPDATE`: create a historical transition row instead;
- an empty section may be moved within its college, but one with any learner, faculty, delivery or schedule history needs an explicit controlled-transfer workflow;
- inserts of section enrollment, faculty assignment, delivery or schedule history take a `FOR SHARE` lock on the section so concurrent structural `NO KEY UPDATE` cannot silently race past the history checks.

**Source parity tension:** legacy `ClassServiceImpl.updateClass` permits batch/program reassignment, whereas `BatchServiceImpl.updateBatch` rejects changing an already-created batch's program. The DB draft protects historical section references, but does not yet implement the equivalent *controlled* legacy class transfer; this remains a required API-wave compatibility item. The draft must be reconciled with DB01/DB03 guards to avoid duplicate or conflicting triggers.

The direct SQL replay gate must cover valid same-college reassignment and invalid cross-college reassignment; concurrent history insert versus section move; active/inactive membership and LEARNER/FACULTY role rejection; and valid cohort/period learner transfers with immutable previous history. **No such PostgreSQL witnesses have been executed here.**
