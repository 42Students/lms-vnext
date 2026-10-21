# Work packet: edit src/modules/projects/admin-risk-query-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-7-029-004  [P1] GAP  facet F01  effort M
- Legacy: superadmin/projects/at-risk/index.js:82-101 URL filter and search are hydrated and persisted
- vNext now: admin-risk-query-model.ts:9-31 accepts riskBucket, q; legacy filter/search not accepted
- Fix: Translate legacy filter=stalled/blocker/review and search= into modern riskBucket/q

## G2-7-029-086  [P1] GAP  facet F20  effort M
- Legacy: superadmin/projects/at-risk/index.js:82-101 restores filter/search exact URL and shallow replace
- vNext now: admin-risk-query-model.ts:9-31 rejects old keys filter/search and >one values
- Fix: Translate old bookmarks before strict parsing
