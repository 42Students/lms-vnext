# Work packet (wave 2): edit src/app/(authenticated)/college/classes/recurring-preview/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-003  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Schedule action opens recurring modal within class list. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-426; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-529)
- vNext now: Schedule navigates to new Recurring Schedule Preview route. (src/components/academics/college-structure-directory.tsx:398-401; src/app/(authenticated)/college/classes/recurring-preview/page.tsx:17-24)
- Fix: Restore modal entry/return context or replicate same modal geometry from row.
