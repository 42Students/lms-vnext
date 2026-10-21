# Work packet: edit src/app/api/placements/tpo/companies/[companyId]/domain/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy domain owned elsewhere: `<domain> belongs to <company>.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:252-265`)
- vNext now: New domain route returns symbolic conflict code 409 (`src/app/api/placements/tpo/companies/[companyId]/domain/route.ts:16-20`)
- Fix: Show canonical owning company name, or safe reveal policy, instead of generic code.
