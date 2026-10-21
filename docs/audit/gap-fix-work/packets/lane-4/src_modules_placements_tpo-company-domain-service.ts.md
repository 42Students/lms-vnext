# Work packet: edit src/modules/placements/tpo-company-domain-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-12-020-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy domain created by recruiter/TPO/superadmin flows via shared resolver `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25`
- vNext now: New admin CompanyDomains ADD/REMOVE; TPO add writes only primaryDomain `src/modules/placements/super-admin-company-identities-service.ts:20-53` `src/modules/placements/tpo-company-domain-service.ts:18-49`
- Fix: Route TPO/recruiter domain mutations through same child domain aggregate.

## G2-12-020-029  [P1] GAP  facet F10  effort M
- Legacy: Legacy domain row unique company global, verified state stored per row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-35`
- vNext now: TPO action updates only placementCompanies.primaryDomain and doesn't insert child row `src/modules/placements/tpo-company-domain-service.ts:39-57`
- Fix: Make TPO mutation insert matching child row transactionally.

## G2-12-020-034  [P1] GAP  facet F11  effort M
- Legacy: Old checkDomain central shared across recruiters,TPO,Settings,superadmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25`
- vNext now: New admin and TPO separate regex/checks `src/modules/placements/super-admin-company-identities-service.ts:20-31` `src/modules/placements/tpo-company-domain-service.ts:18-25`
- Fix: Use one domain policy service to avoid inconsistent validation.

## G2-12-020-053  [P1] GAP  facet F22  effort M
- Legacy: Legacy explicit CompanyDomain table allows multiple domains for same company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-32`
- vNext now: New also child table, but primaryDomain synchronized only by global admin service `src/db/schema/placement-company-identities.ts:6-15` `src/modules/placements/super-admin-company-identities-service.ts:40-52` `src/modules/placements/tpo-company-domain-service.ts:39-49`
- Fix: Unify write paths and enforce primaryDomain child FK/invariant.

## G2-12-020-054  [P1] GAP  facet F23  effort L
- Legacy: Old verifiedBy42 per domain and actor/college provenance for ownership trust `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-44`
- vNext now: New row lacks these and TPO primary domain bypasses child `src/db/schema/placement-company-identities.ts:6-15` `src/modules/placements/tpo-company-domain-service.ts:39-49`
- Fix: Close verification/provenance/aggregation integrity before parity signoff.

## G2-13-012-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:22-34` Spring @Component called through MailDomainResolver.lookup by company-domain checks
- vNext now: `src/modules/placements/public-join/send-code-service.ts:75-91` inline resolveMx inside public invitation code API workflow; `src/modules/placements/tpo-company-domain-service.ts:18-26` company domain writer separate
- Fix: Extract shared DomainMailResolver service and call consistently from every relevant company-domain entry point

## G2-13-012-002  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-24` public recruiter/TPO/admin company-domain paths use one service; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-102` checkEmail/checkDomain
- vNext now: `src/modules/placements/public-join/send-code-service.ts:38-75` MX checks only public-code flow; `src/modules/placements/tpo-company-domain-service.ts:18-57` accepts validated domain without mail check
- Fix: Map every legacy checkEmail/checkDomain call site to vNext and apply equivalent requireMail policy

## G2-13-012-011  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:90-102` requireMail flag permits skipping DNS when false
- vNext now: `src/modules/placements/public-join/send-code-service.ts:75-91` public join always requires MX; `src/modules/placements/tpo-company-domain-service.ts:12-25` domain write never checks DNS
- Fix: Expose requireMail boolean per caller and document when true/false instead of inconsistent behavior

## G2-13-012-025  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-24` single validator used across recruiter, TPO, company setup, admin
- vNext now: `src/modules/placements/tpo-company-domain-service.ts:18-25` demands active TPO membership & placements.manage, but does no DNS
- Fix: Apply shared mail-domain decision after authorization for privileged company-domain edits

## G2-12-012-013  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:99-106 checks local deny lists, academia then optional DNS
- vNext now: src/modules/placements/tpo-company-domain-service.ts:25-49 only schema validation and DB write, without resolver
- Fix: Call shared company-domain validation including deny lists/academic/IP/DNS before mutating primaryDomain

## G2-12-012-014  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:56-61 defines common company-domain rules for recruiter signup, invites, TPO, Settings and Super Admin
- vNext now: src/modules/placements/tpo-company-domain-service.ts:18-24 requires active TPO; src/modules/placements/public-join/send-code-service.ts:38-53 separate anonymous rules
- Fix: Centralize domain policy across role-gated writes and anonymous verification without leaking domain lookups
