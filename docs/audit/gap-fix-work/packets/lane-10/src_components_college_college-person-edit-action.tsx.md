# Work packet: edit src/components/college/college-person-edit-action.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-14-002-036  [P1] GAP  facet F06  effort L
- Legacy: Legacy editable first/last/mobile/email/roll/program/class; vNext canonical Name/Login Mobile/Login Email readonly and class in separate action — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1593-1715`
- vNext now: `src/components/college/college-person-edit-action.tsx:96-161`; `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Unify profile + placement edit controls with explicit permission verification

## G2-14-002-038  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit dirty close prompts Discard student edits? Keep editing/Discard edits; vNext close ignores unsaved when not saving — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:696-715,1593-1608`
- vNext now: `src/components/college/college-person-edit-action.tsx:29-40,85-95`
- Fix: Add isDirty guard, discard confirmation and disabled while saving

## G2-14-002-090  [P1] GAP  facet F20  effort M
- Legacy: Legacy edit dirty discard guard; vNext only busy pending guard — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:696-715`
- vNext now: `src/components/college/college-person-edit-action.tsx:29-40,85-91`
- Fix: Track dirty form, prompt Discard edits/Keep editing

## G2-19-001-008  [P1] GAP  facet F03  effort L
- Legacy: Legacy table row has icon actions Edit, Audit trail, Profile, OTP unlock, Impersonate, Suspend/Reactivate, Delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:959-1085`
- vNext now: vNext row renders lifecycle, Edit Student, Move Class plus details link `src/app/(authenticated)/admin/students/page.tsx:90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:37-50`; `src/components/college/college-person-edit-action.tsx:83-88`
- Fix: Restore missing role-checked Audit trail, Profile, OTP unlock, impersonation and deletion workflows (or document explicit deprecation).

## G2-19-001-032  [P1] GAP  facet F06  effort L
- Legacy: Legacy edit can update first/last name, login mobile/email, college placement program/class `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:526-568`
- vNext now: vNext Edit Student read-only canonical name/login mobile/login email, separate Move Class, no program edit `src/components/college/college-person-edit-action.tsx:62-75`,93-104; `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Provide an explicitly permissioned account-identity and academic-placement edit workflow instead of silently dropping fields.

## G2-19-001-033  [P1] GAP  facet F06  effort S
- Legacy: Legacy cancel edited form invokes unsaved-changes discard confirmation `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:702-715`
- vNext now: vNext `close` dismisses without checking changed fields `src/components/college/college-person-edit-action.tsx:31-32`,164-170
- Fix: Track dirty state and render matching `Discard student edits?` confirmation.

## G2-6-001-025  [P1] GAP  facet F06  effort L
- Legacy: Old edit allows first/last/login mobile/email changes `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1393-1428`
- vNext now: New treats canonical name/login phone/email as read-only `src/components/college/college-person-edit-action.tsx:92-107`
- Fix: Explicitly document intentional cross-membership identity lock; provide secure dedicated identity edit route if parity required

## G2-6-001-026  [P1] GAP  facet F06  effort M
- Legacy: Old edit Faculty Type is disabled; role changes separately `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1468-1489`
- vNext now: New edit Employment Type is editable `src/components/college/college-person-edit-action.tsx:115-124`
- Fix: Match role mutability policy and separate role change from profile employment metadata

## G2-6-001-028  [P1] GAP  facet F06  effort S
- Legacy: Old submit Register Faculty inside inline Form; Edit Save Changes in 600px modal `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1103-1109` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1379-1393`
- vNext now: New modal Add faculty; Edit dialog Save changes `src/components/admin/person-onboard-dialog.tsx:127-148` `src/components/college/college-person-edit-action.tsx:164-174`
- Fix: Match button wording and dialog width/interaction conventions

## G2-6-001-037  [P1] GAP  facet F09  effort S
- Legacy: Old Edit Faculty modal mask not closable, width 600, Save Changes/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1378-1392`
- vNext now: New Dialog title Edit Faculty and save/cancel with pending lock `src/components/college/college-person-edit-action.tsx:88-93` `src/components/college/college-person-edit-action.tsx:164-174`
- Fix: Match mask/ESC affordance, width and copy without reintroducing double submit

## G2-6-001-041  [P1] GAP  facet F10  effort M
- Legacy: Old PUT `/api/v1/faculty/update/:id` used by edit `docs/legacy-source/frontend/src/api/Services/AdminService.js:251-252` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:441-468`
- vNext now: New membership edit endpoint `/api/college/people/:id/edit` `src/components/college/college-person-edit-action.tsx:40-58`
- Fix: Compare and document write fields; ensure audit, rollback, affected memberships

## G2-6-002-034  [P1] GAP  facet F06  effort M
- Legacy: Old edit `Faculty Type` is disabled to avoid role mutation in edit `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1469-1489`
- vNext now: New edit `Faculty Type` is editable employmentType select `src/components/college/college-person-edit-action.tsx:115-124`
- Fix: Decide whether employment metadata is distinct from role; prohibit privilege effects

## G2-6-002-035  [P1] GAP  facet F06  effort L
- Legacy: Old edit first/last/mobile/email can be changed via existing faculty record `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1393-1429`
- vNext now: New edit canonical name/mobile/email is read only `src/components/college/college-person-edit-action.tsx:92-107`
- Fix: Provide secure global identity edit flow or document deliberate conflict prevention

## G2-19-001-039  [P2] GAP  facet F08  effort S
- Legacy: Legacy edit success toast `Student updated successfully!` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:568-571`
- vNext now: vNext same text in success Alert but closes dialog immediately after setSuccess `src/components/college/college-person-edit-action.tsx:76-87`
- Fix: Make feedback reliably visible after dialog closes and match toast duration.

## G2-6-001-032  [P2] GAP  facet F07  effort M
- Legacy: Old edit Department required `Choose a department` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1451-1458`
- vNext now: New has `No department` optional choice `src/components/college/college-person-edit-action.tsx:108-117`
- Fix: Require department if legacy parity required; verify historical null profiles before applying
