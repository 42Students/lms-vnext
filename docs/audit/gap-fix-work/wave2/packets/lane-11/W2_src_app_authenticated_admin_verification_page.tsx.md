# Work packet (wave 2): edit src/app/(authenticated)/admin/verification/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/verification.js:7-16 — /superadmin/verification PageShell always titled Profile verification; selected college shows embedded queue.
- vNext now: src/app/(authenticated)/admin/verification/page.tsx:15-28 — /admin/verification redirects college-selected users to /admin/colleges/:id/verification.
- Fix: Keep workspace embedded under SuperAdmin route and preserve legacy deep link

## G2-10-024-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/verification.js:12-15 — No college shows info alert 'Choose a college at the top...' without navigation.
- vNext now: src/app/(authenticated)/admin/verification/page.tsx:30-39 — Separate EmptyState and Browse colleges CTA.
- Fix: Use original info banner with no required navigation

## G2-10-024-083  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/verification.js:12-12 — 'Profile verification' title exactly.
- vNext now: src/app/(authenticated)/admin/verification/page.tsx:32-34 — Exact title when unselected; scoped src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:43-45 uses college name.
- Fix: Restore title at scoped route
