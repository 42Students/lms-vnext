# Work packet (wave 2): edit src/components/admin/super-admin-hr-detail-drawer.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

## G2-10-021-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-572 — Click name opens in-page right 640px detail Drawer.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:560-562,907-943; src/components/admin/super-admin-hr-detail-drawer.tsx:100-135 — Detail Drawer via 'View' button, name not clickable.
- Fix: Make name a link/button to open 640px drawer and preserve View as optional.

## G2-10-021-009  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-572 — Detail Drawer has College access Card/table, grant controls inline.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:204-357 — Drawer has border sections, grant controls hidden in <details>.
- Fix: Keep College access Card/table/grant picker visible without expanding.

## G2-10-021-014  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:365-396 — Drawer grant rows show College, Access Active/Revoked/Expired, Until date Tag, Remove.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:218-250,367-373 — List of currently active grants, history separate section, Revoke button.
- Fix: Render 3-column grant table with statuses and Until badge.

## G2-10-021-070  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:430-433 — List error and options error distinct retry banners.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:745-757; src/components/admin/super-admin-hr-detail-drawer.tsx:312-328 — independent detail/option errors but options not top-level.
- Fix: Render both top-level errors without blanking list.

## G2-10-021-078  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-528 — Detail right Drawer fixed 640.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:100-114 — Shared Drawer no explicit width.
- Fix: Set desktop width640 and responsive mobile fill.

## G2-10-021-081  [P2] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-535 — Delete action explicit danger label.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:375-397 — No delete action.
- Fix: Expose accessible delete account action if lifecycle retained.

## G2-10-021-105  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:547-554 — Drawer shows active+historical grants in one table; server-colleges model.
- vNext now: src/components/admin/super-admin-hr-types.ts:29-31; src/components/admin/super-admin-hr-detail-drawer.tsx:367-374 — grantHistory optional separate section; active grants list.
- Fix: Always expose grant history and lifecycle end states.

## G2-8-024-004  [P2] GAP  facet F02  effort M
- Legacy: Old controller workflow list, detail, create/update, suspend/reactivate, revoke sessions/delete, grants/revokes (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:67-158).
- vNext now: New admin accounts uses one PageHeader workspace and detail drawer with sections identity, grants, security (src/app/(authenticated)/admin/hr/page.tsx:179-187; src/components/admin/super-admin-hr-detail-drawer.tsx:101-114,159-201,204-215,375-395).
- Fix: Verify legacy action placement/tab sequence and move related actions without burying core controls.

## G2-8-024-052  [P2] GAP  facet F18  effort M
- Legacy: Legacy view refers to recruiter and response key hr; legacy revoke sessions success All sessions revoked (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:122-127).
- vNext now: New PageHeader Recruiter accounts, action Terminate all sessions (src/app/(authenticated)/admin/hr/page.tsx:46-49; src/components/admin/super-admin-hr-detail-drawer.tsx:375-395).
- Fix: Use consistent Recruiter Accounts capitalization and user-facing old success message.

## G2-10-021-015  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:545-550 — Drawer status tag shows Account: Active and inline mobile/company/designation.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:159-201 — Status badge alongside summary with separate definition rows.
- Fix: Keep compact opening line and account tag.

## G2-10-021-020  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:366-373 — Grant labels include college code and expiry raw yyyy-mm-dd.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:229-236 — Name/date formatted to en-IN IST; college code omitted.
- Fix: Include code plus badge-formatted expiry date.

## G2-10-021-068  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:539-543 — Opening detail immediately shows centered Spin in 640px drawer.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:136-148 — LoadingState with label; drawer remains open.
- Fix: Match spinner alignment, area and text density.

## G2-10-021-088  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:567 — Grant CTA 'Give access'.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:355-356 — 'Grant access'.
- Fix: Match button wording.

## G2-10-021-089  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:390-391 — Revoke 'Remove'.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:245-247 — 'Revoke'.
- Fix: Match button and confirmation wording.
