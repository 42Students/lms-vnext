# Work packet (wave 2): edit src/modules/bug-tracker/independent-audit-findings-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-025  [P3] GAP  facet F06  effort S
- Legacy: `audit-findings.js:149-150`: no explicit text max in UI (server trims query).
- vNext now: `page.tsx:80-81`; `independent-audit-findings-model.ts:7`: 120-char UI/server max.
- Fix: Decide/document query max; match legacy or present clear 120-character helper.
