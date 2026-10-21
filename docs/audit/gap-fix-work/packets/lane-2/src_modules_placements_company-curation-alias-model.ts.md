# Work packet: edit src/modules/placements/company-curation-alias-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-036  [P2] GAP  facet F07  effort S
- Legacy: Old alias validator 2..150 and collision message Merge them instead `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:183-199`
- vNext now: New alias input allows 160 and canonical normalization via NFKC `src/modules/placements/company-curation-alias-model.ts:2-11` `src/components/admin/super-admin-company-identities.tsx:41-44`
- Fix: Set alias upper limit150 and ensure cross-company collision text and normalization parity

## G2-9-034-021  [P2] GAP  facet F07  effort S
- Legacy: Old alias validator 2..150 and collision message Merge them instead `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:183-199`
- vNext now: New alias input allows 160 and canonical normalization via NFKC `src/modules/placements/company-curation-alias-model.ts:2-11` `src/components/admin/super-admin-company-identities.tsx:41-44`
- Fix: Set alias upper limit150 and ensure cross-company collision text and normalization parity
