# Chat-16 public and legacy-route Pass A verification

Routes reviewed: `/company-share/[token]`, `/e2e/superadmin-login`, `/enterprises`, `/forbidden`, `/platform`, `/privacy-policy`, `/request-demo`, `/universities`, `/college-admin/departments`, `/college-admin/programs`.

- All ten already had loading and error boundaries and named UX tests on main at the start of this pass. Added fresh behavioral security, interaction and redirect tests in `tests/unit/UX-public-*-02.test.ts` and `UX-college-admin-role-redirects-02.test.ts`.
- The only no-shared-kit findings in this slice are College Admin's two role-guarded legacy redirects and the two public redirects (e2e and privacy). These render no interface before redirect, so adding invisible shared markup would not fix a real UX issue. The main coverage matrix flags only the two College Admin redirects; both are recorded as **proposed** waivers, pending owner approval.
- The share results use shared `DataTable` with an explicit empty state, a protected 6-digit access path and selected-column export. Marketing pages use the common responsive navigation and 44px minimum tap targets.
- Source-verified against main. Runtime tests and TypeScript check still require the orchestrator CI environment.
