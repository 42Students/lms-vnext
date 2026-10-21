# Work packet (wave 2): edit src/app/(authenticated)/tpo/students/requests/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy requests queue is separate endpoint used for Students requests view. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:220-225`)
- vNext now: New requests page separate route and status filters. (`src/app/(authenticated)/tpo/students/requests/page.tsx:111-172`)
- Fix: Match legacy requests entry tab, counts and time shortcuts.

## G2-4-022-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy requestsQueue includeDecided false by default, decidedDays defaults30, 0 all history. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:220-225`)
- vNext now: New requests UI has status, search and paging, decidedDays behavior not clear. (`src/app/(authenticated)/tpo/students/requests/page.tsx:111-172`)
- Fix: Restore Last 30 days and all-history affordance.
