# Work packet: edit src/components/admin/super-admin-hr-account-dialog.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-028  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:178-182 — Add recruiter modal preselects current selectedCollegeId in Colleges multi-select.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:98-197 — Requires existing relationship or new company/college flow, no visible preselect by selectedCollegeId.
- Fix: Prefill selected college's relationship when scope picked.

## G2-10-021-029  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:493-520 — Create fields firstName,lastName,mobile,email,companyName,designation,collegeIds.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:280-409 — First/Last/Mobile/Email/Designation plus Company Relationship / New Company.
- Fix: Preserve source field order, separate new entity workflow if needed.

## G2-10-021-034  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:494-496 — Required First name: 'First name is required', max100.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:284-287 — Required First Name max120; validation via form/native schema.
- Fix: Match max and error message.

## G2-10-021-035  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:500-503 — Required Mobile only creating, message 'Mobile is required'.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:304-317 — Mobile required on create or when existing mobile present.
- Fix: Respect edit nullable-mobile semantics and show exact message.

## G2-10-021-036  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:504-505 — Email invalid text 'Enter a valid email'.
- vNext now: src/components/admin/super-admin-hr-account-dialog.tsx:326-338 — type=email and API field errors, no same explicit message.
- Fix: Restore exact validation copy at field.
