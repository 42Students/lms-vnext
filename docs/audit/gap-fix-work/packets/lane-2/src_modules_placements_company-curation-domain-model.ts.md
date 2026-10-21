# Work packet: edit src/modules/placements/company-curation-domain-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-12-020-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy CompanyDomainService accepts email/URL/@domain, canonicalizes registrable domain with PSL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-103,110-138`
- vNext now: New superadmin regex max253 and website strips only www; TPO parser validates host without PSL `src/modules/placements/company-curation-domain-model.ts:2-8` `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Normalize every input to registrable domain using a complete public-suffix parser.

## G2-12-020-018  [P1] GAP  facet F06  effort M
- Legacy: Old rejects personal, disposable, academic and IP inputs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:90-102`
- vNext now: New admin domain command only validates pattern and subset academic suffix `src/modules/placements/super-admin-company-identities-service.ts:20-31` `src/modules/placements/company-curation-domain-model.ts:2-8`
- Fix: Apply full legacy category blocklists and IP checks before persisted company domain.

## G2-12-020-048  [P1] GAP  facet F20  effort M
- Legacy: Old raw domain input uses PSL registrable (mail.company.co.in→company.co.in) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:128-138`
- vNext now: New normalizer only removes www, potentially stores subdomains independently `src/modules/placements/company-curation-domain-model.ts:4-8`
- Fix: Canonicalize PSL-aware domain before uniqueness/ownership transaction.

## G2-12-020-052  [P1] GAP  facet F22  effort M
- Legacy: Legacy domain unique intent case-insensitive registrable name `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:128-138`
- vNext now: New lower(domain) unique but may store unnormalized subdomain `src/db/schema/placement-company-identities.ts:13-15` `src/modules/placements/company-curation-domain-model.ts:4-8`
- Fix: Normalize before persistence and backfill duplicates.

## G2-10-004-037  [P2] GAP  facet F07  effort M
- Legacy: Old domain accepts domain or name@company.com with ownership collision and minimum-one-domain guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-137` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:123-130`
- vNext now: New domain Input max253; schema strict hostname regex and input label says Company domain or email `src/components/admin/super-admin-company-identities.tsx:40-54` `src/modules/placements/company-curation-domain-model.ts:2-7`
- Fix: Verify email extraction path and preserve legacy collision and minimum-one-domain messages

## G2-12-020-024  [P2] GAP  facet F08  effort S
- Legacy: Old message 'Use the company's domain name, not an IP address' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:40-48`
- vNext now: New generic regex fails IP without specific copy `src/modules/placements/company-curation-domain-model.ts:2-8`
- Fix: Use IP-specific validation copy.

## G2-9-033-022  [P2] GAP  facet F07  effort M
- Legacy: Old domain accepts domain or name@company.com with ownership collision and minimum-one-domain guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-137` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:123-130`
- vNext now: New domain Input max253; schema strict hostname regex and input label says Company domain or email `src/components/admin/super-admin-company-identities.tsx:40-54` `src/modules/placements/company-curation-domain-model.ts:2-7`
- Fix: Verify email extraction path and preserve legacy collision and minimum-one-domain messages

## G2-9-034-022  [P2] GAP  facet F07  effort M
- Legacy: Old domain accepts domain or name@company.com with ownership collision and minimum-one-domain guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-137` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:123-130`
- vNext now: New domain Input max253; schema strict hostname regex and input label says Company domain or email `src/components/admin/super-admin-company-identities.tsx:40-54` `src/modules/placements/company-curation-domain-model.ts:2-7`
- Fix: Verify email extraction path and preserve legacy collision and minimum-one-domain messages
