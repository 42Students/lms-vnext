# Centralisation audit, whole vNext (2026-11-14)

North star: any change, large or small, is made in one central place, never in many. Every number below was measured on `main`
at `77f5b393` by `scripts/centralisation-sweep.cjs`, `scripts/structural-clone-sweep.cjs` and
`scripts/centralisation-metrics.mjs` (the 35 existing ratchets). Re-run them to reproduce.

## What "100 percent" means here (so it can be checked, not claimed)

A concern is centralised when all three hold:

1. One owner file or module defines it (the registry, helper or service).
2. A ratchet counts every use outside the owner and the count is **zero** (or a short, reviewed allowlist for genuinely one-off cases).
3. A change-impact test exists: "to change X, edit exactly these files" is asserted by a test that greps for the literal.

Today 31 of 35 existing ratchets are enforced, but most only stop things getting worse; the counts are far from zero. The sweep
found 18 concerns that have no ratchet at all.

## The shape of the problem

- The **API security plane is mostly central** (the check finds 0 routes off the `route()` wrapper), but 1,044 routes still say
  `service-enforced`, so the permission is decided in services, not named at the wrapper.
- Whole-file copy-paste is **not** the problem (1 page pair, 6 route pairs, 3 service pairs clone each other). The scatter is
  **the same concern re-implemented inline in thousands of places**.
- Everything outside the API wrapper is **not central**: page access, the client API layer, copy, styling, CI, and tests.

## Tier A: structural gaps with the biggest blast radius

| # | Concern | Evidence | Target (the one place) | New or in plan |
|---|---|---|---|---|
| A1 | **Page access** | 655 pages; 507 call `getCurrentRequestContext()` themselves; 213 redirect inline; 171 hold their own role check; `proxy.ts` gates no roles; only 19 layouts guard | Page access registry (path pattern to capability) enforced once in layouts and `proxy.ts`, generated from the same policy as the API matrix | NEW (4.1 covers API only) |
| A2 | **Client API layer** | 321 component files use raw `fetch` (531 calls) vs 205 using `apiFetch`; 168 writes in 130 files, only 4 files send an Idempotency-Key; 311 files hand-build JSON bodies; 475 files call `router.refresh()` after writes; 95 handle 409 by hand | One typed client + mutation hook: auth/origin, JSON, timeout, idempotency key, 409 conflict handling, error-code to copy, refresh | NEW (partly 7.3) |
| A3 | **CI** | 280 workflows; 260 repeat `setup-node`, 247 `npm ci`, 137 define their own Postgres service; 0 composite actions, 0 reusable workflows | Composite actions (setup, postgres, e2e) + reusable workflows; one Node and one PG version pin | NEW |
| A4 | **Tests** | 2,242 unit files read source text (3,243 `readFileSync`), so a copy or class change breaks tests across the tree; 277 files hand-mock `@/db`; 144 inline `collegeId` uuids; fixtures folder holds only dev ids | Domain builders (8.1) + replace source-text pins with registry-derived contract tests | NEW aspect (8.1 covers builders only) |
| A5 | **Data access** | 4,348 direct `db/tx` calls in 595 service files; 1,189 `sql` templates in 378 files; 85 app-layer files import drizzle; 52 routes query directly | Repositories + one unit-of-work and lock-order convention | 5.2 (not built) |
| A6 | **Authorization naming** | 1,044 `service-enforced` routes; 61 per-file `requireX` guards; 1,199 role literals; 119 role-array literals; 41 `role ===` literals in components | Wrapper-named capabilities; role sets live in the policy registry only | 4.1 to 4.3 (31 of 1,075 named) |

## Tier B: behaviour that must be identical everywhere

