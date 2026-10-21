# Work packet: edit src/components/courses/faculty-assignment-review.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-submissions-modal.md, docs/audit/gap2/lane-3/student-assignment.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-13-008-015  [P1] GAP  facet F04  effort M
- Legacy: Submission graded if graded===1 OR nonnegative numeric pointsObtained (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:88-93`)
- vNext now: New uses gradingStatus GRADED and gradePublished fields (`src/components/courses/faculty-assignment-review.tsx:599-608`)
- Fix: Map historical points-only grades to graded state, not falsely Pending.

## G2-13-008-039  [P1] GAP  facet F09  effort M
- Legacy: Modal is destroyOnClose and onCancel suppressed during grade submit (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:257-264`)
- vNext now: Drawer onOpenChange close does not test saving/publishing (`src/components/courses/faculty-assignment-review.tsx:551-556`)
- Fix: Block close/escape during mutation or safely guard draft pending state.

## G2-13-008-051  [P1] GAP  facet F12  effort L
- Legacy: Legacy gradedCount checks graded flag OR points>=0 (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:88-93`)
- vNext now: New status uses gradingStatus==GRADED and gradePublished (`src/components/courses/faculty-assignment-review.tsx:313-328`)
- Fix: Backfill legacy graded state and displayed badge from points.

## G2-13-008-065  [P1] GAP  facet F17  effort M
- Legacy: Old selectable list rows are buttons disabled while gradeSubmitting (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:312-330`)
- vNext now: New Select can be changed while saving unless parent state disables (`src/components/courses/faculty-assignment-review.tsx:603-609`)
- Fix: Disable row switching during grade/publish mutation.

## G2-13-008-075  [P1] GAP  facet F20  effort M
- Legacy: Legacy gradeSubmittingRef rejects double submit and prevents panel close (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:507-508`)
- vNext now: New operationInFlight prevents duplicate save, but drawer close not guarded (`src/components/courses/faculty-assignment-review.tsx:126-173`)
- Fix: Extend pending guard to Drawer onOpenChange and selection changes.

## G2-13-008-081  [P1] GAP  facet F22  effort L
- Legacy: Old lessonContentId is submission scope, assignment metadata max points (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:80-83`)
- vNext now: New courseAssignmentId + deliveryId/section separate authorization boundaries (`src/components/courses/faculty-assignment-review.tsx:471-488`)
- Fix: Map lesson content -> course assignment/section; ensure exact cohort filtering.

## G2-3-016-024  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`
- vNext now: `src/components/courses/faculty-assignment-review.tsx:177-225`, `src/modules/courses/assignment-submission-service.ts:804-893`
- Fix: Legacy bulk `publish-grades` endpoint reports published/skippedUngraded/alreadyPublished/failed; vNext only per-submission publish in cited workflow. Add bulk publish confirm/results modal with per-row failures.

## G2-4-004-064  [P1] GAP  facet F12  effort M
- Legacy: Legacy grade remains private after points saved; publish flips is_grade_published; saving privately again hides grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-84; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:80-82`)
- vNext now: vNext gradePublished bool supports save/publish, but regrading requires >=8 feedback and UI action re-hide is not obvious. (`src/components/courses/faculty-assignment-review.tsx:115-124; src/components/courses/faculty-assignment-review.tsx:177-225`)
- Fix: Provide explicit Save & hide from learner control preserving grade privacy semantics.

## G2-4-007-041  [P1] GAP  facet F12  effort M
- Legacy: Save points privately, publish explicitly to learner; hide published grade on private save. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-85;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128`)
- vNext now: vNext private save and publish, but regrading feedback mandatory. (`src/components/courses/faculty-assignment-review.tsx:100-225`)
- Fix: Expose re-hide published grade action and equivalent privacy transition.

