# Phase 3: Super Admin audit (code side)

Scope: every Super Admin page and API route, checked statically for guard, tenant scope, destructive-action confirmation, audit events, body bounds and test coverage. Method: `scripts/audit/phase3-superadmin-scan.mjs` (re-run it, `--json` or `--md`), plus manual tracing of every flagged item into the service layer. Per-surface tables are in [phase3-superadmin-appendix.generated.md](phase3-superadmin-appendix.generated.md).

No browser or database was used. Findings below are static-analysis results verified by reading source; runtime behaviour is covered only by the tests listed at the end.

## Surface counts

| Surface | Count |
|---|---|
| Pages under `/admin` | 133 (behind `admin/layout.tsx`) |
| Legacy `/superadmin/*` alias pages | 9 (8 redirect-only or self-guarded, 1 catch-all that guards itself) |
| API routes under `/api/admin` | 104 (50 mutating) |
| Platform routes (`organizations` 4, `tenant-domains` 4, `features` 1) | 9 |
| `/api/internal/*` routes | 16 (secret or signature authenticated) |

## How access is enforced

1. `src/app/(authenticated)/admin/layout.tsx` calls `getCurrentRequestContext()` and returns the legacy "Access denied. You are not authorized to access Superadmin." panel unless `isSuperAdmin(context)`; the session is left intact.
2. `/superadmin/*` has no layout of its own. Its pages are redirect aliases into `/admin/*` (guarded by the layout), or check `isSuperAdmin` themselves (`dashboard`, `[...legacy]`).
3. API routes load the context and either guard directly (22 routes), or pass it to a service that guards (76 routes one hop away, 10 routes two hops away). Every mutating admin route has `isSameOriginRequest` (50 of 50).
4. Services guard with `isSuperAdmin`, `requirePermission`, `resolveActingCollege`, `assertPersistedPlatformPermission` or `requireSuperAdminSelectedCollege`.

## Findings, ranked

### HIGH: none confirmed

Every scanner HIGH candidate was traced and cleared:

- 6 "stub" pages under `admin/projects/...`: thin wrappers or encoded redirects; their components call `getCurrentRequestContext`.
- 62 "admin-ish mutating route without role check": guards live in services (`resolveActingCollege` + `assertPersistedPlatformPermission`, `requireCollegePlacementAdmin`, tenant-domains service). After teaching the scanner those helper names, 5 remain, all tenant-domains/bug-tracker and verified guarded two hops down.
- 3 "mutating GET": `Map.delete`, `URL.searchParams.delete` and a helper after the GET handler. No GET handler writes (now enforced by test).
- 1 "internal route without secret": `recruiter-message-inbound` verifies an HMAC signature.
- 6 admin routes with no guard within one hop: all guarded two hops down (listed and asserted in `phase3-superadmin-route-guard-inventory.test.ts`).

### MEDIUM

| # | Finding | Evidence | Status |
|---|---|---|---|
| M1 | 33 of 38 body-reading admin routes still call raw `request.json()` with no size bound; 5 admin routes (10 API-wide) already use the shared `readBoundedJsonRequest` (SA-ADMIN-BODY-19). | `git grep readBoundedJsonRequest`, scanner `--md` | Frozen for Phase 1 by `phase1-unbounded-json-routes.json`. Decision: migrate the remaining 33 to the shared reader. |
| M2 | RESOLVED by stricter tracing. All 17 destructive-looking admin routes reach a `z.literal(true)` acknowledgement, typed confirmation or `expectedUpdatedAt`/`expectedVersion`/`expectedStatus` token within three import hops, except `colleges/bulk-import` (create-only, skips existing codes). | `phase3-destructive-admin-routes-need-confirmation.test.ts` | Locked by test. Residual risk: the signal is a token match, not proof the handler enforces it on every path. |
| M3 | RESOLVED. All 50 mutating admin routes reach a real `recordActivityEvent`/`recordActivityEventInTransaction` call within three hops (`announcements/broadcast` needs the third). | `phase3-admin-mutations-emit-audit-events.test.ts` | Locked by test. An import or comment alone does not satisfy the detector. |
| M4 | `/admin` pages without their own context call (10 delegating pages) rely on the layout plus a guarded component. | pages inventory test | Frozen list; a new data-reading page with no guard now fails the test. |

### LOW

- The layout is the single page-level fence for 10 delegating pages; a layout bug would expose them (their components still call the request context).
- `internal/*` routes have no same-origin check by design; each is listed in `api-origin-guard.test.ts` with a reason.
- Two read-only `GET` handlers open a transaction purely for `assertPersistedPlatformPermission`.
- `apiErrorResponse` returns the raw Zod `issues` array alongside the sanitized `fieldErrors` on a validation failure (`src/lib/api-error.ts`). It exposes schema internals such as allowed enum values to any caller who sends bad input. Not Super Admin specific, so it was left unchanged; a decision is needed on whether the UI depends on `issues`.

## Destructive-action design that already holds

