# Work packet: edit src/app/api/placements/tpo/companies/create/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md, docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-16-031-027  [P1] GAP  facet F10  effort L
- Legacy: TpoCompanyController.java:47-105 searches/resolves company, engagement, join-link, domains and trusted flag
- vNext now: src/app/api/placements/tpo/companies/create/route.ts:13-40 creates global company and relationship
- Fix: Map resolver, trusted-domain creation and join-link actions through explicit API endpoints; audit trust mutation separately

## G2-4-023-007  [P1] MISSING  facet F03  effort M
- Legacy: Resolve returns id, name, logoUrl, verifiedBy42, existed, nameLocked (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:59-67`)
- vNext now: Create POST sends companyId, relationshipId, companyName; canonical verification and locked-name fields not included (`src/app/api/placements/tpo/companies/create/route.ts:34-38`)
- Fix: Provide existed/nameLocked/verified/logo to show exactly why the canonical company was reused.

## G2-4-023-020  [P1] MISSING  facet F06  effort M
- Legacy: ResolveRequest fields name, website, recruiterEmail, notTheSame (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,52-58`)
- vNext now: New create form name, websiteUrl, primaryDomain; lacks recruiterEmail and notTheSame (`src/components/tpo/tpo-company-create-form.tsx:24-26,91-113`; `src/app/api/placements/tpo/companies/create/route.ts:28-33`)
- Fix: Accept/validate recruiterEmail domain and explicit distinct-company intent in resolution flow.

## G2-4-023-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy resolve returns existed/nameLocked and confirmation flags after success (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:59-67`)
- vNext now: New 201 success returns new company UUID and navigates immediately (`src/app/api/placements/tpo/companies/create/route.ts:34-38`; `src/components/tpo/tpo-company-create-form.tsx:56-58`)
- Fix: Show resolution result (existing/new, verified status) before navigation.
