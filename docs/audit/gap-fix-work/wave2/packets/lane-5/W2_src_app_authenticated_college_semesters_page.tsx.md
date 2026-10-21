# Work packet (wave 2): edit src/app/(authenticated)/college/semesters/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/semester-search-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-6-013-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:18-23`
- vNext now: `src/app/(authenticated)/college/semesters/page.tsx:15-22`
- Fix: Preserve old `/api/v2/semesters/search` URL or document explicit API replacement

## G2-6-013-030  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:78-78`
- vNext now: `src/app/(authenticated)/college/semesters/page.tsx:25-30`
- Fix: Preserve legacy success/error API literal where backward compatibility needed

## G2-9-019-011  [P2] GAP  facet F03  effort M
- Legacy: Refresh and export toolbar actions are visible `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:479-507`
- vNext now: Export CSV in PageHeader; no inline Refresh `src/app/(authenticated)/college/semesters/page.tsx:32-40`
- Fix: Add refresh with loading state and move export adjacent to search.

## G2-9-019-053  [P2] GAP  facet F13  effort M
- Legacy: Initial 8-row TableSkeleton/refresh banner and same-scope stale data retention `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:515-544`
- vNext now: Server directory no stale retention; route-level loading fallback `src/app/(authenticated)/college/semesters/page.tsx:31-41`
- Fix: Show list skeleton/retry state without clearing prior scoped results.

## G2-9-019-054  [P2] GAP  facet F13  effort M
- Legacy: Program fetching error alert with Retry programs `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:510-521`
- vNext now: Server failure routed to error fallback `src/app/(authenticated)/college/semesters/page.tsx:20-35`
- Fix: Restore program-specific error banner and retry.

## G2-9-019-056  [P2] GAP  facet F14  effort M
- Legacy: Export CSV semesters.csv with id,name,semesterNumber,programId,totalCredits,isActive yes/no `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:478-507`
- vNext now: Server CSV export from academicExportHref and cap metadata `src/app/(authenticated)/college/semesters/page.tsx:32-40`
- Fix: Verify generated CSV column headers/boolean tokens match consumers.