## G2-4-010-064  [P1] GAP  facet F12  effort M
- Legacy: Legacy grade remains private after points saved; publish flips is_grade_published; saving privately again hides grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-84; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:80-82`)
- vNext now: vNext gradePublished bool supports save/publish, but regrading requires >=8 feedback and UI action re-hide is not obvious. (`src/components/courses/faculty-assignment-review.tsx:115-124; src/components/courses/faculty-assignment-review.tsx:177-225`)
- Fix: Provide explicit Save & hide from learner control preserving grade privacy semantics.

## G2-4-010-122  [P1] GAP  facet F12  effort M
- Legacy: Save grade privately must keep results hidden; Save and hide from student can conceal published grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-84;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128`)
- vNext now: New grading card private save / publish, no explicit hide-after-publish button. (`src/components/courses/faculty-assignment-review.tsx:100-225`)
- Fix: Expose re-hide published grade with accurate visibility transition.

## G2-13-008-030  [P2] GAP  facet F07  effort S
- Legacy: No score triggers warning Enter a score before submitting (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:507-511`)
- vNext now: New Enter whole-number points between 0 and {maxPoints} inline error (`src/components/courses/faculty-assignment-review.tsx:107-113`)
- Fix: Use exact empty-score warning separately from out-of-range validation.

## G2-13-008-031  [P2] GAP  facet F07  effort S
- Legacy: Missing studentAssignmentId triggers Could not resolve this submission (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:513-518`)
- vNext now: New uses UUID submissionId from response and API parse guards (`src/components/courses/faculty-assignment-review.tsx:126-135`)
- Fix: Show exact missing-id error before network call.

## G2-13-008-035  [P2] GAP  facet F08  effort S
- Legacy: Grade success toast exact Grade submitted duration 2 seconds (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:535-547`)
- vNext now: New inline Grade saved and published to the learner success alert (`src/components/courses/faculty-assignment-review.tsx:225-230`)
- Fix: Match legacy toast title or choose both if needed.

## G2-13-008-036  [P2] GAP  facet F08  effort S
- Legacy: Grade failure toast API message or Failed to submit grade (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:548-555`)
- vNext now: New inline courseApiError and uncertain-outcome warning, Refresh (`src/components/courses/faculty-assignment-review.tsx:217-230`)
- Fix: Preserve fallback phrase and actionable refresh.

## G2-13-008-037  [P2] GAP  facet F08  effort S
- Legacy: Load error triggers toast Failed to load submissions and error Alert with Retry (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:178-185`)
- vNext now: New Drawer renders error Alert but Refresh, no toast (`src/components/courses/faculty-assignment-review.tsx:589-597`)
- Fix: Use exact message and recovery button.

## G2-13-008-038  [P2] GAP  facet F08  effort M
- Legacy: When refreshing cached list fails old says Showing the last loaded submissions (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:286-294`)
- vNext now: New clears submissions before every fetch, losing cache (`src/components/courses/faculty-assignment-review.tsx:514-516`)
- Fix: Keep stale data and warning on transient refresh failure.

## G2-3-016-021  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:822-858`
- vNext now: `src/modules/courses/assignment-submission-service.ts:737-779`, `src/components/courses/faculty-assignment-review.tsx:114-116`
- Fix: Legacy points negative/max and conflict exact messages, vNext grade guards use GRADE_INVALID/NO_CHANGE/STALE and regrade feedback 8 chars. Match errors, retain stronger regrade explanation.

## G2-4-004-045  [P2] GAP  facet F08  effort M
- Legacy: Legacy saving privately toast explicitly warns learner cannot see score until published. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-85`)
- vNext now: vNext grade card has status feedback and private save, but wording differs. (`src/components/courses/faculty-assignment-review.tsx:126-170; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Display private grade visibility warning at action time.

## G2-4-010-045  [P2] GAP  facet F08  effort M
- Legacy: Legacy saving privately toast explicitly warns learner cannot see score until published. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-85`)
- vNext now: vNext grade card has status feedback and private save, but wording differs. (`src/components/courses/faculty-assignment-review.tsx:126-170; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Display private grade visibility warning at action time.
