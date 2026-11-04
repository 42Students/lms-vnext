# 2026-11-04 — Private bulk export hardening: source evidence packet

**Repository:** 42Students/lms-vnext  
**Batch baseline SHA:** `0213edd4a90bcc7c9539fa1205fe421c7c6e9ca3` (observed `main` after all implementation and test commits in this batch)  
**Security control linkage:** `SEC-02-013` (partial), `SEC-08-024` (partial), `SEC-10-012` (partial), `SEC-23` (scoped regression). Refer to [the 493-control catalogue](../control-catalog.md).  
**Status:** **Code committed, scoped source-level checks passed; Vitest/TypeScript/CI and authenticated runtime tests unverified.** This is a dated evidence packet, NOT a second execution tracker, NOT program closure, NOT evidence of production RLS/tenant isolation.

## Exactly what changed

- **9 direct private export route guards:** `src/app/api/admin/people/export/route.ts`, `admin/tenants/export/route.ts`, `college/people/export/route.ts`, `college/roles/export/route.ts`, `admin/companies/export/route.ts`, `admin/placements/hiring-report/export/route.ts`, `college/companies/export/route.ts`, `admin/course-progress/students/export/route.ts`, `placements/tpo/audit/export/route.ts` (all under `src/app/api/`).
- **1 shared guard, 4 additional delegated handlers:** `src/modules/admin-ui/super-admin-scoped-csv-service.ts` now requires fresh first-party device authentication before loading rows, covering `admin/students/export`, `admin/faculty/export`, `admin/placements/applications/export`, `admin/placements/shortlisted/export`. Thus **13 known export endpoints are covered** by this batch; it is NOT a full export-route inventory.
- **2 CSV encoders strengthened:** `src/modules/people/college-people-export-model.ts` and `src/modules/people/admin-users-export-model.ts` now neutralize formulas hidden behind Unicode whitespace/control/format/combining prefixes while preserving field content and standard quote escaping. Existing other CSV encoders were not certified in this batch.
- **3 test files:** `tests/unit/private-bulk-csv-security.test.ts` added; `tests/unit/chat13-super-admin-scoped-csv-runtime.test.ts` and `tests/unit/chat13-scoped-csv-export-page-size.test.ts` updated for fresh auth mock and stale-session denial with no data loader invocation.
- **Focused CI definition:** `.github/workflows/security-private-exports.yml` watches affected routes, helper, models and tests; invokes the three Vitest files. Workflow file committed, but **a completed, successful run on the identified SHA is not yet established**.

The fresh-auth guard uses the existing `requireRecentDeviceAuthentication()` implementation. That function verifies the active database-backed device session and checks a ten-minute-old-or-newer OTP-backed session creation timestamp. It is an interim recent sign-in policy, **not** a complete self-service step-up ceremony, phishing-resistant MFA, per-export approval, tenant isolation proof or indefinite-session security solution. The route still delegates role, ownership and tenant authorization to its existing service; those checks were not comprehensively tested here.

## Source-level checks actually executed, without a full repository checkout

After fetching live `main` source through GitHub, an isolated JavaScript check exercised the exact extracted pure CSV functions (not hand-written replicas):
- **22/22** cell-level hostile/safe input cases passed across both encoders; the cases include zero-width/format/combining/control prefixes and ordinary names.
- **6/6** end-to-end *pure serialization function* checks passed on the extracted roster and Super Admin CSV builders (BOM, formula prefixing and absence of unneutralized cell).
- **14/14** static source call-order/delegation checks passed: 10 direct/helper call paths verify `getCurrentRequestContext()` precedes `requireRecentDeviceAuthentication()`, which precedes the private-row reader, and four additional routes delegate to the checked helper.

These **42 scoped source-level assertions** do not execute the Vitest test files themselves, import a real Next.js route runtime, open PostgreSQL, or verify the production environment. They do not certify all HTTP methods or any cross-tenant boundary.

## Exact acceptance remaining

1. Execute `npm ci && npx vitest run tests/unit/private-bulk-csv-security.test.ts tests/unit/chat13-super-admin-scoped-csv-runtime.test.ts tests/unit/chat13-scoped-csv-export-page-size.test.ts` on a trusted checkout, pinning the exact SHA and recording the runner URL and result.
2. Run `npm run typecheck`, relevant export/role tenant integration suites and build. Investigate rather than weakening failing assertions.
3. Prove an authenticated recent session can export only its authorized tenant rows, while an expired/revoked/stale session receives 401 without querying/exporting data, using disposable PostgreSQL and normal restricted application roles.
4. Verify mid-export permission and tenant revocation, multiple pagination reads, limits/quotas, safe report content, response caching, and no unauthorized file/provider/queue side effects.
5. Validate the user-facing reauthentication/retry flow for stale bulk exports in a browser; current recent-sign-in policy can require a new login after ten minutes.
6. Repeat high-risk export inventory across all other endpoints and storage/share/async export flows; define risk tiers rather than asserting all exports are covered.
7. Obtain production database RLS/principal inspection and independent security review as demanded by the broader [security coverage contract](../coverage-contract.md).

**Canonical tracker disposition:** This dated note is input to the sole tracker `docs/tracker.json`. No task marked `done:true`, and no overall security coverage percentage is claimed by these commits.
