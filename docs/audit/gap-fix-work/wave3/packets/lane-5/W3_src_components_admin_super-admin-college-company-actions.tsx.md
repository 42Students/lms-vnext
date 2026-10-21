# Work packet (wave 3): edit src/components/admin/super-admin-college-company-actions.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-10-004-027  [P1] MISSING  facet F06  effort L
- Legacy: Old college Add Company modal 560px has Identity Contact Internal only dividers `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-520`
- vNext now: New college create compact inline form has only name domain website `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Restore complete modal with logo industry description contact person email phone private notes fields

## G2-10-004-028  [P1] MISSING  facet F06  effort L
- Legacy: Old college edit modal allows all global and private fields in one 560px dialog `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:136-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-520`
- vNext now: New relationship actions only trust/archive/restore; global editor only when no scope `src/app/(authenticated)/admin/companies/page.tsx:149-175` `src/components/admin/super-admin-college-company-actions.tsx:53-101`
- Fix: Implement college-scoped editor for authorized private contact/notes and allowed company fields

## G2-9-033-017  [P1] MISSING  facet F06  effort L
- Legacy: Old college Add Company modal 560px has Identity Contact Internal only dividers `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-520`
- vNext now: New college create compact inline form has only name domain website `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Restore complete modal with logo industry description contact person email phone private notes fields

## G2-9-033-018  [P1] MISSING  facet F06  effort L
- Legacy: Old college edit modal allows all global and private fields in one 560px dialog `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:136-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-520`
- vNext now: New relationship actions only trust/archive/restore; global editor only when no scope `src/app/(authenticated)/admin/companies/page.tsx:149-175` `src/components/admin/super-admin-college-company-actions.tsx:53-101`
- Fix: Implement college-scoped editor for authorized private contact/notes and allowed company fields

## G2-9-033-076  [P1] MISSING  facet F06  effort L
- Legacy: Internal only box with private notes max2000 and lock tooltip `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:509-519`
- vNext now: No private notes field `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Implement college-private notes field and lock-styled hint.

## G2-9-033-083  [P1] MISSING  facet F10  effort L
- Legacy: Create maps transient private fields to college_company `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:179-193`
- vNext now: POST only name/domain/website `src/components/admin/super-admin-college-company-actions.tsx:19-24`
- Fix: Introduce transaction that writes private CRM with public identity.

## G2-9-033-084  [P1] MISSING  facet F10  effort L
- Legacy: Shared rename/Logo update propagates to all linked Job records `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:294-305`
- vNext now: College edit entirely absent `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Implement allowed scoped public edit with job snapshot update.
