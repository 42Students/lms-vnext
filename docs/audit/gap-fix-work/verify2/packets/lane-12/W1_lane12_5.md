# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-014-035 [P1] GAP facet F11
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:64-78`
- Expected fix: Legacy Super Admin with scoped JWT forcibly uses organizationId claim, Global Super Admin can supply organizationId; vNext restricts to selected college and organization from verified request context.

## G2-12-014-065 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:77-90`
- Expected fix: Legacy organizationId denormalization from job/application vs vNext organization derived via colleges and college membership; mismatch for moved/reassigned jobs must be audited.

## G2-12-014-068 [P1] GAP facet F23
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-104`
- Expected fix: Legacy per-organization search/stats cannot be substituted by selected-college list without breaking cross-college organization-wide workflows.

## G2-4-014-038 [P1] MISSING facet F10
- Files: src/app/(authenticated)/admin/colleges/page.tsx
- Legacy: POST /:collegeId/select increments in-memory usageCounts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-303`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:255-262`)
- Expected fix: Record selection in durable or explicitly ephemeral counter.

## G2-4-008-046 [P1] GAP facet F12
- Files: src/modules/admin-ui/super-admin-faculty-assignments-service.ts, src/components/courses/admin-course-actions.tsx
- Legacy: Legacy updates `is_active=false` via Edit, can later reactivate; separate deactivate endpoint. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284;docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:176-190`)
- Expected fix: Specify reactivation/end transition parity and add allowed operations.

## G2-4-008-072 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-faculty-assignments-service.ts
- Legacy: Legacy deletion and deactivate distinct; old stats count inactives. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:159-190;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-392`)
- Expected fix: Resolve archived-history semantics and counting of inactive assignments.

## G2-4-011-018 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-faculty-assignments-service.ts
- Legacy: Semester number and academic year string show as Sem N or em dash and raw year or em dash. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-367`)
- Expected fix: Return original semester and academic-year semantics including empty value placeholders.

## G2-4-011-019 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-faculty-assignments-service.ts
- Legacy: Legacy is_active bool defaults true; table says Yes or No. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:46-47`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:369-369`)
- Expected fix: Define active/status mapping and display legacy Yes/No field.

## G2-4-022-041 [P1] GAP facet F11
- Files: src/components/tpo/tpo-students-drive-visibility.tsx
- Legacy: Legacy override checks job writable plus all learner scopes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-145`)
- Expected fix: Verify API enforces writable drive and enrollment/cohort targeting server-side.

## G2-4-022-067 [P1] GAP facet F22
- Files: src/components/tpo/tpo-students-drive-visibility.tsx
- Legacy: Legacy job eligibility override reversible by restoring before state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-168`)
- Expected fix: Define exactly which historic override state must survive undo and persistence.

## G2-4-028-010 [P1] MISSING facet F03
- Files: src/app/(authenticated)/tpo/messages/page.tsx
- Legacy: Recruiters and Team tab buttons with aria-selected (`docs/legacy-source/frontend/src/pages/tpo/messages.js:40-45`)
- Expected fix: Restore both visible Messages tabs.

## G2-13-031-014 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy Applied, Shortlisted, Assessment from server metrics. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:444-453`
- Expected fix: Clarify ever-reached vs current-stage counts.

## G2-13-031-015 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy Interview, Offered and Hired metrics from server. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:454-467`
- Expected fix: Reconcile old hired meaning.

## G2-13-031-016 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy Rejected, Withdrawn and Waitlisted exposed. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:469-486`
- Expected fix: Reconcile mutually exclusive totals.

## G2-13-031-022 [P1] GAP facet F06
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy DatePicker endOf day serialized to UTC ISO. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:71-85`
- Expected fix: Compare exact boundary milliseconds.

## G2-13-031-035 [P1] GAP facet F10
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy three calls for metrics, funnel and report. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:98-165`
- Expected fix: Reconcile all three datasets for identical filters.

## G2-13-031-038 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx, src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy global Super Admin or college scoped report branch. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:96-155`
- Expected fix: Decide whether global report is still intended.

## G2-13-031-041 [P1] GAP facet F12
- Files: src/modules/admin-ui/super-admin-hiring-funnel-model.ts
- Legacy: Legacy conversion denominator previous stage, null when prior zero. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:510-524`
- Expected fix: Display unavailable for zero denominator.

## G2-13-031-042 [P1] GAP facet F12
- Files: src/modules/admin-ui/super-admin-hiring-funnel-model.ts
- Legacy: Legacy returned funnel stage ordering from API. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550`
- Expected fix: Reconcile nonmonotonic/current-state funnel semantics.

## G2-13-031-071 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-hiring-report-service.ts, src/modules/admin-ui/super-admin-hiring-report-model.ts
- Legacy: Legacy report rows and CSV stage stats. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:267-309`
- Expected fix: Document stage provenance.

## G2-13-031-095 [P1] GAP facet F07
- Files: src/app/(authenticated)/tpo/reports/page.tsx
- Legacy: Legacy batch-select error does not erase successfully loaded report. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:177-181`
- Expected fix: Keep catalog visible despite failed KPI or filter fetch.

## G2-5-005-017 [P1] GAP facet F04 Data shown/formatting
- Files: src/app/(authenticated)/hr/calendar/page.tsx
- Legacy: Legacy foldWeek includes slot count in title line (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:115)
- Expected fix: Aggregate slots under parent round for default week view.

## G2-5-007-035 [P1] GAP facet F10 Actions/side effects
- Files: (none, new feature)
- Legacy: GET individual interview records scoped by organization/college (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-161; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-385)
- Expected fix: Reconcile legacy Interview entity to appointment model; don't substitute rounds.

## G2-5-009-038 [P1] GAP facet F09 Modals/drawers
- Files: (none, new feature)
- Legacy: Failed record detail lookup blocks correction controls (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-67)
- Expected fix: Disable save until validated live record detail.

## G2-5-011-038 [P1] GAP facet F10
- Files: src/app/(authenticated)/teacher/calendar/page.tsx
- Legacy: Clicking calendar event client-pushes course path with encoded slug/ref (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:64-80`)
- Expected fix: Preserve correct user navigation for course-level sessions and handle general sessions explicitly.

## Lane-16 FAST verification triage (2026-10-22)

- OK G2-4-028-010 — `tpo/messages/page.tsx` renders `TpoMessagesTabs` for recruiter and team panels; team panel is selected with `selected="team"` and recruiter panel uses `selected="recruiters"`. Tab component behavior still merits regression coverage.
- OK G2-13-031-041 — `hiringFunnel` returns `percentPrevious: null` when preceding stage is zero, avoiding an invalid conversion rate.
- OK G2-5-011-038 — teacher calendar links course deliveries to encoded `/teacher/courses/{deliveryId}/home` and renders section-wide sessions without inventing course navigation.
- DEFERRED — remaining 22 rows require deeper server-side authorization, persistence, migration, query reconciliation, or UI-flow validation; no implementation parity claimed.
