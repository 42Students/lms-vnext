# Work packet (wave 2): edit src/modules/placements/super-admin-hr-validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-104  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:494-511 — Fields name split plus freeform companyName.
- vNext now: src/modules/placements/super-admin-hr-validation.ts:34-49 — Canonical displayName and selected companyRelationship, new company path.
- Fix: Split/join names without losing multi-part surnames; map freeform company carefully.
