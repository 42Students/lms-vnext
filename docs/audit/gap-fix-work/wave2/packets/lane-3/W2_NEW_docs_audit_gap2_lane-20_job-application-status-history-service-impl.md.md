# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/job-application-status-history-service-impl.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/job-application-status-history-service-impl.md

## G2-20-011-001  [P2] GAP  facet F01  effort M
- Legacy: Dedicated recordStatusChange and getHistoryForApplication service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:27-29,55-81`
- vNext now: History writes embedded in placement operation transactions, read via learner/staff detail services [A:21-24,H:95-129]
- Fix: Create one reusable history writer if multiple transitions require identical invariants

## G2-20-011-009  [P3] GAP  facet F05  effort S
- Legacy: Repository ordered changedAt ASC, no tie-breaker `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: Learner ordered createdAt ASC,id ASC, college only createdAt ASC [H:116-119,C:55-60]
- Fix: Use stable createdAt + id ordering across all timelines
