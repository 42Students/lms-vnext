# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/job-service.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/job-service.md

## G2-20-012-026  [P1] GAP  facet F12  effort S
- Legacy: Offer accept OFFERED→HIRED, decline OFFERED→REJECTED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:152-158`
- vNext now: New offer status lifecycle separate from application SUBMITTED/WITHDRAWN history [O:34-38,S:1097-1108]
- Fix: Expose combined status across offer and placement application history, not only SUBMITTED
