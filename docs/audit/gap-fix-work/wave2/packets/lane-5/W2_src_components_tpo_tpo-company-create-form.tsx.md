# Work packet (wave 2): edit src/components/tpo/tpo-company-create-form.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-004  [P2] GAP  facet F01  effort M
- Legacy: POST /resolve response is full company identity and existing/matched flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-68`)
- vNext now: New company POST create returns UUID companyId/relationshipId/name and redirects detail (`src/app/api/placements/tpo/companies/create/route.ts:28-38`; `src/components/tpo/tpo-company-create-form.tsx:50-58`)
- Fix: Preserve decision flags after resolving a company, even if response uses modern UUIDs.

## G2-4-023-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy Add other is in company picker, followed by duplicate-company prompt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:22-24,52-58,104-109`)
- vNext now: New Add company is page-level Dialog with optional website/domain disclosure and review step (`src/components/tpo/tpo-company-create-form.tsx:67-121`)
- Fix: Compare picker and dialog shell, section order, field grouping, footers, and duplicate choice UI.

## G2-4-023-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy has Add other and Use [Company]/It's a different company decision (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-58,104-109`)
- vNext now: New Add company Dialog uses Review and create company then Confirm company creation (`src/components/tpo/tpo-company-create-form.tsx:69-83,114-120`)
- Fix: Restore duplicate decision CTA and exact copy in company picker.

## G2-4-023-034  [P2] MISSING  facet F09  effort M
- Legacy: Legacy company match opens duplicate prompt (Use X / It's a different company) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- vNext now: New create Dialog only has confirmation phase, no conflict branch (`src/components/tpo/tpo-company-create-form.tsx:77-121`)
- Fix: Add duplicate-resolution panel/modal with explicit two actions and close behavior.

## G2-4-023-052  [P2] GAP  facet F13  effort M
- Legacy: Legacy client company lookup can fail with SameCompany 409 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- vNext now: New form catches any failed create into generic error notice (`src/components/tpo/tpo-company-create-form.tsx:50-60,120-121`)
- Fix: Render granular success/error and recovery states.

## G2-4-023-053  [P2] GAP  facet F14  effort M
- Legacy: Legacy company resolve accepts website URL and recruiterEmail work domain; no file upload here (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-58`)
- vNext now: New create allows optional website and domain, no uploaded files in create form (`src/components/tpo/tpo-company-create-form.tsx:91-113`)
- Fix: Retain email-based domain resolution; preserve no-file input unless logo management is added.

## G2-4-023-060  [P2] GAP  facet F18  effort M
- Legacy: Legacy action copy `Add other`, `Use [company]`, `It's a different company` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-58,104-109`)
- vNext now: New copy `Add company`, `Review and create company`, `Confirm company creation` (`src/components/tpo/tpo-company-create-form.tsx:69-83`)
- Fix: Restore legacy picker wording and decision labels where that workflow occurs.
