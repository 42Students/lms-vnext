# Work packet: edit src/app/api/college/departments/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md

## G2-20-013-016  [P3] GAP  facet F07  effort S
- Legacy: Anonymous principal throws Authentication required `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:36-41`
- vNext now: New mutation loads currentRequestContext then service, errors via apiErrorResponse `src/app/api/college/departments/route.ts:8-16`
- Fix: Align sign-in redirect/API error mapping
