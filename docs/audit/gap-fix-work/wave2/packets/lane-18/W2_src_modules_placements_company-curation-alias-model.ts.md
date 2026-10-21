# Work packet (wave 2): edit src/modules/placements/company-curation-alias-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-031  [P2] GAP  facet F06  effort S
- Legacy: Old aliases modal separate Add Other name up to 150 chars and tags `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:135-158`
- vNext now: New inline field has maxLength160 and plain list with Remove buttons `src/components/admin/super-admin-company-identities.tsx:36-55` `src/modules/placements/company-curation-alias-model.ts:2-5`
- Fix: Use 150-character alias cap and legacy modal/chip presentation

## G2-10-004-089  [P2] GAP  facet F22  effort M
- Legacy: Legacy V218 alias varchar150 with uniqueness alias_key per company plus created_by_user_id `docs/legacy-source/backend/src/main/resources/db/migration/V218__company_aliases.sql:6-15`
- vNext now: New curation alias validator max160 and normalized NFKC lowercase, identity table separate `src/modules/placements/company-curation-alias-model.ts:2-11`
- Fix: Align alias cap and collision/creator provenance with legacy table

## G2-9-034-019  [P2] GAP  facet F06  effort S
- Legacy: Old aliases modal separate Add Other name up to 150 chars and tags `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:135-158`
- vNext now: New inline field has maxLength160 and plain list with Remove buttons `src/components/admin/super-admin-company-identities.tsx:36-55` `src/modules/placements/company-curation-alias-model.ts:2-5`
- Fix: Use 150-character alias cap and legacy modal/chip presentation

## G2-9-034-054  [P2] GAP  facet F22  effort M
- Legacy: Legacy V218 alias varchar150 with uniqueness alias_key per company plus created_by_user_id `docs/legacy-source/backend/src/main/resources/db/migration/V218__company_aliases.sql:6-15`
- vNext now: New curation alias validator max160 and normalized NFKC lowercase, identity table separate `src/modules/placements/company-curation-alias-model.ts:2-11`
- Fix: Align alias cap and collision/creator provenance with legacy table
