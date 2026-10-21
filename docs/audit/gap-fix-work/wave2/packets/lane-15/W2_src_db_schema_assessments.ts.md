# Work packet (wave 2): edit src/db/schema/assessments.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/student-assignment.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-2-026-015  [P2] GAP  facet F04  effort M
- Legacy: StudentAssignment.java:19-49 persists assignmentName, names, facultyId, file DTO, html, link, points, graded flag.
- vNext now: assessments.ts:137-201 stores assignment/membership foreign keys, typed text/url, score and publication; names joined at read in `assignment-submission-service.ts:602-642`.
- Fix: Map display names and assignment snapshots; assess downstream expectations of renamed fields.

## G2-2-026-020  [P2] GAP  facet F04  effort M
- Legacy: StudentAssignment.java:44-48 `grading_date` as String plus pointsObtained long.
- vNext now: assessments.ts:167-187 uses integer pointsAwarded and timestamptz gradedAt.
- Fix: Specify datetime presentation in IST and overflow/precision conversion for legacy long grade values.

## G2-2-026-095  [P2] GAP  facet F22  effort L
- Legacy: StudentAssignment.java:17-25 uses integer lessonContentId/studentId, student names and facultyId columns.
- vNext now: assessments.ts:137-155 uses UUID assignmentId/deliveryId/membershipId with FK.
- Fix: Maintain explicit identity translation for reports/legacy imports, no integer-to-UUID casting.

## G2-2-026-098  [P2] GAP  facet F22  effort M
- Legacy: StudentAssignmentRepository.java:14-28 native filtered soft-delete reads.
- vNext now: assessments.ts:137-201 has no deletion marker on assignment_submissions; assignment status is separate.
- Fix: Define archived/deleted submission visibility and remove/restore parity under permission scope.

## G2-2-026-100  [P2] GAP  facet F22  effort M
- Legacy: AssignmentServiceImpl.java:562-599 persists assignment snapshot points and first/last name.
- vNext now: assessments.ts:137-201 stores current assignment reference and member reference; `assignment-submission-service.ts:611-640` reads live user display name.
- Fix: Clarify historical snapshot policy for renamed learners/edited max scores.

## G2-3-016-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:14-19`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:553-568`
- vNext now: `src/db/schema/assessments.ts:137-155`, `src/modules/courses/assignment-submission-service.ts:179-216`
- Fix: Legacy student_assignment rows keyed to lesson_content_id and learner numeric student_id, vNext assignment_submissions keyed assignment UUID, delivery UUID, membership UUID. Map learner assignment route and archived content references.

## G2-3-016-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:20-52`
- vNext now: `src/db/schema/assessments.ts:137-200`
- Fix: Legacy one flat entity holds learner names, assignment name, content, type, points and grading; vNext normalized submission with joins to assignment/users/files. Ensure frontend section field/order parity.

## G2-3-016-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:26-29`, `35-51`
- vNext now: `src/db/schema/assessments.ts:160-187`, `src/modules/courses/assignment-submission-service.ts:603-636`
- Fix: Legacy stored student first/last names, gradingDate string and graded 0/1; vNext derives learnerDisplayName and gradedAt timestamp/gradingStatus enum. Match full name display and empty placeholder.

## G2-3-016-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:35-45`
- vNext now: `src/db/schema/assessments.ts:156-162`, `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy gradingDate string, HTML answer, submissionLink, submissionAssets JSON list; vNext timestamp gradedAt, textContent, submissionUrl and normalized link/file children. Map rich HTML and multi-part assets.

## G2-3-016-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:47-49`
- vNext now: `src/db/schema/assessments.ts:167-170`
- Fix: Legacy points and pointsObtained long (64bit), vNext pointsAwarded int and assignment maxPoints parent; enforce max range and preserve large historic marks conversion.

## G2-3-016-018  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:245-259`
- vNext now: `src/db/schema/assessments.ts:156-162`
- Fix: Legacy written response uses rich HTML string and submission types uppercase names; vNext TEXT uses plain text and LINK URL. Preserve sanitization and rendering of rich student content.

## G2-3-016-035  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:827-843`
- vNext now: `src/db/schema/assessments.ts:247-267`, `src/modules/courses/assignment-submission-service.ts:742-769`
- Fix: Legacy grade max bound is stored StudentAssignment.points, vNext compares to parent maxPoints; if changed after submission, old grade could become invalid. Snapshot maximum points at submission.

## G2-3-016-046  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:47-49`, `73-78`
- vNext now: `src/db/schema/assessments.ts:167-170`, `243-248`
- Fix: Legacy long points and previousPoints zero defaults, vNext nullable int previousPoints and pointsAwarded. Normalize old 0 ungraded to null and avoid overflow.

## G2-3-016-051  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:55-86`
- vNext now: `src/db/schema/assessments.ts:203-269`
- Fix: Legacy @Version and semester attempt semantics vs vNext unique assignmentId/membershipId, ATTEMPT >=1 and 2-state grading check; update relational constraints for historic/regrade parity.

## G2-4-004-095  [P2] GAP  facet F22  effort M
- Legacy: Legacy assignments in `lesson_contents` (content_type, class_id, lesson_id, points bigint, deadline LocalDateTime, version JPA); submissions in `student_assignment`. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:19-70; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:15-85`)
- vNext now: VNext `course_assignments` and `assignment_submissions` with UUID identifiers, delivery scope, integer max_points and grades. (`src/db/schema/assessments.ts:26-124; src/db/schema/assessments.ts:137-203`)
- Fix: Maintain field mapping for status/scope/grade/version, inspect migration constraints and historical data behavior.

## G2-4-010-095  [P2] GAP  facet F22  effort M
- Legacy: Legacy assignments in `lesson_contents` (content_type, class_id, lesson_id, points bigint, deadline LocalDateTime, version JPA); submissions in `student_assignment`. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:19-70; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:15-85`)
- vNext now: VNext `course_assignments` and `assignment_submissions` with UUID identifiers, delivery scope, integer max_points and grades. (`src/db/schema/assessments.ts:26-124; src/db/schema/assessments.ts:137-203`)
- Fix: Maintain field mapping for status/scope/grade/version, inspect migration constraints and historical data behavior.

## G2-4-012-015  [P2] GAP  facet F04  effort M
- Legacy: Deadline comes from deadline or contentDataDTO due_date/dueDate; array/ISO createdAt supported. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:25-61`)
- vNext now: New uses dueAt timestamp and createdAt Date. (`src/db/schema/assessments.ts:41-44`; `src/components/courses/faculty-assessment-overview.tsx:59-69`)
- Fix: Specify canonical legacy date parsing/transfer with timezone.

## G2-4-012-087  [P2] GAP  facet F22  effort M
- Legacy: Legacy numeric lesson/course/class IDs, points empty=0, deadline and due_date duplication. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:445-488`)
- vNext now: New UUID lessonId/deliveryId and timestamptz dueAt, maxPoints integer. (`src/db/schema/assessments.ts:26-45`)
- Fix: Define foreign-key and due/point history migration rules.

## G2-4-012-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy title uses contentTitle or Untitled. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:133-140`)
- vNext now: New prints DB nonnull title directly. (`src/components/courses/faculty-assessment-overview.tsx:179-180`; `src/db/schema/assessments.ts:39-39`)
- Fix: Fallback to Untitled for historical blank title.
