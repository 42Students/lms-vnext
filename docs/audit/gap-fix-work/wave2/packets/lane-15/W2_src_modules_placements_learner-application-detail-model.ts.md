# Work packet (wave 2): edit src/modules/placements/learner-application-detail-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md

## G2-5-015-038  [P2] GAP  facet F18  effort M
- Legacy: Legacy shortlisted/waitlisted labels include round and date `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:913-920`
- vNext now: VNext history mapper has no round/date label `src/modules/placements/learner-application-detail-model.ts:17-27`
- Fix: Show named round and due date where persisted, omit if absent.
