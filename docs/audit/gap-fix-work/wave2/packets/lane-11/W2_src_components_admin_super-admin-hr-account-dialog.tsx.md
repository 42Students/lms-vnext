# Work packet (wave 2): edit src/components/admin/super-admin-hr-account-dialog.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-10-021-008  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:473-521 — Ant Modal Create/Edit with vertical six fields and Colleges selector.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:98-420 — New Dialog fields plus relationship/company editor and split field grids.
- Fix: Match legacy modal baseline and make new relationships progressive.

## G2-10-021-021  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:500-505 — Mobile max15; Email max255.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:304-336 — Mobile max32 and Email max320.
- Fix: Verify backend policy; clone max15/max255 or explain intentional E.164 allowance.

## G2-10-021-022  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:494-498,507-511 — First/Last max100; Company/Designation max150.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:283-293,343-354 — First/Last max120 and Title160; company is relationship entity.
- Fix: Match input limits and field mapping; flag company model evolution.

## G2-10-021-032  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:500-503 — Changing Mobile in edit shows 'Changing the mobile signs the recruiter out everywhere'.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:296-318,404-408 — Generic session-termination note not adjacent to Mobile.
- Fix: Put source warning beside Mobile during editing.

## G2-10-021-033  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:473-490 — Modal Create/Save, closes via dirty-change confirmation.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:98-139 — New Dialog with form and persistent unsaved guard logic.
- Fix: Match modal buttons and discard text, preserve unsaved protection.

## G2-10-021-060  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:175-182 — New recruiter within college preselect selected college, only scoped college options.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:98-197 — New account requires relationship choices loaded from scoped options service.
- Fix: Filter and preselect chosen scoped college relationship.

## G2-10-021-086  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:507-511 — Field labels 'Company' and 'Designation'.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:343-354 — Designation only; Company relationship selection with different wording.
- Fix: Match labels and clarify relationship semantics.

## G2-3-031-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:473-521`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:103-140`
- Fix: Legacy Add recruiter Modal with Ant Form; vNext SuperAdminHrAccountDialog with nested company/college create and different layout.

## G2-3-031-024  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:494-517`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:284-405`
- Fix: Legacy First name required max100, Last name max100, Mobile(login) max15, Email max255, Company/Designation max150; vNext form uses name splits, E164 mobile, optional email and title plus canonical relationship.

## G2-3-031-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:500-503`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:298-319`
- Fix: Legacy Mobile (login) is required on create; vNext phoneE164 validates formatted phone and canonical identity. Match displayed label/error.

## G2-3-031-026  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:514-520`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:175-225`
- Fix: Legacy multiselect Colleges can include several scoped colleges; vNext first relationship + optional same-company colleges, disallows cross-company.

## G2-3-031-035  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:473-521`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:103-140`
- Fix: Legacy dirty-edit Modal.confirm Discard recruiter changes?; verify vNext dialog dirty-state guard and exact copy.

## G2-3-031-058  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:494-517`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:284-405`
- Fix: Legacy Ant field validation inline and autofocus on edit; vNext input labels/HTML validity and toast handling differ.

## G2-3-031-071  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:473-521`
- vNext now: `src/components/admin/super-admin-hr-account-dialog.tsx:103-140`
- Fix: Restore exact field wording First name, Last name, Mobile (login), Email, Company, Designation, Colleges.

## G2-10-021-079  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:473-521 — Ant Modal default responsive width.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:98-134 — Custom Dialog with large form sections.
- Fix: Match legacy centered modal and field spacing.

## G2-10-021-087  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:500-501 — Mobile field label 'Mobile (login)'.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:302-304 — 'Mobile number'.
- Fix: Restore login qualifier.