| # | Concern | Evidence | Target |
|---|---|---|---|
| B1 | Statuses | 1,810 comparisons; 315 SQL `check ... in (...)` lists in 132 migrations | Status registry feeding DB checks, types, labels, badge tones (6.3) |
| B2 | Time | 518 service files use `Date.now()/new Date()` vs 165 using the clock; 69 `Asia/Kolkata`; 233 inline `Intl`; 824 `new Date(` in components; 62 component files use `Intl/toLocale` | Clock service + one formatter set (2.4); owner chose no per-college zone |
| B3 | Money, phone, date inputs | 97 raw date inputs, 87 raw number, 14 raw tel; 30 `+91`; 122 `toFixed/Intl.NumberFormat/INR` | Locale/currency/phone module + one input pair (6.6, 6.7) |
| B4 | Validation limits | 4,263 inline `.min/.max` in 880 files; 41 inline `z.object` in routes; 35 inline `.email()`; 10 inline uuid schemas | One field-limits registry shared by zod and the DB column lengths (6.1) |
| B5 | Events and notifications | 215 inline `activity_events` inserts (1,951 references); 257 audit event literals; 34 email/SMS send sites in 15 files | `recordActivity` + transition writer (5.1); notification service (5.6) |
| B6 | Errors and responses | 1,804 plain `throw new Error`; 165 error classes; 153 `error.message` returned; 915 `Cache-Control` and 1,680 status literals | Error registry + response helpers (3.1, 3.2) |
| B7 | Routes and links | 4,900 route literals; 1,674 `href=` literals in 823 files; 353 `redirect("/...")`; 60 `router.push("/...")` | Typed route registry (6.4), shared with A1 |
| B8 | Files and exports | 126 files say `text/csv`; 55 MIME lists; 8 hand-built Content-Disposition; 7 `csvCell` copies; 99 storage calls in 26 service files | File policy + export pipeline (5.3, 5.4) |
| B9 | Settings and limits | 79 timer literals; 123 magic byte sizes in 86 files; 5 timeouts; 2 rate-limit literals | Settings service (5.7) + `limits.ts` (3.4) |
| B10 | Header and cookie names | 399 `x-...` header literals in 190 files; 3 cookie-name literals | One names module |
| B11 | Query-string state | 329 `searchParams.get` in 151 files; 414 files build `URLSearchParams` | One list-state parser/builder (pairs with pagination 6.2) |

## Tier C: UI

| # | Concern | Evidence | Target |
|---|---|---|---|
| C1 | Copy | 3,481 `title=`, 1,825 `description=`, 2,139 long JSX sentences in 882 files, 633 `placeholder`, 2,417 `aria-label`, 923 message-setter literals, 143 page titles | Copy catalogue by domain; error copy by error code (7.1), exact-wording rule kept |
| C2 | Design tokens | 8,592 Tailwind arbitrary values in 1,123 files; 80 inline `style`; 13 hex colours; 604 `!important`, 309 bare links, 46 bare buttons, 135 raw inputs | Tokens + components (7.2); raw palette classes already 0 |
| C3 | Form, dialog, state kit | 302 `<form>` files; 3,340 hand-written pending/error setters in 490 files; 14 raw dialog markup; 24 `window.confirm/alert` | Form kit, state components, one confirm dialog (7.3, plus A2) |
| C4 | Client storage | 192 `localStorage/sessionStorage` accesses in 55 files | One typed client-storage helper |
| C5 | Layering | 490 component files import `@/modules`; 12 modules import components; 5 components import the db | Boundary lint rule + ratchet |

## Tier D: repository and operations

| # | Concern | Evidence | Target |
|---|---|---|---|
| D1 | Migrations | 344 migrations; 245 triggers in 79 files; 261 `updated_at` column definitions in 103 files; 140 policies in 8 files | Generated helpers (updated_at trigger, tenant policy, version column) so a new table is one declaration |
| D2 | File size | 181 source files over 500 lines, 37 over 1,000 | Size ratchet; split along the registries above |
| D3 | Suppressions | 27 `eslint-disable/@ts-*`, 46 TODO/FIXME, 7 empty catch | Zero-new ratchet |
| D4 | Scripts and docs | 132 scripts, 73 npm scripts, 12,429 tracked docs files (mostly `docs/legacy-source`) | One script index; archive legacy docs |

## Recommended order

1. A1 page access and A2 client API layer first: they are the two largest uncentralised planes and unblock B7, C1, C3.
2. A3 CI composite actions: small, mechanical, and removes 260 copies.
3. Finish the wrapper naming (A6) with role proof, then repositories (A5).
4. B1, B2, B4 registries, then B3, B5 to B11.
5. UI (C1 to C5) once A2 exists, so the copy and form kits have one client to sit on.
6. A4 test migration runs alongside every step: when a registry lands, replace the source-text pins for that area.
7. D1 to D4 last.

## Ratchets to add (the 18 unmeasured concerns)

Pages with inline role check; pages calling the context directly; raw `fetch` in components; writes without Idempotency-Key;
`router.refresh` count; workflows without composite actions; unit tests reading source text; hand-mocked `@/db`; inline `.min/.max`
in api+modules; raw date/number/tel inputs; Tailwind arbitrary values; hex colours; client storage accesses; header-name
literals; module-to-component and component-to-db imports; files over 500 lines; suppressions; query-param reads.
