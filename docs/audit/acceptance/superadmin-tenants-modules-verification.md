# Super Admin Tenants & Modules — verification evidence

Audit `docs/audit/pages/superadmin/tenants-modules.md`. Protocol `docs/orchestrator/briefs/gap-closure-lane.md`. `tests/unit/superadmin-tenants-gap-closure.test.ts` contains 11 gap-ID-named tests. **Tests written, not run.** Server and UI source verified; PostgreSQL acceptance for all settings writes still pending orchestration.

| ID | Status | Source evidence / incomplete work |
| --- | --- | --- |
| SA-tenants-modules-10 | DONE | Server canonicalizes organization whitespace and validates blanks; form shows human duplicate and success; named test SA-tenants-modules-10 |
| SA-tenants-modules-12 | DONE | Server lowercases and validates ^[a-z0-9-]{3,63}$; form honors the rule and maps duplicate errors; named test SA-tenants-modules-12 |
| SA-tenants-modules-18 | OPEN | Sign out everywhere action exists; complete active session device/IP list not independently verified |
| SA-tenants-modules-21 | DONE | College sign-in methods provide explicit email/phone options, expectedVersion guarded write, and save feedback; named test SA-tenants-modules-21 |
| SA-tenants-modules-03 | OPEN | Tenant setup navigation exists; full 11-card scoped overview grid not confirmed |
| SA-tenants-modules-04 | OPEN | Unscoped Overview recruiter-accounts card and original four descriptions incomplete |
| SA-tenants-modules-06 | OPEN | Tenant structure and launch setup remain separate navigation; two-tab parity open |
| SA-tenants-modules-07 | OPEN | Organization Archive action is not legacy permanent Delete |
| SA-tenants-modules-08 | OPEN | Organization archive guard exists; full search/pagination/refresh controls need verification |
| SA-tenants-modules-11 | DONE | College create has City/State/Address/Pin/Country inputs and typed persisted payload; named test SA-tenants-modules-11 |
| SA-tenants-modules-13 | OPEN | Tenant directory searches/paginates; specific legacy Colleges table and page-size controls incomplete |
| SA-tenants-modules-14 | OPEN | Archive vs Delete legacy copy and dependency toasts differ |
| SA-tenants-modules-16 | OPEN | Address edits exist; organization and immutable Unique ID still cannot be changed |
| SA-tenants-modules-17 | OPEN | Admin lifecycle actions exist; Manage College tab/role-create workflow incomplete |
| SA-tenants-modules-19 | OPEN | Scoped per-college Activity tab with export not yet confirmed |
| SA-tenants-modules-23 | OPEN | Launch readiness copy/list distinctions need original semantic states |
| SA-tenants-modules-R02 | OPEN | Action not verified across legacy parity |
| SA-tenants-modules-05 | OPEN | Native scope picker is not equivalent to searchable/clearable switcher at scale |
| SA-tenants-modules-09 | OPEN | Unsaved form guard for organizations/colleges remains unverified |
| SA-tenants-modules-R01 | OPEN | Metadata not independently verified |
| SA-tenants-modules-R03 | OPEN | Permission scenario not independently verified |

New mutation tests check real typed request validation and current source contract, not claimed production SMTP, DNS, image-bucket or active-session behavior. Protected wildcard-DNS live provisioning is outside this page queue and cannot be called working solely because the UI displays an Allot control.
