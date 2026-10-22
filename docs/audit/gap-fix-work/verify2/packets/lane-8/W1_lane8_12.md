# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-007-029 [P1] GAP facet F06
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:258-288` — Allocation history locks semester/year/credits/picks but displays disabled controls
- Expected fix: Display fields, freeze only with history, align server lock

## G2-9-007-041 [P1] GAP facet F09
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:181-194` — Unsaved close prompts Discard this elective slot draft or edits, Keep editing
- Expected fix: Add dirty-close confirmation and busy dismissal lock

## G2-9-007-044 [P1] GAP facet F10
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:10-16` — GET list/detail/unallocated, POST create/archive, PUT edit under /api/v1/electives/admin
- Expected fix: Map every API method, restore detail and eligible read parity

## G2-9-007-046 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:163-196` — Roster GET, allocate POST, remove DELETE with reason, move POST
- Expected fix: Preserve reason, per-student response and waitlist outcomes

## G2-9-007-051 [P1] GAP facet F12
- Files: src/modules/electives/college-slot-mutation-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-248` — Credits 0-30, minPick>=0, maxPick>=1, name<=150, description<=1000
- Expected fix: Align maximum-choice policy and validation

## G2-9-007-052 [P1] GAP facet F12
- Files: src/modules/electives/college-slot-mutation-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:168-203` — History-based semester/year/credits/choice lock
- Expected fix: Allow prehistory corrections; block after history with clear message

## G2-9-007-056 [P1] MISSING facet F13
- Files: src/components/academics/college-structure-directory.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:197-200` — Slot drawer Could not refresh this elective slot and Retry
- Expected fix: Implement detail-load error and retry

## G2-9-007-069 [P1] GAP facet F20
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:64-82` — Request-sequence drops stale list response
- Expected fix: Present stale-version correction and preserve draft

## G2-9-015-047 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:775-788` — Initial fetch failure Failed to load jobs. Please try again. Try Again.
- Expected fix: Render data-fetch error card with retry and exact phrase.

## G2-9-012-009 [P1] MISSING facet F03
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:771-776` — Counters Scheduled, Today, Companies, Conflicts
- Expected fix: Compute and display all four appointment metrics

## G2-9-013-044 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:588-616` — Prefill error disables form; save failure has Drive changes were not saved banner; hierarchy warning independent.
- Expected fix: Separate lookup failures and block stale/partial edits.

## G2-9-014-046 [P1] MISSING facet F09
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1925-1992` — Assessment modal supports optional link and discard-unsaved confirm.
- Expected fix: Provide legacy Assessment dialog and dirty cancellation safeguard.

## G2-9-017-094 [P1] GAP facet F22
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:12-27` — MySQL lecture_hall int id/college_id/dept_id; capacity int; no status.
- Expected fix: Document migration mapping ID/dept0/null/status defaults.

## G2-9-018-037 [P1] GAP facet F08
- Files: src/components/academics/academics-actions.tsx
- Legacy: Deleted program “NAME”. `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:180-183`
- Expected fix: Surface archive semantics; decide hard-delete parity separately with retention policy.

## G2-9-018-039 [P1] GAP facet F09
- Files: src/components/academics/academics-actions.tsx
- Legacy: Delete Popconfirm asks Delete “NAME”? with Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:235-245`
- Expected fix: Reconcile destructive action with archive business policy, label consistently.

## G2-9-018-044 [P1] GAP facet F10
- Files: src/app/api/academics/programs/[programId]/route.ts, src/modules/academics/college-program-mutation-model.ts
- Legacy: DELETE hard-removes only if unreferenced `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-179`
- Expected fix: Document intentional retention policy; ensure legacy deletion expectations communicated.

## G2-9-019-019 [P1] GAP facet F05
- Files: src/modules/academics/college-academic-directory-model.ts, src/components/academics/college-academic-directory.tsx
- Legacy: Default pagination 10 Ant Table, page size changer and range `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-544`
- Expected fix: Fix static 25 per page label to reflect query.pageSize; expose size changer.

## G2-9-019-029 [P1] GAP facet F06
- Files: src/components/academics/college-semester-management.tsx
- Legacy: Total Credits edit hidden to retain legacy value `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:585-589`
- Expected fix: Preserve stored totalCredits on edit, or explicit migration to derived-only model.

## G2-9-019-034 [P1] GAP facet F07
- Files: src/components/academics/college-semester-management.tsx
- Legacy: Server snake_case program_id/semester_number/total_credits field errors `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:199-205,267-272`
- Expected fix: Map backend field errors and retain closeable persistent card alert.

## G2-9-036-100 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/page.tsx
- Legacy: Legacy Feature Controls module columns show Projects and Placements only with Toggle switch `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:251-292`
- Expected fix: Show inline original switches for broad availability and move advanced policy editor elsewhere.

## G2-15-027-024 [P1] MISSING facet F06
- Files: src/modules/academics/faculty-assignment-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:496-516 bulk mapping takes list validates EVERY scope before inserts
- Expected fix: Implement prevalidated bulk scoped mapping command, prevent partial permission writes.

## G2-9-028-015 [P1] GAP facet F04
- Files: src/modules/academics/college-batch-promotion-service.ts, src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Students column currentStudents in legacy DTO `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:314-316`
- Expected fix: Reconcile old currentStudents semantics and label clearly

## G2-9-028-034 [P1] GAP facet F09
- Files: src/components/academics/college-promotion-confirmation.tsx
- Legacy: Modal shows student count, class count, deactivated assignments, term/year impact and max `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:472-500`
- Expected fix: Restore full impact list and class/faculty counts

## G2-9-028-058 [P1] GAP facet F19
- Files: src/modules/academics/college-batch-promotion-service.ts, src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Client loads all batches, paginates ten visible rows `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72,442-449`
- Expected fix: Use server pagination for large colleges

## G2-9-022-015 [P1] GAP facet F04
- Files: src/modules/academics/college-batch-promotion-service.ts, src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Students column currentStudents in legacy DTO `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:314-316`
- Expected fix: Reconcile old currentStudents semantics and label clearly
