# Work packet: edit src/components/admin/department-directory.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md

## G2-20-013-017  [P3] GAP  facet F08  effort S
- Legacy: Success message 'Departments retrieved in Nms' `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:108-114`
- vNext now: Client status says 'N of total results' no duration `src/components/admin/department-directory.tsx:103-105`
- Fix: Do not claim latency when there is no cache; preserve operation success notice if API used
