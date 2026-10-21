# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/job-application-status-history-service-impl.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/job-application-status-history-service-impl.md

## G2-20-011-015  [P1] GAP  facet F08  effort M
- Legacy: Service catch-and-log persist failure, main operation continues `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-52`
- vNext now: New history writes in transaction; fail DB constraint can abort parent mutation [A:21-24,S:1097-1108]
- Fix: Decide audit integrity fail-closed vs legacy fail-open, implement consistent safe response/retry
