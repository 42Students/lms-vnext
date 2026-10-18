# chat-4 export-by-export coverage worklist

Source-scan inventory of the assigned module directories; **PENDING is not verified**. These names are scanned using declarations, not a TypeScript compiler, so re-exported or ambiguous declarations require manual inspection. No tests or app code executed. Snapshot: 2026-10-19.

| Source file | Statically matched public symbols | Per-export test/PG status |
| --- | --- | --- |
| `src/modules/colleges/admin-branding-logo-service.ts` | `CollegeLogoError`, `validateCollegeLogoPng`, `uploadCollegeLogo`, `getPublicCollegeLogo`, `removeCollegeLogo` | PENDING |
| `src/modules/colleges/admin-branding-preview-model.ts` | `LMS_DEFAULT_BRAND_PRIMARY`, `LMS_DEFAULT_BRAND_SECONDARY`, `StoredCollegeBranding`, `AdminCollegeBrandingInput`, `describeAdminCollegeBranding`, `AdminCollegeBrandingPreview` | PENDING |
| `src/modules/colleges/admin-branding-preview-service.ts` | `getSuperAdminCollegeBrandingPreview` | PENDING |
| `src/modules/colleges/admin-branding-request-body.ts` | `CollegeBrandingBodyError`, `readCollegeBrandingBody` | PENDING |
| `src/modules/colleges/admin-college-at-glance-model.ts` | `CollegeAtGlanceCounts`, `COLLEGE_GLANCE_REFRESH_ERROR`, `COLLEGE_GLANCE_LOAD_ERROR`, `isCollegeAtGlanceCounts`, `displayedGlanceNumber` | PENDING |
| `src/modules/colleges/admin-college-at-glance-service.ts` | `getSuperAdminCollegeAtGlance` | PENDING |
| `src/modules/colleges/admin-directory-access-model.ts` | `canManageCollegeDirectoryRow` | PENDING |
| `src/modules/colleges/admin-directory-query-model.ts` | `adminDirectoryQuerySchema`, `parseAdminDirectorySearchParams` | PENDING |
| `src/modules/colleges/admin-history-export-model.ts` | `AdminHistoryExportRow`, `MAX_ADMIN_HISTORY_EXPORT_ROWS`, `collegeAdminHistoryCsv` | PENDING |
| `src/modules/colleges/admin-readiness-export-model.ts` | `buildSuperAdminReadinessCsv` | PENDING |
| `src/modules/colleges/admin-readiness-filter.ts` | `superAdminReadinessQuerySchema`, `SuperAdminReadinessQuery`, `visibleReadinessChecks`, `parseSuperAdminReadinessParams` | PENDING |
| `src/modules/colleges/admin-session-query-model.ts` | `adminSessionHistoryPageSchema`, `parseAdminSessionHistoryPage` | PENDING |
| `src/modules/colleges/admin-session-service.ts` | `listCollegeAdminSessionTargets`, `listCollegeAdminSessions`, `revokeCollegeAdminSessions`, `listCollegeAdminHistory` | PENDING |
| `src/modules/colleges/admin-signin-policy-service.ts` | `readAdminCollegeSignInPolicy`, `CollegeSignInPolicyError`, `saveAdminCollegeSignInPolicy` | PENDING |
| `src/modules/colleges/admin-signin-request-body.ts` | `AdminSignInRequestError`, `readAdminSignInRequestBody` | PENDING |
| `src/modules/colleges/admin-tenant-create-handoff.ts` | `tenantCreationScopeRequest` | PENDING |
| `src/modules/colleges/admin-tenant-export-model.ts` | `TENANT_DIRECTORY_CSV_CAP`, `tenantDirectoryExportQuerySchema`, `TenantDirectoryExportRow`, `tenantDirectoryCsvCell`, `buildTenantDirectoryCsv`, `tenantDirectoryExportHref`, `readTenantDirectoryExportParams` | PENDING |
| `src/modules/colleges/admin-tenant-lifecycle-model.ts` | `tenantLifecycleQuerySchema`, `parseTenantLifecycleSearchParams`, `TENANT_LIFECYCLE_PAGE_SIZE`, `tenantLifecyclePaging`, `tenantLifecycleHref`, `tenantSetupLinksAvailable` | PENDING |
| `src/modules/colleges/admin-tenant-lifecycle-service.ts` | `getSuperAdminTenantLifecycleDirectory`, `getSuperAdminTenantLifecycleDetail`, `exportSuperAdminTenantDirectory` | PENDING |
| `src/modules/colleges/admin-tenant-organization-step.ts` | `createdOrganizationStepHref`, `preferredNewTenantOrganization` | PENDING |
| `src/modules/colleges/admin-tenant-setup-journey.ts` | `superAdminTenantSetupSteps` | PENDING |
| `src/modules/colleges/admin-tenant-setup-model.ts` | `tenantSetupQuerySchema`, `tenantSetupPresentation` | PENDING |
| `src/modules/colleges/admin-tenant-setup-status.ts` | `summarizeTenantSetupReadiness` | PENDING |
| `src/modules/colleges/admin-today-attention-model.ts` | `istDayBounds`, `SuperAdminTodayMetrics`, `SUPER_ADMIN_TODAY_LABELS` | PENDING |
| `src/modules/colleges/admin-today-attention-service.ts` | `getSuperAdminTodayBoard` | PENDING |
| `src/modules/colleges/archive-policy.ts` | `CollegeUsage`, `CollegeHasDependenciesError`, `hasCollegeDependencies`, `assertCollegeCanArchive` | PENDING |
| `src/modules/colleges/branding-service.ts` | `CollegeBrandingView`, `EMPTY_BRANDING`, `CollegeBrandingNotFoundError`, `CollegeBrandingVersionError`, `getPublicCollegeBranding`, `getCollegeBranding`, `saveCollegeBranding` | PENDING |
| `src/modules/colleges/branding.ts` | `collegeBrandingInputSchema`, `CollegeBrandingInput`, `collegeBrandingSaveSchema`, `sameCollegeBranding`, `hexToRgb`, `rgbToHex`, `contrastRatio`, `BrandTokens`, `deriveBrandTokens`, `brandStyleVariables` | PENDING |
| `src/modules/colleges/bulk-import-confirmation-model.ts` | `canApplyConfirmedCollegeBulkImport` | PENDING |
| `src/modules/colleges/bulk-import-feedback-model.ts` | `CollegeImportResult`, `collegeBulkImportToast` | PENDING |
| `src/modules/colleges/bulk-import-model.ts` | `MAX_COLLEGE_IMPORT_ROWS`, `collegeImportInputSchema`, `CollegeImportRow`, `parseCollegeImportCsv` | PENDING |
| `src/modules/colleges/bulk-import-service.ts` | `bulkImportColleges` | PENDING |
| `src/modules/colleges/college-contact-profile-model.ts` | `collegeContactProfileInputSchema`, `CollegeContactProfileInput`, `collegeContactProfileChanged` | PENDING |
| `src/modules/colleges/college-contact-profile-service.ts` | `CollegeContactProfileError`, `getOwnCollegeContactProfile`, `updateOwnCollegeContactProfile` | PENDING |
| `src/modules/colleges/college-logo-request-body.ts` | `CollegeLogoRequestError`, `readCollegeLogoForm` | PENDING |
| `src/modules/colleges/logo-png-chunks.ts` | `verifyCollegeLogoPngChunks` | PENDING |
| `src/modules/colleges/public-branding-model.ts` | `sanitizePublicCollegeBranding` | PENDING |
| `src/modules/colleges/public-signin-policy-service.ts` | `effectiveCollegeSignInMethod`, `effectiveCollegeSignInCapabilities` | PENDING |
| `src/modules/colleges/readiness-model.ts` | `CollegeReadinessStatus`, `CollegeReadinessOverall`, `CollegeReadinessCheckId`, `CollegeReadinessFacts`, `CollegeReadinessCheck`, `CollegeReadinessEvaluation`, `evaluateCollegeReadiness` | PENDING |
| `src/modules/colleges/readiness-remediation-links.ts` | `readinessRemediationLink` | PENDING |
| `src/modules/colleges/readiness-service.ts` | `getSuperAdminCollegeReadiness` | PENDING |
| `src/modules/colleges/service.ts` | `CollegeServiceErrorCode`, `CollegeServiceError`, `listColleges`, `resolveCollegeUsage`, `createCollege`, `updateCollege`, `archiveCollege`, `restoreCollege` | PENDING |
| `src/modules/colleges/signin-methods-model.ts` | `collegeSignInMethodSchema`, `updateCollegeSignInSchema`, `signInCapabilities` | PENDING |
| `src/modules/colleges/signin-policy-read-model.ts` | `signInPolicyReadState` | PENDING |
| `src/modules/colleges/staged-schema.ts` | `collegeSignInPoliciesStaged` | PENDING |
| `src/modules/colleges/super-admin-directory-service.ts` | `getAdminTenantDirectory`, `getAdminTenantDetail` | PENDING |
| `src/modules/colleges/super-admin-tenant-model.ts` | `tenantReadQuerySchema`, `tenantPage` | PENDING |
| `src/modules/colleges/validation.ts` | `collegeIdSchema`, `collegeOrganizationIdSchema`, `collegeNameSchema`, `collegeCodeSchema`, `createCollegeInputSchema`, `updateCollegeInputSchema`, `CreateCollegeInput`, `UpdateCollegeInput` | PENDING |

