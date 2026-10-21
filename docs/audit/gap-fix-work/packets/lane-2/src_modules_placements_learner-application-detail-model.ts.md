# Work packet: edit src/modules/placements/learner-application-detail-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md

## G2-5-015-025  [P1] GAP  facet F10  effort M
- Legacy: Latest REJECTED oldStatus drives student stage text `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:846-853,884-890`
- vNext now: New learner labels only SUBMITTED/WITHDRAWN `src/modules/placements/learner-application-detail-model.ts:17-27`
- Fix: Generate rejected-stage text from latest recorded college stage event.

## G2-5-015-037  [P1] GAP  facet F18  effort M
- Legacy: Legacy rejection labels exact Not shortlisted, Not cleared: Assessment/Interview, Waitlist ended `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:924-932`
- vNext now: VNext mapper labels Application submitted/withdrawn and status updated `src/modules/placements/learner-application-detail-model.ts:22-27`
- Fix: Implement exact per-stage copy from immutable stage history.
