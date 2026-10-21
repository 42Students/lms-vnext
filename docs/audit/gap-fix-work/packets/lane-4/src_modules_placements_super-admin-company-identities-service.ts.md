# Work packet: edit src/modules/placements/super-admin-company-identities-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md

## G2-12-020-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy domain created by recruiter/TPO/superadmin flows via shared resolver `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25`
- vNext now: New admin CompanyDomains ADD/REMOVE; TPO add writes only primaryDomain `src/modules/placements/super-admin-company-identities-service.ts:20-53` `src/modules/placements/tpo-company-domain-service.ts:18-49`
- Fix: Route TPO/recruiter domain mutations through same child domain aggregate.

## G2-12-020-018  [P1] GAP  facet F06  effort M
- Legacy: Old rejects personal, disposable, academic and IP inputs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:90-102`
- vNext now: New admin domain command only validates pattern and subset academic suffix `src/modules/placements/super-admin-company-identities-service.ts:20-31` `src/modules/placements/company-curation-domain-model.ts:2-8`
- Fix: Apply full legacy category blocklists and IP checks before persisted company domain.

## G2-12-020-034  [P1] GAP  facet F11  effort M
- Legacy: Old checkDomain central shared across recruiters,TPO,Settings,superadmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25`
- vNext now: New admin and TPO separate regex/checks `src/modules/placements/super-admin-company-identities-service.ts:20-31` `src/modules/placements/tpo-company-domain-service.ts:18-25`
- Fix: Use one domain policy service to avoid inconsistent validation.

## G2-12-020-035  [P1] GAP  facet F12  effort M
- Legacy: Legacy verifiedBy42 false until manual verification `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New domain is accepted immediately without row-level verified status `src/modules/placements/super-admin-company-identities-service.ts:35-45` `src/db/schema/placement-company-identities.ts:6-15`
- Fix: Keep domain unverified until explicit attestation, do not confer recruiter claim rights prematurely.

## G2-12-020-053  [P1] GAP  facet F22  effort M
- Legacy: Legacy explicit CompanyDomain table allows multiple domains for same company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-32`
- vNext now: New also child table, but primaryDomain synchronized only by global admin service `src/db/schema/placement-company-identities.ts:6-15` `src/modules/placements/super-admin-company-identities-service.ts:40-52` `src/modules/placements/tpo-company-domain-service.ts:39-49`
- Fix: Unify write paths and enforce primaryDomain child FK/invariant.

## G2-12-020-055  [P1] GAP  facet F23  effort M
- Legacy: Old domain accepts website/email/registrable normalized input via one CompanyDomainService `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25,77-103`
- vNext now: New validators diverge between public/admin/TPO `src/modules/placements/super-admin-company-identities-service.ts:20-31` `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Adopt shared registry validation with exact error mapping.

## G2-9-034-096  [P1] GAP  facet F11  effort M
- Legacy: Legacy global list is superadmin-only independent of college scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:20-24`
- vNext now: New identities/edit require global scope, and UI hides actions when scope selected `src/modules/placements/super-admin-company-identities-service.ts:15-19`; `src/modules/placements/super-admin-company-edit-service.ts:13-17`
- Fix: Treat 42 global catalogue as independent platform scope even if header has a selected college, with safe scoping.

## G2-12-020-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy NO_MAIL distinguishes absent MX+address from temp DNS error `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:86-103`
- vNext now: New no DNS on superadmin add, host regex alone passes `src/modules/placements/super-admin-company-identities-service.ts:20-31`
- Fix: If mail verification requested, reject undeliverable domain with tri-state logic.

## G2-12-020-025  [P2] GAP  facet F08  effort S
- Legacy: Old message 'College and university addresses can't be used for a company' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:40-49`
- vNext now: New only .edu/.ac.in explicitly rejected 'A college domain cannot be claimed by a company.' `src/modules/placements/super-admin-company-identities-service.ts:28-31`
- Fix: Retain full academic list and original copy.

## G2-12-020-026  [P2] MISSING  facet F08  effort S
- Legacy: Old says 'This domain doesn't receive email. Check the spelling' when requireMail `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:40-49`
- vNext now: New no company-domain add DNS check and thus no equivalent error `src/modules/placements/super-admin-company-identities-service.ts:20-53`
- Fix: Show distinct no-mail state in flows requiring deliverability.

## G2-16-024-024  [P2] GAP  facet F07  effort M
- Legacy: CompanyCurationService.java:187-196 alias conflict references conflicting company name.
- vNext now: super-admin-company-identities-service.ts:73-80 only generic other company conflict.
- Fix: Return safe conflicting company name where appropriate, preserve actionable merge hint.

## G2-9-034-079  [P2] GAP  facet F07  effort S
- Legacy: Legacy alias attempts against another company name say Merge them instead `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:183-199`
- vNext now: New service says 'Other name conflicts with another company.' `src/modules/placements/super-admin-company-identities-service.ts:71-80`
- Fix: Map distinct alias conflicts to detailed legacy messages.

## G2-9-034-080  [P2] GAP  facet F07  effort S
- Legacy: Domain already owned gives '<domain> already belongs to another company. Merge them instead.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-115`
- vNext now: New 'Domain belongs to another company.' `src/modules/placements/super-admin-company-identities-service.ts:35-39`
- Fix: Include conflicting domain and merge guidance.

## G2-16-024-022  [P3] GAP  facet F07  effort S
- Legacy: CompanyCurationService.java:112-115 domain conflict message `already belongs to another company. Merge them instead`.
- vNext now: super-admin-company-identities-service.ts:35-38 says `Domain belongs to another company.`
- Fix: Preserve actionable Merge them instead text.

## G2-16-024-023  [P3] GAP  facet F07  effort S
- Legacy: CompanyCurationService.java:134 `A company keeps at least one domain`.
- vNext now: super-admin-company-identities-service.ts:47-48 `Keep at least one company domain.`
- Fix: Align exact wording.

## G2-9-034-081  [P3] GAP  facet F07  effort S
- Legacy: Legacy must keep >=1 domain: 'A company keeps at least one domain' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:129-136`
- vNext now: New 'Keep at least one company domain.' `src/modules/placements/super-admin-company-identities-service.ts:47-50`
- Fix: Restore exact minimum-domain message.
