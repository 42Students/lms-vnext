# Security implementation evidence: API response cache confidentiality

**Date:** 2026-11-04  
**Repository/branch:** `42Students/lms-vnext`, `main`  
**Scope:** shared/browser HTTP cache isolation only; this is not a tenant authorization, RLS, or production certification.

## Boundary and rationale

- The existing `next.config.ts` rule sent `Cache-Control: no-store` only under `/api/auth/:path*`.
- Authenticated endpoints across placements, academics, projects, people, files, and exports can emit private college, person, signed-resource, or other tenant-bound state.
- Route-specific `no-store` controls were present in many handlers, but the shared default did not cover newly added or unreviewed API handlers. A missed header must not make an otherwise sensitive response eligible for caching.
- The global Next.js header match now targets `/api/:path*` with `Cache-Control: private, no-store, max-age=0`. This is defense in depth against client/shared caches; it **does not** provide resource authorization. Existing 404s and permission-denied responses receive the same default.
- Deliberately scoped to `/api` rather than globally disabling caching for static Next.js assets or ordinary public page assets. Public logo API responses will also become uncached; assess performance separately without relaxing tenant confidentiality.

## Changes on main

- `src/security/headers.ts`: central `PRIVATE_API_HEADERS` constant — [commit 2f1124d](https://github.com/42Students/lms-vnext/commit/2f1124d6686d49495b2e628165878470fac62b88).
- `next.config.ts`: expand old auth-only header rule to all API routes — [commit 5b8045c](https://github.com/42Students/lms-vnext/commit/5b8045c9cf3b6aa04485f4132298a07efd036812).
- `tests/unit/private-api-cache-headers.test.ts`: static configuration/critical global-header regression assertions — [commit 4b45fe6](https://github.com/42Students/lms-vnext/commit/4b45fe6bbee1dc553f832e95b5f2ddcae24c3e22).
- `scripts/smoke-public.mjs`: deployed `/api/__private_response_cache_probe__` expected-404 response checks for `private` and `no-store` — [commit 8f2f075](https://github.com/42Students/lms-vnext/commit/8f2f0759196245cd98fb2095e42fcb3549684653).
- `.github/workflows/security-response-cache.yml`: focused typecheck/unit/smoke-syntax workflow — [commit 4f034ac](https://github.com/42Students/lms-vnext/commit/4f034ac81b691cfa957204dc1def0579659f9065).

## Evidence and acceptance

**Code committed:** yes, on shared `main`; no changes to RBAC, session, tenant policy, or database files.

**CI verification:** **BLOCKED — NOT PASS.** At `4f034ac81b691cfa957204dc1def0579659f9065`, [focused run 41832582824](https://github.com/42Students/lms-vnext/actions/runs/41832582824) concluded FAILURE, with its only job showing **zero executed steps**. The accompanying general CI and Browser runs at the same SHA likewise reported failures with zero executed steps. Therefore no tests, typecheck, or deployed smoke are certified for that SHA; do not classify as application test failures without runner logs.

**Deployment verification:** NOT RUN. The smoke probe must run against a known updated deployment before this boundary can be marked runtime PASS.

## Reproduction commands

```bash
npm ci
npx vitest run tests/unit/private-api-cache-headers.test.ts tests/unit/security-headers.test.ts
npm run typecheck
node --check scripts/smoke-public.mjs
# Against a deployed build with approved access and a disposable test environment:
node scripts/smoke-public.mjs https://YOUR_TEST_DEPLOYMENT
```

## Remaining controls not addressed

Do not attribute these requirements to this slice: authorization on all 1,322 known HTTP methods, tenant ownership validation, PostgreSQL role/RLS policies, session/role revocation races, privileged reauthentication, cross-tenant negative matrix, signed-resource expiry, cloud/CDN response auditing, CI branch protection. The existing `docs/tracker.json` remains the sole program tracker; this note is implementation evidence only.
