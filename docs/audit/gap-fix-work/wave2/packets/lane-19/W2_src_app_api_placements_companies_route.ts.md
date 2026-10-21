# Work packet (wave 2): edit src/app/api/placements/companies/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/company-controller.md

## G2-20-027-016  [P2] GAP  facet F13  effort S
- Legacy: Old invalid collegeId 400 positive integer docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:93-98
- vNext now: New UUID collegeId parse src/app/api/placements/companies/route.ts:15-20
- Fix: Map invalid route state

## G2-20-027-021  [P3] GAP  facet F18  effort S
- Legacy: Companies fetched/company created exact wording docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:103-105,173-175
- vNext now: New API {companies}/entity JSON src/app/api/placements/companies/route.ts:18-43
- Fix: Restore notice copy
