# Work packet: edit src/modules/placements/tpo-recruiter-access-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md

## G2-15-022-010  [P0] GAP  facet F04  effort S
- Legacy: `expired` true only when nonnull validUntil≤now; NULL explicitly `No end date`; TpoRecruiterAccessController.java:77-79; settings.js:705-709
- vNext now: `ended=REVOKED \|\| !validUntil \|\| expired`; tpo-recruiter-access-model.ts:126-127
- Fix: Fix `ended` computation: null only means ended if fail-closed security contract intentionally overrides legacy; distinguish `missing-expiry invalid` vs `never expires` in UI.

## G2-15-022-032  [P0] GAP  facet F12  effort M
- Legacy: Legacy `STATUS_ACTIVE` with `validUntil==null` considered live; RecruiterCollegeAccess.java:26-27,76-83
- vNext now: vNext NULL invalid/fail-closed (`ended` true); tpo-recruiter-access-model.ts:126-127; placements.ts `placement_recruiter_college_grants.valid_until`
- Fix: Decide conflict between legacy indefinite access and new fail-closed policy; never silently treat null as both.
