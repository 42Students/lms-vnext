# Work packet (wave 2): edit src/modules/placements/admin-company-merge-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u024-super-admin-company-controller.md

## G2-16-024-035  [P2] GAP  facet F10  effort M
- Legacy: CompanyCurationService.java:166-168 marks merged_into_company_id and soft deleted.
- vNext now: admin-company-merge-service.ts:109-111 sets ARCHIVED but no mergedInto pointer.
- Fix: Persist canonical company redirect mapping for historical links and audit.
