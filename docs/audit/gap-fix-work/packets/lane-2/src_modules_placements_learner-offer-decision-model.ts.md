# Work packet: edit src/modules/placements/learner-offer-decision-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md

## G2-18-011-049  [P1] GAP  facet F12  effort L
- Legacy: Legacy one accepted offer per learner, cascade to other active applications (`JobServiceImpl.java:1168-1255,1325-1390`).
- vNext now: New offer decision model and placement college rules maxHeldOffers/uplift, different statuses (`learner-offer-decision-model.ts:3-19`; `application-service.ts:786-805`).
- Fix: Cross-check offer acceptance cross-application cascade against college max-held offers rules.
