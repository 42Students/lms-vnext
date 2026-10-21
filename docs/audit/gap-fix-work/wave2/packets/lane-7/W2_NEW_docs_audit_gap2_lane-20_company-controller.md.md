# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/company-controller.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/company-controller.md

## G2-20-027-001  [P2] GAP  facet F01  effort M
- Legacy: Old /api/v1/admin/companies CRUD/stats/jobs docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:91-219
- vNext now: New placements companies and relationships APIs [R:12-43,A:16-62]
- Fix: Route crosswalk

## G2-20-027-012  [P2] GAP  facet F10  effort M
- Legacy: Old create/update/delete/restore backed JPA docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:162-219
- vNext now: New POST/PATCH/DELETE/POST restore [R:28-43,A:16-62,X:9-16]
- Fix: Preserve business side effects
