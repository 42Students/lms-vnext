# DB02 academic progression and timetable persistence contract

**Task:** DB-005 · **Worker:** Chat 4 · **Phase:** DATABASE · **Status:** 125/125 SOURCE + TARGET DESIGN DISPOSITIONS COMPLETE; NOT RUNTIME VERIFIED  
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

### Versioned correction vs promotion

Legacy forbids direct semester correction, but normal batch update can edit `academicYear` without advancing the semester. The canonical state machine therefore has two versioned event kinds:

- **PROMOTION** — `current_term_number = old + 1`, `version = old + 1`; year/period may advance with the term.
- **CORRECTION** — term remains unchanged, `version = old + 1`, and at least academic-year start or current-period identity changes.

A version-only no-op is invalid. Backward/jump semester changes remain invalid. Both event kinds are database-journaled and immutable. Changing only the event actor or state actor metadata cannot bypass the versioned transition rules.

A same-term academic-year correction may be applied even when the already-referenced current period has since been CLOSED; changing/advancing the current period **to** a closed period is still rejected.

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

### History-safe legacy batch delete compatibility

The active legacy batch delete path hard-deletes a batch when it has no linked classes; the current vNext native lifecycle separately supports cohort archive. DB02 therefore keeps these semantics distinct.

Canonical database rule:

- `cohort_progression_state.cohort_id` uses `ON DELETE CASCADE` because the automatically-created version-0 initializer row is lifecycle-owned by a cohort and is not, by itself, academic history;
- direct `DELETE` or `TRUNCATE` of `cohort_progression_state` remains forbidden;
- `cohort_progression_events.cohort_id` remains `ON DELETE RESTRICT`, so any real promotion/correction history preserves the cohort;
- existing section, learner-program-enrollment, offering and other child FKs remain restrictive;
- therefore only a truly child-free, history-free cohort can hard-delete, matching the useful part of legacy batch-delete behavior without permitting historical erasure;
- native vNext archive remains a separate history-preserving operation and must not be silently treated as the legacy delete endpoint.

The rollback harness covers successful empty-cohort deletion plus rejection after progression history. The two-session race harness covers both delete-first and section-first orders so parent deletion cannot race a new class/section into an orphan.

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
- a `CORE` offering additionally persists `program_term_course_id -> program_term_courses.id`; that row must match the offering's exact term, course, and CORE curriculum type;
- PostgreSQL `ON DELETE RESTRICT` on the concrete curriculum-row FK protects a materialized CORE offering from concurrent curriculum deletion;
- an `ELECTIVE` offering keeps `program_term_course_id = NULL`: it remains term-bound but is not forced into the fixed curriculum list, matching the legacy elective path where the selected course can be outside `semester_course`.

The stable term link is the historical semester anchor for all delivery-bound teaching assignments. The concrete CORE curriculum-row link additionally preserves exactly which reusable curriculum mapping materialized the offering. A cohort's mutable current progression state cannot reconstruct either fact after promotion.

### Zero-credit curriculum alignment

Legacy `semester_course.credits` accepts **0..30**. Canonical `program_term_courses.credits` preserves that range, and DB02 stages `course_offerings.credits` as nullable **0..30** so a zero-credit CORE curriculum row can be materialized without a database contradiction.

The current vNext course-offering create/update validator still uses `.min(1)`. That is an **API-phase follow-up**: change it to `.min(0)` before end-to-end parity can pass. DB02 does not modify API code while DATABASE is the active global phase.

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

- `batch.current_students`: legacy response is server-managed and derived from learner → **ordinary/non-GROUP_BACKED primary class** → batch, excluding soft-deleted learner/class rows. It does **not** exclude a temporarily suspended learner.
- batch `classCount`: legacy counts non-deleted classes linked to the batch. Legacy GROUP_BACKED elective classes have `batch_id = null`, so they do not inflate the count. Because vNext sections are period-scoped, compatibility `classCount` is the number of ACTIVE sections for `cohort_progression_state.current_period_id`, not all historical cohort sections;
- some academic-year display strings when canonical start-year state is persisted.

### Exact `current_students` compatibility derivation

Counting every active `learner_program_enrollments` row in a cohort is too broad because a learner can exist in the cohort before being placed into a primary section. The canonical compatibility read is:

- `learner_program_enrollments.status = 'ACTIVE'`;
- joined to at least one `section_enrollments.status = 'ACTIVE'`;
- joined section is `sections.status = 'ACTIVE'`;
- section and learner-program enrollment resolve to the **same cohort**;
- count `DISTINCT learner_program_enrollments.id` so multi-row period/history state cannot double-count;
- elective/group-backed rosters do not contribute because they are modeled in the elective/group kernel rather than primary section enrollment.

Identity lifecycle is intentionally asymmetric:

- temporary college-membership `SUSPENDED` blocks access but **does not academically withdraw** the learner and therefore still contributes when the active section relationship remains;
- removing the `LEARNER` role or changing the membership to `ENDED` closes active section enrollment and marks the active learner-program enrollment `WITHDRAWN`;
- restoring a role/membership must not silently resurrect old academic history; reactivation/transfer is an explicit academic operation.

