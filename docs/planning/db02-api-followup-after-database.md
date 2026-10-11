# DB02 API follow-up after DATABASE

**Owner now:** Chat 4 / DB-005 design evidence  
**Execution phase:** API only, after the global DATABASE gate closes  
**Status:** handoff matrix only — do not implement from DATABASE workers

DB02 source and target design disposition is complete for 125/125 legacy candidates, but a registered database alone will not provide end-to-end parity. The items below are current-main application gaps that must be handled in the API phase after Chat 1 integrates and PostgreSQL-verifies DB02.

## 1. Cohort / legacy batch compatibility

Database target:

- `cohorts` for batch identity/name/program/status;
- staged optional `start_date` / `end_date`;
- `cohort_progression_state.current_term_number`;
- `cohort_progression_state.current_academic_year_start`;
- `cohort_progression_state.current_period_id`;
- immutable progression history.

Current API gaps:

- `src/modules/academics/constants.ts` does not expose `INACTIVE` in `COHORT_STATUSES`.
- `cohortTransitionSchema` only supports ACTIVATE / COMPLETE / ARCHIVE; legacy INACTIVE is reversible and requires explicit deactivate/reactivate behavior.
- cohort create/update validation does not author compatibility `startDate`, `endDate`, or explicit legacy academic-year override.
- no vNext promotion API currently drives compare-and-set `current_term_number/version`, current period/year, outgoing teaching assignment closure and promotion preview semantics;
- legacy batch **delete** is distinct from native cohort archive: compatibility delete must refuse while linked classes/sections, learner-program enrollments, offerings, or progression history exist; a truly history-free/child-free cohort may hard-delete and its version-0 initializer state cascades with it; native archive remains a separate endpoint/lifecycle;
- expected-end-period updates must map the database conflict when shrinking the cohort window would exclude existing sections, offerings or current progression state.
- progression-state CASCADE is only for cohort-owned initializer cleanup during a valid empty-cohort delete; API code must never directly delete `cohort_progression_state` or progression events.
- native ARCHIVED remains terminal and is allowed only from PLANNED/COMPLETED; legacy reversible INACTIVE must use the compatibility status path and must never be implemented as archive/unarchive.

Compatibility reads:

- `currentStudents` = COUNT DISTINCT ACTIVE learner-program enrollments that have an ACTIVE section enrollment into an ACTIVE section of the same cohort. Do not count unsectioned cohort learners or elective/group-backed rosters. Temporary membership SUSPENDED remains academically counted; LEARNER-role removal or membership ENDED withdraws active academic state.
- `classCount` = ACTIVE sections for `cohort_progression_state.current_period_id`, not every historical period-scoped section in the cohort.

## 2. Program term / curriculum APIs

Database target:

- `program_terms`;
- `program_term_courses`;
- 1-based curriculum display order;
- 0..30 credits;
- CORE/ELECTIVE curriculum type;
- stable program-term identity on every course offering.

API work required:

- semester/program-term CRUD/list surfaces;
- term activation/name/total-credit behavior;
- curriculum add/remove/update/reorder;
- duplicate-course conflicts remain errors, but duplicate `displayOrder` positions are source-valid; reads must tie-break deterministically (order, then stable row ID) and the API must not assume order uniqueness;
- program duration shrink conflict mapping;
- compatibility projections for any retained `new_program_structure` API;
- curriculum remove must map the database conflict once any offering materializes the term/course pair; do not silently delete historical curriculum identity.
- curriculum CORE/ELECTIVE type may change only before materialization; once an offering references the row, map the database conflict instead of rewriting historical type identity.
- program-term delete must map the database conflict once canonical cohort progression currently occupies or has historically traversed that term; deactivation remains a separate allowed edit.
- do not add a uniqueness contract on `(programTermId, displayOrder)` during API work; legacy single-row reorder can create duplicate positions.

Do not revive JSON `course_ids` storage.

## 3. Course offering term identity and credits

Database target:

- `course_offerings.program_term_id NOT NULL`;
- `course_offerings.program_term_course_id` is a concrete `ON DELETE RESTRICT` FK for CORE offerings;
- CORE requires a non-null curriculum-row FK whose row matches the exact program term, course, and CORE type;
- ELECTIVE remains term-bound with `program_term_course_id = NULL`, so it is not forced into fixed-curriculum membership;
- `course_offerings.credits` DB range becomes nullable 0..30.

Current API gaps:

- create-course-offering input has no `programTermId` or `programTermCourseId`;
- CORE offering creation must resolve/pass the exact curriculum-row ID atomically; the server may derive it from term+course but must persist the concrete FK;
- ELECTIVE creation must keep `programTermCourseId` null and reject clients that claim a fixed curriculum row;
- offering queries do not return program-term or CORE curriculum-row identity;
- `src/modules/courses/validation.ts` currently uses `.min(1)` for offering credits; change create/update validation to `.min(0)` after DB registration;
- offering producer must pass the stable term FK and, for CORE, the concrete curriculum-row FK atomically;
- period/date-parent conflict mapping must be deterministic when a referenced academic period can no longer be moved.

