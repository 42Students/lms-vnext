# Verification packet (P1 sample): 21 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-003-023 [P1] GAP facet F05
- Files: src/app/(authenticated)/activity/page.tsx, src/modules/activity/service.ts
- Legacy: Old important category matches deletion restore promotion suspension impersonation access feature identity reads and bulk statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:72-98`
- Expected fix: Use importantOnly HIGH or CRITICAL and legacy action coverage; do not exclude CRITICAL

## G2-10-008-063 [P1] GAP facet F10
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts, src/app/(authenticated)/admin/placements/hiring/page.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:911-937` GET metrics/funnel/company-report via three endpoints and different parameters
- Expected fix: Keep endpoint-equivalent response sections for report accuracy even if served by one query

## G2-10-019-003 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/module-access/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:605-639 — Search learner and Recent changes, Expand all, Collapse all, Refresh in top overview actions.
- Expected fix: Put original actions on hierarchy surface and show college selector current scope.

## G2-11-005-033 [P1] GAP facet F05
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Drawer unread rows as List with `name/roll/branch` and empty Everyone has read it `docs/legacy-source/frontend/src/pages/tpo/announcements.js:120`
- Expected fix: Include privacy-scoped learner roll and branch

## G2-11-007-023 [P1] GAP facet F04
- Files: src/components/tpo/tpo-company-memory-workspace.tsx
- Legacy: Legacy total `studentsHired` is facts.hired(companyJobs) honoring placement rules. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:408`
- Expected fix: Use one policy-aware consistent count with documented null/unknown behavior.

## G2-12-001-043 [P1] MISSING facet F23 Extras/intentional drops
- Files: src/app/request-demo/page.tsx
- Legacy: Page-specific ContactPage/BreadcrumbList JSON-LD `docs/legacy-source/frontend/src/pages/request-demo.js:13-36`
- Expected fix: Add approved structured data in App Router

## G2-18-026-013 [P1] GAP facet F06 Update payload
- Files: (none, new feature)
- Legacy: NPC:145-183 PUT `/update/{id}` full validated DTO
- Expected fix: Document PUT→PATCH payload migration and make old edit callers write required vNext fields atomically

## G2-15-002-043 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Remove skill asks confirmation `Remove this entry?` (`ProfileSectionsPanel.js:444-448`).
- Expected fix: Add confirmation before skill removal, disabled pending state.

## G2-19-017-053 [P1] GAP facet F23
- Files: src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx
- Legacy: Legacy typed history can reconstruct changed fields/before/after `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-51`
- Expected fix: Treat generic feed as supplement, not substitute for typed source audit.

## G2-2-001-013 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: LD:130-145 Where, Affects/roles, Seen on/environment, Reported agent/session, duplicate and short commit chips
- Expected fix: Surface omitted provenance, roles, environment, duplicate, reported agent session.

## G2-4-008-013 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-faculty-assignments-service.ts
- Legacy: Legacy row includes facultyId, courseId, classId, batchId, semesterNumber, academicYear, role and isActive. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-216`)
- Expected fix: Map exact semester number and explicit academic year, not academicPeriod start year by default.

## G2-4-022-033 [P1] GAP facet F09
- Files: src/components/tpo/tpo-students-drive-visibility.tsx
- Legacy: Legacy bulk override restore supports both previous INCLUDE and EXCLUDE state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:153-167`)
- Expected fix: Restore prior override for exact previous state or explicitly document safer clear-only undo.

## G2-13-031-013 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy Total Applications comes from admin hiring metrics endpoint. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-443`
- Expected fix: Validate historical inclusion for withdrawals.

## G2-13-031-063 [P1] GAP facet F19
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy separates report fetches, no 5000-row cap visible. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:98-165`
- Expected fix: Load-test large college and reconcile totals.

## G2-5-015-043 [P1] GAP facet F21
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Admin hiring metrics gets first SHORTLISTED transition time from history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2309-2331`
- Expected fix: Compute first-shortlist latency from immutable stage transition rows.

## G2-11-026-023 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Legacy reporter allowed if active display name found; no session required for create (BugTrackerService.java:43-50).
- Expected fix: Support approved reporter identity resolution without granting manager access.

## G2-7-001-043 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:129-132: excludes archived client-side but completed with blocker/review can still qualify.
- Expected fix: Align completed-project inclusion across counts and visible rows.

## G2-7-018-033 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:126-128 conditional full/partial description
- Expected fix: Provide partial legacy recovery warning and preserve user choice

## G2-7-031-023 [P1] GAP facet F12
- Files: src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: superAdminNavGroups.js:21-30 Templates first by deliberate role-specific prioritization
- Expected fix: Enforce product rule that Super Admin begins on Templates

## G2-8-030-023 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx
- Legacy: Old delete impact includes activeApps,affectedLearners,openInterviews docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-450.
- Expected fix: Restore dependency impact preview and guarded deletion route.

## G2-9-016-033 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:462-492` — Search by drive or company, client filters top60; URL q shallow synced.
- Expected fix: Place search on Active drives section and preserve q deep link.
