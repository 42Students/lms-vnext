# Work packet (wave 3): edit src/modules/projects/workspace-brief-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md

## G2-18-028-047  [P1] MISSING  facet F23  effort L
- Legacy: Old map facts persisted unchanged; overview.js:41-56,80-97
- vNext now: New strict authoredBrief drops unknown keys; workspace-brief-model.ts:2-12;workspace-brief-service.ts:23-26
- Fix: Preserve historical overview facts via schema translator
