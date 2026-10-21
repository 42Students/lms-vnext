# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/department-search-controller.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md

## G2-20-013-015  [P2] GAP  facet F07  effort S
- Legacy: Non-global caller without collegeId gets 403 explicit message `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:75-83`
- vNext now: New authenticated context and client pre-scoped rows, no matching message [A:8-16,N:1-5]
- Fix: Return per-permission structured 403 with college required message for compat consumers
