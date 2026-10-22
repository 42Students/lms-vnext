# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-005-009 [P1] GAP facet F04
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx
- Legacy: Fields faculty/course/class/batch/semester/year/role/is_active. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380`)
- Expected fix: Reinstate semester/year fields.

## G2-12-024-021 [P1] GAP facet F10
- Files: src/modules/log-alerts/manual-ops.ts
- Legacy: Digest requested hours clamped 1..336, send endpoint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:222-235`
- Expected fix: Add hour-scoped digest and exact evidence window.

## G2-4-017-029 [P1] GAP facet F06
- Files: src/modules/projects/college-project-summary-service.ts, src/components/projects/college-project-summary-editor-full.tsx
- Legacy: Legacy resources/sprints/tasks/meetings arrays have distinct concurrency tokens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:26-36`)
- Expected fix: Verify all section mutations use independent optimistic tokens/append semantics.

## G2-4-017-031 [P1] GAP facet F07
- Files: src/modules/projects/college-project-summary-service.ts
- Legacy: Legacy stale section token returns 409 rather than overwrite newer child rows. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:26-36`)
- Expected fix: Map exact 409 user copy and guard child collections individually.

## G2-4-017-065 [P1] GAP facet F20
- Files: src/modules/projects/college-project-summary-service.ts
- Legacy: Legacy JPA @Version Long null for new entities prevents merge/persist confusion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:119-125`)
- Expected fix: Prove optimistic tokens survive timestamp precision and prevent lost writes.

## G2-4-029-011 [P1] GAP facet F04
- Files: src/components/projects/project-activity-filtered-list.tsx
- Legacy: Rows resourceKey/actionType/actorName-or-ID/userType/createdAt (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85`)
- Expected fix: Render old four-column resource audit table with resource, action, actor and timestamp.

## G2-4-029-016 [P1] MISSING facet F05
- Files: src/components/projects/project-activity-filtered-list.tsx
- Legacy: Column order Resource→Action→Actor→When (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85`)
- Expected fix: Implement table with exact column order.

## G2-4-022-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/students/page.tsx
- Legacy: Legacy Students page GET /api/v1/tpo/students/table, detail, notes, register and 13 bulk endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-218`)
- Expected fix: Map legacy route-by-route action results to new scoped API and UI.

## G2-13-021-001 [P1] GAP facet F01
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy screening result runs after job application submission, one per application. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-20`
- Expected fix: Choose whether to reimplement explainable scoring or explicitly sunset numeric matching.

## G2-13-021-016 [P1] GAP facet F06
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy default screeningVersion v1, screenedAt generated on insert. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:108-116`
- Expected fix: Fix timestamp meaning and model version.

## G2-13-021-018 [P1] GAP facet F07
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy pending row created if missing, screenedBy SYSTEM/method AUTOMATED_V1 only if null. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:80-107`
- Expected fix: Populate expected screening row on application create and support repair.

## G2-13-021-021 [P1] GAP facet F08
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy marks auto screening COMPLETED on success. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:236-241`
- Expected fix: Keep distinct completion vs disposition messaging.

## G2-13-021-022 [P1] GAP facet F08
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy failures produce FAILED result with diagnostics. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:80-107`
- Expected fix: Expose failure reason and controlled rescreen action.

## G2-13-021-025 [P1] GAP facet F10
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy transactional screenApplication creates/updates ApplicationScreening and algorithm provenance. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:61-107`
- Expected fix: Separate automatic run from human disposition service.

## G2-13-021-026 [P1] GAP facet F10
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy computes skills+education, average available components and explanation. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:110-239`
- Expected fix: If parity needed implement deterministic explainable evaluator.

## G2-13-021-048 [P1] MISSING facet F21
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy background scorer started after application save. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-16`
- Expected fix: Implement worker trigger or mark scoring intentionally removed.

## G2-13-021-052 [P1] GAP facet F23
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy scoring automatically calculated skills/education; optional AI future comment, not deployed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-16`
- Expected fix: Owner explicitly decide whether deterministic matching score retained, without AI.

## G2-13-031-017 [P1] MISSING facet F04
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx, src/modules/placements/college-hiring-funnel-service.ts
- Legacy: Legacy optional average time to shortlist in milliseconds. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- Expected fix: Connect same history-backed average to Super Admin.

## G2-13-031-065 [P1] GAP facet F19
- Files: src/modules/placements/college-hiring-funnel-service.ts, src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: Legacy average shortlist time is shown if computed. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- Expected fix: Share average calculation across roles.

## G2-13-031-068 [P1] GAP facet F20
- Files: src/modules/placements/college-hiring-funnel-service.ts, src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: Legacy date endOf day precise milliseconds. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-84`
- Expected fix: Use exclusive next-day end.

## G2-13-031-085 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/reports/unplaced/page.tsx
- Legacy: Legacy unplacedReady needs resume, CGPA, 10th%, registration and no placed-status offer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:96-101`
- Expected fix: Add distinct ready-unplaced metric and academic fields.

## G2-14-028-034 [P1] GAP facet F10
- Files: src/modules/projects/college-project-summary-service.ts
- Legacy: Legacy updateProject PATCH with detailsToken, touched scalar fields. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:267-312`
- Expected fix: Document API adapter and partial patch semantics.

## G2-5-004-026 [P1] GAP facet F06 Forms
- Files: src/app/(authenticated)/mentor/calendar/page.tsx
- Legacy: RESCHEDULED and DRAFT may appear via status (docs/legacy-source/frontend/src/pages/mentor/calendar.js:55-63)
- Expected fix: Add lifecycle filter options to include all stored values.

## G2-5-007-012 [P1] GAP facet F03 Visible elements
- Files: src/app/(authenticated)/admin/placements/interviews/page.tsx
- Legacy: Scheduled/Confirmed/Reschedule/Completed/Cancelled/No Show status badge colors (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:96-103)
- Expected fix: Use appointment status lifecycle, not round status.

## G2-5-009-016 [P1] GAP facet F04 Data formatting
- Files: (none, new feature)
- Legacy: Multi-session cell number attended/marked ratio (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- Expected fix: Use per-student per-day ratio backed by marks.

## Fast verification disposition
- DEFERRED G2-4-005-009: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-12-024-021: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-4-017-029: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-4-017-031: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-4-017-065: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-4-029-011: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-4-029-016: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-4-022-001: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-001: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-016: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-018: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-021: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-022: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-025: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-026: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-048: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-021-052: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-031-017: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-031-065: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-031-068: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-13-031-085: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-14-028-034: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-5-004-026: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-5-007-012: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-5-009-016: Requires deeper source comparison and/or feature work; not certified as matching.
