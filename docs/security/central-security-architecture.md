# Central security architecture

Written 2026-11-06. This is a design and migration plan, not a status source. Status lives only in `docs/tracker.json`. The requirements are in [control-catalog.md](control-catalog.md).

## Why

Today every one of the 1,001 API routes hand-writes its own security. Measured on 2026-11-06:

| Fact | Count |
|---|---|
| API route files | 1,001 |
| Authenticated-user routes | 914 |
| Internal (machine credential) routes | 16 |
| Public / sign-in routes | 27 |
| Webhook / callback routes | 4 |
| Exports and unusual routes | 40 |
| Mutating routes reading the body with raw `request.json()` | 344 |
| Mutating routes using the bounded body reader | 36 |
| Routes calling a permission helper directly | 37 (the rest rely on checks inside services) |
| Shared route wrapper | none |
| RLS policies found in `drizzle/` | none located; confirm before relying on RLS |

A security change therefore means editing about a thousand files, and one forgotten route is a hole. The fix is to put each concern in exactly one place, make the code path impossible to skip, and let CI prove it.

## Principles

1. **One place per concern.** A rule is changed in one file and every route inherits it.
2. **Impossible to skip.** A route that does not use the central layer fails the build (ratchet guards, like `ux:consistency`).
3. **Defence in depth.** The route layer checks who and what; the database independently refuses other tenants' rows.
4. **Fail closed.** Unknown role, missing scope, unregistered permission or missing policy means deny.
5. **Evidence, not claims.** Each layer ships with executed positive and negative tests on an exact commit; nothing is marked verified without independent review and deployed proof.

## The layers

| # | Layer | What it does once, for everyone | Catalog domains it serves |
|---|---|---|---|
| L1 | Edge (`src/proxy.ts`, response headers) | Request id, security headers, maintenance mode, basic request limits | SEC-12, SEC-17 |
| L2 | Route wrapper `route({ auth, permission, scope, schema }, handler)` | Origin/CSRF check, authentication, selected role, permission check, body limit, schema validation, error mapping, audit event | SEC-01, 02, 03, 04, 08, 13 |
| L3 | Actor resolver | The only code that turns a session into user, selected role and college; handles disabled users, revoked memberships, step-up age | SEC-01, 02, 03, 04 |
| L4 | Permission registry | One file mapping role to permission names and scopes; routes reference names | SEC-03, 04, 08 |
| L5 | Tenant-aware data access + RLS | Every query runs through one function that sets college and role on the connection; Postgres row-level security enforces it independently | SEC-05, 06, 07, 14 |
| L6 | Storage and export service | Signed URLs, downloads, CSV/PDF exports and report counts, all tenant-scoped in one place | SEC-10, 11, 14 |
| L7 | Input pipeline | Strict schema per route (rejects unknown fields), body size limits, file type and size checks | SEC-12, 13, 14 |
| L8 | Abuse control | One distributed rate limiter with per-account, per-device, per-network and global limits | SEC-01, 13 |
| L9 | Audit and logging | The wrapper writes audit events for mutations; one logger with redaction | SEC-19, 20 |
| L10 | Internal and webhook wrappers | `internalRoute()` and `webhookRoute()`: machine credential or signature, replay protection, allow-listed callers | SEC-15, 16 |
| L11 | Config and secrets | One validated environment schema; startup fails on unsafe or missing settings | SEC-09, 10, 17, 21 |
| L12 | CI guards | Ratchets that fail the build when anything bypasses L2 to L11 | SEC-18, 23, 24, 25 |

Rough split of the 493 controls: about 290 are enforced by code in L1 to L10, about 130 are infrastructure and pipeline work (L11, L12, cloud, backup), and about 80 are process, privacy and independent-testing items that no code layer can close.

## Migration order

Each phase ends with executed tests and a ratchet baseline that can only go down.

1. **Phase 0 - inventory and guards (half a day).** Route inventory (done, numbers above). Ratchet guard `security:central` counting routes not on the wrapper, raw `request.json()` uses, direct `getDb()` calls outside the data layer, and tenant tables without a policy. Baseline = today.
2. **Phase 1 - wrapper, actor, errors, CSRF, bounded body (2 to 3 days).** Build L2 and L3. A codemod converts the 914 authenticated routes (most share a few shapes: origin check, context, body, service call, error response). Interim `permission: "service-enforced"` is tracked as debt and replaced by named permissions in Phase 2.
3. **Phase 2 - permission registry (2 days).** L4. Derive each route's permission from the service it calls; replace the interim marker route by route; permission names validated against the registry at build time.
4. **Phase 3 - tenant data access and RLS (3 to 5 days).** L5. Build the connection-scoped transaction helper; add policies for the tenant tables in priority order (people, placements, projects, courses); prove with the restricted runtime role on disposable PostgreSQL (CI already runs the app as one); lint ban on direct database access.
5. **Phase 4 - storage, export, internal, webhook (2 to 3 days).** L6 and L10. The 40 export routes and storage paths move behind one service.
6. **Phase 5 - abuse, audit, logging, config (2 days).** L8, L9, L11.
7. **Phase 6 - prove it (2 days).** Deploy to dev for deployed-configuration evidence, run positive and negative tests per layer, request the independent review.

