# Work packet: edit src/app/(authenticated)/college/semester-courses/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-16-007-003  [P1] GAP  facet F01  effort S
- Legacy: `semester-courses.js:18-29`: no college shows warning `Admin not assigned to a college` and contact administrator.
- vNext now: `college/semester-courses/page.tsx:9-11`: no membership redirects /dashboard.
- Fix: Render exact missing-college warning with contact instruction when authenticated but unassigned.

## G2-16-007-022  [P1] GAP  facet F06  effort M
- Legacy: `SemesterCourseMapping.js:141-155`: college context change resets all lookup/mapping state and aborts prior async results.
- vNext now: `college/semester-courses/page.tsx:9-11`; `college-term-mapping-manager.tsx:23-34`: manager initializes state once and receives server data; no key on collegeId.
- Fix: Key manager by collegeId and reset state on college change to prevent stale cross-college draft/selection.

## G2-16-007-044  [P1] GAP  facet F11  effort S
- Legacy: `semester-courses.js:11-18`: college determined from signed-in loginUser.collegeId; no college gives warning.
- vNext now: `college/semester-courses/page.tsx:9-11`; `college-term-mapping-service.ts:60-62`: server context.membership college; redirects if absent.
- Fix: Distinguish authenticated unassigned admin from session invalid and show legacy warning.

## G2-16-007-051  [P1] GAP  facet F13  effort M
- Legacy: `SemesterCourseMapping.js:336-341`: independent lookup error Alert lists failed keys and Retry.
- vNext now: `college/semester-courses/page.tsx:11-18`: await list data; failed read throws page error, no field-specific retry.
- Fix: Return partial lookup failures and Retry instead of losing entire page.

## G2-16-007-079  [P1] GAP  facet F23  effort S
- Legacy: `semester-courses.js:18-29`: missing-college warning preserved.
- vNext now: `college/semester-courses/page.tsx:9-11`: redirect instead.
- Fix: Restore actionable warning for authenticated unassigned admin.

## G2-17-002-059  [P1] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:385-403 separately handles table refresh, reorder, stale mapping error, staffing error and 6-row first-load skeleton.
- vNext now: src/app/(authenticated)/college/semester-courses/page.tsx:11 relies on one awaited service read; src/components/academics/college-term-mapping-manager.tsx:128-175 has no independent mapping/staffing status model.
- Fix: Introduce separate lookup, mappings and staffing loading/error states with targeted retries.
