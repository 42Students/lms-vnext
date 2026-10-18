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
