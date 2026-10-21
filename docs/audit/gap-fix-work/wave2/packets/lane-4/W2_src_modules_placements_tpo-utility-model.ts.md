# Work packet (wave 2): edit src/modules/placements/tpo-utility-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:53 — TPO role Placement officer, ADMIN College admin (acts as placement officer), fallback Placement team.
- vNext now: src/modules/placements/tpo-utility-model.ts:72-86 — TPO displayed TPO, other roles title-cased.
- Fix: Use legacy human role labels.
