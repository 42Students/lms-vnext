# Verification packet (P1 round 2): 17 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-032-078 [P1] GAP facet F22
- Files: src/components/admin/college-edit-dialog.tsx, src/app/api/colleges/[collegeId]/route.ts
- Legacy: Legacy editable organization and uniqueId on update `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:294-303`
- Expected fix: Document migration/renaming policy for existing tenants

## G2-9-032-080 [P1] GAP facet F23
- Files: src/components/admin/college-bulk-import.tsx, src/modules/colleges/bulk-import-model.ts
- Legacy: Old import can mix multiple orgIds in one CSV `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-671`
- Expected fix: Provide legacy importer mode or explicit conversion workflow

## G2-9-033-021 [P1] GAP facet F07
- Files: src/components/admin/super-admin-company-edit.tsx, src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Old industry max100 description max2000, contact name 150 email 150 phone30 and notes2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-518`
- Expected fix: Apply legacy per-field length caps in college workflow and decide global caps explicitly

## G2-9-034-078 [P1] GAP facet F06
- Files: src/components/admin/super-admin-company-merge.tsx
- Legacy: Legacy merge modal target searchable, options only current 50 rows and exclude source `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-173`
- Expected fix: Search all accessible target companies, not only same-page duplicate detections.

## G2-9-034-089 [P1] GAP facet F09
- Files: src/components/admin/super-admin-company-merge.tsx
- Legacy: Old Merge modal warns domains, drives, recruiters and every college's notes move `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-171`
- Expected fix: Preserve explicit data-migration disclosure or mark unsupported cross-college merge.

## G2-9-035-017 [P1] GAP facet F03
- Files: src/components/admin/super-admin-today-board.tsx
- Legacy: Today card rows show named affected students/courses with and N more when total exceeds items `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- Expected fix: Include authorized item previews, compact rows and overflow counts in each attention card

## G2-9-035-025 [P1] GAP facet F05
- Files: src/components/admin/super-admin-today-board.tsx
- Legacy: Old Today cards order Attendance not taken, Under threshold, Waiting to be graded, Courses with no teacher, Setup gaps, Quizzes closing this week `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- Expected fix: Populate all six legacy attention categories and preserve order

## G2-9-035-031 [P1] MISSING facet F08
- Files: src/app/(authenticated)/dashboard/page.tsx, src/components/admin/super-admin-today-board.tsx
- Legacy: Old Today fetch failure uses Couldn't load today's overview with Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:102-109`
- Expected fix: Render old explicit error and Retry rather than hiding backend failure as unknown values

## G2-9-035-036 [P1] GAP facet F10
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Legacy Today calls getAdminCollegeDashboard with pending at-risk grading unstaffed setup gaps dueWeek and today payload `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:81-85` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- Expected fix: Build endpoint projection returning each old section's totals and top items

## G2-9-035-067 [P1] GAP facet F21
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Old Today query returns six named issue sets and status per section `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- Expected fix: Implement missing attendance risk, grading backlog, setup gaps and drilldown sources

## G2-9-035-089 [P1] GAP facet F04
- Files: src/components/admin/super-admin-today-board.tsx
- Legacy: Old Today opening trio '<classes> scheduled today / <held> held so far / <marked> with attendance taken' `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:137-147`
- Expected fix: Restore three exact labels and distinguish class-held evidence from scheduled end.

## G2-9-035-098 [P1] GAP facet F07
- Files: src/components/admin/super-admin-today-board.tsx
- Legacy: Old Today on incomplete response displays card failed placeholder rather than fake 0 `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-124,37-44`
- Expected fix: Differentiate missing evidence, failed fetch, unsupported metric and actual zero.

## G2-9-035-102 [P1] GAP facet F10
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Legacy Today class 'held so far' from actual dashboard today.heldCount `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:140-143`
- Expected fix: Derive actual held status rather than equating calendar elapsed with held.

## G2-9-035-115 [P1] GAP facet F19
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Legacy fetch Today full issue sets plus limited items, explicit remainder count `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63,113-123`
- Expected fix: Create paginated/per-card capped row projections with remainder count.

## G2-9-035-119 [P1] GAP facet F22
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Legacy state source Today dashboard response has 6 issue categories `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- Expected fix: Extend data projection joins to existing attendance/submission/structure models.

## G2-9-024-034 [P1] GAP facet F08
- Files: src/components/admin/department-actions.tsx
- Legacy: Department deleted successfully! `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:173-175`
- Expected fix: Communicate deliberate archive rather than hard-delete and owner-approved copy

## G2-9-024-041 [P1] GAP facet F10
- Files: src/components/admin/department-actions.tsx
- Legacy: DELETE /api/v1/department/delete/{id}, hard delete after dependency guards `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:167-185` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:176-225`
- Expected fix: Document archive migration and resurrect/reuse semantics
