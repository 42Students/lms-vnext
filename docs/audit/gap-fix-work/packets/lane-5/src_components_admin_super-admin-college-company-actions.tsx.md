# Work packet: edit src/components/admin/super-admin-college-company-actions.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-10-004-034  [P1] GAP  facet F07  effort M
- Legacy: Old logo and website require HTTPS with Must be a valid URL and HTTPS-specific messages `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:483-490`
- vNext now: New college Website HTTPS preferred; browser type URL permits HTTP; logo field absent `src/components/admin/super-admin-college-company-actions.tsx:39-42`
- Fix: Require HTTPS and restore logo field validation in college modal

## G2-10-004-035  [P1] GAP  facet F07  effort M
- Legacy: Old industry max100 description max2000, contact name 150 email 150 phone30 and notes2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-518`
- vNext now: New global editor industry160 about3000 and new college create lacks most fields `src/components/admin/super-admin-company-edit.tsx:43-48` `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Apply legacy per-field length caps in college workflow and decide global caps explicitly

## G2-9-033-020  [P1] GAP  facet F07  effort M
- Legacy: Old logo and website require HTTPS with Must be a valid URL and HTTPS-specific messages `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:483-490`
- vNext now: New college Website HTTPS preferred; browser type URL permits HTTP; logo field absent `src/components/admin/super-admin-college-company-actions.tsx:39-42`
- Fix: Require HTTPS and restore logo field validation in college modal

## G2-9-033-021  [P1] GAP  facet F07  effort M
- Legacy: Old industry max100 description max2000, contact name 150 email 150 phone30 and notes2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-518`
- vNext now: New global editor industry160 about3000 and new college create lacks most fields `src/components/admin/super-admin-company-edit.tsx:43-48` `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Apply legacy per-field length caps in college workflow and decide global caps explicitly

## G2-9-033-069  [P1] MISSING  facet F06  effort S
- Legacy: Logo URL field maxLength=500 placeholder 'https://...' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-486`
- vNext now: No logo URL input in college create form `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Restore HTTPS-only logo field and max500 rule.

## G2-9-033-070  [P1] GAP  facet F06  effort S
- Legacy: Website max500, HTTPS regex; one-per-domain helper `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:487-489`
- vNext now: Website (HTTPS preferred) type=url no cap `src/components/admin/super-admin-college-company-actions.tsx:41-42`
- Fix: Cap 500, require HTTPS and restore helper text.

## G2-9-033-073  [P1] MISSING  facet F06  effort M
- Legacy: Contact person max150, 'Recruiter contact name' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:498-500`
- vNext now: Contact person input absent `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Restore per-college contact person field max150.

## G2-9-033-074  [P1] MISSING  facet F06  effort M
- Legacy: Contact email max150, email validator, 'recruiter@company.com' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:502-503`
- vNext now: Contact email field absent `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Restore scoped contact email and email validator.

## G2-9-033-085  [P1] MISSING  facet F12  effort M
- Legacy: Once verified by 42, only superadmin can edit public details `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:255-257,311-316`
- vNext now: Relationship actions only trust/archive `src/components/admin/super-admin-college-company-actions.tsx:78-99`
- Fix: Restore authorization-preserving editable public/private field split.

## G2-10-004-033  [P2] GAP  facet F07  effort S
- Legacy: Old college company name exact messages Company name is required and between 2 and 150 characters `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:480-483`
- vNext now: New college create HTML name max200 and no old explicit error message `src/components/admin/super-admin-college-company-actions.tsx:35-40`
- Fix: Use 150 cap and old exact required/range validation messages

## G2-10-004-040  [P2] MISSING  facet F08  effort S
- Legacy: Old college create/update messages Company created and Company updated `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:154-168`
- vNext now: New college create closes and refreshes with no success notification `src/components/admin/super-admin-college-company-actions.tsx:14-27`
- Fix: Restore create/update success feedback with old phrasing

## G2-10-004-041  [P2] MISSING  facet F08  effort S
- Legacy: Old college restore/delete success Company restored and Company deleted `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:108-122` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:198-209`
- vNext now: New relationship action refreshes silently without toast `src/components/admin/super-admin-college-company-actions.tsx:67-75`
- Fix: Show success messages for archive and restoration

## G2-9-033-019  [P2] GAP  facet F07  effort S
- Legacy: Old college company name exact messages Company name is required and between 2 and 150 characters `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:480-483`
- vNext now: New college create HTML name max200 and no old explicit error message `src/components/admin/super-admin-college-company-actions.tsx:35-40`
- Fix: Use 150 cap and old exact required/range validation messages

## G2-9-033-023  [P2] MISSING  facet F08  effort S
- Legacy: Old college create/update messages Company created and Company updated `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:154-168`
- vNext now: New college create closes and refreshes with no success notification `src/components/admin/super-admin-college-company-actions.tsx:14-27`
- Fix: Restore create/update success feedback with old phrasing

## G2-9-033-024  [P2] MISSING  facet F08  effort S
- Legacy: Old college restore/delete success Company restored and Company deleted `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:108-122` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:198-209`
- vNext now: New relationship action refreshes silently without toast `src/components/admin/super-admin-college-company-actions.tsx:67-75`
- Fix: Show success messages for archive and restoration

## G2-9-033-078  [P2] GAP  facet F07  effort S
- Legacy: Client name min2 max150 error text explicit `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:481-483`
- vNext now: Native name min2/max200 `src/components/admin/super-admin-college-company-actions.tsx:37-38`
- Fix: Set cap150 and exact field-level message.

## G2-9-033-080  [P2] MISSING  facet F08  effort S
- Legacy: Company created/updated toasts after successful write `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:154-168`
- vNext now: Silent close and router.refresh only `src/components/admin/super-admin-college-company-actions.tsx:18-27`
- Fix: Show exact 'Company created' and 'Company updated' toasts.
