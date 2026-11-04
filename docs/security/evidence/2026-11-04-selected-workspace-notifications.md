# 2026-11-04 — Own-notification selected-workspace privacy hardening

**Repository:** `42Students/lms-vnext` / `main`  
**Classification:** scoped source and unexecuted test evidence; **not** production sign-off.  
**Canonical state:** `docs/tracker.json -> security.controls` only. This file is not a tracker and must not be used to infer control completion.

## Scope and risk

The pre-fix shared notification operations restricted `in_app_notifications.user_id` to the authenticated human but did not consistently restrict `activity_events` to their **selected** college, organization or recruiter grant. A person with memberships in two colleges may have valid receipts from both; identity ownership alone does not authorize viewing or acknowledging both while acting in College A. Same-recipient cross-workspace counts, page content, unread flags and mark-read side effects were the concern. This is an authorization issue, not a cosmetic UI difference.

## Implementation committed to main

- `src/modules/activity/own-notification-scope.ts` — per-event selected-workspace SQL predicate. Active single-role college membership permits its own college's events plus organization-wide events in that organization. It denies unrelated colleges/organizations and account-global events in a college workspace. The platform path remains a distinct Super Admin context; explicit admin scope narrows that path. Recruiter context is restricted to explicitly selected live company-college grant projections and denies an empty grant set. Inactive/ambiguous/missing workspaces deny.
- `src/modules/activity/notification-service.ts` — applies the same predicate to personal list, paginated/search list, unread counts, category unread counts, single-notification acknowledgements and bulk mark-read updates. Caller-supplied college filters are additive and cannot widen the selected workspace.
- `tests/unit/security-own-notification-workspace-scope.test.ts` — SQL predicate contracts for membership, selected-role isolation from Super Admin, inactive/multiple roles, recruiter grants and separate platform admin scope.
- `tests/integration/db10-notification-guards.test.ts` — adds disposable-PostgreSQL scenario for **the same user with two genuine college memberships**, college A/B receipts, organization-wide and platform-global receipts, foreign-ID read denial, foreign college filter denial, atomic bulk acknowledgement isolation and persisted `read_at` checks.
- `.github/workflows/security-notification-workspace.yml` — focused TypeScript/unit and registered disposable PG17 integration suites; exact checkout SHA and migration-journal checks. Uses no shared or production DB.

**Key commits:**
- [Scope helper](https://github.com/42Students/lms-vnext/commit/c7b5d94542e8b52f5d8752ad59df7e84d714a055).
- [Shared query/write enforcement](https://github.com/42Students/lms-vnext/commit/edc481927aa2712447510c1b9aadfbd9a22f65dc).
- [PostgreSQL adversarial scenario](https://github.com/42Students/lms-vnext/commit/9572b0b0a7cfc7850b702d1fcc09d358398b35b0).
- [Unit SQL policy test](https://github.com/42Students/lms-vnext/commit/04bc71b7add97456071f6cffdd1db9f410896a32).
- [Adversarial fixture refinement](https://github.com/42Students/lms-vnext/commit/7be6a4c75b7e34378dfb979b167a6f78ab645cf2).
- [Focused CI workflow](https://github.com/42Students/lms-vnext/commit/b2d22ca9b4057bad293cdb92dd6066255b544f8f).

## Evidence and outstanding acceptance

GitHub emitted [workflow run 41837170389](https://github.com/42Students/lms-vnext/actions/runs/41837170389) for the above CI change. Both `notification-scope-unit` and `notification-scope-postgres` returned **FAILURE with zero job steps**. This is a **pre-execution CI/runner blockade**, not a verified test pass or an observed assertion failure. A separate incremental credential gate also returned pre-execution FAILURE. No local vNext checkout or PG17 fixture was available in this execution. **No 493-control status, DB task, API task or security-program completion is claimed.**

Required continuation:

1. Restore GitHub Actions job execution/runner eligibility, then run and retain the exact-source unit, TypeScript, PG17 and full affected notification/browser results; investigate actual test failures rather than disabling them.
2. Independently validate real deployment request-context role selection, live grant/membership revocation during a running query, restricted PostgreSQL application principal and effective RLS.
3. Audit event producers that issue tenantless/platform and organization-wide notifications: ensure these never carry college-private content. Decide separately whether user-level global notices require an explicit account workspace before rendering; this batch deliberately excludes them in college contexts.
4. Exercise same-user multi-college *frontend navigation*, in-flight SSE stream revocation and recruiter company-college grants; the shared query guard is not by itself proof that a long-running stream terminates immediately after a grant change.
5. Verify no unauthorized search-result facets, export/cache leaks or side effects under actual data access policy; obtain independent review.

**Controls partially advanced, not verified:** `SEC-03-003`, `SEC-03-008`, `SEC-04-008`, `SEC-05-005`, `SEC-05-015`, `SEC-08`, `SEC-23`. This is a focused implementation slice and must not be counted as a verified release control until real positive/negative evidence and independent review exist.
