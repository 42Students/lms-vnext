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
| SA-tenants-modules-R01 | DONE (source) | Control overview scopes/counters detailed in Chat-11 final sprint acceptance row and named test below; runtime verification pending. |
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

| SA-tenants-modules-33 | DONE (source; not executed) | `src/app/(authenticated)/admin/settings/page.tsx` now exposes `TenantSettingsEditor` in both verified GLOBAL and scoped active COLLEGE contexts, identity keyed by scope; `src/components/admin/tenant-settings-editor.tsx` provides safe typed legacy keys, delete-to-default, per-key optimistic versions, partial status, and accessible high-impact review. `tests/unit/chat11-tenant-settings-scope-confirm-round9.test.ts` — `it("SA-tenants-modules-33 edits global and scoped college settings with a styled high-impact confirmation")`. Underlying DB migration must be registered (form disables when absent); persisted deployment-managed auth/SMS configuration still requires separately approved activation. |

## Chat-3 round 13 — scoped tenant admin feature verification (tests authored, not executed)

| ID | Status | Evidence |
| --- | --- | --- |
| SA-tenants-modules-05 | DONE (source) | Super Admin selector is college-searchable, can clear scope, and warns "Showing all colleges — data may be large." `tests/unit/chat3-tenant-public-verified-round13.test.ts` named test. |
| SA-tenants-modules-08 | DONE (source) | Organizations provides scoped search, counts, pagination and selected page size (10/25/50/100), plus clear and refresh. `tests/unit/superadmin-tenants-gap-closure.test.ts` and new round-13 test. |
| SA-tenants-modules-13 | DONE (source) | Colleges provides scoped search across identity, code, city and organization, page size and refresh; no unscoped listing. Same ID-named tests. |
| SA-tenants-modules-16 | DONE (source) | College edit saves addressLine, landmark, postalCode and country; intentionally does not reparent a live college or rewrite immutable tenant ID. New round-13 ID-named regression. |

## Chat-3 round 13 — remaining tenant navigation and session control

| ID | Status | Rationale / regression |
| --- | --- | --- |
| SA-tenants-modules-06 | DONE (source) | The scoped `/admin/tenants/setup` is one route with persisted `STRUCTURE`/`LAUNCH` URL steps, overview progress, adjacent structure forms, launch addresses/settings/checklist, and safe default to launch when college scoped. `tests/unit/chat3-tenant-public-verified-round13.test.ts` case SA-tenants-modules-06. |
| SA-tenants-modules-17 | DONE (source) | College Admin/TPO creation, status, suspend/reactivate, scoped history, device list and session controls are reachable from a college-scoped Admins page. Active mentoring is intentionally guarded conservatively; permanent deletion is withheld to preserve history. Same ID-named test and persisted tenant-role permission guard. |
| SA-tenants-modules-18 | DONE (source) | Scoped administrator active devices and audited Sign out everywhere POST; `tests/unit/superadmin-tenants-gap-closure.test.ts` and round13 source evidence. |
| SA-tenants-modules-19 | NOT-A-GAP (safe functionality; visual tab deferred) | Scoped college detail links to `/activity?collegeId=` plus authorised activity CSV; route enforces tenant permission. Duplicate embedded audit grid would add maintenance/UX surface without added capability; visual navigation remains for playbook review, no page restyling now. Named round13 regression. |

## Chat-11 final sprint — 2026-10-18 (tests authored, unexecuted)
| ID | Status | Source, test and acceptance |
| --- | --- | --- |
| SA-tenants-modules-R01 | DONE — source-level, DB acceptance pending | Feature Controls `src/app/(authenticated)/admin/features/page.tsx`, Module Access `src/app/(authenticated)/admin/module-access/page.tsx`, and Tenant Settings `src/app/(authenticated)/admin/settings/page.tsx` now display legacy scope headings and meaningful bounded counts. `src/modules/module-access/admin-control-overview-model.ts` computes scope label / page-module counts, `src/modules/module-access/admin-overview-metrics-service.ts` enforces Super Admin permission and computes membership counts only inside already-authorized visible colleges; shows page-only counts, never extrapolates hidden tenants. `tests/unit/chat11-final-SA-tenants-modules-R01.test.ts` — `SA-tenants-modules-R01 restores all three header-card contracts with truthful bounded counters`. |


## Chat-11 Super Admin security and concurrency follow-up (source-authored, cloud CI pending)

| Audit ID | Evidence | Verification status |
|---|---|---|
| SA-tenants-modules-BRAND-03 / BRAND-04 | `src/modules/colleges/branding-service.ts`, `src/components/admin/college-branding-form.tsx`, `tests/unit/chat11-super-admin-branding-save-adversarial.test.ts` | Persisted Super Admin actor and active college locked; unsafe unsaved preview URLs refused |
| SA-tenants-modules-BRAND-05 | `src/modules/colleges/college-logo-request-body.ts`, `src/app/api/colleges/[collegeId]/branding/logo/route.ts`, `tests/unit/chat11-super-admin-logo-boundary.test.ts` | Auth and same-origin before 3 MiB multipart stream cap; no green upload/storage claim |
| SA-tenants-modules-BRAND-CAS-01 | `src/modules/colleges/branding-service.ts`, `src/modules/colleges/branding.ts`, `tests/unit/chat11-super-admin-branding-cas.test.ts`, `tests/integration/chat11-super-admin-branding-cas.test.ts` | Expected-version conflict, harmless retry, one audit, preserved draft; PostgreSQL rerun needed |
| SA-tenants-modules-BRAND-06 | `src/modules/colleges/public-branding-model.ts`, `tests/unit/chat11-super-admin-public-branding-safe.test.ts` | Public sign-in suppresses signed/credential-bearing stored image URLs and unsafe contact inputs |
| SA-tenants-modules-R01 | `src/modules/module-access/admin-overview-metrics-scope.ts`, `tests/unit/chat11-super-admin-module-metrics-scope.test.ts` | Counts scoped active college learners and explicit membership overrides; live SQL verification needed |
| SA-tenants-modules-LOGIN-02 | `src/modules/colleges/admin-signin-request-body.ts`, `tests/unit/chat11-super-admin-signin-route-adversarial.test.ts` | Sign-in policy PUT origin, 2 KiB cap, actor before parse, safe stale conflict |

## Chat-11 current-role read barrier — source verified, CI pending

| ID | Status | Evidence |
|---|---|---|
| SA-tenants-modules-R01 | DONE — source hardening, database race acceptance pending | `getModuleAccessOverviewMetrics` rechecks persisted `admin-scope.select` inside a transaction holding actor SHARE locks before either the empty-page shortcut or reading selected tenants and learner/override counts. Selected colleges are still validated individually against persisted organization and status; `tests/unit/chat11-super-admin-module-metrics-revoked-role.test.ts` — `SA-tenants-modules-R01`, commits `db34e73`, `df3d5e4`, `eee568d`. Two-session actor revocation and PostgreSQL aggregation checks remain pending. |
