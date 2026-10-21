# Work packet: edit src/modules/placements/public-join/company-preview-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/public-company-join-controller.md

## G2-6-026-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy company-domain check resolves among domains registered to linked company (CompanyJoinService.java:239-253).
- vNext now: VNext compares email with link.companyDomain/primaryDomain (send-code-service.ts:59-74; company-preview-policy.ts:1-5).
- Fix: Support all verified domains for the company, not only a single primary domain.
