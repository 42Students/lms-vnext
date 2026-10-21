# Work packet: edit src/app/(authenticated)/superadmin/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md

## G2-10-010-001  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-15` bare /superadmin HTTP 302 Location /superadmin/dashboard
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:1-2` bare /superadmin redirect('/admin/academics')
- Fix: Redirect legacy root to /dashboard when Super Admin or equivalent Overview route; preserve browser bookmarks

## G2-10-010-003  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-10` intended old-bookmark/hardcoded-router compatibility
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:2` preserves /superadmin route but maps to a different module
- Fix: Retain old landing intent and document path translation

## G2-10-010-023  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-14` GET /superadmin triggers HTTP302 Location /superadmin/dashboard
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:1-2` GET /superadmin invokes Next redirect /admin/academics
- Fix: Make GET response location compatible with legacy destination intent

## G2-10-010-029  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-10` explicit product rule root should route to superadmin dashboard
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:2` routes academic module requiring selected college
- Fix: Restore default landing to global Overview/Dashboard independent of tenant selection

## G2-10-010-045  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-14` 302 redirect reusable bookmark always resolves same landing
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:2` always resolves to college-dependent academic page
- Fix: Ensure stable Overview endpoint for global, org and college scopes
