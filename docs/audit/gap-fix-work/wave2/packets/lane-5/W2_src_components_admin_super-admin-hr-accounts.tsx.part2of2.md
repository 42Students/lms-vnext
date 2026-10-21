# Work packet (wave 2): edit src/components/admin/super-admin-hr-accounts.tsx (part 2 of 2)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md, docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-3-031-044  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:124-148`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:174-185`
- Fix: Legacy scope switch discards open unsaved editor and resets grant state with warning; vNext keyed by scopeKey remounts but warning text may be missing.

## G2-3-031-048  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:399-415`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:678-685`
- Fix: Legacy metric counts Active/Suspended/Deleted on current page; vNext status summary totals across scope.

## G2-3-031-050  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:154-176`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:233-290`
- Fix: Legacy detail fetch error uses Ant message then closes state; vNext keeps detail error panel and retry.

## G2-3-031-051  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-559`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:736-915`
- Fix: Legacy No colleges yet. text for empty grant table vs vNext no grant/history panel copy. Restore exact empty.

## G2-3-031-057  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:332-356`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:560-581`
- Fix: Legacy disabled action tooltip states explain out-of-scope and not-active; vNext Actions menu disabled tooltips may be hidden on mobile sheet.

## G2-3-031-059  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:403-418`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:663-685`
- Fix: Exact Industry access eyebrow, Recruiter account lifecycle title and one recruiter identity description missing or altered.

## G2-3-031-060  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:319-323`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:582-642`
- Fix: Exact Mobile column separated and Active on page/Suspended on page/Deleted on page labels differ.

## G2-3-031-067  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:8-23`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:61-103`
- Fix: Legacy getColleges/AdminService and SupAdminRecruiterService calls; vNext same-origin JSON with placement relationship options, different error/dependency boundaries.

## G2-3-031-070  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-574`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:736-993`
- Fix: Clone Drawer detail, visible Add a college/Until picker and per-grant Remove, plus scopes and disabled tooltips.

## G2-10-021-010  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:318-363 — Columns Name, Mobile, Company, Colleges, Status, Actions.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:582-645 — Same logical columns but Name includes email/title and Actions header sr-only.
- Fix: Match row density/heading and secondary line visibility.

## G2-10-021-047  [P3] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:354-357 — Sign-out confirms 'Sign <name> out everywhere?'
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:954-965 — Title 'Terminate all sessions for <name>?'.
- Fix: Restore title, keep canonical-session warning in description.

## G2-10-021-052  [P3] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:150-176; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:79-82 — GET recruiter/:id on opening detail.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:233-282 — GET /api/admin/hr/:userId canonical ID.
- Fix: Maintain detail by canonical user mapping.

## G2-10-021-084  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:435-435 — Card heading 'Recruiter accounts'.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:662-664 — Same page heading, but no Table Card heading.
- Fix: Restore Card title above table.

## G2-10-021-090  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:355-357 — Button 'Sign out'.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:575-576 — Same in dropdown; drawer says Terminate all sessions.
- Fix: Use same concise label in main and drawer.

## G2-3-031-012  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:438-453`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:695-710`
- Fix: Legacy search placeholder Name, mobile or email; vNext generic Search and status filter. Match placeholder and inline width.
