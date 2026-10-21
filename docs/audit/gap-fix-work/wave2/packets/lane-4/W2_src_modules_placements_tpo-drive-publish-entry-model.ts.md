# Work packet (wave 2): edit src/modules/placements/tpo-drive-publish-entry-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-8-011-011  [P2] GAP  facet F06  effort M
- Legacy: Initial transition permits only DRAFT or REQUEST (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:40-46`)
- vNext now: new lifecycle action only PUBLISH/CLOSE/REOPEN; DRAFT created through separate create route (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9; src/modules/placements/tpo-drive-publish-entry-model.ts:3-9`)
- Fix: Map REQUEST creation path separately; enforce initial-state invariant in one place
