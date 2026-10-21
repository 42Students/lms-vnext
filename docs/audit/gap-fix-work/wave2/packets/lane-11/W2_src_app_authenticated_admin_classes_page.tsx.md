# Work packet (wave 2): edit src/app/(authenticated)/admin/classes/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-5-008-024  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Search matches class/program/batch/capacity/description immediately (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:468-470)
- vNext now: Search term q manual Filter submit (src/app/(authenticated)/admin/classes/page.tsx:53-56; src/app/(authenticated)/admin/classes/page.tsx:71-73)
- Fix: Implement immediate search with capacity matching.

## G2-5-008-055  [P2] GAP  facet F13 States  effort M
- Legacy: Loading TableSkeleton 8x8 and refresh status (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:496-509)
- vNext now: SSR await and EmptyState, no list skeleton on page (src/app/(authenticated)/admin/classes/page.tsx:28-33; src/app/(authenticated)/admin/classes/page.tsx:76-80)
- Fix: Add skeleton/refresh distinction.

## G2-5-008-062  [P2] GAP  facet F16 Responsive  effort M
- Legacy: 165px compact filters, scroll table x=max-content (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:489-500)
- vNext now: Responsive multi-column search and DataTable (src/app/(authenticated)/admin/classes/page.tsx:40-75; src/app/(authenticated)/admin/classes/page.tsx:79-96)
- Fix: Match legacy filter widths and overflow on tablet.

## G2-5-008-066  [P2] GAP  facet F18 Wording  effort S
- Legacy: Classes & Sections, Create New Class/Section, Existing Classes/Sections (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:442-448)
- vNext now: Classes, Manage classes, no matching subtitle (src/app/(authenticated)/admin/classes/page.tsx:35; src/app/(authenticated)/admin/classes/page.tsx:77-80)
- Fix: Use exact page/card headings.
