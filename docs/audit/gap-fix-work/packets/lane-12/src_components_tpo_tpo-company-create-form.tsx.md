# Work packet: edit src/components/tpo/tpo-company-create-form.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-020  [P1] MISSING  facet F06  effort M
- Legacy: ResolveRequest fields name, website, recruiterEmail, notTheSame (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,52-58`)
- vNext now: New create form name, websiteUrl, primaryDomain; lacks recruiterEmail and notTheSame (`src/components/tpo/tpo-company-create-form.tsx:24-26,91-113`; `src/app/api/placements/tpo/companies/create/route.ts:28-33`)
- Fix: Accept/validate recruiterEmail domain and explicit distinct-company intent in resolution flow.

## G2-4-023-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy 409 duplicate-company response code SAME_COMPANY, companyId/name/message/error (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- vNext now: New API maps identity conflict to generic placement error response and dialog generic save error (`src/modules/placements/company-service.ts:265-284`; `src/components/tpo/tpo-company-create-form.tsx:50-60`)
- Fix: Map conflict to dedicated dialog with Use existing / It's different buttons and detail.

## G2-4-023-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy TPO conflict returns message on 409 as well as code (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- vNext now: New create dialog masks body error behind generic `Could not save...` (`src/components/tpo/tpo-company-create-form.tsx:50-60`)
- Fix: Preserve actionable error messages for duplication, validation and bad website/domain.

## G2-4-023-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy resolve returns existed/nameLocked and confirmation flags after success (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:59-67`)
- vNext now: New 201 success returns new company UUID and navigates immediately (`src/app/api/placements/tpo/companies/create/route.ts:34-38`; `src/components/tpo/tpo-company-create-form.tsx:56-58`)
- Fix: Show resolution result (existing/new, verified status) before navigation.