The canonical unregistered DB02 staging SQL and single-session acceptance harness encode these rules. They remain unexecuted PostgreSQL evidence.

Calculated redesign does not mean “unmapped.” The producer, filter semantics, tenant scope and race behavior must still be recorded in the DB02 row-level audit.

## 7. Parallel legacy structures — target design disposition complete

The source sweep and target-design pass now cover **125/125 DB02 legacy candidates**. This closes design disposition, not runtime equivalence.

Key resolved decisions:

- the older `program` and `program_structure` DDL-only tables are **retirement proposed, not final**; the current `/api/v1/program/create` endpoint delegates to `NewProgramService/new_program`;
- `new_program_structure` is a backend compatibility store with no current production-FE surface. If the compatibility API survives, name/program/status/course-list fields project from `program_terms/program_term_courses`; start/end-date semantics remain API-retirement/open because they have no safe canonical equivalent;
- `semester/semester_course` normalize to `program_terms/program_term_courses`;
- `batch` normalizes to `cohorts + cohort_progression_state/history`, with current-student count derived from canonical enrollment;
- ordinary classes normalize to sections; GROUP_BACKED elective roster semantics normalize through the elective delivery/group kernel rather than duplicate section discriminator fields;
- legacy `faculty_course_associations` remains a distinct broad pre-delivery faculty↔course pool;
- legacy `faculty_course_mapping` and richer `faculty_teaching_assignment` project through delivery-bound `course_teaching_assignments`, with stable semester identity inherited from `course_offerings.program_term_id`;
- schedule course identity projects through `section_schedule_event_courses -> course_section_deliveries -> course_offerings`;
- attendance-marked lifecycle projects to `attendance_sessions.status/marked_at`, not a duplicate schedule column.

The row-level mapping is authoritative in `docs/planning/db-pass4-columns-db02_academics_and_timetable.json`. Every target disposition remains **design-only / unregistered / not PostgreSQL verified** until the integration gate below executes.

## 8. Staged database proposal

Canonical unregistered proposal:

`scripts/sql/db02-academic-progression-and-rooms-staging.sql`

It currently stages:

- program terms and ordered curriculum mappings;
- stable `course_offerings.program_term_id`, with CORE curriculum enforcement and term-bound ELECTIVE support;
- stable tenant ownership for departments plus same-college program/course department movement;
- cohort/section/offering/progression academic-period tenant + cohort-window guards;
- reversible legacy `INACTIVE` cohort state, cohort lifecycle dates, and section description/minimum-capacity/compatibility dates;
- cohort progression state + database-owned immutable PROMOTION/CORRECTION history;
- delivery↔section and schedule-event↔delivery scope integrity;
- lecture halls, hall tenant scope, overlap exclusion constraints and hall archive-vs-booking locking;
- active FACULTY tenant guards for section and course teaching assignments;
- broad faculty-course association pool independent of deliveries;
- identity lifecycle cleanup that closes active faculty-course/teaching/section assignments and unassigns only future scheduled events while retaining past attribution;
- tenant consistency, promotion monotonic/version and program-duration shrink guards.

Consolidated integrity layers now live in the same canonical staging file:

`scripts/sql/db02-academic-progression-and-rooms-staging.sql`

The canonical file now also contains:

- academic-period, membership and lecture-hall college-owner immutability;
- cohort program/start-period and program-term identity immutability;
- section historical reparent protection;
- active LEARNER program-enrollment tenant/program/cohort checks;
- learner section-enrollment cohort/period checks;
- section parent SHARE locks against history-insert vs structural-move races;
- immutable learner-program and section-enrollment parent identity;
- LEARNER-role removal / membership-END lifecycle cleanup while SUSPENDED preserves academic state;
- progression-state identity/delete/truncate protection;
- timestamp-only future-room lifecycle protection;
- historic offering/delivery/event parent immutability after dependent teaching/course/attendance history;
- SHARE-lock serialization for offering→delivery, delivery→teaching/course-link, and event→attendance history.

The previously separate DB02 parent/enrollment, progression/schedule and historic-parent drafts were consolidated and removed. Static source tests now read the canonical stage directly.

Current direct structural reconciliation on 2026-10-11 found:

- canonical PL/pgSQL functions: **45/45 paired**;
- canonical triggers: **53 uniquely named**;
- malformed single-dollar function bodies: **0**;
- duplicate function names: **0**;
- duplicate trigger names: **0**.

Executable but still **unexecuted** PostgreSQL acceptance helpers:

- `scripts/sql/db02-postgres-acceptance-unregistered.sql` — transactional single-session negative/positive invariants with rollback;
- `scripts/sql/db02-postgres-concurrency-unregistered.sh` — two-session promotion CAS and hall archive-vs-booking races on a disposable DB.

**Chat 1 remains the only worker allowed to register numbered Drizzle migrations or the shared schema barrel.** The DB02 SQL layers are already consolidated into one unregistered canonical stage; Chat 1 must translate/review that stage into numbered Drizzle migration/schema changes. No staging file or authored harness counts as a PostgreSQL PASS.

