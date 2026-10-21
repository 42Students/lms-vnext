# Work packet (wave 2): edit src/app/(authenticated)/layout.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md, docs/audit/gap2/lane-20/404.md

## G2-10-010-026  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-15` unconditional redirect; authorization occurs on destination layout
- vNext now: `src/app/(authenticated)/layout.tsx:52-68` authenticated layout resolves session/roles before nested redirect page; `src/app/(authenticated)/admin/layout.tsx:9-10` admin auth path
- Fix: Verify root landing never reveals academic content to non-Super Admin; preserve redirect for valid bookmarked users

## G2-20-001-023  [P2] GAP  facet F11  effort M
- Legacy: On hard refresh, restore persisted identity before selecting shell; `docs/legacy-source/frontend/src/pages/404.js:53-75`
- vNext now: Authenticated layout resolves request context/session server-side; `src/app/(authenticated)/layout.tsx:52-98,117-157`
- Fix: Preserve signed-in shell when nested not-found runs and test with valid persisted session/expired cookie; no direct localStorage restoration needed if server cookie authoritative.

## G2-20-001-025  [P2] GAP  facet F12  effort S
- Legacy: No eligibility or record status transitions; only `authenticated = isUserLoggedIn && role`; `docs/legacy-source/frontend/src/pages/404.js:73-76`
- vNext now: Session/context gate tests valid membership; `src/app/(authenticated)/layout.tsx:52-98,122-138`
- Fix: Document changed session authority (Redux/localStorage vs cookie/request context); verify expected 404 UX for invalid membership.

## G2-20-001-028  [P2] GAP  facet F13  effort M
- Legacy: If localStorage throws, treat user as anonymous; `docs/legacy-source/frontend/src/pages/404.js:62-70`
- vNext now: Server session failures redirect to login or membership recovery; `src/app/(authenticated)/layout.tsx:69-98,124-138`
- Fix: Record and test localStorage-denied browsers; ensure fallback does not loop between unknown route and login.

## G2-20-001-041  [P2] GAP  facet F20  effort S
- Legacy: Session from localStorage may be stale; catches storage exceptions; `docs/legacy-source/frontend/src/pages/404.js:57-71`
- vNext now: Session expired/revoked/invalid each redirects with auth query key; `src/app/(authenticated)/layout.tsx:100-138`
- Fix: Test 404 recovery across expired/revoked/session-invalid states and preserve returnTo without leaking cross-origin URLs.

## G2-10-010-043  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:1-20` legacy layout imported on destination; not in redirect itself
- vNext now: `src/app/(authenticated)/layout.tsx:52-68` authenticated layout loads memberships/scope choices before page body
- Fix: Measure cold-link redirect latency after authentication; prevent extra duplicate scope round trips

## G2-20-001-039  [P3] GAP  facet F19  effort S
- Legacy: No list load; effective-user determination is client localStorage after first render; `docs/legacy-source/frontend/src/pages/404.js:49-76`
- vNext now: Server request-context and membership list resolved before authenticated render; `src/app/(authenticated)/layout.tsx:52-68,117-145`
- Fix: Compare response timing and fallback chrome; avoid auth flash and additional blocking checks on public route.
