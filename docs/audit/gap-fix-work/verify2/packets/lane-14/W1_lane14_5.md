# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-016-036 [P1] GAP facet F22
- Files: src/db/schema/quizzes.ts
- Legacy: QuizAttempt.java:18-32 legacy learner_id, status, long score
- Expected fix: Verify actual drizzle migration, overflow bounds and reenrolment semantics, documenting every field replacement

## G2-18-020-011 [P1] GAP facet F04
- Files: src/db/schema/attendance.ts
- Legacy: ClassSchedule.java:32-35 nullable attendanceMarkedAt single event marker
- Expected fix: Keep exact null=unmarked semantics; migrate read projections through attendance_sessions with status source of truth

## G2-18-020-028 [P1] GAP facet F10
- Files: src/db/schema/attendance.ts
- Legacy: ClassSchedule.java:32-35 writes attendance timestamp when bulk mark succeeds
- Expected fix: Audit transaction across attendance_sessions and attendance_records; no false MARKED when bulk write fails

## G2-19-019-002 [P1] GAP facet F01
- Files: src/db/schema/courses.ts, src/db/schema/academics.ts
- Legacy: FacultyTeachingAssignment.java:12-15 defines who teaches what in a class for semester/year
- Expected fix: Use delivery-scoped grant for actual content permissions and section grant only for section responsibilities

## G2-19-019-008 [P1] GAP facet F04
- Files: src/db/schema/courses.ts
- Legacy: FacultyTeachingAssignment.java:24-40 faculty/course/class ints, batch optional, semesterNumber required, academicYear string
- Expected fix: Document joins resolving all legacy IDs, batch/semester/year and preserving historical term after promotion

## G2-19-019-010 [P1] GAP facet F04
- Files: src/db/schema/courses.ts
- Legacy: FacultyTeachingAssignment.java:46-53 isActive true; startDate/endDate java.sql.Date nullable (date-only)
- Expected fix: Preserve date-only start/end contract vs instant timestamps in API labels and semester-bound filtering

## G2-19-019-037 [P1] GAP facet F12
- Files: src/db/schema/courses.ts, src/modules/courses/faculty-course-service.ts
- Legacy: FacultyTeachingAssignment.java:49-53 explicit startDate/endDate may encode future-dated grants
- Expected fix: Enforce future start and scheduled end cutoff in authorization or formally document non-equivalence

## G2-19-019-048 [P1] GAP facet F20
- Files: src/db/schema/courses.ts
- Legacy: FacultyTeachingAssignmentRepository.java:124-139 bulk promotion updates deactivation by class/semester or batch/semester
- Expected fix: Serialize promotion against new assignment creation/role edits with version, no surviving old-term active grants

## G2-19-019-051 [P1] GAP facet F22
- Files: src/db/schema/courses.ts
- Legacy: FacultyTeachingAssignment.java:18-53 table faculty_teaching_assignment fields id/faculty_id/course_id/class_id/batch_id/semester_number/academic_year/role/is_active/start_date/end_date + BaseModel softdelete
- Expected fix: Create explicit legacy->vNext projection map via sections/cohorts/offering program term, handle soft delete and nullable dates

## G2-19-019-052 [P1] GAP facet F22
- Files: src/db/schema/courses.ts
- Legacy: FacultyTeachingAssignmentRepository.java:83-119 subset queries depend on faculty/class/course/semester relationship
- Expected fix: Verify indexed joins support class+term, batch+term, faculty+course existence; apply migration constraints

## G2-12-018-001 [P1] GAP facet F01
- Files: src/db/schema/academic-terms.ts
- Legacy: NewProgramStructure is independent program structure/semester entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:13-18`
- Expected fix: Crosswalk legacy structure rows separate from Semester model, do not collapse duplicates without policy.

## G2-12-018-005 [P1] MISSING facet F03
- Files: src/db/schema/academic-terms.ts, src/modules/academics/semester-mutation-model.ts
- Legacy: Status ACTIVE/INACTIVE/COMPLETED using StatusType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-103`
- Expected fix: Represent COMPLETED distinctly for historical/terminal curriculum statuses.