## 4. Section / legacy class compatibility

Database target:

- primary class → `sections`;
- staged description;
- staged minimum capacity;
- existing capacity as legacy upper limit;
- optional compatibility start/end dates;
- GROUP_BACKED elective semantics remain in elective/group/delivery kernel rather than duplicate section type/roster columns.

Current API gaps:

- section create/update validation does not expose description, minimumCapacity, startDate or endDate;
- error mapping must preserve min >= 0, max 1..500, min <= max and ordered compatibility dates;
- controlled historical section transfer needs an explicit API workflow. The DB allows empty same-tenant/window reparenting but rejects silent reparent once learner/faculty/delivery/schedule history exists;
- legacy class **delete** compatibility must refuse while enrolled learners or non-deleted/scheduled sessions exist. Native vNext archive may remain a separate history-preserving operation; do not silently equate archive with legacy delete.

## 5. Lecture halls / schedule room identity

Database target:

- first-class `lecture_halls`;
- tenant/department/type/capacity/status;
- `section_schedule_events.lecture_hall_id`;
- section/faculty/hall overlap exclusion;
- archive-vs-booking locking.

Current API gaps:

- no lecture-hall CRUD/list service on current vNext main;
- schedule create/update validation only exposes free-text `location`, not `lectureHallId`;
- schedule read model does not return room identity/details;
- map PostgreSQL exclusion/archive conflicts to stable product errors;
- retain free-text location only for external/ad-hoc locations, not as a replacement for room FK.

## 6. Faculty-course and teaching compatibility

Database target:

- broad `faculty_course_associations` pool independent of delivery;
- delivery-bound `course_teaching_assignments`;
- section-level `section_faculty_assignments`;
- ACTIVE FACULTY + same-college guards;
- de-role/suspension lifecycle cleanup.

Current API gaps:

- no broad faculty↔course association CRUD/list/deactivate API independent of delivery;
- legacy `faculty_course_mapping` compatibility reads must project through teaching assignment → delivery → section/offering;
- richer teaching-assignment compatibility fields derive batch/cohort, course, section, program term, period/year and role from the delivery chain;
- promotion API must end outgoing-term teaching assignments through stable offering term identity.

## 7. Learner academic identity lifecycle

Database canonical stage enforces:

- active LEARNER tenant/program/cohort enforcement;
- section enrollment cohort/period enforcement;
- immutable parent identity;
- history locks against section reparent races;
- LEARNER role removal or membership END withdraws active academic state;
- temporary membership SUSPEND does not academically withdraw.

API work required:

- ensure People/account lifecycle surfaces clearly distinguish SUSPEND from END;
- do not silently reactivate withdrawn academic history when a role/membership is restored;
- explicit section move ends prior section enrollment and creates a new history row.

## 8. Schedule delivery / course linkage

Database target:

- `section_schedule_event_courses` must point to a delivery for the same section;
- delivery offering and section must share cohort and academic period;
- schedule event faculty must be active FACULTY in tenant;
- cancellation releases overlap resources while preserving history.

Current API work:

- preserve delivery identity on create/update;
- return course via delivery/offering projection;
- surface database conflict errors deterministically;
- retain past faculty attribution while future events are unassigned when faculty identity becomes inactive.

## 9. Academic period mutation compatibility

Database target now makes `academic_periods.start_date/end_date` stable after any cohort, section, offering or current progression state references that period. Unused PLANNED periods remain editable.

API work required:

- surface a stable conflict when an admin tries to move referenced period dates;
- do not work around the constraint by rewriting children in place;
- use an explicit new-period / controlled academic-structure workflow when history already exists;
- keep status transition semantics separate from date mutability: closing a period is not equivalent to changing its historical calendar boundaries.

## 10. API phase entry gate

Do not start these changes merely because this file exists. API work begins only after:

1. Chat 1 translates/reviews and registers the single consolidated canonical DB02 stage;
2. zero-to-current disposable PostgreSQL replay passes;
3. `scripts/sql/db02-postgres-acceptance-unregistered.sql` passes;
4. `scripts/sql/db02-schedule-progression-integrity-acceptance-unregistered.sql` passes;
5. `scripts/sql/db02-historic-parent-reassignment-acceptance-unregistered.sql` passes;
6. `scripts/sql/db02-postgres-concurrency-unregistered.sh` passes;
7. DB-005 has exact registered-schema evidence.

Until then, this file is a handoff matrix, not implementation authorization.
