# Work packet: edit src/app/api/placements/tpo/placement-rules/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-16-031-022  [P1] GAP  facet F07  effort M
- Legacy: LearnerEligibilityController.java:59-105 get eligibility/apply checks and visibility guard
- vNext now: src/app/api/placements/tpo/placement-rules/route.ts:13-14,25-27 may return DB09_MIGRATIONS_PENDING 503
- Fix: Expose actionable schema-unavailable learner eligibility state and avoid presenting disabled applications as simply ineligible
