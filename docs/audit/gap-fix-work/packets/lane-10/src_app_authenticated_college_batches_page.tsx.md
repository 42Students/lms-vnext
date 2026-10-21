# Work packet: edit src/app/(authenticated)/college/batches/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-6/batch-search-controller.md

## G2-9-003-003  [P1] GAP  facet F01  effort M
- Legacy: No college warning with Contact administrator (`docs/legacy-source/frontend/src/pages/college-admin/batches.js:20-31`)
- vNext now: No membership redirects /dashboard (`src/app/(authenticated)/college/batches/page.tsx:20-24`)
- Fix: Render legacy warning rather than silent redirect.

## G2-9-003-051  [P1] GAP  facet F11  effort M
- Legacy: Missing college warning (`docs/legacy-source/frontend/src/pages/college-admin/batches.js:18-31`)
- vNext now: redirect dashboard (`src/app/(authenticated)/college/batches/page.tsx:20-24`)
- Fix: Show contact administrator warning.

## G2-6-014-011  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:99-103`
- vNext now: `src/app/(authenticated)/college/batches/page.tsx:25-32`
- Fix: Return original 403 programId-required copy on legacy endpoint
