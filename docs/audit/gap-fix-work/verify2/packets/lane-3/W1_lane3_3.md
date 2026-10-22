# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-003-049 [P1] GAP facet F10
- Files: src/modules/courses/course-service.ts
- Legacy: Delete physical or soft according backend, blocked by lessons `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-405`
- Expected fix: Reconcile history-safe archive and dependency semantics

## G2-12-003-056 [P1] GAP facet F12
- Files: src/modules/courses/course-service.ts
- Legacy: Delete blocked when linked lessons count >0 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:493-513`
- Expected fix: Audit lesson dependency guards for archive

## G2-12-003-064 [P1] MISSING facet F14
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: R2 course image presign upload and old-image deletion after update `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84,214-227`
- Expected fix: Implement storage API signed upload and cleanup

## G2-12-003-080 [P1] GAP facet F20
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy `@Version` optimistic lock protects nested metadata merge `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:44-53`
- Expected fix: Add optimistic stale form token to avoid lost edits

## G2-12-003-082 [P1] MISSING facet F21
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: External R2 presign image uploads and deleteFileFromR2 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-227`
- Expected fix: Use current signed GCP storage abstraction for image parity

## G2-12-003-085 [P1] GAP facet F22
- Files: src/modules/courses/validation.ts
- Legacy: Legacy DTO short_title required max255, course_name required max255, dept_id positive `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:14-31`
- Expected fix: Reconcile requiredness/length and identifier migration

## G2-12-003-088 [P1] GAP facet F23
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: Legacy Delete course action `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-405`
- Expected fix: Document intentional deletion-to-archive business change

## G2-17-029-017 [P1] GAP facet F04
- Files: src/modules/platform-settings/admin-editor-service.ts, src/modules/platform-settings/legacy-setting-specs.ts
- Legacy: legacy TenantSettings.js:273-365 placement overlap, duration, apply rate, stale, closing, conversion threshold/cap
- Expected fix: Provide per-key activation status and preserve low conversion decimal formatting and min/max cross-field messages

## G2-17-029-034 [P1] GAP facet F10
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: legacy TenantAdminController.java:637-762 GET/PUT/DELETE GLOBAL/ORG/COLLEGE app_setting persisted directly
- Expected fix: Validate all runtime readers consult new override table; document intentional ORG exclusion and no-effect keys

## G2-18-016-009 [P1] GAP facet F05
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: QuizServiceImpl.java:663-681 lists all manager attempts across quiz without paging
- Expected fix: Retain scalability but show quiz-wide totals/all-deliveries view and explicit 25/page control

## G2-18-016-011 [P1] GAP facet F06
- Files: src/modules/courses/quiz-validation.ts
- Legacy: QuizSubmitRequestDTO.java:13-24 requires answers list 1-200 and optional shownQuestionIds 0-200
- Expected fix: Reconcile 100 vs 200 cap and nonempty requirements; document immutable-question assumption or retain shown question fingerprint

## G2-18-016-012 [P1] GAP facet F06
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: QuizServiceImpl.java:575-589 rejects missing answers/empty options and demands exactly one answer per question
- Expected fix: Decide required-question behavior; apply client and server validation and explain skipped questions

## G2-18-016-014 [P1] GAP facet F07
- Files: src/modules/courses/quiz-validation.ts
- Legacy: QuizServiceImpl.java:564-589,643-658 duplicate/question-set 400/409 errors
- Expected fix: Restore actionable changed-quiz reload warning or verify immutable publish transition prevents issue

## G2-18-016-021 [P1] GAP facet F11
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: QuizAttemptResponseDTO.java:15-17 includes mobile and roll
- Expected fix: Record PII access decision and reveal learner contact only for explicit need-to-know roles

## G2-18-016-038 [P1] MISSING facet F23
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: QuizAttemptRepository.java:24-25 supports global learner attempt history
- Expected fix: Recreate learner-owned all-quiz attempt-history endpoint with tenant scoping

## G2-19-019-015 [P1] GAP facet F05
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: FacultyTeachingAssignmentRepository.java:83-119 exists variants for faculty+course+class and subsets
- Expected fix: Ensure lesson/quiz/assignment guards use per-delivery authorization, not broad section or course association only

## G2-19-019-017 [P1] GAP facet F06
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: FacultyTeachingAssignmentDTO.java:13-34 create requires facultyId/classId/courseId/semesterNumber, optional year, role, isActive/date
- Expected fix: Provide legacy field selection mapped to delivery and period, prevent silent semester/year mismatch

## G2-19-019-020 [P1] GAP facet F06
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: FacultyTeachingAssignmentServiceImpl.java:111-125 updates arbitrary selected faculty/course/class/batch/semester/year/role/active/dates
- Expected fix: Support reassignment with explicit history and active grant, keep old start/end dates and role changes atomic

## G2-19-019-028 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: FacultyTeachingAssignmentServiceImpl.java:53-80 one row in faculty_teaching_assignment
- Expected fix: Ensure course teacher grant creation also reflects section role only when intended; no shadow duplicate records

## G2-19-019-030 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: FacultyTeachingAssignmentServiceImpl.java:130-140 delete physically and deactivate flag
- Expected fix: Map hard-delete/admin cleanup as separate privileged action or explicitly de-scope for audit retention

## G2-19-019-055 [P1] GAP facet F23
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: FacultyTeachingAssignmentServiceImpl.java:130-140 hard-delete/deactivate and :189-196 reversible semester activation
- Expected fix: Document historical immutability as intentional; provide correction mechanism for mistaken end and cohort rollback

## G2-12-006-006 [P1] GAP facet F03
- Files: src/app/(authenticated)/learn/my-placements/applications/page.tsx
- Legacy: Cards show 44px company logo, jobType, pay, applied date, compact rounds, chip and chevron `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:124-141`
- Expected fix: Provide missing fields and header icon/layout

## G2-13-008-015 [P1] GAP facet F04
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Submission graded if graded===1 OR nonnegative numeric pointsObtained (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:88-93`)
- Expected fix: Map historical points-only grades to graded state, not falsely Pending.

## G2-13-008-039 [P1] GAP facet F09
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Modal is destroyOnClose and onCancel suppressed during grade submit (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:257-264`)
- Expected fix: Block close/escape during mutation or safely guard draft pending state.

## G2-13-008-051 [P1] GAP facet F12
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Legacy gradedCount checks graded flag OR points>=0 (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:88-93`)
- Expected fix: Backfill legacy graded state and displayed badge from points.
