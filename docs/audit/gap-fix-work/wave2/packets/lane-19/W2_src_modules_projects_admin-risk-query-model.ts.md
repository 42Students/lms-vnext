# Work packet (wave 2): edit src/modules/projects/admin-risk-query-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-7-029-028  [P2] GAP  facet F05  effort M
- Legacy: superadmin/projects/at-risk/index.js:281 Inactive numeric sorter ascending/descending
- vNext now: admin-risk-query-model.ts:11 accepts INACTIVE sort but list defaults differently
- Fix: Expose column sort and tie handling for inactive days

## G2-7-029-085  [P2] GAP  facet F19  effort S
- Legacy: superadmin/projects/at-risk/index.js:449 fixed25 page size
- vNext now: admin-risk-query-model.ts:14-15 accepts 10–100 and defaults25
- Fix: Disable size-changing affordance in parity mode

## G2-7-029-087  [P2] GAP  facet F20  effort S
- Legacy: superadmin/projects/at-risk/index.js:145 reset projectPage=0 after selected college/filter/search change
- vNext now: admin-risk-query-model.ts:9-31 carries page query unchanged if filter link constructed separately
- Fix: Reset page to first on bucket/query changes

## G2-7-029-029  [P3] GAP  facet F05  effort S
- Legacy: superadmin/projects/at-risk/index.js:449 pageSize25 fixed, current projectPage+1
- vNext now: admin-risk-query-model.ts:14-15 pageSize25 default but ProjectAdminPagination shared rows options
- Fix: Match fixed25 with no size changer for risk list
