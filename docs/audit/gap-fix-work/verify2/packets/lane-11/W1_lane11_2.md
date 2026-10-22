# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-009-057 [P1] GAP facet F09
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:129-133` done/reopen disabled when open.loading and posted
- Expected fix: Disable actions while unresolved detail loads and for posted replies

## G2-10-009-060 [P1] MISSING facet F10
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/SuperAdminInboundMailService.js:9` GET /api/v1/superadmin/inbound-mail/{id} loads full mail
- Expected fix: Add authenticated GET /api/admin/inbound-mail/{id} with role gate and full body

## G2-10-009-124 [P1] GAP facet F23
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:69-71` fetch full body on open
- Expected fix: Restore lazy detail fetch and full-body visibility

## G2-10-014-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:104-110 — Selected college missing shows yellow 'Select a college to continue' warning.
- Expected fix: Keep guard while showing actionable warning.

## G2-10-015-050 [P1] GAP facet F12
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Reverse paths from INTERVIEW/OFFERED/HIRED and REJECTED reinstate available.
- Expected fix: Restore audit-safe reversals or mark intentional.

## G2-10-018-087 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-423 — One screen creates inline and shows existing table side-by-side.
- Expected fix: Rebuild structure while keeping advanced filters reachable.

## G2-10-019-014 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx, src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:506-513 — 'Placement cell decides' textual state with tooltip for eligibility-controlled cells.
- Expected fix: Determine where eligibility is authoritative; avoid falsely editable cells.

## G2-10-019-021 [P1] GAP facet F04
- Files: src/components/admin/learner-module-access-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:790-817 — Per-learner name fallback #id, roll number, individual On/Off tags, legacy lock without value.
- Expected fix: Build override roster with precise tags and lock-only status.

## G2-10-019-030 [P1] GAP facet F06
- Files: src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:524-527 — Clicking an editable module cell opens Segmented Inherit/On/Off in-place.
- Expected fix: Restore in-cell tri-state editing and immediate apply behavior.

## G2-10-019-031 [P1] GAP facet F06
- Files: src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:528-539 — Lock icon appears only Super Admin and explicit value; toggle via confirmation.
- Expected fix: Match explicit-only lock availability and confirmation.

## G2-10-019-046 [P1] GAP facet F09
- Files: src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:398-433 — Broad (>100 students or college/dept/program) On/Off/Inherit opens confirmation with blast-radius text.
- Expected fix: Show actual scope population, implications, and danger style for Off.

## G2-10-019-047 [P1] GAP facet F09
- Files: src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:459-499 — Broad Lock/Unlock confirm with warnings about ignored lower settings.
- Expected fix: Separate lock confirm with exact consequences and current value.

## G2-10-019-065 [P1] GAP facet F12
- Files: src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:515-576 — Ancestor locked causes disabled control and explicit shadow strikeout.
- Expected fix: Resolve ancestor lock before offering mutating control.

## G2-10-019-096 [P1] GAP facet F20
- Files: src/components/admin/learner-module-access-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:260-279 — Four sequence refs invalidate all pending tree/search/trace/history responses on scope switch.
- Expected fix: Reset/abort all scope-dependent client state on college change.

## G2-10-019-111 [P1] MISSING facet F23
- Files: src/components/admin/descendant-feature-rule-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:398-499 — Scope-population warnings for actions affecting many students.
- Expected fix: Require selected-scope blast-radius and warning, no guessed number.

## G2-10-021-028 [P1] GAP facet F06
- Files: src/components/admin/super-admin-hr-account-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:178-182 — Add recruiter modal preselects current selectedCollegeId in Colleges multi-select.
- Expected fix: Prefill selected college's relationship when scope picked.

## G2-10-021-029 [P1] GAP facet F06
- Files: src/components/admin/super-admin-hr-account-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:493-520 — Create fields firstName,lastName,mobile,email,companyName,designation,collegeIds.
- Expected fix: Preserve source field order, separate new entity workflow if needed.

## G2-10-021-031 [P1] GAP facet F06
- Files: src/components/admin/super-admin-hr-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:556-567 — Grant picker directly shows scoped college options, optional DatePicker end-of-day.
- Expected fix: Expose picker/expiry/grant inline and map expiry semantics.

## G2-10-021-054 [P1] GAP facet F10
- Files: src/components/admin/super-admin-hr-detail-drawer.tsx, src/modules/placements/super-admin-hr-validation.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-298; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-149 — POST grant and DELETE revoke by college numeric ID.
- Expected fix: Resolve selected company relationship to college and expiry precisely.

## G2-10-021-102 [P1] GAP facet F22
- Files: src/components/admin/super-admin-hr-types.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:318-323,365-376 — Numeric recruiter id, contactMobile/companyName, activeCollegeCount, status SUSPENDED/DELETED.
- Expected fix: Map canonical identifiers, status and aggregate counts in migration-free vNext.

## G2-10-021-107 [P1] GAP facet F23
- Files: src/components/admin/super-admin-hr-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-572 — Direct in-drawer grant editor with optional unlimited grant expiry.
- Expected fix: Resolve expiry product decision and expose date affordance.

## G2-10-023-004 [P1] GAP facet F01
- Files: src/components/admin/college-create-form.tsx, src/app/(authenticated)/admin/tenants/create/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:83-90 — Creating college auto-selects it and jumps identity tab.
- Expected fix: After create select scoped college and move directly to Launch setup

## G2-10-023-031 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:141-156 — Subdomain text placeholder kluniversity, save and remove buttons.
- Expected fix: Embed subdomain editor in Launch

## G2-10-023-052 [P1] GAP facet F10
- Files: src/components/admin/college-create-form.tsx, src/app/(authenticated)/admin/tenants/create/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:87-122 — createCollege payload includes code/org/address; success selects scope.
- Expected fix: Preserve selected tenant transition

## G2-17-030-022 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/placements/new/page.tsx, src/app/(authenticated)/admin/placements/page.tsx
- Legacy: New drive opens Modal width800 with JobForm; Duplicate same dialog prefilled duplicateFrom; DrivesLanding.js:656-672
- Expected fix: Restore width800 Create Drive dialog and duplicate-prefill, while preserving newer form validations.
