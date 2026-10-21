# Work packet (wave 2): edit src/app/(authenticated)/college/electives/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-4-024-001  [P2] GAP  facet F01  effort M
- Legacy: College-admin and selected-college super-admin manage Electives under /api/v1/electives/admin (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:38-46`)
- vNext now: New /college/electives server page and /api/academics/elective-slots with acting-college support (`src/app/(authenticated)/college/electives/page.tsx:18-29`; `src/app/api/academics/elective-slots/route.ts:9-24`)
- Fix: Match Electives navigation, breadcrumb, selected college behavior and active menu.

## G2-4-024-002  [P2] GAP  facet F01  effort M
- Legacy: Slots available GET /slots with programId, semester, includeArchived=false defaults (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:81-87`)
- vNext now: New electives directory uses URL filters and paged directory read (`src/app/(authenticated)/college/electives/page.tsx:31-43`; `src/modules/academics/college-structure-directory-service.ts:25-38`)
- Fix: Map includeArchived, semester and program default filter semantics.

## G2-4-024-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy selection of college missing returns `Select a college first` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:68-76`)
- vNext now: New redirects without membership and displays optional-module off notice (`src/app/(authenticated)/college/electives/page.tsx:21-29`)
- Fix: Restore selected college warning for acting Super Admin rather than a misleading disabled module.

## G2-4-024-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy slot detail groups slot properties, nested offerings and allocated counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:18-39`)
- vNext now: New CollegeStructureDirectory combines slot table and optional creation panel (`src/app/(authenticated)/college/electives/page.tsx:39-55`)
- Fix: Preserve nested offering roster and metrics in original hierarchy under one canvas.

## G2-4-024-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy GET slots list accepts optional program, semester, includeArchived (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:81-87`)
- vNext now: New directory query has paginated URL filters with program and status (`src/app/(authenticated)/college/electives/page.tsx:31-43`)
- Fix: Retain include archived and default active ordering with independent semester dropdown.

## G2-9-007-001  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/electives.js:16-18` — Active menu item electives on mount
- vNext now: `src/app/(authenticated)/college/electives/page.tsx:1-13` — Route /college/electives uses server context and no page-level Redux menu update
- Fix: Verify and implement exact legacy active menu highlighting

## G2-9-007-005  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:196-218` — Toolbar then explanatory alert then middle-density table
- vNext now: `src/app/(authenticated)/college/electives/page.tsx:38-62` — Create manager and export before FilterBar/table; no slot explanatory alert
- Fix: Match legacy section order and render the complete info alert
