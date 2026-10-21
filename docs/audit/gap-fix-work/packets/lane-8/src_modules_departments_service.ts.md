# Work packet: edit src/modules/departments/service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-14-031-023  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:169-171 'Department updated successfully'
- vNext now: src/modules/departments/service.ts:293-340 returns typed result
- Fix: Use legacy update success toast on page
