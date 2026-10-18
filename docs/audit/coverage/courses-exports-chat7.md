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
| `src/modules/courses/assignment-submission-methods.ts` | `assignmentMethodSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-methods.ts` | `assignmentMethodsSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-methods.ts` | `AssignmentMethod` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-methods.ts` | `ALL_ASSIGNMENT_METHODS` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-methods.ts` | `ASSIGNMENT_METHOD_LABELS` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-methods.ts` | `normalizeAssignmentMethods` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-service.ts` | `submitCourseAssignment` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-service.ts` | `getMyAssignmentSubmission` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-service.ts` | `listAssignmentSubmissions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-service.ts` | `gradeAssignmentSubmission` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-submission-service.ts` | `publishAssignmentGrade` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `courseAssignmentIdSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `assignmentSubmissionIdSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `createCourseAssignmentInputSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `updateCourseAssignmentInputSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `assignmentTransitionSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `submitAssignmentInputSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `assignmentSubmissionTypeSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `gradeAssignmentSubmissionInputSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `publishAssignmentGradeInputSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `CreateCourseAssignmentInput` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `UpdateCourseAssignmentInput` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `SubmitAssignmentInput` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/assignment-validation.ts` | `GradeAssignmentSubmissionInput` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/bulk-visibility-failure-model.ts` | `safeCourseVisibilityFailure` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `COLLEGE_ASSESSMENT_PAGE_SIZE` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `collegeAssessmentKindSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `CollegeAssessmentKind` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `collegeAssessmentListQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `CollegeAssessmentListQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `parseCollegeAssessmentQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `collegeAssessmentScopeLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `collegeAssessmentSummary` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `collegeAssessmentHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-model.ts` | `CollegeAssessmentAggregateItem` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-aggregate-service.ts` | `listCollegeAssessmentAggregate` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-export-model.ts` | `COLLEGE_ASSESSMENT_EXPORT_CAP` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-export-model.ts` | `collegeAssessmentExportQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-export-model.ts` | `collegeAssessmentExportHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-export-model.ts` | `renderCollegeAssessmentCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assessment-export-service.ts` | `exportCollegeAssessments` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assignment-authoring-options.ts` | `getCollegeAssignmentAuthoringOptions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-assignment-submission-review-service.ts` | `getCollegeSubmissionReviewPage` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `COLLEGE_CONTENT_PAGE_SIZE` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentKindSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `CollegeContentKind` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `CollegeContentQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentTypes` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentScopeLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentDuration` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentPageCount` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-model.ts` | `collegeContentSearchParams` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-aggregate-service.ts` | `listCollegeContentAggregate` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-authoring-service.ts` | `getCollegeContentAuthoringOptions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-authoring-service.ts` | `getCollegeLessonAuthoringOptions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-csv-model.ts` | `CollegeContentExportRow` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-csv-model.ts` | `collegeContentCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-export-model.ts` | `CONTENT_METADATA_EXPORT_CAP` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-export-model.ts` | `collegeContentCsvSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-export-model.ts` | `collegeContentCsvHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-export-model.ts` | `renderCollegeLiveClassCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-export-model.ts` | `renderCollegeContentMetadataCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-export-service.ts` | `exportCollegeContentMetadata` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-content-visibility-service.ts` | `updateCollegeContentStudentVisibility` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-export-model.ts` | `COLLEGE_COURSE_EXPORT_CAP` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-export-model.ts` | `collegeCourseCatalogueExportQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-export-model.ts` | `collegeCourseCatalogueExportHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-export-model.ts` | `renderCollegeCourseCatalogueCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-model.ts` | `collegeCourseCatalogueQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-model.ts` | `CollegeCourseCatalogueQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-model.ts` | `COLLEGE_COURSE_CATALOGUE_PAGE_SIZE` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-model.ts` | `collegeCourseCatalogueHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-model.ts` | `paginateCollegeCourses` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-service.ts` | `listCollegeCourseCatalogue` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-catalogue-service.ts` | `listCollegeCourseCatalogueExport` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-contents-summary-model.ts` | `summarizeCollegeCourseContents` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-duplicate-model.ts` | `collegeCourseDuplicatePrefill` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-setup-relations-service.ts` | `listCollegeCourseSetupRelations` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-tabs-copy.ts` | `COLLEGE_COURSE_TAB_COPY` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-tabs-copy.ts` | `collegeLessonVisibilityLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-tabs-copy.ts` | `collegeAudienceLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-tabs-copy.ts` | `collegeResultsLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-tabs-copy.ts` | `collegeStatusLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-course-teachers-service.ts` | `listOfferingTeachingOverview` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-courses-copy.ts` | `COLLEGE_COURSES_COPY` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-courses-copy.ts` | `FACULTY_ASSIGNMENT_ROLE_LABELS` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-courses-copy.ts` | `facultyAssignmentRoleLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-courses-copy.ts` | `courseVisibleToStudentsLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-courses-copy.ts` | `FACULTY_ASSIGNMENT_COPY` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-faculty-picker-service.ts` | `listCollegeFacultyPicker` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-ist-datetime-model.ts` | `parseCollegeIstLocal` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
