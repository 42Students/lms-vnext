# Work packet: edit src/modules/module-access/super-admin-student-bulk-rule-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l19-u026-module-access-controller.md

## G2-19-026-056  [P0] GAP  facet F20  effort L
- Legacy: Legacy bulk preflights all IDs/locks and commits atomically. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:565`
- vNext now: vNext catches each learner failure and continues after earlier commits. `src/modules/module-access/super-admin-student-bulk-rule-service.ts:24`
- Fix: Stop partial success or make result preview/rollback behavior a deliberate product decision.

## G2-19-026-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy bulk can update 1000 learners within one Spring transaction. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:565`
- vNext now: vNext bulk processes 25 per request and each write separately. `src/modules/module-access/super-admin-student-bulk-rule-service.ts:14`
- Fix: Performance/atomicity design for 1000 learners with bounded SQL and locks.
