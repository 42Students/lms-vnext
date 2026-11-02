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
| M1 | 36 of 36 body-reading admin routes use unbounded `request.json()`; 206 of 487 routes API-wide. | scanner `--md` | Frozen for Phase 1 by `phase1-unbounded-json-routes.json`. Decision: add a shared bounded-JSON reader. |
| M2 | Destructive-looking admin routes without a server-enforced confirmation or version token: HR `terminate-sessions`, HR grant revoke (`DELETE`), college `subdomain` (`PUT`/`DELETE`), `colleges/bulk-import`, `courses/legacy-bulk-flags`, `verification/bulk-review` (client sends `confirm:true`, server enforcement not seen within two hops). | `p3stats` in this audit | Origin check and role guard apply, and audit events exist for HR actions. Decision: require `confirmed: true` server-side (needs client change). |
| M3 | 11 mutating admin routes show no audit-event signal within one hop: `colleges/bulk-import`, `colleges/[id]/subdomain`, `companies/restore`, `course-progress/retake`, `faculty/search` (selection record), `features/[id]/descendants`, `placements/applications/refresh`, `placements/organization-applications`, `skills/curated-seed`, `skills/import`, `verification/settings`. | `p3stats` | Several likely record events deeper than two hops. Each needs a manual trace before a test can assert it. |
| M4 | `/admin` pages without their own context call (10 delegating pages) rely on the layout plus a guarded component. | pages inventory test | Frozen list; a new data-reading page with no guard now fails the test. |

### LOW

- The layout is the single page-level fence for 10 delegating pages; a layout bug would expose them (their components still call the request context).
- `internal/*` routes have no same-origin check by design; each is listed in `api-origin-guard.test.ts` with a reason.
- Two read-only `GET` handlers open a transaction purely for `assertPersistedPlatformPermission`.

## Destructive-action design that already holds

- Drive archive (`admin/placements/jobs/[jobId]/delete`): preview endpoint, then POST with `expectedUpdatedAt` optimistic check and an audit event (`PLACEMENTS_JOB_ARCHIVED`).
- Bulk course visibility (`admin/courses/bulk-status`): strict schema with `confirmed: z.literal(true)`, max 100 ids, per-row tenant re-check inside the transaction, activity events.
- Recruiter HR actions: audit events for create, suspend, grant, revoke and session termination.

## Test coverage added in Phase 3 (static, no database)

| File | What it locks |
|---|---|
| `phase3-superadmin-layout-and-legacy-pages.test.ts` | Layout guard is an early return; legacy aliases redirect only to internal absolute paths or self-guard. |
| `phase3-superadmin-route-guard-inventory.test.ts` | Every `/api/admin` and platform route loads context and reaches a guard; two-hop exceptions are reasoned and the delegate is asserted. |
| `phase3-no-mutating-get-handlers.test.ts` | No API `GET` handler contains a write. |
| `phase3-internal-routes-authenticate-callers.test.ts` | Every internal route authenticates its caller before doing work, with constant-time comparison. |
| `phase3-superadmin-pages-guard-inventory.test.ts` | Every admin page guards itself, redirects without data, or is a reviewed delegating page. |

Existing related coverage: `api-origin-guard.test.ts` (origin check on every mutating route), `PROJ-BREAK-SA-admin-pages-and-scope.test.ts` (Super Admin Projects/Placements pages), `chat6-auth-admin-scope-guards-17.test.ts`.

## Decisions needed

1. Server-side confirmation for the M2 routes (changes the client contract).
2. A shared bounded JSON reader for admin routes (M1).
3. Which M3 routes must emit audit events (and which are exempt, such as search-selection records).

Regenerate the appendix with:

    node scripts/audit/phase3-superadmin-scan.mjs --md | sed -n '/^## Pages/,$p' > docs/audit/phase3-superadmin-appendix.generated.md
