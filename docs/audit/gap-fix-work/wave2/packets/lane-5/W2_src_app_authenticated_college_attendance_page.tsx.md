# Work packet (wave 2): edit src/app/(authenticated)/college/attendance/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u009-attendance-shared-component.md

## G2-5-001-001  [P2] GAP  facet F01 Purpose, entry points and navigation  effort M
- Legacy: College Admin wrapper uses AdminGroupShell groupKey academic, highlights attendance; docs/legacy-source/frontend/src/pages/college-admin/attendance.js:13-31
- vNext now: Standalone /college/attendance, PageHeader + own tab strip; src/app/(authenticated)/college/attendance/page.tsx:117-137
- Fix: Preserve the Academic Setup group navigation placement and current active-item identity instead of creating a competing attendance subnavigation.

## G2-5-001-002  [P2] GAP  facet F01 Purpose, entry points and navigation  effort S
- Legacy: No-college route warns 'Admin not assigned to a college' with contact-admin guidance; docs/legacy-source/frontend/src/pages/college-admin/attendance.js:17-26
- vNext now: Shows 'Choose a college to view attendance' with link to /college; src/app/(authenticated)/college/attendance/page.tsx:38-42
- Fix: Use legacy warning copy and retain a non-redirecting alert for unassigned College Admin.

## G2-5-001-003  [P2] GAP  facet F02 Layout and section order  effort M
- Legacy: Order: title/subtitle, policy card, errors, filters, health summary, monthly grid; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:469-538,127-149
- vNext now: PageHeader, four navigation tabs, filter form, health summary, grid, retroactive-window disclosure, parent contact editor; src/app/(authenticated)/college/attendance/page.tsx:119-137; src/components/attendance/admin-attendance-workspace.tsx:324-438,595-619
- Fix: Use legacy section order; put read-only policy information before class/course/month filters and do not relocate policy to a lower disclosure.

## G2-5-001-031  [P2] GAP  facet F10 Actions and side effects  effort L
- Legacy: Read pipeline GET /api/v1/admin/attendance/monthly?collegeId,classId,courseId,startDate,endDate; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:423-427; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:136-153
- vNext now: Server calls getAdminAttendanceGrid by collegeId/deliveryId/month using Drizzle joins; src/app/(authenticated)/college/attendance/page.tsx:71-76; src/modules/attendance/admin-service.ts:282-425
- Fix: Verify parity of class-wide sessions when multiple course deliveries/periods share a class/course; explicitly document term scoping.

## G2-5-001-044  [P2] GAP  facet F13 Empty/loading/error/offline/session  effort S
- Legacy: No-college warning renders inline on page; docs/legacy-source/frontend/src/pages/college-admin/attendance.js:17-26
- vNext now: No-college empty with action to dashboard; src/app/(authenticated)/college/attendance/page.tsx:41-42
- Fix: Match warning treatment and support session-expired retry via shell error handling.

## G2-5-001-055  [P2] GAP  facet F18 Wording vs legacy copy  effort S
- Legacy: Legacy subtitle 'Review monthly attendance by class and course, correct recent records, and export the same grid shown on screen.'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:470-474
- vNext now: vNext subtitle 'College-wide attendance oversight for [college]...' ; src/app/(authenticated)/college/attendance/page.tsx:119-122
- Fix: Use exact legacy subtitle; preserve college name only if required elsewhere.

## G2-5-009-004  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Policy card is first surface under title (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:477-486)
- vNext now: Filter controls ahead of policy, policy disclosure below (src/components/attendance/admin-attendance-workspace.tsx:324-410; src/app/(authenticated)/college/attendance/page.tsx:123-137)
- Fix: Move read-only policy card before filters.
