# Verification packet (P1 sample): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-035-013 [P1] GAP facet F03
- Files: src/components/projects/project-template-controls.tsx
- Legacy: overview.js:451-456 disabled Publish with tooltip links to missing Deliverables/Sprints
- Expected fix: Show publish prerequisite tooltip and navigation links before disabled button

## G2-9-002-013 [P1] GAP facet F04
- Files: src/app/(authenticated)/college/batch-promotion/page.tsx
- Legacy: Batch Name, Program, Semester, Academic Year, Students, Status, Action (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:283-321`)
- Expected fix: Restore all seven columns in all-batch list.

## G2-9-017-043 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/lecture-halls/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-312` — Independent colleges/departments failure banners with Retry; optional department stays blank.
- Expected fix: Isolate department lookup failure; allow creating without department.
