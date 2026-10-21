# Work packet: edit src/components/admin/person-onboard-dialog.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-teachers.md, docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-5/u031-admin-users.md, docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-003-015  [P1] GAP  facet F06  effort L
- Legacy: Old wrapper renders no direct form, but nested Faculty required Department and Type when registering `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:25-27` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1079`
- vNext now: New wrapper uses PersonOnboardDialog without department and type select `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Restore required department and type fields within scoped Super Admin Faculty create

## G2-6-003-018  [P1] GAP  facet F07  effort M
- Legacy: Old Faculty register validates mobile regex, dept/type required `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1003-1079`
- vNext now: New modal validates phone on submit and omits dept/type `src/components/admin/person-onboard-dialog.tsx:69-70` `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Reproduce exact client error text and required-field enforcement

## G2-6-003-023  [P1] GAP  facet F10  effort L
- Legacy: Old route is a wrapper and has no mutation itself; nested Faculty POST `/api/v1/faculty/register` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:23-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:106-170`
- vNext now: New wrapper likewise delegates POST to onboard component `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:75-86`
- Fix: Ensure delegated create persists dept/type/profile metadata and admin audit row

## G2-1-007-023  [P2] GAP  facet F07  effort M
- Legacy: `SuperAdminUserAdminController.java:139-141,179-183` exact invalid role and phone/college messages.
- vNext now: `person-onboard-dialog.tsx:69-84` toast 'Check mobile number', 'Mobile number must be 10 digits'; API standardized Zod.
- Fix: Map exact validation copy to controlled form fields and preserve role failure.

## G2-1-007-024  [P2] GAP  facet F07  effort M
- Legacy: `SuperAdminUserAdminController.java:187-189` 409 `MOBILE_ALREADY_EXISTS_IN_COLLEGE`.
- vNext now: `person-onboard-dialog.tsx:69-94` generic apiFetch failure mapped toast; user can belong to multiple memberships.
- Fix: Provide conflict text distinguishing existing canonical user vs already-member college.

## G2-1-007-027  [P2] GAP  facet F08  effort M
- Legacy: `AdminUsers.js:165-168` success '${roleLabel(role)} created'; `:183-190` 'Admin suspended. Their existing sessions were invalidated.'
- vNext now: `person-onboard-dialog.tsx:69-94` generic onboarding toast; scoped membership lifecycle differs.
- Fix: Use role-specific success and immediate-session meaning, qualify membership scope.

## G2-18-031-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy faculty exact required messages Enter the mobile number, Choose a department, Choose a faculty type; Faculty.js:1004-1061
- vNext now: vNext onboarding reports Check mobile number/Onboarding failed, no department fields; person-onboard-dialog.tsx:69-113,215-225
- Fix: Restore required department/type checks and position messages under fields

## G2-18-031-036  [P2] GAP  facet F08  effort S
- Legacy: Legacy faculty register/update/delete copy Faculty registered successfully! They can now login with their mobile number./Faculty updated successfully!/Faculty deleted successfully!; Faculty.js:386-485
- vNext now: vNext faculty onboarding reuses matching registration toast, role mutation uses Role added/removed toasts; person-onboard-dialog.tsx:106-113;person-membership-actions.tsx:117-124
- Fix: Preserve exact update toast on successful editor save and explain intentional nondeletion

## G2-5-031-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy required Role and Mobile with exact errors `Role required`,`Mobile required`, email invalid `Enter a valid email`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:379-400`
- vNext now: vNext mobile normalization expects 10 digits, duplicate errors and generic toast; exact required messages differ. `src/components/admin/person-onboard-dialog.tsx:69-72,88-100`
- Fix: Add field errors and legacy wording alongside modern mobile validation.

## G2-5-031-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy create failure alert `Admin user was not created` plus server field mapping. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:364-374`
- vNext now: vNext toast `Onboarding failed` and error reason, no inline field mapping. `src/components/admin/person-onboard-dialog.tsx:88-101`
- Fix: Map API validation to field errors and inline create alert.

## G2-5-031-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy success toast `[College Admin
- vNext now: vNext success `Person onboarded`, description no invitation/message sent. `src/components/admin/person-onboard-dialog.tsx:104-112`
- Fix: Use exact role-specific created toast and refresh role view.

## G2-6-001-029  [P2] GAP  facet F07  effort S
- Legacy: Old required first name error `Enter the first name` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:982-989`
- vNext now: New uses native required for firstName without equivalent inline wording `src/components/admin/person-onboard-dialog.tsx:154-159`
- Fix: Use exact first-name inline message, including focus/scroll behavior

## G2-6-001-030  [P2] GAP  facet F07  effort S
- Legacy: Old last name error `Enter the last name` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:991-998`
- vNext now: New native required for lastName `src/components/admin/person-onboard-dialog.tsx:160-163`
- Fix: Use exact last-name inline message

## G2-6-001-031  [P2] GAP  facet F07  effort S
- Legacy: Old phone pattern `/^\d{10}$/` and message `Mobile number must be 10 digits` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1003-1010`
- vNext now: New validates Indian phone in submit and shows toast, not per-field error `src/components/admin/person-onboard-dialog.tsx:69-70` `src/components/admin/person-onboard-dialog.tsx:182-195`
- Fix: Restore field-level validation timing and exact text

## G2-6-002-037  [P2] GAP  facet F07  effort S
- Legacy: Old first-name inline error `Enter the first name` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:982-990`
- vNext now: New dialog relies on HTML required validation `src/components/admin/person-onboard-dialog.tsx:154-159`
- Fix: Use exact per-field validation wording

## G2-6-002-038  [P2] GAP  facet F07  effort S
- Legacy: Old last-name inline error `Enter the last name` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:991-999`
- vNext now: New dialog relies on HTML required validation `src/components/admin/person-onboard-dialog.tsx:160-163`
- Fix: Restore exact last-name message

## G2-6-002-039  [P2] GAP  facet F07  effort S
- Legacy: Old mobile inline errors `Enter the mobile number` and `Mobile number must be 10 digits` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1003-1010`
- vNext now: New toast-level validation error `Check mobile number` and description on submit `src/components/admin/person-onboard-dialog.tsx:69-70`
- Fix: Render field-level red validation and same two exact texts
