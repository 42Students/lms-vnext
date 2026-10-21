# Work packet: edit src/modules/colleges/admin-directory-query-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-search-controller.md

## G2-4-014-017  [P1] GAP  facet F05  effort M
- Legacy: /search default limit15, accepts query,state,city,orgId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:72-84`)
- vNext now: New admin page q,page,pageSize only, pageSize defaults25. (`src/app/(authenticated)/admin/colleges/page.tsx:91-99`; `src/modules/colleges/admin-directory-query-model.ts:17-28`)
- Fix: Support default15 top-N search plus all legacy filters.