Agent time is roughly two weeks end to end; the human-gated parts are listed below.

## Decisions needed from the owner

- Session and role model: how a user switches role, and which actions need fresh step-up authentication.
- Approval of the permission names and scopes in the registry.
- Branch protection with code-owner review (SEC-18-002) so the guards actually block merges.
- Dev deployment of `main` for deployed evidence; no production changes are part of this plan.
- Whether to commission the paid external penetration test (SEC-24).

## What this does not change

Tenant data, production, credentials and the CI database-role fix already merged are untouched by this document. No control moves state because of this plan; states change only through evidence recorded in `docs/tracker.json`.

## Build status (2026-11-06, updated as work lands)

This table is a working note, not a status source. Control states live only in `docs/tracker.json`.

| Layer | Built | Not built |
|---|---|---|
| L2 route wrapper | `route()` + core (19 tests); about 200 routes on it. `secured()` shim + core: all 791 remaining route files pass through one chokepoint (request id, tenant scope holder, audit line, optional central origin enforcement) | Move shim routes to `route()` with schemas and named permissions (guard rule `route-on-shim-only`, 791) |
| L12 guards | `security:central` in lint: off-wrapper (0), shim-only (791), raw `request.json()`, direct DB imports, `service-enforced` (167), tenant tables without RLS | More rules |
| L4 permission registry | Names are the existing `PlatformPermission` set; 89 handlers now name their permission (mutating handlers and unshared reads with a single candidate) | 167 `service-enforced` handlers (multi-candidate or shared-role reads) need a human decision per route. `secured(handler, { permission })` exists but is deliberately NOT applied to existing routes: 28 test files pin "validate input before resolving the session", and a central check would reorder that. Existing routes get names only by moving to `route()` with their real order |
| L5 tenant scope | Handlers run in the actor's scope; server components/actions bind the actor for their async chain; session bootstrap, internal jobs and webhooks run under named system scopes; off by default | Enabling `DB_TENANT_SCOPE` per environment |
| L5 RLS | Migration 0333: catalog-driven `tenant_isolation` policies, inert until `app.rls_mode = 'enforce'`. Migration 0334: `lms_groups` and `legacy_id_map` also let every college READ platform-owned NULL-college rows (writes stay strict); the other 20 nullable-college tables keep the strict policy because no code reads their NULL rows as defaults. Acceptance script in CI covers both | Recruiter cross-college variant; enforcement per environment ([rls-rollout.md](rls-rollout.md)) |
| L3 step-up auth | `route({ stepUp: true })` (15-minute fresh sign-in, or `{ maxAgeSeconds }`) via the existing device-session check; guard rule `sensitive-without-step-up` (115 routes, ratcheted) | Apply to the 115 routes together with the UI re-sign-in prompt; privileged-role switch freshness |
| L6 downloads | Any `Content-Disposition: attachment` response is forced no-store + nosniff and audited as an export, in both wrappers (about 120 routes, no route changes) | Row-cap and per-role export limits as one service; step-up for bulk export |
| L8 abuse control | `route()`: per-user write budget (600/min, one bucket per user), per-route and public per-address budgets, 429 + Retry-After. Cross-instance windows and webhook delivery claims live in `security_shared_store` (migration 0335, one atomic statement each, concurrency-tested in CI); off by default, falls back to process memory on any database error | Turning on `SECURITY_SHARED_STORE=on` per environment after migration 0335 |
| L9 audit | One structured audit line from both wrappers for writes, 401/403/429 and downloads | Redacting logger as a central pass |
| L10 internal / webhook wrappers | `internalRoute()` (5 routes), `webhookRoute()`: raw body, HMAC or token, timestamp tolerance, replay claim | Convert the remaining bespoke internal routes and webhooks (replay claims already shared when the store is on) |
| L11 config | `secret-registry.ts` + startup validation (warnings only); a test fails when code adds an unregistered internal credential | Enforce (fail closed) in production once the registry is verified against live config |
