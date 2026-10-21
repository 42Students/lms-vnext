# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/job-service.md

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/job-service.md

## G2-20-012-001  [P2] GAP  facet F01  effort M
- Legacy: Service entrypoints active jobs/visible jobs/application and calendar `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:24-70,73-110,211-238`
- vNext now: Split into modules application, eligibility, offers and job models; not a monolithic JobService [A:65-72,O:60-69,E:35-43]
- Fix: Produce API migration crosswalk from every Java method to vNext route and service

## G2-20-012-004  [P2] GAP  facet F02  effort S
- Legacy: Legacy apply→screen→decide workflow `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:11-20`
- vNext now: New has apply, independent eligibility, offer cascade modules [A:53-65,O:48-57]
- Fix: Map step hierarchy and in-app labels to legacy while retaining current product logic

## G2-20-012-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy application source INTERNAL and optional resume URL, fallback profile `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:83-91`
- vNext now: New placementApplications/channel and secure file receipt model; creation input schema [A:67-72,S:973-1001]
- Fix: Document source/channel mapping and optional resume fallback under private files

## G2-20-012-033  [P2] GAP  facet F18  effort S
- Legacy: Legacy names Apply, APPLIED, OFFERED, HIRED, REJECTED, Withdraw `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:82-85,138-158`
- vNext now: New application statuses SUBMITTED/WITHDRAWN, offer status separate [S:1097-1108,O:34-38]
- Fix: Create explicit UI label/translation matrix by state and role
