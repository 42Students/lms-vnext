# Work packet (wave 2): edit src/modules/placements/company-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u020-college-company.md, docs/audit/gap2/lane-20/company-controller.md, docs/audit/gap2/lane-4/tpo-company-controller.md, docs/audit/gap2/lane-9/college-admin-companies.md

## G2-14-020-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy row displays contact person name, email, phone and private notes `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:35-45`
- vNext now: New relationship list projects company info trusted and owner but no private contact fields `src/modules/placements/company-service.ts:117-149`
- Fix: Restore restricted contact fields in separate private relationship detail

## G2-14-020-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy shows trusted boolean with company link metrics `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:60-75` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:104-113`
- vNext now: New list shows isTrusted but no joinLinkOpens/Joins in relationship `src/modules/placements/company-service.ts:117-149`
- Fix: Show link opens, recruiter joins and link creation timestamp

## G2-14-020-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy TPO company browse links metrics separately `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:104-113`
- vNext now: New company listing includes trusted and owner status fields `src/modules/placements/company-service.ts:117-149`
- Fix: Add link metrics columns and drilldown

## G2-14-020-040  [P2] GAP  facet F13  effort S
- Legacy: Legacy absent company returns Company not found `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:79-83`
- vNext now: New create and active-company checks yield typed PlacementsServiceError `src/modules/placements/company-service.ts:235-275`
- Fix: Map forbidden vs nonexistent company copy

## G2-14-020-043  [P2] GAP  facet F14  effort M
- Legacy: Legacy join token is generated but only hash stored `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:64-66` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:85-90`
- vNext now: New company service has no link download/upload `src/modules/placements/company-service.ts:235-377`
- Fix: Generate copyable one-time URL not exposed in logs

## G2-14-020-046  [P2] GAP  facet F15  effort M
- Legacy: Legacy alreadyIn path sends no bell or welcome `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:200-206`
- vNext now: New relationship onConflictDoUpdate activity may occur independently `src/modules/placements/company-service.ts:339-374`
- Fix: Deduplicate join-triggered outbound notices

## G2-14-020-051  [P2] GAP  facet F18  effort M
- Legacy: Legacy contact person fields name/email/phone `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:38-45`
- vNext now: New company list has global company and relationship, no contact fields `src/modules/placements/company-service.ts:117-149`
- Fix: Restore private contacts wording in detail

## G2-20-027-017  [P2] GAP  facet F14  effort M
- Legacy: Old logo URL optional and validated docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:160-164
- vNext now: New logoObjectPath src/modules/placements/company-service.ts:107-130
- Fix: Use signed logo upload and preview

## G2-20-027-023  [P2] GAP  facet F20  effort M
- Legacy: Legacy matching by company domain/verified names docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:138-180
- vNext now: New global company and alias/domain tables src/modules/placements/company-service.ts:117-127
- Fix: Verify shared-company conflict merge

## G2-20-027-025  [P2] GAP  facet F22  effort L
- Legacy: Old MySQL Company/CollegeCompany numeric IDs docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:34-40
- vNext now: New placementCompanies/Relationships UUID src/modules/placements/company-service.ts:18-21
- Fix: Map legacy schemas and private fields

## G2-4-023-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy company domain can be multiple verified/unverified rows (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:240-275`)
- vNext now: vNext list relationship projection includes primaryDomain and ordered domains array (`src/modules/placements/company-service.ts:117-133`)
- Fix: Surface all domains and verified source in engagement/details, not only primaryDomain.

## G2-4-023-038  [P2] GAP  facet F10  effort M
- Legacy: POST /resolve may insert company, domain and college link with actor attribution (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-68`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:15-18`)
- vNext now: New createPlacementCompany transaction creates/enriches company and relationship, records activity (`src/modules/placements/company-service.ts:235-315`; `src/app/api/placements/tpo/companies/create/route.ts:28-38`)
- Fix: Preserve name-lock, domain-owner, attribution and existed flags in transactional result.

## G2-9-004-064  [P2] GAP  facet F15  effort M
- Legacy: Company create/update/delete events via old Java API (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:170-194`)
- vNext now: Creates activity event linking employer to college (`src/modules/placements/company-service.ts:305-338`)
- Fix: Verify separate update/archive/restore event taxonomy and audit metadata.
