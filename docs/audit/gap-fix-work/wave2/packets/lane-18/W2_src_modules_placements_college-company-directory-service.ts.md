# Work packet (wave 2): edit src/modules/placements/college-company-directory-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l15-u019-industry-company.md, docs/audit/gap2/lane-20/company-controller.md, docs/audit/gap2/lane-9/college-admin-companies.md

## G2-15-019-027  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:15-16 — old global listing without export cap
- vNext now: src/modules/placements/college-company-directory-service.ts:39-71 — per-college export stops after 2000
- Fix: Disclose hard cap and paginate export until complete

## G2-20-027-005  [P2] GAP  facet F05  effort S
- Legacy: Old alphabetic company name ascending docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:91-105
- vNext now: New default LAST_ACTIVE descending src/modules/placements/college-company-directory-service.ts:39-65
- Fix: Restore default alphabetical sorting

## G2-20-027-022  [P2] GAP  facet F19  effort M
- Legacy: Old all company list sorted alpha docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:91-105
- vNext now: New paged directory and export2000 cap src/modules/placements/college-company-directory-service.ts:39-72
- Fix: Show total/pagination/export bound

## G2-9-004-017  [P2] GAP  facet F04  effort M
- Legacy: Last active default descending, formatted DD MMM YYYY, Never posted (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:308-322`)
- vNext now: Sort LAST_ACTIVE desc with updatedAt fallback (`src/modules/placements/college-company-directory-service.ts:52-68`)
- Fix: Use Never posted fallback rather than Not recorded when no job activity.
