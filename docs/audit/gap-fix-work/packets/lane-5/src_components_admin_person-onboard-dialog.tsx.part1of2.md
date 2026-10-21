# Work packet: edit src/components/admin/person-onboard-dialog.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-5/u031-admin-users.md, docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-1-007-018  [P1] GAP  facet F06  effort M
- Legacy: `SuperAdminUserAdminController.java:401-420` role default ADMIN; only ADMIN or TPO permitted.
- vNext now: `person-onboard-dialog.tsx:21-63` role list uses membership roles including more than two.
- Fix: Offer limited ADMIN/TPO role picker in managed-admin create and enforce server restriction.

## G2-18-031-027  [P1] MISSING  facet F06  effort M
- Legacy: Legacy Faculty register requires First/Last/Mobile/Department/Faculty Type and conditional college, optional Email/Gender/DOB/Address/Bio; Faculty.js:983-1105
- vNext now: vNext PersonOnboardDialog forcedRole FACULTY asks first/last/mobile/email/mentor checkbox but not department or demographic fields; person-onboard-dialog.tsx:153-225
- Fix: Restore Department and faculty type validation at initial registration or enforce explicit post-registration completion step

## G2-18-031-030  [P1] GAP  facet F06  effort M
- Legacy: Legacy register Faculty Type includes protected ADMIN/TPO and Mentor plus department; Faculty.js:1038-1078;FacultyController.java:137-154
- vNext now: vNext roles checkbox and forced faculty Mentor addition; person-onboard-dialog.tsx:215-225;membership-service.ts:82-100
- Fix: Ensure only SA can grant protected roles and faculty type/department remain independently mapped

## G2-18-031-042  [P1] GAP  facet F10  effort L
- Legacy: Legacy Faculty POST /register, /bulk-validate, /bulk-register, PUT /update/{id}, DELETE /delete/{id}; FacultyController.java:107-196,623-690
- vNext now: vNext POST /api/admin/faculty/bulk-import and /api/people/onboard plus scoped profile editor, no verified account deletion route; super-admin-faculty-bulk-import.tsx:48-75;person-onboard-dialog.tsx:69-113
- Fix: Map department/type payloads and batch preflight, retain status/result envelope compatibility for surviving callers

## G2-5-031-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy onValuesChange marks dirty for Manage College close guard. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:376-380`
- vNext now: vNext dialog standalone without parent dirty-change callback. `src/components/admin/person-onboard-dialog.tsx:32-59`
- Fix: Add dirty confirm on modal/drawer close.

## G2-5-031-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy createFacultyAdmin API, body includes role, first/last, mobile/email, college and org. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:131-173`, `docs/legacy-source/frontend/src/api/Services/SuperAdminUsersService.js:1-12`
- vNext now: vNext POST /api/people/onboard creates/reuses users and memberships. `src/components/admin/person-onboard-dialog.tsx:69-112`
- Fix: Map duplicate identity/role collision into exact admin creation results.

## G2-6-001-022  [P1] GAP  facet F06  effort L
- Legacy: Old registration requires First, Last, 10-digit Mobile, Department, Faculty Type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:982-1065`
- vNext now: New add dialog requires First, Last, Phone and Faculty mentor-checkbox only `src/components/admin/person-onboard-dialog.tsx:154-163` `src/components/admin/person-onboard-dialog.tsx:183-235`
- Fix: Require department and explicit legacy Faculty Type selection during onboarding

## G2-6-001-023  [P1] GAP  facet F06  effort M
- Legacy: Old register optional Gender, DOB, Address, Bio fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1081-1101`
- vNext now: New add dialog omits these; later edit is necessary `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Expose optional fields in create flow and persist via profile write

## G2-6-001-024  [P1] GAP  facet F06  effort S
- Legacy: Old birth date uses date picker; college fixed from loginUser `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1021-1029` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1091-1096`
- vNext now: New uses implicit membership college and only name/phone/email `src/components/college/college-role-directory-workspace.tsx:91-93` `src/components/admin/person-onboard-dialog.tsx:75-86`
- Fix: Keep implicit college scope but add DOB picker and mapping

