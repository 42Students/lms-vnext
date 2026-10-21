# Work packet: edit src/modules/placements/admin-company-merge-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-049  [P1] GAP  facet F10  effort L
- Legacy: Legacy global merge moves domains jobs recruiters college notes aliases and marks old merged id `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- vNext now: New merge moves jobs/recruiters/grants and relationship status, but code does not move alias records or college notes and rejects shared cross-college source `src/modules/placements/admin-company-merge-service.ts:44-125`
- Fix: Specify safe migration for aliases/domains/private notes and multi-college merge; enforce explicit approval

## G2-10-004-055  [P1] GAP  facet F12  effort L
- Legacy: Legacy merges duplicate globally if two live companies and moves every college relation `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- vNext now: New merge refuses source relationships in any other college `src/modules/placements/admin-company-merge-service.ts:44-54`
- Fix: Support approved platform-wide merge across colleges with transactional privacy preservation or document deliberate restriction

## G2-10-004-056  [P1] MISSING  facet F12  effort M
- Legacy: Legacy merges original company name into target alias for future search `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:158-166`
- vNext now: New merge archives source but no former-name alias creation in service `src/modules/placements/admin-company-merge-service.ts:97-125`
- Fix: Create canonical alias from merged identity and preserve source alias search

## G2-16-024-031  [P1] GAP  facet F10  effort L
- Legacy: CompanyCurationService.java:142-170 merge rehomes domains/jobs/recruiters/college relationships and aliases.
- vNext now: admin-company-merge-service.ts:44-125 rehomes jobs/grants/recruiters and relationships only for one college.
- Fix: Define true global merge or explicitly restrict UI to acting college and reject shared identities with clear explanation.

## G2-16-024-032  [P1] GAP  facet F10  effort L
- Legacy: CompanyCurationService.java:150-155 merge appends source college private notes into target on overlap.
- vNext now: admin-company-merge-service.ts:87-95 merges trust/owner/share defaults; no notes merge shown.
- Fix: Preserve per-college CRM notes/history on merge with access controls.

## G2-16-024-033  [P1] MISSING  facet F10  effort M
- Legacy: CompanyCurationService.java:158-165 moves aliases and source name to canonical.
- vNext now: admin-company-merge-service.ts:97-111 only transfers primary domain/website/logo, no alias move.
- Fix: Copy aliases and old name before archiving source; preserve company search by old identity.

## G2-16-024-034  [P1] MISSING  facet F10  effort M
- Legacy: CompanyCurationService.java:147 domains moved to target.
- vNext now: admin-company-merge-service.ts:97-108 primaryDomain copied when empty, no domain table migration.
- Fix: Transfer domain table rows with conflict resolution.

## G2-16-024-037  [P1] GAP  facet F11  effort L
- Legacy: CompanyCurationService.java:140-171 legacy merge global across colleges.
- vNext now: admin-company-merge-service.ts:19-26,48-54 restrict source exclusive to acting college.
- Fix: Document new safety policy and offer admin-safe multi-college merge workflow.

## G2-16-024-052  [P1] GAP  facet F20  effort L
- Legacy: CompanyCurationService.java:147-165 `UPDATE IGNORE` on aliases/domains.
- vNext now: admin-company-merge-service.ts:97-108 no alias/secondary domain transfers.
- Fix: Use deterministic conflict and partial rollback for domain/alias merges.

## G2-16-024-054  [P1] GAP  facet F22  effort L
- Legacy: CompanyCurationService.java:140-170 MySQL company/company_alias/company_domain/college_company/job/recruiter updates.
- vNext now: admin-company-merge-service.ts:44-125 Postgres normalized placement tables; missing alias/domain/note move.
- Fix: Write per-FK/data migration map for global merge and preserve source lineage.

## G2-16-024-056  [P1] MISSING  facet F23  effort M
- Legacy: CompanyCurationService.java:158-165 old name always indexed as alias after merge.
- vNext now: admin-company-merge-service.ts:97-111 no alias migration.
- Fix: Guarantee search old legal name after archive.

## G2-9-034-028  [P1] GAP  facet F10  effort L
- Legacy: Legacy global merge moves domains jobs recruiters college notes aliases and marks old merged id `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- vNext now: New merge moves jobs/recruiters/grants and relationship status, but code does not move alias records or college notes and rejects shared cross-college source `src/modules/placements/admin-company-merge-service.ts:44-125`
- Fix: Specify safe migration for aliases/domains/private notes and multi-college merge; enforce explicit approval

## G2-9-034-031  [P1] GAP  facet F12  effort L
- Legacy: Legacy merges duplicate globally if two live companies and moves every college relation `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- vNext now: New merge refuses source relationships in any other college `src/modules/placements/admin-company-merge-service.ts:44-54`
- Fix: Support approved platform-wide merge across colleges with transactional privacy preservation or document deliberate restriction

## G2-9-034-032  [P1] MISSING  facet F12  effort M
- Legacy: Legacy merges original company name into target alias for future search `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:158-166`
- vNext now: New merge archives source but no former-name alias creation in service `src/modules/placements/admin-company-merge-service.ts:97-125`
- Fix: Create canonical alias from merged identity and preserve source alias search

## G2-9-034-095  [P1] GAP  facet F10  effort L
- Legacy: Legacy merge reassigns global domains, jobs, recruiters, college contacts and aliases in one transaction `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- vNext now: New merge prohibits cross-college sources and archives source relationship `src/modules/placements/admin-company-merge-service.ts:20-111`
- Fix: Implement audited full-scope merge with private CRM/alias/domain migration or explicitly reject UI claim.

## G2-9-034-099  [P1] MISSING  facet F12  effort M
- Legacy: Legacy merge's previous name becomes alias of target `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:158-165`
- vNext now: New merge service never creates alias from old company name `src/modules/placements/admin-company-merge-service.ts:91-126`
- Fix: Preserve old canonical name and aliases for company search.
