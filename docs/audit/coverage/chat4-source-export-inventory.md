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