## G2-6-001-028  [P1] GAP  facet F06  effort S
- Legacy: Old submit Register Faculty inside inline Form; Edit Save Changes in 600px modal `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1103-1109` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1379-1393`
- vNext now: New modal Add faculty; Edit dialog Save changes `src/components/admin/person-onboard-dialog.tsx:127-148` `src/components/college/college-person-edit-action.tsx:164-174`
- Fix: Match button wording and dialog width/interaction conventions

## G2-6-001-040  [P1] GAP  facet F10  effort L
- Legacy: Old POST `/api/v1/faculty/register` persists faculty `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-215` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:106-170`
- vNext now: New POST `/api/people/onboard` writes user+membership `src/components/admin/person-onboard-dialog.tsx:75-86` `src/app/api/people/onboard/route.ts:9-35`
- Fix: Map department, faculty enum and old profile metadata into new transactional onboarding

## G2-6-001-045  [P1] GAP  facet F11  effort M
- Legacy: Old `ADMIN` role option shown only to superadmin `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1057-1080`
- vNext now: New college dialog can add FACULTY plus optional MENTOR `src/components/admin/person-onboard-dialog.tsx:224-234`
- Fix: Map legacy faculty-type enum without permitting privilege escalation

## G2-6-002-029  [P1] GAP  facet F06  effort L
- Legacy: Old register required First Name, Last Name, Mobile, Department, Faculty Type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:982-1079`
- vNext now: New onboarding only requires name/mobile, optional mentor role checkbox `src/components/admin/person-onboard-dialog.tsx:154-163` `src/components/admin/person-onboard-dialog.tsx:183-235`
- Fix: Require department and legacy type choice and persist both atomically

## G2-6-002-030  [P1] GAP  facet F06  effort M
- Legacy: Old extra fields Gender, DOB, Address, Bio / Description `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1081-1101`
- vNext now: New creation modal only name, phone, email, mentor toggle `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Add optional profile fields to create modal and server payload

## G2-6-002-033  [P1] GAP  facet F06  effort L
- Legacy: Old initial faculty type has choices PROFESSOR/ASSOCIATE/ASSISTANT/LECTURER/HEAD/COORDINATOR/MENTOR/PERMANENT/VISITING/GUEST/CONTRACT/ADJUNCT; ADMIN superadmin-only `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1057-1079`
- vNext now: New faculty onboarding only Mentor checkbox `src/components/admin/person-onboard-dialog.tsx:223-234`
- Fix: Provide all allowed enum choices and explicit separate membership permission mapping

## G2-6-002-036  [P1] MISSING  facet F06  effort M
- Legacy: Old department form fails closed on departments load error and disables select/submit `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:138-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1055`
- vNext now: New create modal has no department at all `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Load selected-college departments and block submission on lookup failure

## G2-6-002-040  [P1] MISSING  facet F07  effort S
- Legacy: Old department error `Choose a department` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1049`
- vNext now: New modal omits department validation `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Reintroduce department validation after chooser is added

## G2-6-002-051  [P1] GAP  facet F10  effort L
- Legacy: Old creation POST `/api/v1/faculty/register` with dept/type/gender/dob/address `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-215` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:386-407`
- vNext now: New POST `/api/people/onboard` with identity/mobile/email/roles `src/components/admin/person-onboard-dialog.tsx:75-86`
- Fix: Map all legacy create payload fields and reconcile canonical user+membership persistence

## G2-6-002-059  [P1] GAP  facet F12  effort L
- Legacy: Old faculty type registration may be ADMIN only for superadmin, otherwise all listed roles `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1057-1080`
- vNext now: New FACULTY role onboarding with optional MENTOR membership `src/components/admin/person-onboard-dialog.tsx:75-86` `src/components/admin/person-onboard-dialog.tsx:223-234`
- Fix: Define mapping from old faculty_type to facultyProfiles.employmentType and membershipRoles

## G2-6-002-085  [P1] GAP  facet F21  effort L
- Legacy: Old AdminService sends direct API calls for register/bulk/edit/delete; sessions support impersonation tokens `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:543-559`
- vNext now: New separate canonical identity onboarding API and no visible impersonate `src/components/admin/person-onboard-dialog.tsx:75-86` `src/app/(authenticated)/admin/faculty/page.tsx:36-44`
- Fix: Inventory external session, notification and audit integrations before restoring support action
