# Work packet: edit src/app/(authenticated)/college/attendance/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u001-college-admin-attendance.md

## G2-5-001-022  [P1] GAP  facet F07 Validation and errors  effort M
- Legacy: Options failure alert 'Couldn't load classes/courses for this college' with retry; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-490
- vNext now: getAdminAttendanceOptions awaited in server page without page-specific catch/retry; src/app/(authenticated)/college/attendance/page.tsx:54,117-137
- Fix: Catch options fetch failure, show inline error and Retry without replacing whole page.

## G2-5-001-043  [P1] GAP  facet F13 Empty/loading/error/offline/session  effort M
- Legacy: Grid skeleton labeled 'Loading monthly attendance'; refresh status 'Refreshing attendance…'; error retains last grid and Retry; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538
- vNext now: Server-rendered data delivered without explicit grid skeleton/refresh partial state or scoped Retry; src/app/(authenticated)/college/attendance/page.tsx:54-77; src/components/attendance/admin-attendance-workspace.tsx:414-435
- Fix: Add visible loading/refresh/error states with same-scope stale data retained and Retry.
