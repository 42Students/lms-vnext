# Work packet: edit src/db/schema/assessments.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md, docs/audit/gap2/lane-3/student-assignment.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-2-026-062  [P1] GAP  facet F12  effort L
- Legacy: StudentAssignment.java:60-88 supports AUTO_GRADED, MANUALLY_GRADED, PARTIALLY_GRADED, attemptNumber, previousPoints, semesterNumber.
- vNext now: assessments.ts:167-190 has NOT_GRADED/GRADED, attemptNumber and previousPoints, no semesterNumber field.
- Fix: Map grading-status distinctions and semester-reset attempt count; document deliberate omissions.

## G2-2-026-096  [P1] GAP  facet F22  effort L
- Legacy: StudentAssignment.java:29-46 stores JSON `assignment_contents`, `submission_assets`, html and link on one row.
- vNext now: assessments.ts:156-162 stores TEXT/LINK/FILE; files in separate table per `assessments.ts:239-241`.
- Fix: Complete normalized submission-parts schema/data-access parity for multiple method payloads.

## G2-2-026-097  [P1] GAP  facet F22  effort L
- Legacy: StudentAssignment.java:60-88 JPA version, status enum strings, prior points, semester number.
- vNext now: assessments.ts:167-200 version, GRADED enum, prior points, attemptNumber but no semesterNumber.
- Fix: Add semester snapshot/reset policy or document deliberate behavior change, migrate old statuses.

## G2-2-026-099  [P1] GAP  facet F22  effort L
- Legacy: StudentAssignmentRepository.java:84-104 counts attempts per semester; ignores NULL semester-number history.
- vNext now: assessments.ts:168-169 default attemptNumber 1 and unique assignment+membership at :203-208.
- Fix: Reconcile semester-limited attempts with uniqueness index before supporting retakes.

## G2-3-016-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:20-34`
- vNext now: `src/db/schema/assessments.ts:137-166`
- Fix: Legacy assignmentName, studentFirstName, studentLastName, facultyId, JSON FileDTO stored directly; vNext joins these from assignment/membership and stores files separately. Add audited historical projection preserving snapshots when source names change.

## G2-3-016-011  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:84-86`
- vNext now: `src/db/schema/assessments.ts:137-200`
- Fix: Legacy semesterNumber stamped on submission for attempt-scope reset; vNext submission row lacks semester_number and unique one assignment/member blocks multiple term attempts. Add term-at-submission field and per-term attempt policy.

## G2-3-016-016  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:260-426`
- vNext now: `src/db/schema/assessments.ts:224-241`, `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy submissionAssets supports many mixed WRITTEN_RESPONSE, repository/external LINK and FILE assets with per-asset receipt; vNext core submissionType enum requires one TEXT/LINK/FILE, extra link table supports links but primary write path inserts one mode. Finish mixed multi-part insert/read.

## G2-3-016-033  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:60-86`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:821-858`
- vNext now: `src/db/schema/assessments.ts:168-188`, `254-268`
- Fix: Legacy four grading statuses NOT_GRADED,AUTO_GRADED,MANUALLY_GRADED,PARTIALLY_GRADED and graded int; vNext enum only NOT_GRADED/GRADED. Provide typed mapping and display old distinctions when importing.

## G2-3-016-034  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:76-86`
- vNext now: `src/db/schema/assessments.ts:168-170`, `203-208`
- Fix: Legacy attemptNumber scoped by semesterNumber and can reset each semester; vNext attempt counter but no term field, unique assignment/membership. Add term scope and attempt reset.

## G2-3-016-050  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:19-88`
- vNext now: `src/db/schema/assessments.ts:137-269`, `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy student_assignment has assignment_name, lesson_content_id, student/faculty IDs, JSON assignment_contents/submission_assets, grading_date, html_content, submission_link, points max/obtained, graded flag, version, status, attempt, publication, semester. VNext normalized submission loses some direct snapshot fields; migration must account for them.

## G2-3-016-053  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:84-86`
- vNext now: `src/db/schema/assessments.ts:137-201`
- Fix: Legacy semesterNumber intentionally stamps term and reattempt semantics, missing from vNext with no recorded exclusion reason. Add field/logic.

