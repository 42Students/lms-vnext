# Work packet: edit src/app/(authenticated)/admin/students/page.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-14-002-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy edit/profile/audit accessible per row; vNext links to generic People management for some — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:965-989`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:64-69,90-90`
- Fix: Put authorized student-specific actions on roster itself

## G2-14-002-010  [P1] MISSING  facet F03  effort M
- Legacy: Legacy Audit trail row icon; vNext omitted from roster actions — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:974-981,1719-1729`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Add authorized scoped audit modal and row icon

## G2-14-002-011  [P1] MISSING  facet F03  effort M
- Legacy: Legacy Profile icon with resume, skills, education, preferences and identity; vNext omitted here — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:982-989,1765-1775`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Link to 20-section profile viewer with same entry point

## G2-14-002-012  [P1] MISSING  facet F03  effort M
- Legacy: Legacy Clear OTP lockout icon only when mobile; vNext row has no such control — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1007`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Provide privileged, logged OTP lockout reset confirmation

## G2-14-002-036  [P1] GAP  facet F06  effort L
- Legacy: Legacy editable first/last/mobile/email/roll/program/class; vNext canonical Name/Login Mobile/Login Email readonly and class in separate action — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1593-1715`
- vNext now: `src/components/college/college-person-edit-action.tsx:96-161`; `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Unify profile + placement edit controls with explicit permission verification

## G2-14-002-041  [P1] GAP  facet F07  effort M
- Legacy: Legacy failed classes/programs warning but roster stays accessible; vNext register unavailable page-level error — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1472-1480`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:34-51`
- Fix: Keep directory visible and disable only affected register/edit actions

## G2-14-002-049  [P1] MISSING  facet F09  effort M
- Legacy: Legacy Audit trail — Name width800 and fixed college entity filter; vNext no row audit popup — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1719-1729`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Add source-scoped 800px audit viewer modal

## G2-14-002-050  [P1] MISSING  facet F09  effort M
- Legacy: Legacy Profile — Name width860 with ProfileSectionsPanel; vNext no row profile popup — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1765-1775`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Add 860px learner section viewer

## G2-14-002-056  [P1] MISSING  facet F10  effort M
- Legacy: Legacy OTP reset /api/v1/users/admin/clear-otp-lockout clears rate keys; vNext no equivalent row — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:173-200`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Add privileged audited OTP reset API and button

## G2-14-002-068  [P1] GAP  facet F13  effort M
- Legacy: Legacy academic options failure disables register/edit only; vNext could block entire Student register page — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1476-1480`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:34-51`
- Fix: Separate option fetch errors from authorized roster read

## G2-14-002-076  [P1] MISSING  facet F15  effort M
- Legacy: Legacy OTP reset clears login/verifyOTP prefixes, no new OTP send; vNext no admin reset — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:173-200`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Reset limiter state only, send no OTP automatically

## G2-14-002-093  [P1] MISSING  facet F21  effort M
- Legacy: Legacy OTP rate limiter integration reset all login prefixes; vNext page lacks integration — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Implement privileged limiter reset with auditing

## G2-18-031-010  [P1] GAP  facet F03  effort L
- Legacy: Legacy Students row icon actions Edit, Audit trail, Profile, Clear OTP lockout, SA Impersonate, Suspend/Reactivate, Delete; Students.js:966-1086
- vNext now: vNext scoped roster exposes edit/lifecycle, admin membership actions and profile dialog, but no verified matching full icon row; admin/students/page.tsx:82-92;person-membership-actions.tsx:72-152
- Fix: Create explicit per-action parity sheet and surface supported OTP/audit/impersonation actions or document removals

## G2-19-001-008  [P1] GAP  facet F03  effort L
- Legacy: Legacy table row has icon actions Edit, Audit trail, Profile, OTP unlock, Impersonate, Suspend/Reactivate, Delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:959-1085`
- vNext now: vNext row renders lifecycle, Edit Student, Move Class plus details link `src/app/(authenticated)/admin/students/page.tsx:90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:37-50`; `src/components/college/college-person-edit-action.tsx:83-88`
- Fix: Restore missing role-checked Audit trail, Profile, OTP unlock, impersonation and deletion workflows (or document explicit deprecation).

## G2-19-001-032  [P1] GAP  facet F06  effort L
- Legacy: Legacy edit can update first/last name, login mobile/email, college placement program/class `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:526-568`
- vNext now: vNext Edit Student read-only canonical name/login mobile/login email, separate Move Class, no program edit `src/components/college/college-person-edit-action.tsx:62-75`,93-104; `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Provide an explicitly permissioned account-identity and academic-placement edit workflow instead of silently dropping fields.

## G2-19-001-037  [P1] GAP  facet F07  effort M
- Legacy: Legacy academic-choice lookup failure warns and disables registration/edit `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:485-489`,520-523,1476-1479
- vNext now: vNext rejects entire register page if any choices/history read fails with `Student register unavailable` `src/app/(authenticated)/admin/students/page.tsx:39-50`
- Fix: Keep readable roster and targeted retry for failed academic options, rather than block all register sections due to history failure.

## G2-19-001-044  [P1] MISSING  facet F09  effort M
- Legacy: Legacy `Audit trail — <name>` modal width 800 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1719-1729`
- vNext now: vNext roster has no in-row audit modal; person audit exists on other route but no link here `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Restore row audit trigger and selected-student scoped audit history dialog/link.

## G2-19-001-046  [P1] GAP  facet F09  effort L
- Legacy: Legacy `Clear OTP lockout?`, `Impersonate this student?`, `Suspend Student`, `Reactivate Student`, `Delete Student` confirmations `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1085`
- vNext now: vNext lifecycle reasons/confirm flow but no OTP, impersonation or delete `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-64`; `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Provide role-gated per-action dialogs with exact impact copy and safe confirmation.

## G2-19-001-051  [P1] MISSING  facet F10  effort M
- Legacy: Legacy clear-OTP operation keyed by learner mobile `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:685-694`
- vNext now: vNext roster renders no OTP-unlock action `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Provide rate-limit unlock with superadmin authorization and audit receipt.

## G2-19-001-054  [P1] GAP  facet F11  effort M
- Legacy: Legacy impersonate/module-access only for superadmin (loginUser id 0 + FACULTY), while other roster actions shown `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:52-56`,600-603,1008-1027
- vNext now: vNext all page gated isSuperAdmin, module access inside page with selected college `src/app/(authenticated)/admin/students/page.tsx:24-30`,82-90; `src/components/admin/super-admin-student-bulk-access.tsx:41-74`
- Fix: Check role identification parity and ensure privileged extras remain narrower than ordinary learner management.
