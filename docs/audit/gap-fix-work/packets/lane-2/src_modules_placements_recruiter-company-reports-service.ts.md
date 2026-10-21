# Work packet: edit src/modules/placements/recruiter-company-reports-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-028  [P1] GAP  facet F05  effort L
- Legacy: Reports rows source exclusively recruiter's own drives (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:97-104`)
- vNext now: Rows include all company-relationship PUBLISHED/CLOSED jobs (`src/modules/placements/recruiter-company-reports-service.ts:95-108`)
- Fix: Decide owner scope explicitly; if exact parity required constrain to creator/approved owned jobs.

## G2-13-001-050  [P1] GAP  facet F12  effort L
- Legacy: Reports per drive use workspace.funnel(jobId) and SUM totals by stage (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:97-124`)
- vNext now: New report derives SQL funnel from PUBLISHED/CLOSED relationship portfolio (`src/modules/placements/recruiter-company-reports-service.ts:281-303`)
- Fix: Reconcile funnel stage definitions, status inclusion, and own-drive cohort against original model.

## G2-13-001-084  [P1] GAP  facet F22  effort L
- Legacy: Legacy job_offer aggregates RELEASED/ACCEPTED/DECLINED and JOINED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:105-116`)
- vNext now: New placement_offers ISSUED/ACCEPTED/DECLINED with joining-outcome join (`src/modules/placements/recruiter-company-reports-service.ts:205-225`)
- Fix: Map RELEASED→ISSUED and joined semantics; verify old offer schema and Drizzle enum migrations.
