# Work packet: edit src/modules/placements/learner-job-service.ts (part 3 of 3)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-18/job-service-impl.md

## G2-18-013-018  [P2] GAP  facet F07  effort S
- Legacy: Legacy org absent yields 403 exact Organization context required for job search. Provide learnerId or ensure authentication.; JobSearchController.java:159-166
- vNext now: vNext require active learner membership and permission; learner-job-service.ts:42-65
- Fix: Map authorization codes without revealing job existence; use role-appropriate error text

## G2-18-011-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy incomplete hierarchy `Learner hierarchy is incomplete; cannot apply to jobs.` (`JobServiceImpl.java:448-456`).
- vNext now: New if no exact active enrollment returns empty list; write returns PLACEMENT_APPLICATION_INELIGIBLE (`learner-job-service.ts:155-165`; `application-service.ts:647-654`).
- Fix: Preserve precise recovery message; don't leak target details.
