# Work packet: edit src/modules/placements/tpo-settings-people-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-team-redirect.md

## G2-4-028-058  [P1] GAP  facet F22  effort S
- Legacy: Settings TeamPeople has writable team member model (`docs/legacy-source/frontend/src/pages/tpo/settings.js:152`)
- vNext now: Service notes assignment table may be unregistered and read-only (`src/modules/placements/tpo-settings-people-service.ts:86-114`)
- Fix: Register underlying assignment schema and mutation services.
