# Work packet (wave 2): edit src/components/admin/super-admin-company-edit.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-026  [P2] GAP  facet F06  effort M
- Legacy: Old global edit modal has Name Website Logo link Industry About `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:97-108`
- vNext now: New global edit is inline form inside details with Name Website Industry About Public logo URL `src/components/admin/super-admin-company-edit.tsx:34-54`
- Fix: Use centered legacy Edit company modal with old field order and close behavior

## G2-9-034-016  [P2] GAP  facet F06  effort M
- Legacy: Old global edit modal has Name Website Logo link Industry About `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:97-108`
- vNext now: New global edit is inline form inside details with Name Website Industry About Public logo URL `src/components/admin/super-admin-company-edit.tsx:34-54`
- Fix: Use centered legacy Edit company modal with old field order and close behavior

## G2-9-034-070  [P2] GAP  facet F06  effort S
- Legacy: Edit modal heading dynamic 'Edit <name>' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:97-108`
- vNext now: Inline form heading static 'Edit company' `src/components/admin/super-admin-company-edit.tsx:34-55`
- Fix: Use name-specific modal title.

## G2-9-034-071  [P2] GAP  facet F06  effort S
- Legacy: Legacy field label 'Logo link', order Name Website Logo link Industry About `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:102-108`
- vNext now: New 'Public logo URL (HTTPS)' comes last after About `src/components/admin/super-admin-company-edit.tsx:37-48`
- Fix: Restore legacy label and field order.

## G2-9-034-072  [P3] GAP  facet F06  effort S
- Legacy: Old edit Website/Logo placeholder 'https://' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:104-105`
- vNext now: New website/logo default values but no placeholders `src/components/admin/super-admin-company-edit.tsx:41-48`
- Fix: Add exact placeholder to empty URL fields.
