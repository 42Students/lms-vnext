# Work packet: edit src/modules/placements/tpo-company-hiring-pulse-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-022  [P1] GAP  facet F04  effort L
- Legacy: Legacy hiring per year counts distinct placed learners by **job creation year**, honoring college counts-as-placed rules. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:412`
- vNext now: vNext canonical detail computes confirmed JOINED learners by joining date; name Memory also says JOINED in chart and computes companyHiredByYear. `src/modules/placements/tpo-company-hiring-pulse-model.ts:13`
- Fix: Decide intended KPI equivalence; preserve job-year/placed-rule figure on exact cloned surface.
