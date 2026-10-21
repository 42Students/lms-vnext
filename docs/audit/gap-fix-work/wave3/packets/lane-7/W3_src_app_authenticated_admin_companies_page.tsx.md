# Work packet (wave 3): edit src/app/(authenticated)/admin/companies/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-10-004-028  [P1] MISSING  facet F06  effort L
- Legacy: Old college edit modal allows all global and private fields in one 560px dialog `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:136-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-520`
- vNext now: New relationship actions only trust/archive/restore; global editor only when no scope `src/app/(authenticated)/admin/companies/page.tsx:149-175` `src/components/admin/super-admin-college-company-actions.tsx:53-101`
- Fix: Implement college-scoped editor for authorized private contact/notes and allowed company fields

## G2-9-033-018  [P1] MISSING  facet F06  effort L
- Legacy: Old college edit modal allows all global and private fields in one 560px dialog `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:136-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-520`
- vNext now: New relationship actions only trust/archive/restore; global editor only when no scope `src/app/(authenticated)/admin/companies/page.tsx:149-175` `src/components/admin/super-admin-college-company-actions.tsx:53-101`
- Fix: Implement college-scoped editor for authorized private contact/notes and allowed company fields

## G2-9-033-058  [P1] MISSING  facet F03  effort L
- Legacy: Old visible buttons History, Edit and Delete with icons `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:313-335`
- vNext now: Manage relationship in disclosure and Drive history as separate link; college Edit absent `src/app/(authenticated)/admin/companies/page.tsx:149-185`
- Fix: Expose accessible row History/Edit/Delete buttons, implement scoped Edit.

## G2-9-033-066  [P1] MISSING  facet F05  effort L
- Legacy: Original Company Contact Website Drives Last active Actions table columns `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-335`
- vNext now: Company listing is rows of articles without those headers `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Restore exact six-column table including accessible headers.
