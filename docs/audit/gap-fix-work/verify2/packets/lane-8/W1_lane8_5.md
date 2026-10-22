# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-006-032 [P1] MISSING facet F09
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old react-big-calendar default overflow popup (`StandardCalendar.js:48-49,224-253`).
- Expected fix: Implement overflow dialog with all hidden sessions.

## G2-18-006-036 [P1] GAP facet F10
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old independent GET upcoming today to +180 days (`ClassScheduleContent.jsx:122-196`).
- Expected fix: Restore separate stable upcoming source.

## G2-18-006-040 [P1] GAP facet F12
- Files: src/modules/academics/learner-schedule-service.ts
- Legacy: Old includes class schedule by class ID in date range (`ClassScheduleServiceImpl.java:1041-1069`).
- Expected fix: Confirm historical/closed period view rules and restore history when required.

## G2-18-006-041 [P1] GAP facet F12
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old metrics remain anchored to today independent of navigated grid (`ClassScheduleContent.jsx:122-228`).
- Expected fix: Keep today/upcoming metrics independent of grid filters/anchor.

## G2-18-006-046 [P1] GAP facet F13
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old noninitial fetch preserves prior events with small spinner (`CalendarEvents.js:256-262`).
- Expected fix: Add refetch spinner and stale-response handling.

## G2-18-006-059 [P1] GAP facet F19
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old fetch scopes to visible range, aborts previous, sequencing prevents stale results (`CalendarEvents.js:69-103,152-173`).
- Expected fix: Add bounded refetch with abort/sequence checks.

## G2-18-006-061 [P1] GAP facet F20
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old `AbortController`, fetchSeq protect rapid nav (`CalendarEvents.js:94-103,152-173`).
- Expected fix: Prevent stale period/data mismatch, include latest wins.

## G2-18-006-069 [P1] MISSING facet F23
- Files: src/modules/academics/learner-calendar-window-model.ts, src/components/academics/learner-class-schedule.tsx
- Legacy: Old upcoming 180-day data independent of grid (`ClassScheduleContent.jsx:122-228`).
- Expected fix: Restore independent long-range metric dataset.

## G2-19-003-011 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy table six columns Student, Roll number, Videos, Assignments, Quizzes, Progress `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`
- Expected fix: Join scoped roll number and add table column.

## G2-19-018-002 [P1] GAP facet F01
- Files: src/modules/academics/lecture-hall-service.ts, src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: Super Admin global all-hall and org-scoped listing; non-SA principal sees its college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101`
- Expected fix: Resolve broader Super Admin read parity under permission checks.

## G2-19-018-037 [P1] GAP facet F11
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy requires admin action permission per college and applies org/college SA scope. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:60-74` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:139-152`
- Expected fix: Document and implement explicit SA role/scope parity.

## G2-19-018-038 [P1] GAP facet F11
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy any authenticated non-SA principal gets own college rooms on fetch. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101`
- Expected fix: Allow safe room-read permission for scheduling consumers while restricting writes.

## G2-19-018-041 [P1] GAP facet F12
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy blocks delete whenever any schedule references room. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- Expected fix: Define expected lifecycle and all scheduling constraints.

## G2-19-001-037 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy academic-choice lookup failure warns and disables registration/edit `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:485-489`,520-523,1476-1479
- Expected fix: Keep readable roster and targeted retry for failed academic options, rather than block all register sections due to history failure.

## G2-2-006-052 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LF:43-44 request token prevents stale lesson/class lookup races, LF:199-208 stale version warning
- Expected fix: Require expectedUpdatedAt on admin edit and protect read-modify-save race with robust CAS.

## G2-2-009-038 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LF:22 isHeld excludes sessions not started, LF:192 click only held
- Expected fix: Align server to UI future-session policy, or explicitly approve pre-session corrections; prevent deep-link bypass.

## G2-2-012-011 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LC:161-177 attendanceAtRisk count, 8 rows learnerId,name,rollNumber,className,held,absent,percent
- Expected fix: Return safe roll, class, total and correct percentage semantics, including implicit present marks.

## G2-2-014-019 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LC:110-117 failures 'Invalid course id'/'Course not found' per course
- Expected fix: Continue to process authorized selected courses and return per-item failure instead of aborting whole batch.

## G2-2-017-006 [P1] MISSING facet F03
- Files: src/app/(authenticated)/college/course-progress/page.tsx
- Legacy: Two request fields learnerId and courseId; no visible button definition `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:61-66`
- Expected fix: Add explicit Start next attempt control with selected learner+course identity

## G2-2-029-016 [P1] GAP facet F04
- Files: src/modules/academics/college-cohort-mutation-model.ts
- Legacy: BatchRequestDTO.java:13-29 `batchName,programId,startDate,endDate,currentStudents,academicYear,status`.
- Expected fix: Provide migration schema for batch code/period, ignore old client count; document status default change.

## G2-2-029-059 [P1] GAP facet F11
- Files: src/modules/academics/college-batch-retire-service.ts
- Legacy: BatchController.java:308-321 scoped SA delete allows college/org scope.
- Expected fix: Supply authorized SA retire path through acting college permission, not an unscoped bypass.

## G2-2-029-065 [P1] GAP facet F12
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: BatchServiceImpl.java:312-320 previews current/target faculty assignment counts and deactivation.
- Expected fix: Report exact deactivation forecast and maintain old vs retained shared-course assignment semantics.

## G2-2-029-102 [P1] GAP facet F22
- Files: src/modules/academics/college-batch-promotion-execute.ts
- Legacy: BatchServiceImpl.java:312-320 faculty batch-semester assignment relation.
- Expected fix: Audit historic course/semester assignment transitions and shared-offering retention.

## G2-2-031-016 [P1] GAP facet F04
- Files: src/modules/academics/college-section-mutation-model.ts
- Legacy: ClassDTO.java:11-24 uses snake_case program_id,batch_id,upper_limit,lower_limit plus description/startDate/endDate.
- Expected fix: Implement field/ID translation and decisions for legacy minSize/start/end lifecycle metadata.

## G2-2-032-022 [P1] GAP facet F04
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleDTO.java:11-31 snake_case IDs and startTime/endTime strings.
- Expected fix: Define ID/time conversion for every legacy session and API consumer.

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-18-006-032: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-036: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-040: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-041: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-046: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-059: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-061: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-18-006-069: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-003-011: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-018-002: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-018-037: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-018-038: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-018-041: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-001-037: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-006-052: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-009-038: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-012-011: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-014-019: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-017-006: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-029-016: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-029-059: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-029-065: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-029-102: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-031-016: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-032-022: Not independently verified against all cited behavior; implementation and regression check remain open.
