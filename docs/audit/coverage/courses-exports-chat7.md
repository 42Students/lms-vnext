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
| `src/modules/courses/college-learner-progress-service.ts` | `listCollegeLearnerProgressChoices` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learner-progress-service.ts` | `getCollegeLearnerProgressReport` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `COLLEGE_LEARNING_PAGE_SIZE` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeLearningKindSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `CollegeLearningKind` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeLearningQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `CollegeLearningQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeLessonQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `CollegeLessonQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeProgressQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `CollegeProgressQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeLearningHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeOfferingProgressHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeOfferingLessonsHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeLearningPageCount` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `CollegeLessonRecord` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `CollegeCourseProgressRecord` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-model.ts` | `collegeProgressDescription` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-service.ts` | `listCollegeLessons` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-directory-service.ts` | `listCollegeCourseProgress` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-path-transition-policy.ts` | `canPublishPath` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-learning-path-transition-policy.ts` | `canUnpublishPath` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lesson-order-model.ts` | `lessonMoveSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lesson-order-model.ts` | `planLessonMove` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lesson-order-model.ts` | `collegeLessonBulkOrderSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lesson-order-model.ts` | `rearrangeLessonIds` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lesson-visibility-service.ts` | `updateCollegeLessonStudentVisibility` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lesson-visibility-service.ts` | `bulkCollegeLessonStudentVisibility` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lessons-export-model.ts` | `LESSONS_EXPORT_CAP` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lessons-export-model.ts` | `lessonsCsvSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lessons-export-model.ts` | `lessonsCsvHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lessons-export-model.ts` | `renderLessonsCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-lessons-export-service.ts` | `exportCollegeLessons` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-live-classes-model.ts` | `collegeIstDateSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-live-classes-model.ts` | `collegeLiveClassQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-live-classes-model.ts` | `istDayBoundary` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-live-classes-model.ts` | `collegeLiveClassHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-live-classes-model.ts` | `liveClassSearchParams` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-live-classes-model.ts` | `liveClassIstSchedule` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-lifecycle-model.ts` | `collegeOfferingLifecycleIdSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-lifecycle-model.ts` | `collegeOfferingLifecycleSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-lifecycle-model.ts` | `offeringLifecycleConfirmation` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-lifecycle-service.ts` | `CollegeOfferingLifecycleError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-lifecycle-service.ts` | `changeCollegeOfferingLifecycle` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-metadata-model.ts` | `collegeOfferingMetadataSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-metadata-model.ts` | `offeringMetadataChangeAffectsDelivery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-metadata-service.ts` | `CollegeOfferingMetadataError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-metadata-service.ts` | `updateCollegeOfferingMetadata` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-offering-section-preview-service.ts` | `listOfferingSectionPreview` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-progress-export-model.ts` | `PROGRESS_EXPORT_CAP` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-progress-export-model.ts` | `collegeProgressCsvSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-progress-export-model.ts` | `collegeProgressCsvHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-progress-export-model.ts` | `renderCollegeProgressCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-progress-export-service.ts` | `exportCollegeCourseProgress` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-quiz-authoring-options.ts` | `getCollegeQuizAuthoringOptions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-student-visibility-control-model.ts` | `collegeStudentVisibilityAction` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-options-service.ts` | `listCollegeTeachingOptions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-model.ts` | `collegeTeachingReassignSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-model.ts` | `collegeTeachingReassignIdSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-model.ts` | `teachingMembershipIsActive` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-model.ts` | `TeachingScheduleWindow` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-model.ts` | `teachingScheduleConflict` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-model.ts` | `teachingReassignPrompt` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-service.ts` | `CollegeTeachingReassignError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/college-teaching-reassign-service.ts` | `reassignCollegeTeaching` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_OFFERING_TYPES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseOfferingType` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_OFFERING_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseOfferingStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_TEACHING_ROLES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseTeachingRole` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `LEARNING_PATH_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `LearningPathStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_LESSON_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseLessonStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `LESSON_CONTENT_TYPES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `LessonContentType` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `LESSON_CONTENT_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `LessonContentStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_ASSIGNMENT_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseAssignmentStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `ASSIGNMENT_SUBMISSION_TYPES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `AssignmentSubmissionType` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `ASSIGNMENT_GRADING_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `AssignmentGradingStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `COURSE_QUIZ_STATUSES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `CourseQuizStatus` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `QUIZ_QUESTION_TYPES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/constants.ts` | `QuizQuestionType` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-readiness.ts` | `courseDisplayRuntimeEnabled` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-service.ts` | `CourseDisplayContentView` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-service.ts` | `loadCourseDisplayContentIfReady` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-service.ts` | `loadAuthorizedCourseDisplayContentsIfReady` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-service.ts` | `getAdminCourseDisplayContent` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-service.ts` | `updateCourseDisplayContent` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-validation.ts` | `updateCourseDisplayContentSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-validation.ts` | `UpdateCourseDisplayContentInput` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-display-validation.ts` | `sanitizeCourseDisplayHtml` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-service.ts` | `listCourses` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-service.ts` | `createCourse` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-service.ts` | `updateCourse` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/course-service.ts` | `archiveCourse` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/delivery-roster.ts` | `DeliveryRosterScope` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/delivery-roster.ts` | `listActiveDeliveryLearners` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/delivery-service.ts` | `listCourseSectionDeliveries` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/delivery-service.ts` | `createCourseSectionDelivery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/delivery-service.ts` | `endCourseSectionDelivery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/discussion-service.ts` | `listCourseDiscussionMessages` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/discussion-service.ts` | `createCourseDiscussionMessage` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/discussion-service.ts` | `toggleCourseDiscussionPin` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/discussion-service.ts` | `deleteCourseDiscussionMessage` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/errors.ts` | `CoursesServiceErrorCode` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/errors.ts` | `CoursesServiceError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/errors.ts` | `postgresConstraintName` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-batch-model.ts` | `facultyAssessmentVisibleToDelivery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitEditable` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitPatch` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentCanArchive` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentEditReceiptMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentArchiveReceiptMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-filter.ts` | `FacultyAssessmentFilterQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `ScoreDistributionBucket` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `buildScoreDistribution` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `latestQuizAttemptsByLearner` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `questionAccuracy` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `assignmentScoreSummary` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `scoreSummary` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyQuizReport` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyAssignmentReport` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `parseFacultyAssessmentReportRoute` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyAssignmentReportHidden` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyQuizReportHidden` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assessment-service.ts` | `getFacultyAssessmentOverview` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentParamsSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentCommandSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `FacultyAssignmentCommand` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `assignmentFieldsChanged` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentMethodsChanged` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentVersionMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentLegacyEdit` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentEditLockedBySubmissions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-service.ts` | `commandFacultyAssignment` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-authoring-service.ts` | `getFacultyAssignmentMethods` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentDraftDirty` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentDraftIssue` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `FacultyAssignmentAction` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentCommandReceipt` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentMaySubmit` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentConfirmationOnEdit` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentSwitchNeedsConfirmation` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentArchiveWarning` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentPublishIssue` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentCommandError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentCanSaveDraft` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradePublicationAllowed` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionFilterSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `FacultySubmissionFilter` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportPageQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportSearchSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `FacultySubmissionListQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `selectFacultyAssignmentSubmissions` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListPage` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `parseFacultySubmissionReviewUrl` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReviewApiHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySortSubmissionReportRows` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySearchSubmissionReportRows` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultyFilterSubmissionPublication` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportEmptyState` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionCsvScopeNote` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringLocalDateTime` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringDueInstant` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `assignmentActionAvailable` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailParamsSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactRoleLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactTabMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailHidden` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDirectoryQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contacts-filter-model.ts` | `parseFacultyContactsQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contacts-service.ts` | `listFacultyContacts` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-contacts-service.ts` | `getFacultyContactDetail` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `EditableContent` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentPatch` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `FacultyContentDraftSnapshot` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentDraftChanged` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentMayChangeOpen` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentSaveReceiptMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentMaySave` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-input-model.ts` | `facultyYouTubeLinkIssue` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-input-model.ts` | `facultyLiveClassIssue` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyMoveContentId` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyContentOrderDirty` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyResetContentOrder` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyContentOrderValid` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyContentOrderReceiptMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-preview-model.ts` | `facultyContentExternalHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-content-preview-model.ts` | `facultyYouTubeEmbed` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-card-summary-model.ts` | `countFacultyCourseCardItems` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-card-summary-service.ts` | `FacultyCourseCardSummary` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-card-summary-service.ts` | `listFacultyCourseCardSummaries` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-model.ts` | `facultyCourseHealthParamsSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-model.ts` | `FacultyCourseHealthParams` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-model.ts` | `FacultyCourseHealthCandidate` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-model.ts` | `selectFacultyCourseHealthCandidates` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-model.ts` | `facultyCourseHealthHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-model.ts` | `responseCoverage` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-health-service.ts` | `getFacultyCourseAssessmentHealth` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-home-model.ts` | `buildFacultyCourseHomeSignals` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-home-service.ts` | `getFacultyCourseHomeSignals` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `FacultyCourseListQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `FACULTY_COURSE_LIST_PAGE_SIZE` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `pageFacultyCourseList` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseWorkspaceRevokedError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-model.ts` | `parseFacultyCourseListLocation` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-list-service.ts` | `getFacultyCourseList` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabs` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-navigation.ts` | `FacultyCourseTab` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-navigation.ts` | `isFacultyCourseTab` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabFromPath` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-navigation.ts` | `validFacultyDefaultDeliveryId` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-route-errors.ts` | `hidesFacultyCourseRouteError` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-service.ts` | `listFacultyCourseDeliveries` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-course-service.ts` | `getFacultyCourseWorkspace` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistorySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-model.ts` | `FacultyDiscussionHistoryQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-model.ts` | `discussionHistoryPagination` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistoryHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-model.ts` | `discussionHistoryLabel` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-model.ts` | `parseFacultyDiscussionHistoryLocation` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-history-service.ts` | `getFacultyDiscussionHistory` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionModerationSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionTokenMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `FacultyDiscussionCountRow` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSummary` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-participation-service.ts` | `getFacultyDiscussionParticipation` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyDiscussionReplySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyReplyParentTokenMatches` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-discussion-reply-service.ts` | `postFacultyDiscussionReply` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpPageCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpCsvHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-grade-editor-model.ts` | `facultyGradeEditorState` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-grade-noop-model.ts` | `facultyGradeHasChanges` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookParamsSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `GradebookScore` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `GradebookLearner` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedGradeRows` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `FacultyGradebookRow` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookCsv` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `FacultyGradebookAssessment` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedLearnerBreakdown` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `FacultyGradebookViewQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `paginateFacultyGradebookRows` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookPrivateNotFound` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebook` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebookLearner` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-inbox-query-model.ts` | `parseFacultyInboxQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthQuerySchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `FacultyMonthQuery` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `istDateKey` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `currentIstMonth` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `shiftMonth` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `FacultyMonthCourse` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `FacultyMonthEvent` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthGrid` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthHref` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-month-service.ts` | `getFacultyIstMonth` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_QUARTER_MINUTES` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_NOTE` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstTimeParts` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstWallTime` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstQuarterHourIssue` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibilityCommandSchema` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibleToReader` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `mayEditLessonStudentVisibility` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
| `src/modules/courses/faculty-lesson-visibility-staged.ts` | `filterStagedStudentVisibleLessonContents` | OPEN — no direct test verified; check tenant, role, state, retries and privacy |
