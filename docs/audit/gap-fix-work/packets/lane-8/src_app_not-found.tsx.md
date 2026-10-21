# Work packet: edit src/app/not-found.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/404.md

## G2-20-001-002  [P1] GAP  facet F01  effort M
- Legacy: Authenticated home href from `homePathForRole(role)` with Super Admin `/superadmin/dashboard`, Admin `/college-admin/dashboard`, Learner `/learn/courses`; `docs/legacy-source/frontend/src/pages/404.js:73-82`, `docs/legacy-source/frontend/src/config/roles.js:24-32,77`
- vNext now: Root fallback hardcodes `/`; nested admin fallback `/admin`, learner fallback `/learn`; `src/app/not-found.tsx:4-6`, `src/app/(authenticated)/admin/not-found.tsx:4-12`, `src/app/(authenticated)/learn/not-found.tsx:5-9`
- Fix: For every authenticated not-found boundary resolve current membership's actual home route (role landing, not generic portal root); cover direct and nested unknown URLs.

## G2-20-001-020  [P1] GAP  facet F10  effort S
- Legacy: Home click performs client-side `next/link` route change to derived role home; `docs/legacy-source/frontend/src/pages/404.js:41-43,73-76`
- vNext now: Home click performs Next Link navigation to hardcoded route; `src/app/not-found.tsx:4-6`, `src/components/public/graceful-screen.tsx:43`
- Fix: Derive home destination from server membership in authenticated shell, or use centralized role-aware home redirect.

## G2-20-001-022  [P1] GAP  facet F11  effort M
- Legacy: Logged-in users get role shell; explicit Super Admin/Admin selection plus shared Layout for others; `docs/legacy-source/frontend/src/pages/404.js:73-82`
- vNext now: Root fallback uses public layout, while nested role-specific not-found handlers exist; `src/app/not-found.tsx:3-7`, `src/app/(authenticated)/admin/not-found.tsx:4-12`, `src/app/(authenticated)/learn/not-found.tsx:5-9`
- Fix: Verify which unmatched authenticated deep links resolve to nested boundaries and ensure correct shell/permissions in all namespaces.