## G2-12-018-006 [P1] GAP facet F03
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: Activate one status automatically inactivates non-completed siblings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:76-104`
- Expected fix: Implement atomic sibling exclusivity when activating legacy program structure.

## G2-12-018-009 [P1] MISSING facet F04
- Files: src/db/schema/academic-terms.ts
- Legacy: Legacy startDate/endDate each String up to255 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:23-26` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:17-20`
- Expected fix: Preserve exact structure date text or define explicit program-term schedule mapping.

## G2-12-018-011 [P1] GAP facet F04
- Files: src/db/schema/academic-terms.ts
- Legacy: Old status StatusType enum serialized string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32`
- Expected fix: Add status enum field or independent completedAt semantics.

## G2-12-018-027 [P1] GAP facet F10
- Files: src/modules/academics/semester-mutation-service.ts, src/modules/academics/college-term-mapping-service.ts
- Legacy: POST/create PUT/update DELETE/delete and GET/fetchAllSemesters+fetchActiveSemesters; PUT/updateStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-146`
- Expected fix: Expose full structure management actions and route compatibility.

## G2-12-018-032 [P1] GAP facet F11
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: Legacy updateStatus checks target belongs program before touching siblings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:76-103`
- Expected fix: Perform target check and sibling transition atomically.

## G2-12-018-035 [P1] GAP facet F12
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: Legacy statuses mutate only ACTIVE target and other noncompleted siblings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-103`
- Expected fix: Reconcile sibling inactivation with new dependency blockers.

## G2-12-018-047 [P1] GAP facet F20
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: Legacy updateStatus transaction ensures sibling status updates atomic `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:76-104`
- Expected fix: Add atomically serialized sibling update preserving completed terms.

## G2-12-018-051 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Legacy table new_program_structure int PK + program_id int, name,date strings, courseIds JSON,status, soft delete inherited `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:13-33` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- Expected fix: Plan DB schema migration/disposition for every legacy field incl dates,status and explicit structure ID.

## G2-12-018-052 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Legacy no uniqueness by program/term, multiple structures for program `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:13-33`
- Expected fix: Do not invent ordinal for multiple legacy structures without audited mapping.

## G2-12-018-054 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Old startDate/endDate VARCHAR? model String and courseIds JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:23-29`
- Expected fix: Migrate date text and ordered course ID array losslessly.

## G2-12-018-056 [P1] GAP facet F23
- Files: src/db/schema/academic-terms.ts
- Legacy: Old COMPLETED state retained across active peer switches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-99`
- Expected fix: Preserve terminal status and peer transition invariants.

## G2-12-017-007 [P1] MISSING facet F03
- Files: src/db/schema/projects.ts
- Legacy: System event badges REVIEW,BLOCKED,STATUS_UPDATE produced by quick actions `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13,30-35`
- Expected fix: Include distinct system event types in associated activity projection.

## G2-12-017-014 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: Old commentType varchar30 stores six human/system variants `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:37-38` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:13,21-35`
- Expected fix: Provide full comment-kind parity and migration aliases.

## Fast verification disposition (22 Oct 2026)

Only narrowly verified schema properties are OK. Deep migration, serialization, authorization and workflow questions remain DEFERRED; no uninspected behavior is claimed fixed.

- G2-18-016-036: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-18-020-011: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-18-020-028: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-002: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-008: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-010: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-037: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-048: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-051: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-19-019-052: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-001: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-005: OK — legacyStructureStatus explicitly permits COMPLETED and is separate from isActive
- G2-12-018-006: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-009: OK — legacyStartDate/legacyEndDate preserve original 255-character source text
- G2-12-018-011: OK — legacyStructureStatus keeps ACTIVE, INACTIVE and COMPLETED distinct
- G2-12-018-027: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-032: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-035: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-047: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-051: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-052: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-018-054: OK — legacyCourseIds JSONB preserves raw order; legacy text dates retained
- G2-12-018-056: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-017-007: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
- G2-12-017-014: DEFERRED — needs source-to-service/migration verification beyond direct schema inspection