- Drive archive (`admin/placements/jobs/[jobId]/delete`): preview endpoint, then POST with `expectedUpdatedAt` optimistic check and an audit event (`PLACEMENTS_JOB_ARCHIVED`).
- Bulk course visibility (`admin/courses/bulk-status`): strict schema with `confirmed: z.literal(true)`, max 100 ids, per-row tenant re-check inside the transaction, activity events.
- Recruiter HR actions: audit events for create, suspend, grant, revoke and session termination.

## Fixed in Phase 3

- `GET /api/admin/hr/options`, `GET`/`PATCH /api/admin/hr/[userId]` and `GET /api/admin/onboarding/resolve-preview` returned account, grant or tenant data with no cache header. They now send `Cache-Control: private, no-store` (14 admin routes lacked the header; the other 11 are mutation-only, which browsers and proxies do not cache). Locked by `phase3-admin-get-responses-private-no-store.test.ts`.

## Runtime permission matrix

`phase3-superadmin-routes-deny-non-super-admin.test.ts` calls every `/api/admin`, `organizations`, `tenant-domains` and `features` route handler with a stubbed database that answers every query with no rows, so an unguarded route can only return a success status by letting the caller in. Identities: LEARNER, FACULTY, COLLEGE_ADMIN, MENTOR, TPO, RECRUITER, a SUSPENDED Super Admin, and an unauthenticated caller. Result: no identity receives a 2xx or 3xx from any route except these reasoned, identity-specific exceptions:

- `features/me` returns the caller's own module flags to any authenticated member.
- `admin/batches|classes|semesters|semester-courses/export` answer a College Admin only for their own college (`resolveActingCollege(context,'academics.read')`).

This test is slow (about 2.5 minutes on a busy laptop) and belongs in CI, not in a watch loop.

## Test coverage added in Phase 3 (static, no database)

| File | What it locks |
|---|---|
| `phase3-superadmin-layout-and-legacy-pages.test.ts` | Layout guard is an early return; legacy aliases redirect only to internal absolute paths or self-guard. |
| `phase3-superadmin-route-guard-inventory.test.ts` | Every `/api/admin` and platform route loads context and reaches a guard; two-hop exceptions are reasoned and the delegate is asserted. |
| `phase3-no-mutating-get-handlers.test.ts` | No API `GET` handler contains a write. |
| `phase3-internal-routes-authenticate-callers.test.ts` | Every internal route authenticates its caller before doing work, with constant-time comparison. |
| `phase3-superadmin-pages-guard-inventory.test.ts` | Every admin page guards itself, redirects without data, or is a reviewed delegating page. |
| `phase3-superadmin-routes-deny-non-super-admin.test.ts` | Runtime matrix: eight non-Super-Admin identities never get a success response from any admin or platform route. |
| `phase3-admin-mutations-emit-audit-events.test.ts` | Every mutating admin route reaches a real activity-event write within three hops. |
| `phase3-destructive-admin-routes-need-confirmation.test.ts` | Destructive admin routes carry a confirmation or version token. |
| `phase3-admin-mutations-strict-input.test.ts` | Mutating admin routes reach strict schemas and parse every JSON body. |
| `phase3-admin-get-responses-private-no-store.test.ts` | Admin GET responses carry `no-store`; no admin route opts into caching. |
| `phase3-permission-policy-super-admin-matrix.test.ts` | Real `can()`/`requirePermission`: unscoped, college-scoped, org-scoped and suspended Super Admin; every other role; forged scope cookie; forged membership role. |
| `phase3-admin-scope-cookie-tamper.test.ts` | `lms_admin_scope` decode rejects 20 tampered shapes; a stale cookie cannot widen the verified scope. |
| `phase3-tenant-host-validation-and-confirmation.test.ts` | Tenant host normalisation (URLs, ports, IPs, localhost, bad labels), reserved subdomains, exact-hostname delete confirmation, strict subdomain move. |
| `phase3-bulk-and-hr-input-schemas.test.ts` | Bulk course visibility (literal confirmation, 100 cap, no injected scope) and HR create/update/list schemas (strict, no role injection). |
| `phase3-api-error-response-private-refusals.test.ts` | A refusal is a generic 403 with no permission name; unexpected errors never echo messages, stacks or connection strings. |

Existing related coverage: `api-origin-guard.test.ts` (origin check on every mutating route), `PROJ-BREAK-SA-admin-pages-and-scope.test.ts` (Super Admin Projects/Placements pages), `chat6-auth-admin-scope-guards-17.test.ts`.

## Decisions needed

1. Migrate the remaining 33 admin routes from raw `request.json()` to `readBoundedJsonRequest` (M1).
2. Decide whether the confirmation token match (M2) should be replaced by a per-route handler test that proves enforcement.
3. Run the runtime matrix in CI with an authorised Super Admin positive control (needs a disposable PG17; not run locally).

Regenerate the appendix with:

    node scripts/audit/phase3-superadmin-scan.mjs --md | sed -n '/^## Pages/,$p' > docs/audit/phase3-superadmin-appendix.generated.md
