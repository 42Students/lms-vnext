# Work packet (wave 2): edit src/components/admin/super-admin-college-company-actions.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-10-004-006  [P2] GAP  facet F02  effort S
- Legacy: College tab old overview metrics and Add company primary action at top `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-361`
- vNext now: New Add company inline action below multi-filter header, with metrics after create form `src/app/(authenticated)/admin/companies/page.tsx:64-142` `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Put Add company primary CTA alongside college overview heading

## G2-10-004-044  [P2] GAP  facet F09  effort S
- Legacy: Old college Delete asks Delete this company? This action cannot be undone. `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:320-331`
- vNext now: New Delete company for this college? Description The global company record will be kept. `src/components/admin/super-admin-college-company-actions.tsx:90-95`
- Fix: Clarify intentional change in delete semantics and update confirmation to explain relationship-only archive

## G2-10-004-045  [P2] MISSING  facet F09  effort M
- Legacy: Old Add/Edit modal on dirty Cancel prompts Discard unsaved changes? with Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-464`
- vNext now: New inline college form Cancel immediately closes without touched-field confirm `src/components/admin/super-admin-college-company-actions.tsx:35-49`
- Fix: Add dirty-form confirmation and suppress close while saving

## G2-10-004-069  [P2] GAP  facet F16  effort M
- Legacy: Old college modal fixed width560 and history modal width720 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-476` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-530`
- vNext now: New forms inline across responsive grid; link navigates to detail route `src/components/admin/super-admin-college-company-actions.tsx:29-51` `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Reproduce modal dimensions and mobile overflow/focus handling

## G2-10-004-078  [P2] GAP  facet F18  effort S
- Legacy: Legacy college action Add company; form headings Identity Contact Internal only `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-361` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:479-520`
- vNext now: New inline form action Add company and only name domain website `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Restore section titles and field help copy

## G2-10-004-079  [P2] GAP  facet F18  effort S
- Legacy: Legacy restore title Restore this company? and sentence It will reappear across job postings. `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:298-311`
- vNext now: New relationship restore asks Restore COMPANY for this college? The global company record will be kept. `src/components/admin/super-admin-college-company-actions.tsx:90-96`
- Fix: Choose correct new relationship semantics and make title/help explain that college-only scope

## G2-9-033-005  [P2] GAP  facet F02  effort S
- Legacy: College tab old overview metrics and Add company primary action at top `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-361`
- vNext now: New Add company inline action below multi-filter header, with metrics after create form `src/app/(authenticated)/admin/companies/page.tsx:64-142` `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Put Add company primary CTA alongside college overview heading

## G2-9-033-026  [P2] GAP  facet F09  effort S
- Legacy: Old college Delete asks Delete this company? This action cannot be undone. `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:320-331`
- vNext now: New Delete company for this college? Description The global company record will be kept. `src/components/admin/super-admin-college-company-actions.tsx:90-95`
- Fix: Clarify intentional change in delete semantics and update confirmation to explain relationship-only archive

## G2-9-033-027  [P2] MISSING  facet F09  effort M
- Legacy: Old Add/Edit modal on dirty Cancel prompts Discard unsaved changes? with Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-464`
- vNext now: New inline college form Cancel immediately closes without touched-field confirm `src/components/admin/super-admin-college-company-actions.tsx:35-49`
- Fix: Add dirty-form confirmation and suppress close while saving

## G2-9-033-040  [P2] GAP  facet F16  effort M
- Legacy: Old college modal fixed width560 and history modal width720 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-476` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-530`
- vNext now: New forms inline across responsive grid; link navigates to detail route `src/components/admin/super-admin-college-company-actions.tsx:29-51` `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Reproduce modal dimensions and mobile overflow/focus handling

## G2-9-033-045  [P2] GAP  facet F18  effort S
- Legacy: Legacy college action Add company; form headings Identity Contact Internal only `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-361` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:479-520`
- vNext now: New inline form action Add company and only name domain website `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Restore section titles and field help copy

## G2-9-033-046  [P2] GAP  facet F18  effort S
- Legacy: Legacy restore title Restore this company? and sentence It will reappear across job postings. `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:298-311`
- vNext now: New relationship restore asks Restore COMPANY for this college? The global company record will be kept. `src/components/admin/super-admin-college-company-actions.tsx:90-96`
- Fix: Choose correct new relationship semantics and make title/help explain that college-only scope

## G2-9-033-071  [P2] MISSING  facet F06  effort S
- Legacy: Industry max100 placeholder 'e.g. IT Services' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-492`
- vNext now: Industry input absent `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Add Industry input and server validation max100.

## G2-9-033-072  [P2] MISSING  facet F06  effort S
- Legacy: Description TextArea rows3 max2000 showCount `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:494-495`
- vNext now: Description absent from college form `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Add 2000-character counted textarea.

## G2-9-033-075  [P2] MISSING  facet F06  effort S
- Legacy: Phone regex and max30 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:505-506`
- vNext now: Phone field absent `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Restore phone field and exact legacy regexp.

## G2-9-033-081  [P2] GAP  facet F09  effort M
- Legacy: Dirty close displays 'Discard unsaved changes?' and Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:451-464`
- vNext now: Cancel closes immediately without dirty check `src/components/admin/super-admin-college-company-actions.tsx:44-49`
- Fix: Add dirty-form confirmation with pending-save close lock.

## G2-9-033-092  [P2] GAP  facet F17  effort M
- Legacy: Modal fields AntForm labels/help and lock tooltip `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:480-518`
- vNext now: Inline form lacks dialog focus trap and notes help `src/components/admin/super-admin-college-company-actions.tsx:35-51`
- Fix: Restore focus trap, error associations, tooltip and modal keyboard semantics.

## G2-9-033-095  [P2] GAP  facet F18  effort S
- Legacy: Internal group labels 'Identity', 'Contact', 'Internal only' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:480-518`
- vNext now: Three flat form fields `src/components/admin/super-admin-college-company-actions.tsx:35-42`
- Fix: Restore exact form section wording and order.
