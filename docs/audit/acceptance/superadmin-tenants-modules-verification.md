# Super Admin Tenants & Modules — verification evidence

Audit `docs/audit/pages/superadmin/tenants-modules.md`. Protocol `docs/orchestrator/briefs/gap-closure-lane.md`. `tests/unit/superadmin-tenants-gap-closure.test.ts` contains 11 gap-ID-named tests. **Tests written, not run.** Server and UI source verified; PostgreSQL acceptance for all settings writes still pending orchestration.

| ID | Status | Source evidence / incomplete work |
| --- | --- | --- |
| SA-tenants-modules-10 | DONE | Server canonicalizes organization whitespace and validates blanks; form shows human duplicate and success; named test SA-tenants-modules-10 |
| SA-tenants-modules-12 | DONE | Server lowercases and validates ^[a-z0-9-]{3,63}$; form honors the rule and maps duplicate errors; named test SA-tenants-modules-12 |
| SA-tenants-modules-18 | OPEN | Sign out everywhere action exists; complete active session device/IP list not independently verified |
| SA-tenants-modules-21 | DONE | College sign-in methods provide explicit email/phone options, expectedVersion guarded write, shared apiFetch and ref-locked action guard with friendly 409 handling; named test SA-tenants-modules-21 |
| SA-tenants-modules-03 | OPEN | Tenant setup navigation exists; full 11-card scoped overview grid not confirmed |
| SA-tenants-modules-04 | DONE (source; test not run) | `SUPER_ADMIN_GLOBAL_LINKS` now has Tenant Setup→unscoped directory, Recruiter accounts, Feature Controls and Activity Log with distinct descriptions, rendered under exact legacy hero in a four-card grid. `tests/unit/superadmin-tenants-gap-closure.test.ts`: `SA-tenants-modules-04 unscoped platform has four described navigation cards including Recruiter accounts`. |
| SA-tenants-modules-06 | OPEN | Tenant structure and launch setup remain separate navigation; two-tab parity open |
| SA-tenants-modules-07 | NOT-A-GAP (intentional vNext improvement) | Owner resolution keeps Archive instead of permanent Delete, preserving historical organizations. Organization service persists ARCHIVED status and checks dependent colleges, with explicit refusal and no data deletion. `tests/unit/superadmin-tenants-gap-closure.test.ts`: `SA-tenants-modules-07 archive is intentionally non-destructive with dependent-college guard`. Restore workflow now has a source-level implementation under `SA-tenants-modules-R02`. |
| SA-tenants-modules-08 | OPEN | Organization archive guard exists; full search/pagination/refresh controls need verification |
| SA-tenants-modules-11 | DONE | College create has City/State/Address/Pin/Country inputs and typed persisted payload; named test SA-tenants-modules-11 |
| SA-tenants-modules-13 | OPEN | Tenant directory searches/paginates; specific legacy Colleges table and page-size controls incomplete |
| SA-tenants-modules-14 | NOT-A-GAP (intentional vNext improvement) | The owner resolved to retain Archive rather than legacy Delete, and the UI reports live dependency counts. `archiveCollege` asserts dependencies and persists ARCHIVED, without destructive deletion. `tests/unit/superadmin-tenants-gap-closure.test.ts`: `SA-tenants-modules-14 college archive intentionally preserves dependencies and historical records`. Restore remains R02. |
| SA-tenants-modules-16 | OPEN | Address edits exist; organization and immutable Unique ID still cannot be changed |
| SA-tenants-modules-17 | OPEN | Admin lifecycle actions exist; Manage College tab/role-create workflow incomplete |
| SA-tenants-modules-19 | OPEN | Scoped per-college Activity tab with export not yet confirmed |
| SA-tenants-modules-23 | OPEN | Launch readiness copy/list distinctions need original semantic states |
| SA-tenants-modules-R02 | DONE (source verified; PostgreSQL/browser unexecuted) | Same-origin restore POST routes, scoped service restore of ARCHIVED only, audited transaction, parent ACTIVE guard, duplicate organization-name check and confirmed client action. See Round 8 R02 evidence below and `tests/unit/superadmin-tenants-gap-closure.test.ts` named SA-tenants-modules-R02. |
| SA-tenants-modules-05 | OPEN | Native scope picker is not equivalent to searchable/clearable switcher at scale |
| SA-tenants-modules-09 | DONE | `src/components/admin/organization-create-form.tsx`, `college-create-form.tsx` use per-form `useFormDraft` restored state, beforeunload warning and clear-on-commit; `tests/unit/superadmin-tenants-gap-closure.test.ts` test SA-tenants-modules-09 |
| SA-tenants-modules-R01 | OPEN | Metadata not independently verified |
| SA-tenants-modules-R03 | NOT-A-GAP (conservative access model) | Audit Findings intentionally require active Super Admin plus centrally authorized admin scope, rather than inheriting the broader legacy logs-access role. No college member or public access. `tests/unit/superadmin-tenants-gap-closure.test.ts`: `SA-tenants-modules-R03 Audit Findings requires an active Super Admin rather than a broad logs role`. |

New mutation tests check real typed request validation and current source contract, not claimed production SMTP, DNS, image-bucket or active-session behavior. Protected wildcard-DNS live provisioning is outside this page queue and cannot be called working solely because the UI displays an Allot control.


## Round 6 — source contracts and setup navigation (tests not executed)

| ID | Status | Evidence |
| --- | --- | --- |
| SA-tenants-modules-06 | OPEN | Scoped setup now links two named steps Tenant structure and Launch setup, with no implicit unrelated-tenant selection. It is still not the legacy fully co-located two-tab editor. `admin/tenants/setup/page.tsx`. |
| SA-tenants-modules-19 | OPEN | A college detail now exposes Activity and Export activity CSV entries with explicit `collegeId`, and Tenant Setup links to the same authorized scoped endpoints. Global Activity route persists the filter. Embedded detail-page audit grid is still not cloned. `admin/colleges/[collegeId]/page.tsx` and `admin/tenants/setup/page.tsx`. |
| SA-tenants-modules-04 | DONE | Four described unscoped global cards including recruiter accounts; named SA-tenants-modules-04 unit test. |
| SA-tenants-modules-07 | NOT-A-GAP | Approved archive-not-delete safety model; named SA-tenants-modules-07 test. |
| SA-tenants-modules-14 | NOT-A-GAP | Approved archive-not-delete dependency-preserving model; named SA-tenants-modules-14 test. |
| SA-tenants-modules-R03 | NOT-A-GAP | Deliberately restricted Audit Findings to active Super Admin with scoped permission; named SA-tenants-modules-R03 test. |

| SA-tenants-modules-R02 | DONE (source verified; PG/browser unexecuted) | Scoped archived organization/college restore is implemented, validated and audited through `src/modules/{organizations,colleges}/service.ts`, same-origin restore POST routes, `tenant-restore-action.tsx`, archived Organization list and College detail. Parent must be ACTIVE before restoring college, no child state auto-recovery. Unit test named SA-tenants-modules-R02 in `tests/unit/superadmin-tenants-gap-closure.test.ts`; browser and PostgreSQL remain unexecuted. |
