# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-024-060 [P1] GAP facet F12
- Files: src/components/verification/SuperAdminVerificationPanel.tsx
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:248-251 — Bulk verify excludes missing marksheets OR missing Identity document based on blindProblem.
- Expected fix: Exclude missing identity proof from blind verification too

## G2-10-024-088 [P1] GAP facet F19
- Files: src/modules/verification/staff-queue-service.ts
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-421 — Legacy queue result bounded 1000 per active view.
- Expected fix: Ensure tab counts/coverage unaffected by other statuses

## G2-10-024-105 [P1] GAP facet F23
- Files: src/components/verification/VerificationWorkspace.tsx, src/components/verification/SuperAdminVerificationPanel.tsx
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-433 — Legacy dense table with integrated actions.
- Expected fix: Recompose parity surface

## G2-17-026-009 [P1] GAP facet F05
- Files: src/app/(authenticated)/learn/notifications/page.tsx
- Legacy: Class feed page/size optional and default 100/max500; NotificationController.java:142-155; NotificationServiceImpl.java:274-287
- Expected fix: Provide full history pagination rather than truncating class notifications after 60.

## G2-19-027-001 [P1] GAP facet F01
- Files: src/app/api/courses/route.ts, src/app/api/courses/[courseId]/route.ts, src/app/(authenticated)/admin/courses/page.tsx
- Legacy: API base `/api/v1/courses` with POST /create, GET /fetch and /fetchAll, scoped + paged variants, slug reads, PUT /update, DELETE /delete, GET /deleted and POST /restore; CourseController.java:27-30,66-67,95-105,129-131,159-175,195-198,233-235,267-269,287-291,322-324,406-408,450-452,463-465
- Expected fix: Produce explicit route crosswalk for every old operation, URL redirect, method and response; identify deprecated legacy client callers before changing API contract.

## G2-19-027-056 [P1] GAP facet F22
- Files: src/components/courses/admin-course-display-editor.tsx
- Legacy: Legacy 14-key MetaData JSON stored under Course.contents, merged on writes; MetaData.java:17-32; CourseServiceImpl.java:271-351
- Expected fix: Map each exact JSON key to course vs Course Home model, preserving images/text/date display and null/missing differences.

## G2-11-002-024 [P1] MISSING facet F05
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Search appears only when >8 applicants `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:319`
- Expected fix: Implement conditional search

## G2-11-009-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Legacy drive-day home promises all today's on-campus rounds. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:14`
- Expected fix: Add a separate full today on-campus list as the primary page.

## G2-11-012-075 [P1] GAP facet F15
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Bulk remind sends in-app notifications to eligible nonapplicants. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:244`
- Expected fix: Port bulk reminder result summary and delivery guard.

## G2-12-007-004 [P1] GAP facet F02
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: PageShell listing header plus vertically stacked 20 assignment cards `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:637-761`
- Expected fix: Restore legacy row-card hierarchy and dimensions

## G2-12-007-010 [P1] MISSING facet F03
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: Assignment resource cards have icons Instructions/PDF/File/Link, action Open PDF/Open file/Download `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:40-94`
- Expected fix: Restore structured resource cards/open/download actions

## G2-12-007-017 [P1] GAP facet F05
- Files: src/modules/courses/learner-assessment-service.ts
- Legacy: Legacy GET assignments backend page 20, filter by course slug `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:246-248,282-309`
- Expected fix: Restore bounded server paging for large colleges

## G2-12-007-021 [P1] GAP facet F06
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: Open assignment drawer shows structured instructions/materials and own submission `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:107-160`
- Expected fix: Restore rich resource fields and download controls

## G2-12-007-022 [P1] GAP facet F06
- Files: src/components/courses/assignment-submission-control.tsx
- Legacy: Submission methods written response, PDF upload, arbitrary file upload, repository link, external link can combine `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:66-76`
- Expected fix: Compare multi-asset submit semantics and preserve allowed methods

## G2-12-007-030 [P1] GAP facet F08
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: Refresh stale warning `Couldn't refresh assignments` and Retry `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:709-717`
- Expected fix: Preserve last fetched list during reload failure

## G2-12-007-034 [P1] GAP facet F10
- Files: src/modules/courses/learner-assessment-service.ts
- Legacy: GET all assignments via `getAllAssignments` paginated with course/role `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-309`
- Expected fix: Align pagination, visibility, time ordering

## G2-12-007-036 [P1] GAP facet F10
- Files: src/components/courses/assignment-submission-control.tsx
- Legacy: POST submitAssignment payload plus saveContentProgress completed true `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:509-516`
- Expected fix: Confirm/update course lesson completion progress on submit

## G2-12-007-047 [P1] GAP facet F13
- Files: src/modules/courses/learner-assessment-service.ts
- Legacy: Failed refresh keeps stale cards and shows warning `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:709-717`
- Expected fix: Retain last good data under error

## G2-12-007-050 [P1] MISSING facet F14
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: Resources support PDF/open, file/download and external HTTPS links `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:47-94`
- Expected fix: Expose assignment resource cards and downloads

## G2-12-007-065 [P1] GAP facet F19
- Files: src/modules/courses/learner-assessment-service.ts
- Legacy: Legacy GET paged20, role/course filter and total count `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-309`
- Expected fix: Add server-side paging where learner has many assessments

## G2-12-007-077 [P1] MISSING facet F23
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: Legacy rich materials/PDF/download card closure `docs/legacy-source/frontend/src/components/Assignments/ViewAssignmentModal.jsx:40-94`
- Expected fix: Restore structured materials in drawer

## G2-12-003-020 [P1] GAP facet F05
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx
- Legacy: Row selection across pages preserved until scope/search change `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:615-627`
- Expected fix: Preserve cross-page selection with explicit scope guard

## G2-12-003-074 [P1] GAP facet F18
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx
- Legacy: `Visible to students`, helper Off hides course and lessons ... `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-95`
- Expected fix: Use accurate course-level visibility copy

## G2-12-003-076 [P1] GAP facet F19
- Files: src/modules/courses/admin-course-workspace.ts
- Legacy: Legacy dependency counts only visible paginated rows; 10/25/50/100 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:450-454`
- Expected fix: Paginate and lazy-load nonessential relation stats

## G2-12-003-077 [P1] GAP facet F19
- Files: src/modules/courses/admin-course-workspace.ts
- Legacy: Legacy fetch courses/department independently; guards stale scope `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:155-206`
- Expected fix: Use independent load/error boundaries
