# Work packet (wave 2): edit src/db/schema/academics.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u015-class-entity.md, docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-2/class-controller.md

## G2-18-015-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:10-15 — JPA entity class mapped to table class
- vNext now: src/db/schema/academics.ts:184-198 — Drizzle sections table
- Fix: Document legacy class-to-section identity mapping; no direct table reuse

## G2-18-015-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:20-36 — class name, description, dates, capacity in entity
- vNext now: src/db/schema/academics.ts:198-204 — name/code/capacity/minSize/description
- Fix: Confirm API presentation dates and label differences

## G2-18-015-004  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:37-42 — classType default SECTION
- vNext now: src/db/schema/academics.ts:184-206 — section status ACTIVE, no class type
- Fix: Prevent grouping legacy group-backed classes as SECTION during imports

## G2-18-015-007  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:32-35 — upperLimit and lowerLimit primitive int default0
- vNext now: src/db/schema/academics.ts:200-202 — capacity/minSize nullable
- Fix: Define zero vs unset semantics and display default

## G2-18-015-010  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:28-31 — programId int mandatory, batchId nullable
- vNext now: src/db/schema/academics.ts:188-196 — cohort and academic period nonnullable FKs
- Fix: Map program/batch to cohort and program of cohort with null-batch handling

## G2-18-015-015  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:18-19 — getClassDetail by exact id OR name
- vNext now: src/db/schema/academics.ts:184-204 — UUID id, name casefold unique within cohort+period
- Fix: Preserve name-or-ID class selector via scoped search

## G2-18-015-021  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:63-67 — findByIdAndNotDeleted permits false/null soft delete
- vNext now: src/db/schema/academics.ts:204-206 — ACTIVE status default; no isDeleted
- Fix: Map null/false soft delete to ACTIVE and archived to non-active status

## G2-18-015-023  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:24-27 — dates per class may differ from term
- vNext now: src/db/schema/academics.ts:193-196 — period FK required
- Fix: Publish precise computed legacy date fields in export/import

## G2-18-015-026  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:23-26 — nullable description/start/end dates
- vNext now: src/db/schema/academics.ts:200-204 — description optional, period FK always required
- Fix: Ensure field-required labels reflect new date scope

## G2-18-015-027  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:37-42 — SECTION / GROUP_BACKED enum labels
- vNext now: src/db/schema/academics.ts:184-206 — no classType label; Active status only
- Fix: Preserve '[Elective]' display for group-backed legacy selectors

## G2-18-015-029  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:127-129 — current eligible course class sorted name,id
- vNext now: src/db/schema/academics.ts:219-227 — unique lower name by cohort/period
- Fix: Guarantee scope-specific name sort for targets

## G2-18-015-031  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:16-19 — numeric generated class PK
- vNext now: src/db/schema/academics.ts:187 — UUID random PK
- Fix: Record import collision and mapping strategy

## G2-18-015-034  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37 — BaseModel id/int and timestamps and isDeleted
- vNext now: src/db/schema/academics.ts:187-216 — UUID, tz timestamps, status enum
- Fix: Write DB migration mapping for class soft-delete/date FK

## G2-18-015-037  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:157-167 — application uniqueness in batch or program, no DB unique
- vNext now: src/db/schema/academics.ts:219-236 — DB unique only ACTIVE per cohort+period
- Fix: Document intended historical duplicate behavior vs active naming

## G2-18-020-001  [P2] GAP  facet F01  effort M
- Legacy: ClassSchedule.java:10-35 persists legacy class_schedule; class timetable consumed by ClassScheduleController/FacultyClassScheduleController/AdminClassScheduleController
- vNext now: src/db/schema/academics.ts:450-506 persists section_schedule_events; teacher calendar at src/modules/courses/faculty-schedule-service.ts:23-102 and learner schedule at src/modules/academics/learner-schedule-service.ts:143-209
- Fix: Map legacy /scheduleClass and /admin timetable deep links to new schedule events and calendar entry points, retaining section context

