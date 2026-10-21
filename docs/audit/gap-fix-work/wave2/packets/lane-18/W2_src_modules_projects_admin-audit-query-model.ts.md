# Work packet (wave 2): edit src/modules/projects/admin-audit-query-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md

## G2-7-030-072  [P2] GAP  facet F20  effort M
- Legacy: audit/index.js:147-210 URL hydration avoids resetting deep linked page on first load
- vNext now: admin-audit-query-model.ts:31-99 ignores legacy page key, uses cursor
- Fix: Translate old page to cursor or provide actionable compatibility reset
