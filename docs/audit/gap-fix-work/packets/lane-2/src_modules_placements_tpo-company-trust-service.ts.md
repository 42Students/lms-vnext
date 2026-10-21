# Work packet: edit src/modules/placements/tpo-company-trust-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u020-college-company.md, docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-14-020-036  [P1] GAP  facet F12  effort M
- Legacy: Legacy trusted company recruiter drives bypass placement-cell review `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:60-62` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:30-34`
- vNext now: New isTrusted used by TPO trust service `src/modules/placements/tpo-company-trust-service.ts:19-24` `src/modules/placements/tpo-company-trust-service.ts:63-95`
- Fix: Verify trusted-drive publish fastpath and consent safeguards end-to-end

## G2-4-023-033  [P2] GAP  facet F08  effort M
- Legacy: Legacy trusted response re-reads full engagement (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:95-115`)
- vNext now: New returns `{relationshipId,isTrusted,changedAt}` after audit (`src/modules/placements/tpo-company-trust-service.ts:90-94`)
- Fix: Refresh engagement counters/domains and trust badge after toggle.
