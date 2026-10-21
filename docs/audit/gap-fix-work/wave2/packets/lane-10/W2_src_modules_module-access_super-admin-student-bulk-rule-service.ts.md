# Work packet (wave 2): edit src/modules/module-access/super-admin-student-bulk-rule-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l19-u026-module-access-controller.md

## G2-19-026-054  [P2] GAP  facet F19  effort S
- Legacy: Legacy bulk dedupes IDs before enforcing limit. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:579`
- vNext now: vNext zod rejects duplicate membership IDs with refinement. `src/modules/module-access/super-admin-student-bulk-rule-service.ts:14`
- Fix: Adopt stable deduplication or match explicit duplication error with user help.