## G2-18-020-003  [P2] GAP  facet F02  effort M
- Legacy: ClassSchedule.java:16-35 exposes flat schedule title/start/end/class/course/faculty/room and attendance marker to UI
- vNext now: src/db/schema/academics.ts:450-506 event row and separate links, attendance_sessions for marker
- Fix: Reconstitute exact event detail row order and labels in calendar/drawer; avoid exposing raw UUIDs in cards

## G2-18-020-005  [P2] GAP  facet F03  effort S
- Legacy: ClassSchedule.java:30-31 title is optional string; legacy calendar uses it as event label
- vNext now: src/db/schema/academics.ts:465 title text NOT NULL
- Fix: Default blank legacy title consistently in new UI; ensure required title not a confusing validation regression

## G2-18-020-006  [P2] GAP  facet F03  effort M
- Legacy: ClassSchedule.java:28-29 hall ID is numeric and always represented
- vNext now: src/db/schema/academics.ts:464 hall UUID nullable, plus 473 free-text location
- Fix: Show hall name/number if hall assigned and location fallback only when absent; match old room label

## G2-18-020-010  [P2] GAP  facet F04  effort M
- Legacy: ClassSchedule.java:28-31 lectureHallId int, title String
- vNext now: src/db/schema/academics.ts:464-466 lectureHallId UUID nullable, title required, description optional
- Fix: Map hall records and title fallback, preserve display of no hall

## G2-18-020-018  [P2] GAP  facet F06  effort S
- Legacy: ClassSchedule.java:22-23 facultyId primitive int non-null zero default
- vNext now: src/db/schema/academics.ts:459-463 facultyMembershipId nullable
- Fix: If unassigned events allowed, display 'Faculty not assigned' and exclude from faculty-owned read until assigned

## G2-18-020-035  [P2] GAP  facet F12  effort M
- Legacy: ClassSchedule.java:11-15 soft-deleted rows historically ignored
- vNext now: src/db/schema/academics.ts:474-476 cancellation status instead of isDeleted
- Fix: Ensure cancelled event excluded from schedule/attendance denominator and historical audit retained appropriately

## G2-18-020-050  [P2] GAP  facet F23  effort M
- Legacy: ClassSchedule.java:20-21 transient courseSlug populated for response
- vNext now: src/db/schema/academics.ts:450-506 no slug column; linked delivery resolves course code/name
- Fix: Return courseSlug-equivalent in DTO when caller depends on slug bookmarks, not persisted

## G2-19-019-053  [P2] GAP  facet F22  effort M
- Legacy: FacultyTeachingAssignment.java:30-34 nullable batchId denormalization to expedite reads
- vNext now: src/db/schema/academics.ts:400-448 section grant plus courses.ts:156-199 active section/delivery link
- Fix: Reconstruct historical cohort even if section/cohort moves, do not treat section-level grant as course grant

## G2-13-018-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:18-19` deptId int required via primitive, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:13-14` >=1
- vNext now: `src/db/schema/academics.ts:33-37` department UUID FK restrict, `src/modules/academics/validation.ts:4` uuid
- Fix: Resolve old department numeric IDs to current UUID and reject dangling links

## G2-13-018-047  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:227-245` optional paged lookup default20, capped100
- vNext now: `src/modules/academics/program-service.ts:182-205` unpaged but department/name SQL indexed via `src/db/schema/academics.ts:56-70`; `src/components/admin/admin-program-directory.tsx:99` paginates client
- Fix: Use paginated API for institution-scale program listings; don't materialize all org records

## G2-13-018-049  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:21-22` signed Java int durationYears, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramDTO.java:15` Min1
- vNext now: `src/db/schema/academics.ts:40` durationTerms integer CHECK 1..24, `src/modules/academics/validation.ts:41` years1..10
- Fix: Use exact integer conversion and flag unsupported >10-year legacy values

## G2-13-018-050  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:49-50` uniqueness trims name and compares lower including archived
- vNext now: `src/db/schema/academics.ts:56-61` lower(name) UNIQUE among ACTIVE only
- Fix: Document unique exclusion for archived and handle restoration collisions

