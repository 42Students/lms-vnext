# Work packet: edit src/db/schema/academics.ts (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u015-class-entity.md, docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-13/new-program.md

## G2-18-015-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:37-46 — SECTION and GROUP_BACKED polymorphic classType
- vNext now: src/db/schema/academics.ts:184-204 — sections only, group-backed not encoded
- Fix: Map elective backed groups to explicit offerings/group roster without synthetic section

## G2-18-015-005  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:44-46 — rosterGroupId only meaningful for GROUP_BACKED
- vNext now: src/db/schema/academics.ts:184-204 — no rosterGroupId FK
- Fix: Retain relation to live group roster for electives

## G2-18-015-008  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:24-27 — startDate/endDate SQL Date per class
- vNext now: src/db/schema/academics.ts:184-204 — period FK instead of per-class dates
- Fix: Expose class dates explicitly or calculate from academic period with known precedence

## G2-18-015-012  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:157-167 — duplicate name checked by batch or program in Java
- vNext now: src/db/schema/academics.ts:219-227 — unique lower(name) in cohort+period ACTIVE only
- Fix: Reconcile duplicate scope and inactive reuse behavior

## G2-18-015-018  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:35-42 — GROUP_BACKED roster access through active lms_group_member
- vNext now: src/db/schema/academics.ts:330-399 — sectionEnrollments scoped to sections, not group roster
- Fix: Maintain live elective group-membership audience

## G2-18-015-032  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:81-123 — course targeting union includes teaching assignments and electives
- vNext now: src/db/schema/academics.ts:330-449 — enrollment/faculty separate tables
- Fix: Keep canonical audience query across semester/group/explicit assignment

## G2-18-015-033  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:45-46 — GROUP_BACKED group id nullable
- vNext now: src/db/schema/academics.ts:184-204 — sections cannot express roster group
- Fix: Define group offering relation and referential safeguards

## G2-18-015-035  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:20-46 — name, desc, two dates, upper/lower, classType, rosterGroup
- vNext now: src/db/schema/academics.ts:198-204 — name/code/capacity/minSize/desc/status
- Fix: Publish full legacy-to-new column map including missing type/group/dates

## G2-18-015-036  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:22-26 — group-backed also in unpaged course target selection
- vNext now: src/db/schema/academics.ts:184-204,330-399 — section type and roster not represented by section
- Fix: Resolve feature design: elective group-backed audience vs academic sections

## G2-18-020-008  [P1] GAP  facet F04  effort L
- Legacy: ClassSchedule.java:16-23 classId/courseId/facultyId ints, courseSlug transient
- vNext now: src/db/schema/academics.ts:454-463 section UUID/facultyMembership UUID; course deliveries linked via sectionScheduleEventCourses
- Fix: Document full mapping (class->section, courseId->deliveryId/offering, facultyId->membership) including elective and shared events

## G2-18-020-009  [P1] GAP  facet F04  effort M
- Legacy: ClassSchedule.java:24-27 startTime/endTime Java String columns
- vNext now: src/db/schema/academics.ts:467-472 timestamptz startsAt/endsAt with DB order check
- Fix: Parse legacy timestamp/IST wall clock and display correctly; never compare strings lexicographically on ingestion

## G2-18-020-016  [P1] GAP  facet F05  effort M
- Legacy: ClassScheduleRepository.java:17-18 all scheduled count vs :31-43 held count for denominator
- vNext now: src/db/schema/academics.ts:467-476 schedules dates/status; attendanceSessions at src/db/schema/attendance.ts:63-108
- Fix: Use startsAt<=now and SCHEDULED/held policy for denominator, never include future or cancelled; per-course count too

## G2-18-020-032  [P1] GAP  facet F12  effort M
- Legacy: ClassScheduleRepository.java:31-43 held-session denominator only started events
- vNext now: src/db/schema/academics.ts:474-476 status SCHEDULED/CANCELLED and startsAt
- Fix: Exclude cancelled and future even if old count included scheduled, reconcile historical denominator methodology

## G2-18-020-034  [P1] GAP  facet F12  effort L
- Legacy: ClassScheduleRepository.java:137-165 faculty/class/room double-book guards
- vNext now: src/db/schema/academics.ts:489-505 non-unique indexes/time order, no exclusion constraint
- Fix: Add serializable clash guard or Postgres exclusion constraints and precise conflict reason

## G2-18-020-044  [P1] GAP  facet F20  effort L
- Legacy: ClassScheduleRepository.java:137-165 uses start<newEnd and end>newStart half-open overlap
- vNext now: src/db/schema/academics.ts:467-472 timestamptz and ends>starts check
- Fix: Test exact touching boundary, concurrent create race, timezone IST-midnight and DST-neutral dates

## G2-18-020-047  [P1] GAP  facet F22  effort L
- Legacy: ClassSchedule.java:10-35 table class_schedule BaseModel ID/int, class_id int, course_id int, faculty_id int, start_time/end_time strings, hall int, title, marked_at Timestamp, deleted/created/updated inherited
- vNext now: src/db/schema/academics.ts:450-506 uuid event section/facultyMembership/hall/title/description/timestamptz/location/status/created/updated
- Fix: Provide field-by-field schema map including absent course column and split attendance marker, note no data migration

## G2-18-020-048  [P1] GAP  facet F22  effort M
- Legacy: ClassScheduleRepository.java:17-18,31-43 is_deleted filter on every attendance-related count
- vNext now: src/db/schema/academics.ts:474-476 status; attendance_sessions status independent
- Fix: Map deletions to cancellation and update denominator queries, preserve legacy held denominator semantics

## G2-18-020-049  [P1] GAP  facet F22  effort L
- Legacy: ClassScheduleRepository.java:137-165 application conflict queries not DB constraints
- vNext now: src/db/schema/academics.ts:489-505 indexes for hall/section/faculty and time-order check only
- Fix: Add exclusion/race-safe conflict enforcement in migration; indexes alone do not prohibit overlaps

## G2-19-019-002  [P1] GAP  facet F01  effort M
- Legacy: FacultyTeachingAssignment.java:12-15 defines who teaches what in a class for semester/year
- vNext now: src/db/schema/courses.ts:228-284 delivery-scoped course teacher grant and src/db/schema/academics.ts:400-448 section-level teacher grant
- Fix: Use delivery-scoped grant for actual content permissions and section grant only for section responsibilities

## G2-13-018-001  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:10-22` JPA new_program with name/dept_id/duration_years
- vNext now: `src/db/schema/academics.ts:29-54` programs table with departmentId/name/code/durationTerms/status
- Fix: Map legacy new_program IDs and fields into normalized program UUIDs, including duration and generated code
