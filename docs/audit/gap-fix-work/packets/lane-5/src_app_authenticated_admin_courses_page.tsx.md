# Work packet: edit src/app/(authenticated)/admin/courses/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-19-027-001  [P1] GAP  facet F01  effort M
- Legacy: API base `/api/v1/courses` with POST /create, GET /fetch and /fetchAll, scoped + paged variants, slug reads, PUT /update, DELETE /delete, GET /deleted and POST /restore; CourseController.java:27-30,66-67,95-105,129-131,159-175,195-198,233-235,267-269,287-291,322-324,406-408,450-452,463-465
- vNext now: REST GET/POST `/api/courses`, PATCH/DELETE `/api/courses/{courseId}`; src/app/api/courses/route.ts:11-50; [courseId]/route.ts:13-65, with server page `/admin/courses`; admin/courses/page.tsx:11-29
- Fix: Produce explicit route crosswalk for every old operation, URL redirect, method and response; identify deprecated legacy client callers before changing API contract.

## G2-19-027-037  [P1] GAP  facet F11  effort M
- Legacy: `fetchAll` unscoped global Super Admin may read across platform, scoped org/college filtered; CourseController.java:104-125
- vNext now: vNext Super Admin Courses page requires selected college, empty without one; admin/courses/page.tsx:14-48
- Fix: Offer explicit authorized global/org catalogue read only in platform-admin mode, never remove college scope by default.

## G2-12-003-002  [P1] MISSING  facet F01  effort M
- Legacy: Unscoped SA has global Progress policy in progress lower bound setting, default 5%, range0..99 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:530-535`
- vNext now: Unscoped SA only sees navigation tabs plus scope-selection empty state `src/app/(authenticated)/admin/courses/page.tsx:18-43`
- Fix: Restore global progress policy control independent of college selection

## G2-12-003-054  [P1] MISSING  facet F11  effort S
- Legacy: Global progress policy editable without college `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:527-535`
- vNext now: Page requires selected college before any content `src/app/(authenticated)/admin/courses/page.tsx:18-43`
- Fix: Expose platform policy in SA unscoped state

## G2-12-003-059  [P1] GAP  facet F13  effort S
- Legacy: Refresh failure keeps stale loaded college rows and warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:607-613`
- vNext now: Server page crashes into route error if load throws; no last snapshot `src/app/(authenticated)/admin/courses/page.tsx:64-99`
- Fix: Add last-good snapshot/partial recovery for directory

## G2-18-003-002  [P1] GAP  facet F01  effort M
- Legacy: No selected college shows warning and global Progress policy editor, without Courses manager. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:11-29`
- vNext now: vNext shows course header + tabs + Select a college EmptyState, but no global policy card. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Render globally editable Progress policy card in unscoped Super Admin course surface, gated to platform scope.

## G2-18-003-064  [P1] MISSING  facet F10  effort M
- Legacy: Legacy global policy reads/writes `course.minInProgressPercent` through global settings API, min0 max99 default5. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:21-27`, `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:26-38`, `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:91-116`
- vNext now: vNext unscoped courses view has no policy field/action. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Re-add progress threshold editor with global permission, persistence and reset-to-default behavior.

## G2-18-003-068  [P1] MISSING  facet F11  effort M
- Legacy: Legacy global progress policy editable only when no college selected, super-admin. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:11-29`, `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:20-25`
- vNext now: vNext page no global policy control regardless of college. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Permit global policy within designated platform configuration view, link from Courses if intentionally relocated.

## G2-18-003-076  [P1] GAP  facet F13  effort S
- Legacy: Legacy unscoped state warning plus global policy form. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:11-29`
- vNext now: vNext unscoped EmptyState lacks policy form. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Show policy editor; use warning banner not empty-only.

## G2-18-003-086  [P1] MISSING  facet F15  effort M
- Legacy: Legacy global progress policy updates key and shows `${label} updated` toast. `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:91-116`
- vNext now: vNext unscoped page lacks policy mutation. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Rebuild global setting save/reset and event audit with exact success/error feedback.

## G2-18-003-107  [P1] MISSING  facet F21  effort M
- Legacy: Legacy global policy reads tenant settings through PolicySettingField and GLOBAL scope, default 5. `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:5-12`, `docs/legacy-source/frontend/src/pages/superadmin/courses.js:21-27`
- vNext now: vNext page no progress policy, so no page-level integration. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Wire existing platform setting override service or implement typed course threshold storage.

## G2-18-003-044  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing department error `Departments could not be loaded` and Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:519-525`
- vNext now: vNext create page uses typed workspace data/permission boundaries; no equivalent local fetch alert visible in create component. `src/components/courses/admin-course-create-panel.tsx:94-100`, `src/app/(authenticated)/admin/courses/page.tsx:64-69`
- Fix: Show scoped department-fetch failure separately with retry and preserve last known list only if valid.
