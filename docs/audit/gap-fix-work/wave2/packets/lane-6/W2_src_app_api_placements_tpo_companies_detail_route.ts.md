# Work packet (wave 2): edit src/app/api/placements/tpo/companies/detail/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-056  [P2] GAP  facet F10  effort L
- Legacy: GET legacy `/api/v1/tpo/companies/detail?name=` -> `companyDetail(college(),name)`; GET `/drives/counts` independently. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:202`
- vNext now: vNext GET `/api/placements/tpo/companies/detail?collegeId=&name=`; backend requires manage scope, CRM table ready. `src/app/api/placements/tpo/companies/detail/route.ts:8`
- Fix: Reconcile response envelope, explicit college parameter and counts failure handling.