## 9. Acceptance required before DB-005 can be DONE_VERIFIED

Design classification is complete, but DB-005 remains open until the registered implementation is proven on exact SHAs:

1. re-check current legacy BE/FE oracle heads and confirm the 125/125 target map has no new producer/consumer drift;
2. Chat 1 translates/reviews the single consolidated canonical DB02 stage into Drizzle schema/migrations with **no duplicate guards**;
3. zero-to-current migration replay succeeds on disposable PostgreSQL;
4. run `scripts/sql/db02-postgres-acceptance-unregistered.sql` and attach its exact DB/schema SHA evidence;
5. run `scripts/sql/db02-postgres-concurrency-unregistered.sh` and attach exact outputs proving one promotion CAS winner and both hall lock-order race outcomes;
6. negative tests prove department/period/membership/hall ownership cannot cross colleges and program/course department movement stays within one college;
7. cohort/section/offering/progression periods remain in the owning college and cohort window; closed/out-of-window targets fail;
8. cohort lifecycle date round-trip/order plus section description/min/max/compatibility-date behavior matches source contract;
9. program-term uniqueness, term bounds, curriculum/offering **0..30** credits, 1-based curriculum ordering and CORE-vs-ELECTIVE offering rules pass; API offering validation must also accept 0 before end-to-end parity is claimed;
10. batch response compatibility proves current-period-only `classCount`, and learner program/section enrollment tenant, role, cohort, period and immutable-history constraints pass, including concurrent section move vs history insert; exact `current_students` compatibility must exclude unsectioned learners, preserve temporarily suspended academic membership, and drop LEARNER-role-removed / ENDED-membership state;
11. faculty-course pool, section faculty and course teaching assignment tests prove ACTIVE FACULTY role, tenant scope, historical deactivation and de-role/suspension cleanup;
12. term jump/backward semester change fails; same-term year/period correction requires version+1 and a real metadata change, journals CORRECTION, term+1 journals PROMOTION, and progression history rejects direct INSERT/UPDATE/DELETE/TRUNCATE while actor-FK cleanup does not create fake events;
13. same faculty/section/hall overlap fails, adjacent `[start,end)` succeeds, cancellation releases resources and attendance/history remains;
14. compatibility API acceptance explicitly approves projection or retirement for `new_program_structure` and other retirement-proposed legacy storage.

No source review, target design, staging SQL, static regex test, authored harness, CI absence or billing issue counts as runtime verification. **Current PostgreSQL/runtime verified fields remain 0.**

## Direct SQL tenant/history stability (Chat 4)

**Canonical unregistered stage:** `scripts/sql/db02-academic-progression-and-rooms-staging.sql`  
**Static safety nets:** `tests/db02-academic-parent-tenancy-contract.test.mjs`, `tests/db02-schedule-progression-integrity-overlay.test.mjs`, `tests/db02-historic-parent-reassignment-contract.test.mjs`  
**Status:** consolidated and source/static reviewed; **not registered or PostgreSQL runtime verified**.

The canonical stage now refuses silent academic-parent rewrites once historical learner/faculty/delivery/schedule/attendance facts exist. Empty sections may still move within the canonical same-college/period-window rules; any historical transfer must become an explicit audited API workflow rather than rewriting old academic history. Offering, delivery and schedule-event history are similarly protected, with parent SHARE locks intended to serialize concurrent history creation against parent reparenting.

No PostgreSQL witness has been executed from Chat 4; CI availability is not used as a completion gate.

## Source-backed promotion readiness gate (2026-10-11, Chat 4)

**Legacy oracle:** `42Students/lms@prod-2026` `BatchServiceImpl.validatePromotion` (blob `9727013167f5c4ffd4eafa8064d45786b14c3dde`). Promotion is permitted only if (1) source cohort is `ACTIVE`, (2) target term is exactly current+1 within program duration, (3) target `program_terms` is configured/active, and (4) at least one `program_term_courses` row exists in that target term. Legacy preview reports staffing readiness, but does not require staffing to permit promotion.

The canonical DB02 term/version guard does not yet enforce (1), (3), or (4). **Staged source-scoped proposal:** `scripts/sql/db02-promotion-readiness-guard.draft.sql` with target-term and mapped-course `FOR SHARE` locks. These locks serialize changes to the target term/course with promotion; they do not guarantee the term will stay active forever after the promotion commits, consistent with later authorized admin edits. The rule does **not** apply to initial term-1 cohort creation or a same-term academic-year/period correction.

**Proof to execute after Chat 1 registration:** `scripts/sql/db02-promotion-readiness-acceptance-unregistered.sql` and `scripts/sql/db02-promotion-readiness-concurrency-unregistered.sh`. Authored static tests: `tests/db02-promotion-readiness-contract.test.mjs`. No PostgreSQL, Node runner or CI execution is claimed.

**Dependent API contracts:** all application promotions must use a versioned CAS predicate, return a stale-conflict response to the loser and deactivate outgoing teaching assignments transactionally. DB03 elective checks must use the canonical cohort current term/year and target program, never an independent academic-period-number heuristic.

