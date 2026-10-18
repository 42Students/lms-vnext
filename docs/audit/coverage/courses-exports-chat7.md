# Courses module exports — chat-7 full symbol inventory

Snapshot 18 October 2026. Every exported symbol needs a direct behavioural test. OPEN means the test has not been independently verified, not that the symbol is unused. Curated evidence is in `courses-ledger.md`.

| Module file | Named export | Direct behavioural evidence / obligation |
|---|---|---|
| `src/modules/courses/admin-assessment-directory-model.ts` | `adminAssessmentQuerySchema` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-assessment-directory-model.ts` | `AdminAssessmentKind` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-assessment-directory-model.ts` | `adminAssessmentHref` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-assessment-directory-model.ts` | `adminAssessmentStats` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-course-workspace.ts` | `getAdminCourseWorkspace` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-learning-read-model.ts` | `adminLearningQuerySchema` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-learning-read-model.ts` | `adminLearningHref` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-learning-read-model.ts` | `adminLessonStats` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-learning-read-model.ts` | `adminProgressStats` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/admin-offering-learning-workspace.ts` | `getAdminOfferingLearningWorkspace` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-readiness.ts` | `assignmentFilesRuntimeEnabled` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-readiness.ts` | `multipartAssignmentRuntimeEnabled` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-service.ts` | `createAssignmentFileUploadGrant` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-service.ts` | `prepareAssignmentFileReceipt` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-service.ts` | `AssignmentFileMetadata` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-service.ts` | `listAssignmentFileMetadataIfReady` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-service.ts` | `createAssignmentFileReadGrant` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-validation.ts` | `MAX_ASSIGNMENT_FILE_BYTES` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-validation.ts` | `assignmentFileUploadRequestSchema` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-validation.ts` | `assignmentFileSubmissionSchema` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-file-validation.ts` | `AssignmentFileUploadRequest` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-method-policy.ts` | `SubmittedPart` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-method-policy.ts` | `allowedAssignmentSubmissionPart` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-method-policy.ts` | `allowedAssignmentMixedParts` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-scope.ts` | `loadCourseAssignmentScope` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-scope.ts` | `loadAssignmentSubmissionScope` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-service.ts` | `listCourseAssignments` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-service.ts` | `getCourseAssignmentForAdmin` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-service.ts` | `createCourseAssignment` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-service.ts` | `updateCourseAssignment` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-service.ts` | `transitionCourseAssignment` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-deadline-policy.ts` | `assertAssignmentSubmissionDeadline` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `submissionFileUploadInputSchema` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `SubmissionFileUploadInput` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `submitSubmissionFilesInputSchema` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `SubmitSubmissionFilesInput` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `toSubmissionFileDto` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `SubmissionFileDto` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `issueSubmissionFileUploadGrant` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `completeSubmissionFileUpload` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `listMySubmissionFiles` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `removeStagedSubmissionFile` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `submitAssignmentWithFiles` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `issueSubmissionFileDownloadGrant` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `listSubmissionFiles` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
| `src/modules/courses/assignment-submission-file-service.ts` | `listAssignmentSubmissionLinks` | OPEN — no direct test verified; require success, role, college IDOR, state and retry cases |
