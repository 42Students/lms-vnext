# Work packet (wave 2): edit src/app/(authenticated)/college/semester-courses/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-16-007-001  [P2] GAP  facet F01  effort M
- Legacy: `semester-courses.js:9-16,40`: College Admin route uses AdminLayout and sets active menu `semester-courses`.
- vNext now: `src/app/(authenticated)/college/semester-courses/page.tsx:8-20`: membership route in unified shell; no explicit local menu activation.
- Fix: Match legacy college admin sidebar highlight and group route head; verify global shell active path.

## G2-16-007-002  [P2] GAP  facet F01  effort M
- Legacy: `semester-courses.js:31-36`: AdminGroupShell groupKey `academic` around mapping.
- vNext now: `college/semester-courses/page.tsx:12-19`: direct PageHeader + manager; no AdminGroupShell academic tabstrip.
- Fix: Use old Academic group tabs/active state from admin shell.

## G2-16-007-004  [P2] GAP  facet F01  effort S
- Legacy: `SemesterCourseMapping.js:327-331`: title `Semester–Course Mapping`, subtitle `Define the curriculum for each semester and spot courses that still need faculty coverage.`
- vNext now: `college/semester-courses/page.tsx:13-17`: same title but no subtitle, extra Course offerings link.
- Fix: Restore exact subtitle; position offerings action as approved supplementary action.

## G2-16-007-006  [P2] GAP  facet F02  effort M
- Legacy: `SemesterCourseMapping.js:324-332`: standalone admin list page title/subtitle above two Ant Card panels.
- vNext now: `college/semester-courses/page.tsx:12-18`: PageHeader separate, manager begins border-top and h2.
- Fix: Use legacy header offsets, cards and source-level spacing.

## G2-17-002-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-330 exact title and subtitle 'Define the curriculum for each semester and spot courses that still need faculty coverage.'
- vNext now: src/app/(authenticated)/admin/semester-courses/page.tsx:46-49 replaces subtitle with registered curriculum directory description; src/app/(authenticated)/college/semester-courses/page.tsx:13-17 omits it.
- Fix: Use the exact legacy subtitle beneath title in both routes.

## G2-17-002-004  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:342-344 gives no-program action Go to Programs via role-relative path.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:132-150 only empty Program select; src/app/(authenticated)/college/semester-courses/page.tsx:13-17 adds Course offerings header link.
- Fix: Restore contextual Go to Programs action when no programs; preserve useful offerings as separate optional link.

## G2-17-002-072  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:329-330 title 'Semester–Course Mapping' plus precise explanatory subtitle.
- vNext now: src/app/(authenticated)/college/semester-courses/page.tsx:13-17 has same title but only extra Course offerings button.
- Fix: Use full exact subtitle.

## G2-5-025-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy `GET /{semesterId}/staffing` exposes per-course staffing gap. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- vNext now: vNext staffing embedded in listing service, not standalone scoped staffing GET. `src/modules/academics/college-term-mapping-service.ts:97-132`, `src/app/(authenticated)/college/semester-courses/page.tsx:8-21`
- Fix: Keep route/report parity or clearly link to embedded staffing warning.

## G2-5-025-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy get courses in semester returns course mappings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:469-481`
- vNext now: vNext mapping read collates all chosen college terms, no semester-specific GET endpoint. `src/modules/academics/college-term-mapping-service.ts:63-132`, `src/app/(authenticated)/college/semester-courses/page.tsx:8-21`
- Fix: Expose filterable semester GET for clients or route adapter.

## G2-5-025-045  [P2] GAP  facet F13  effort M
- Legacy: Legacy lookup failure sets loadError while preserving existing data and retry UI. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:61-105`
- vNext now: vNext SSR page failure travels error boundary; create editor separate. `src/app/(authenticated)/college/semester-courses/page.tsx:8-21`, `src/components/academics/college-semester-management.tsx:40-99`
- Fix: Add in-place reload/error state for list and selected program.

## G2-16-007-063  [P3] GAP  facet F18  effort S
- Legacy: `SemesterCourseMapping.js:327-331`: title exact `Semester–Course Mapping`, subtitle coverage sentence.
- vNext now: `college/semester-courses/page.tsx:13`: title exact, subtitle missing.
- Fix: Add exact subtitle.