## Academic modules — source inventory

| Source file | Statically matched public symbols | Per-export test/PG status |
| --- | --- | --- |
| `src/modules/academics/a2-scope.ts` | `loadAcademicsMembership`, `requireActiveAcademicMembership`, `requireAcademicRole`, `loadLearnerEnrollmentScope`, `loadSectionEnrollmentScope`, `loadFacultyAssignmentScope`, `loadScheduleEventScope` | PENDING |
| `src/modules/academics/academic-setup-error-copy.ts` | `ACADEMIC_SETUP_GENERIC_ERROR`, `isMachineErrorCode`, `academicSetupErrorMessage` | PENDING |
| `src/modules/academics/admin-batch-promotion-read-model.ts` | `adminPromotionQuerySchema`, `AdminPromotionQuery`, `readAdminPromotionParams`, `summarizeAdminPromotion` | PENDING |
| `src/modules/academics/cohort-service.ts` | `listCohorts`, `createCohort`, `updateCohort`, `transitionCohort` | PENDING |
| `src/modules/academics/college-academic-directory-model.ts` | `COLLEGE_ACADEMIC_PAGE_SIZE`, `collegeSemesterDirectoryBaseSchema`, `withCollegeSemesterCreditCheck`, `collegeSemesterDirectorySchema`, `collegeBatchDirectoryBaseSchema`, `withCollegeBatchFilterCheck`, `collegeBatchDirectorySchema`, `CollegeSemesterDirectoryQuery`, `CollegeBatchDirectoryQuery`, `CollegeDirectoryKind`, `academicDirectoryHref`, `academicDirectoryPageCount`, `academicDirectorySearchParams`, `batchProgressLabel` | PENDING |
| `src/modules/academics/college-academic-directory-service.ts` | `listCollegeSemesters`, `listCollegeBatches` | PENDING |
| `src/modules/academics/college-academic-export-model.ts` | `ACADEMIC_EXPORT_CAP`, `semesterCsvSchema`, `batchCsvSchema`, `AcademicCsvKind`, `academicExportHref`, `exportParams`, `renderBatchCsv`, `renderSemesterCsv` | PENDING |
| `src/modules/academics/college-academic-export-service.ts` | `exportCollegeAcademicDirectory` | PENDING |
| `src/modules/academics/college-batch-graduation-service.ts` | `CollegeBatchGraduationError`, `markCollegeBatchGraduated` | PENDING |
| `src/modules/academics/college-batch-promotion-copy.ts` | `BATCH_PROMOTION_COPY`, `promotionImpactMessage` | PENDING |
| `src/modules/academics/college-batch-promotion-execute.ts` | `CollegePromotionExecuteError`, `executeCollegeBatchPromotion` | PENDING |
| `src/modules/academics/college-batch-promotion-model.ts` | `formatPromotionAcademicYear`, `collegePromotionQuerySchema`, `CollegePromotionQuery`, `PromotionBlocker`, `batchPromotionPlan`, `promotionLearnerBlockers`, `collegePromotionExecuteSchema`, `promotionReady`, `promotionPreviewMatches` | PENDING |
| `src/modules/academics/college-batch-promotion-service.ts` | `CollegePromotionPreviewError`, `listCollegePromotionOptions`, `previewCollegeBatchPromotion`, `previewCollegeBatchPromotionInTransaction` | PENDING |
| `src/modules/academics/college-batch-retire-model.ts` | `collegeBatchRetireSchema`, `collegeBatchRetireIdSchema`, `batchRetirementPrompt` | PENDING |
| `src/modules/academics/college-batch-retire-service.ts` | `CollegeBatchRetireError`, `retireCollegeBatch` | PENDING |
| `src/modules/academics/college-classes-export-model.ts` | `CLASSES_EXPORT_CAP`, `collegeClassesExportSchema`, `ClassExportRow`, `classesExportHref`, `renderCollegeClassesCsv`, `readClassesExportParams` | PENDING |
| `src/modules/academics/college-classes-export-service.ts` | `exportCollegeClasses` | PENDING |
| `src/modules/academics/college-cohort-mutation-model.ts` | `createCollegeCohortSchema`, `updateCollegeCohortSchema`, `collegeCohortIdSchema`, `hasUnsavedCollegeCohortEdit`, `validCohortPeriodRange`, `batchAcademicYearFromDates` | PENDING |
| `src/modules/academics/college-cohort-mutation-service.ts` | `CollegeCohortMutationCode`, `CollegeCohortMutationError`, `createCollegeCohort`, `updateCollegeCohort` | PENDING |
| `src/modules/academics/college-directory-export-model.ts` | `exportParams`, `buildCollegeDirectoryCsv`, `collectCollegeExportRows` | PENDING |
| `src/modules/academics/college-directory-validation.ts` | `collegeDirectoryValidationMessage` | PENDING |
| `src/modules/academics/college-elective-export-model.ts` | `ELECTIVES_EXPORT_CAP`, `electiveCsvSchema`, `exportParams`, `electiveCsvHref`, `renderElectivesCsv` | PENDING |
| `src/modules/academics/college-elective-export-service.ts` | `exportCollegeElectives` | PENDING |
| `src/modules/academics/college-faculty-assignment-export-model.ts` | `FACULTY_ASSIGNMENT_EXPORT_CAP`, `facultyAssignmentCsvSchema`, `exportParams`, `facultyAssignmentCsvHref`, `renderFacultyAssignmentCsv` | PENDING |
| `src/modules/academics/college-faculty-assignment-export-service.ts` | `exportCollegeFacultyAssignments` | PENDING |
| `src/modules/academics/college-hall-availability-model.ts` | `collegeHallAvailabilitySchema`, `istWindow`, `HallScheduledRow`, `collegeHallAvailabilityProjection` | PENDING |
| `src/modules/academics/college-hall-availability-service.ts` | `CollegeHallAvailabilityNotFoundError`, `getCollegeHallAvailability` | PENDING |
| `src/modules/academics/college-hall-booking-model.ts` | `collegeHallBookingSchema`, `hallBookingWindow`, `hallCanFitClass`, `hallFacultyIsEligible` | PENDING |