## G2-13-018-052  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:11` new_program table and DeptId numeric FK only logical in entity
- vNext now: `src/db/schema/academics.ts:29-76` programs with department UUID FK and uniqueness/check; `src/modules/academics/college-program-mutation-service.ts:156` activity event
- Fix: Schema migration needs old numeric-to-UUID map and explicit foreign-key integrity plan

## G2-2-029-100  [P2] GAP  facet F22  effort M
- Legacy: BatchServiceImpl.java:94-98 legacy academicYear text derived from startDate.
- vNext now: academics.ts:150-152 academicYear stored varchar16 plus date span.
- Fix: Normalize legacy `YYYY-YY` into accepted new format and retain unparseable originals for review.

## G2-2-031-020  [P2] GAP  facet F04  effort M
- Legacy: ClassDTO.java:22-23 has upperLimit and lowerLimit separate.
- vNext now: academics.ts:200-203 stores `capacity` and `minSize` but mutation model :12-27 does not expose minSize.
- Fix: Expose editable class minimum only if legacy parity required; preserve stored min_size data.

## G2-2-031-058  [P2] GAP  facet F12  effort M
- Legacy: ClassServiceImpl.java:168-180 start/end dates preserved on empty update.
- vNext now: academics.ts:193-203 stores academicPeriodId and no class startDate/endDate.
- Fix: Map historic legacy dates to period/metadata or preserve separate historical fields.

## G2-20-019-001  [P2] GAP  facet F01  effort M
- Legacy: Mapping associates facultyId,courseId,classId [L:15-22,Q:13-20]
- vNext now: New associates membershipId,sectionId,role `src/db/schema/academics.ts:400-414`
- Fix: Crosswalk faculty/course/class to membership/section and derive course

## G2-20-019-005  [P2] GAP  facet F03  effort S
- Legacy: Active integer flag defaults 1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:21-22`
- vNext now: endedAt null signifies active `src/db/schema/academics.ts:415-422`
- Fix: Map Active/Ended badge and default

## G2-20-019-007  [P2] GAP  facet F04  effort M
- Legacy: Integer faculty/course/class IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:15-20`
- vNext now: UUID membership and section IDs `src/db/schema/academics.ts:403-414`
- Fix: Preserve ID translation

## G2-20-019-012  [P2] GAP  facet F06  effort M
- Legacy: Nullable courseId/classId and active=1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:17-22`
- vNext now: Required sectionId/memberId/role `src/db/schema/academics.ts:403-414`
- Fix: Handle incomplete mapping and role default

## G2-20-019-021  [P2] GAP  facet F12  effort M
- Legacy: Active=1 historical flag only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:21-22`
- vNext now: New start/end timestamps `src/db/schema/academics.ts:415-422`
- Fix: Map old deactivation date to endedAt when known

## G2-20-019-031  [P2] GAP  facet F22  effort M
- Legacy: Old numeric faculty_course_mapping IDs and active int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:9-24`
- vNext now: New UUID section_faculty_assignments with role/end/index `src/db/schema/academics.ts:400-448`
- Fix: Write full DDL and migration crosswalk

## G2-20-019-033  [P2] GAP  facet F23  effort M
- Legacy: Legacy nullable class/course `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:17-20`
- vNext now: New section FK required `src/db/schema/academics.ts:403-408`
- Fix: Validate retired partial mappings

## G2-14-026-014  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:94-102`
- vNext now: `src/db/schema/academics.ts:56-71`
- Fix: Legacy college listing includes any underlying new_program not deleted per service, vNext ACTIVE-only and excludes archived parent departments.

## G2-5-011-069  [P2] GAP  facet F22  effort M
- Legacy: Legacy `class_schedule` stores integer class/course/faculty ids, varchar start/end, lecture hall, title, attendance_marked_at (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:10-35`)
- vNext now: vNext `section_schedule_events` uses UUID section/faculty-membership, timestamptz starts/ends, status, location and separate delivery link (`src/db/schema/academics.ts:450-505`)
- Fix: Map legacy identities and attendance session semantics to new schema; document migration deliberate divergence.
