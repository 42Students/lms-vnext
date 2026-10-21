# Work packet: edit src/components/tpo/tpo-company-team-conversation.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-059  [P1] GAP  facet F10  effort L
- Legacy: Legacy company Team chat uses GET about `kind=COMPANY&key=normalized name`; messages POST by about name. `docs/legacy-source/frontend/src/pages/tpo/companies.js:188`
- vNext now: vNext embedded conversation uses canonical UUID companyId and same-company actor membership. `src/components/tpo/tpo-company-team-conversation.tsx:15`
- Fix: Ensure name-keyed legacy threads remain reachable after canonical ID migration.
