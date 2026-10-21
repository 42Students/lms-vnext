# Work packet (wave 2): edit src/modules/admin-ui/legacy-superadmin-destination-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u031-superadmin-projects-index.md

## G2-7-031-004  [P2] GAP  facet F01  effort S
- Legacy: superadmin/projects/index.js:13-15 tab default derives from group config
- vNext now: legacy-superadmin-destination-model.ts:21 literal projects mapping
- Fix: Share one central default-path definition with sidebar route map

## G2-7-031-009  [P2] GAP  facet F04  effort S
- Legacy: superadmin/projects/index.js:13-15 derives destination from navGroupDefaultPath metadata
- vNext now: legacy-superadmin-destination-model.ts:4-22 maps static route dictionary
- Fix: Source default destination from same nav model, avoid diverging tab list
