# Work packet: edit src/modules/departments/college-department-mutation-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-departments.md

## G2-9-006-042  [P1] GAP  facet F12  effort M
- Legacy: Delete blocked when linked program/course/faculty, known 3-counts (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:201-223`)
- vNext now: Archive checks all historical dependencies including archived children (`src/modules/departments/college-department-mutation-service.ts:122-152`)
- Fix: Compare archival safety rule: vNext stricter than displayed active-only count; explain mismatch.

## G2-9-006-076  [P1] GAP  facet F22  effort M
- Legacy: Legacy delete removes department after dependency check (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:210-250`)
- vNext now: Soft archive timestamp instead (`src/modules/departments/college-department-mutation-service.ts:124-155`)
- Fix: Confirm retention policy and visibility impacts, do not silently hard delete.
