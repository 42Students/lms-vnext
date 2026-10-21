# Work packet: edit src/app/(authenticated)/admin/faculty/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-19/faculty-search-controller.md

## G2-6-002-058  [P1] MISSING  facet F11  effort M
- Legacy: Old superadmin impersonation shown only when target not suspended `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:856-876`
- vNext now: New admin roster omit action entirely `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Restore guarded role/session state checks if support impersonation needed

## G2-6-002-071  [P1] MISSING  facet F15  effort M
- Legacy: Old clear OTP lockout calls admin utility and shows toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:561-570`
- vNext now: New admin action array omits clear lockout `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Add admin-only OTP reset with audit and rate limiting controls

## G2-6-002-085  [P1] GAP  facet F21  effort L
- Legacy: Old AdminService sends direct API calls for register/bulk/edit/delete; sessions support impersonation tokens `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:543-559`
- vNext now: New separate canonical identity onboarding API and no visible impersonate `src/components/admin/person-onboard-dialog.tsx:75-86` `src/app/(authenticated)/admin/faculty/page.tsx:36-44`
- Fix: Inventory external session, notification and audit integrations before restoring support action

## G2-6-003-015  [P1] GAP  facet F06  effort L
- Legacy: Old wrapper renders no direct form, but nested Faculty required Department and Type when registering `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:25-27` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1038-1079`
- vNext now: New wrapper uses PersonOnboardDialog without department and type select `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:154-235`
- Fix: Restore required department and type fields within scoped Super Admin Faculty create

## G2-6-003-023  [P1] GAP  facet F10  effort L
- Legacy: Old route is a wrapper and has no mutation itself; nested Faculty POST `/api/v1/faculty/register` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:23-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:106-170`
- vNext now: New wrapper likewise delegates POST to onboard component `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:75-86`
- Fix: Ensure delegated create persists dept/type/profile metadata and admin audit row

## G2-15-027-041  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/ProtectedFacultyRoles.java:21-54 ADMIN/TPO may be granted/managed only superadmin; self-edit exemption
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:21-43 forcedRole FACULTY + lifecycle via scoped tools
- Fix: Apply protected-role mutation fence across onboarding, lifecycle and profile paths.

## G2-19-013-023  [P3] GAP  facet F08  effort S
- Legacy: Legacy success response `"Faculty retrieved in Nms" for search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:164-170`
- vNext now: vNext directory rows rendered in page with no API latency text `src/app/(authenticated)/admin/faculty/page.tsx:20-44`
- Fix: Avoid promising specific timing; preserve success semantics if adapter used.
