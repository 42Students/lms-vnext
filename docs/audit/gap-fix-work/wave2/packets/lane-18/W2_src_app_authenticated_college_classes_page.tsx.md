# Work packet (wave 2): edit src/app/(authenticated)/college/classes/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-2-031-002  [P2] GAP  facet F01  effort M
- Legacy: ClassController.java:109-143 GET /getClass optional classId returns detail OR whole scoped list.
- vNext now: src/app/(authenticated)/college/classes/page.tsx:31-35 fetches one filtered list; no optional ID overload.
- Fix: Provide explicit authorized detail and list read paths rather than overloaded legacy query.

## G2-2-031-004  [P2] GAP  facet F01  effort M
- Legacy: ClassController.java:156-178 GET /getClassesByCollege with optional `search`.
- vNext now: src/app/(authenticated)/college/classes/page.tsx:11-34 uses collegeClassQuerySchema filtered server read.
- Fix: Map search query/filter field equivalence and response shape.

## G2-2-031-007  [P2] GAP  facet F02  effort M
- Legacy: Classes.js:109-160 uses `Classes` page, Create class form then table/pagination.
- vNext now: src/app/(authenticated)/college/classes/page.tsx:25-54 uses PageHeader+CollegeStructureDirectory with Create class Disclosure.
- Fix: Align old page header/canvas/create-card and table position.

## G2-2-031-015  [P2] GAP  facet F03  effort M
- Legacy: Classes.js:109-160 includes recurring schedule drawer flow.
- vNext now: college/classes/page.tsx:44-46 navigates to separate recurring-preview page.
- Fix: Clone drawer entrypoint/modal/sizing where requested; preserve separate preview function.

## G2-2-031-050  [P2] GAP  facet F11  effort M
- Legacy: ClassController.java:116-137 superadmin can fetch all, selected org or college, non-SA only college.
- vNext now: college/classes/page.tsx:21-34 requires membership and scoped list; admin classes page separate.
- Fix: Ensure SA global/org read parity through dedicated admin list instead of leaking unscoped college API.

## G2-2-031-051  [P2] GAP  facet F11  effort M
- Legacy: ClassController.java:128-129 derives learner's college if direct field null.
- vNext now: college/classes/page.tsx:21-23 redirects no membership; vNext section-service relies on role-scope.
- Fix: Document learner-safe class selectors without college admin rights.

## G2-2-031-063  [P2] GAP  facet F14  effort M
- Legacy: Classes.js:109-603 includes recurring schedule creation via non-file modal.
- vNext now: college/classes/page.tsx:44-46 adds separate recurring-preview link.
- Fix: Compare modal/schedule action parity; no file upload needed.

## G2-2-031-083  [P2] GAP  facet F21  effort M
- Legacy: ClassController.java:109-178 returns Spring `Response(status,message,data)` envelopes.
- vNext now: college/classes/page.tsx:31-35 consumes internal typed data and API mutation `{section}`.
- Fix: Port consuming API adapters without reusing mixed legacy response shapes.

## G2-5-010-009  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Refresh, Export classes.csv controls visible even when empty (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:467-476)
- vNext now: Export behind disclosure, no explicit refresh (src/components/academics/college-structure-directory.tsx:364-378; src/app/(authenticated)/college/classes/page.tsx:38-51)
- Fix: Always show action pair on directory toolbar.
