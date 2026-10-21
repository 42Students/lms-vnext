# Work packet: edit src/modules/placements/tpo-drive-lifecycle-list-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/job-auto-expiry-service.md

## G2-19-011-033  [P1] GAP  facet F12  effort M
- Legacy: Legacy expires job even if interview rounds continue (worker no stage checks) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:53-63`
- vNext now: vNext overdue stage helper may still show Rounds or Offers after deadline `src/modules/placements/tpo-drive-lifecycle-list-model.ts:111-137`
- Fix: Allow rounds/offers to continue while applications are closed.

## G2-19-011-046  [P1] GAP  facet F18  effort S
- Legacy: Legacy `isActive=false` no literal Expired job label `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- vNext now: vNext returns `Applications closed` only as journey helper, while persisted PUBLISHED remains Live `src/modules/placements/tpo-drive-lifecycle-list-model.ts:98-108` `src/modules/placements/tpo-drive-lifecycle-list-model.ts:111-137`
- Fix: Unify expired presentation and whether rounds can still run.