## G2-4-004-062  [P1] GAP  facet F12  effort M
- Legacy: Legacy create allows points 0 while grading editor permits 0..max; total points stored as long. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:129-131; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:28-30`)
- vNext now: vNext create requires at least 1, DB check accepts zero to 10000. (`src/components/courses/college-assignment-create.tsx:39-59; src/db/schema/assessments.ts:123-124`)
- Fix: Resolve UI/DB inconsistency and match zero-point authoring.

## G2-4-007-058  [P1] GAP  facet F22  effort M
- Legacy: Legacy assignments stored lesson_contents with class_id, points, deadline, embedded JSON resources. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:19-70`)
- vNext now: vNext course_assignments plus course_assignment_materials links. (`src/db/schema/assessments.ts:26-124;src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Map rich legacy materials and audience scoping to normalized schema.

## G2-4-010-062  [P1] GAP  facet F12  effort M
- Legacy: Legacy create allows points 0 while grading editor permits 0..max; total points stored as long. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:129-131; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:28-30`)
- vNext now: vNext create requires at least 1, DB check accepts zero to 10000. (`src/components/courses/college-assignment-create.tsx:39-59; src/db/schema/assessments.ts:123-124`)
- Fix: Resolve UI/DB inconsistency and match zero-point authoring.

## G2-4-010-132  [P1] GAP  facet F22  effort M
- Legacy: Legacy persisted LessonContents.content_data embeds material links/files and StudentAssignment gradePublished. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:39-70;docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:46-85`)
- vNext now: New normalized course_assignments and course_assignment_materials omit resource DTO from creator. (`src/db/schema/assessments.ts:26-124;src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Complete material/grade schema mapping and connect new authoring service.

## G2-4-012-031  [P1] GAP  facet F06  effort M
- Legacy: How Learners Can Submit five choices defaults Written Response only. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:109-110`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:885-905`)
- vNext now: New JSONB default grants all five methods; create sends none. (`src/db/schema/assessments.ts:49-59`; `src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Restore checkbox controls and default WRITTEN_RESPONSE.

## G2-4-012-042  [P1] GAP  facet F08  effort L
- Legacy: Legacy creation sets active=true enabled=true; no publish confirmation. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:484-491`)
- vNext now: New status defaults DRAFT, Publish command/confirmation. (`src/db/schema/assessments.ts:46-48`; `src/components/courses/faculty-assessment-lifecycle.tsx:79-89`)
- Fix: Restore immediate visibility or owner-approve draft-first.

## G2-4-012-057  [P1] GAP  facet F12  effort L
- Legacy: Legacy new assignment active and enabled; no drafts. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:484-491`)
- vNext now: New DRAFT until PUBLISH. (`src/db/schema/assessments.ts:46-48`; `src/components/courses/faculty-assessment-lifecycle.tsx:9-19`)
- Fix: Clarify approved lifecycle and list visibility.

## G2-4-012-086  [P1] GAP  facet F22  effort L
- Legacy: Old lesson-content assignment stores active/enabled, resources, allowed methods and canonical deadline. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-488`)
- vNext now: New course_assignments table has UUID delivery, title, description, dueAt, maxPoints, status, methods. (`src/db/schema/assessments.ts:26-75`)
- Fix: Specify full field transformation, resource child records, author/audience.

## G2-4-012-088  [P1] GAP  facet F22  effort M
- Legacy: Legacy enabled=false soft-delete retains submissions. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:475-495`)
- vNext now: New ARCHIVED status filters out of overview. (`src/db/schema/assessments.ts:46-48`; `src/modules/courses/faculty-assessment-service.ts:69-82`)
- Fix: Preserve grade/submission history and access rules on archive.
