# Centralisation audit: what is scattered, and where it should live

Date: 2026-11-14. Method: counts taken from the source by search (`src/`, 7,068 TS/TSX files, 1,003 API routes, 641 pages) plus a
duplicate-name scan. Counts are approximate (text matches, not a parser) but the orders of magnitude are reliable. "Central tool
exists" means a module already does the job; "no central tool" means nothing does. The goal of the list: **a change made in one
place is picked up by the whole app.**

## 0. Verdict in five lines

1. The app is **well centralised at its edges** (route wrapper, security headers, RLS, logger, design-system components) and
   **badly scattered in its middle** (authorization decisions, errors, data access, config, time, status vocabulary, URLs, copy).
2. The single biggest gap: **1,075 routes say `permission: "service-enforced"`**, meaning authorization is decided separately in
   each service, in about 59 files that define their own `requireX` guards. There is no single place to read "who can do what".
3. Where a central tool exists it is often **bypassed or duplicated**: 7 different API error mappers, 6 request-body readers,
   193 files building their own date formatter although one exists, 215 handlers re-checking the origin the wrapper already checks.
4. **Configuration is not a system**: 141 environment variable names read in 217 files, only 2 files use the typed config, and 50
   `*_READY` flags are each read with a bare `process.env[...]`.
5. Everything below is reachable with a **strangler pattern**: build the central module, add a ratchet that counts the old pattern,
   migrate by codemod, never allow the count to rise. This repo already runs ratchets (api surface, UI consistency, test integrity,
   central security), so the mechanism exists.

## 1. Already centralised (keep, extend, do not rebuild)

| Area | Central tool | Evidence |
|---|---|---|
| Route entry | `route()` in `src/security/route.ts` (origin, body size, auth, permission, audit) | 985 files import it; 673 of 673 data-changing routes guarded |
| Browser security headers, CSP | `src/security/headers.ts` | one place |
| Tenant isolation | `src/db/tenant-context.ts`, `tenant-pool.ts`, RLS policies, `pooling-guard.ts` | live-catalog CI test |
| Logging and redaction | `src/observability/logger.ts`, `redact.ts` | 53 logger calls, only 14 raw `console.*` |
| Shared rate-limit store | `src/security/shared-store*.ts` | on by default in production |
| Permission primitives | `src/modules/permissions/policy.ts` (`can`, `requirePermission`) | 604 + 265 uses |
| Portal access | `src/modules/identity/role-portal-policy.ts` | layouts use `canAccessRolePortal` |
| Activity event names | `ACTIVITY_EVENT_TYPES` | 443 references |
| File type safety | `src/modules/storage/inline-safe.ts`, `file-policy.ts` | download paths |
| Design system | `src/components/ui/*` (about 100 components) | `ErrorState/EmptyState/LoadingState` used 1,660 times |
| Client API calls | `src/lib/api-fetch.ts` | 355 uses |
| Server outbound calls | `src/lib/outbound*.ts` | only about 8 server files bypass it |
| Page boundaries | 519 `error.tsx`, 521 `loading.tsx` | consistent per route |
| Gates | UI consistency, api-surface, test-integrity, security:central ratchets | CI |

## 2. Tier 1: security and correctness (do these first)

Each row: what is scattered, how much, what the one place should be, and the ratchet that keeps it from coming back.

| # | Thing | Scatter (measured) | One place it should live | Ratchet |
|---|---|---|---|---|
| 1 | **Authorization rules** | 1,075 routes `service-enforced`, 126 named permissions, 18 `actor-owned`; 59 files define their own `requireTpo` / `requireLearner` / `ownCollege` / `loadJob` style guards (7, 6, 8 and 7 copies of the same names); 609 `hasMembershipRole` and 154 `roles.includes` calls | A **policy registry**: each route declares a named capability and (where needed) a resource resolver; the registry maps capability to roles, scope and step-up. The role matrix is generated from it | `service-enforced` count may only fall; no new `function require*Actor` outside the registry |
| 2 | **Request plumbing repeated inside handlers** | 265 handler-level origin checks in 215 files (the wrapper already does it); 951 `getCurrentRequestContext()` calls in 846 files (the wrapper already hands over the actor); 457 body-reader calls across **6 variants** (`bounded-json-body`, `bounded-json-request`, `bounded-request-json`, `bounded-utf8-body`, `bounded-form-data`, the auth reader) | The wrapper owns origin, actor, body and query parsing; one body reader; handlers receive typed values | Count of `isSameOriginRequest(` and `getCurrentRequestContext(` inside `src/app/api` may only fall |
| 3 | **Error model** | 7 separate API error mappers (`api-error`, announcement, bug-tracker, log-alert, tpo-crm, tpo-messaging, tpo-recruiter-invite); 164 custom error classes; 1,801 `throw new Error("...")`; about 4,300 upper-snake code literals; 687 places return `error.message`; only 3 code-to-message maps | One `AppError {code, status, safeMessage, retryable}` plus one registry of codes to status and user wording; one mapper | No new mapper file; `throw new Error("` count may only fall |
| 4 | **Response building and headers** | 3,146 `NextResponse.json` / `Response.json`; 1,211 `Cache-Control` literals (1,098 are `private, no-store`); 1,747 numeric `status:` literals | Response helpers by route class (private data, public, download, redirect) that set cache and security headers once | Raw `Cache-Control` literals in routes may only fall |
| 5 | **Audit and activity records** | 215 inline `insert(activityEvents)`; 36 hand-written status-history inserts; 43 other event writers; only 7 calls to a helper | One `recordActivity(tx, event)` and one status-transition writer: required actor, tenant, event type, redaction, same transaction | Inline `insert(activityEvents)` may only fall |
| 6 | **Tenant and ownership checks** | 226 inline `collegeId ===/!==` comparisons, 48 for `organizationId` | `requireSameCollege(context, resource)` and `ownsResource(context, row)` in the policy module; RLS stays as backstop | Inline comparisons may only fall |
| 7 | **Data access** | 2,548 `getDb()` calls in 949 files; 2,360 raw `sql` templates; 852 transactions; 757 row locks; 52 routes query the DB directly; no repository layer | Repositories per aggregate; one lock-order convention; one unit-of-work wrapper (`transaction-retry` exists) | `direct-db-in-route` (52) may only fall |
| 8 | **Optimistic concurrency** | 564 `expectedVersion` uses; 184 `STALE_VERSION` codes; 4 helpers | One `requireCurrentVersion(row, expected)` returning the standard conflict error | helpers count |
| 9 | **Configuration and feature flags** | 316 `process.env` reads in 217 files; 141 distinct names (families: DB10 33, TPO 32, APP 31, DB09 28, E2E 13, PUBLIC 11, AUTH 11, TELEGRAM 10); **only 2 files use the typed config**; 50 distinct `*_READY` flags, 327 checks (`DB09_TPO_API_READY` is read 24 times) | One typed, validated config module loaded at boot (fail closed in production) and one feature API (`features.tpoApi`), with a table of every flag, owner and default | `process.env` reads outside the config module may only fall |
| 10 | **Two feature-gate systems** | 327 env-flag checks versus 86 module-access (`resolveOptionalModuleAccess`) uses | One entitlement answer per college/module; env flags only for deployment readiness | flag count |
| 11 | **Rate limits, timeouts, retries** | 65 `rateLimit: {` literals; 116 `timeoutMs` literals; 124 abort controllers; 201 timers | One `limits.ts` table keyed by route class and by client call type | literals count |
| 12 | **Cookies and session settings** | 20 `cookies.set` calls with 17 hand-built option objects across auth routes | One `setSessionCookies / clearSessionCookies` | `cookies.set(` outside it |
| 13 | **Roles and portals as string literals** | 2,543 role literals in 888 files | Role constants and capability groups; pages ask "can" or "portal", never a role name | literal count |
| 14 | **Outbound calls** | about 8 server files use raw `fetch` (storage, telegram, github, branding logo, two exports, one parity model) | All through `outboundFetch` (SSRF guard, timeout, redaction) | server raw `fetch` count |
| 15 | **CSV and spreadsheet exports** | 211 `text/csv` mentions in 201 files; `csvCell` defined in 10 places although `security/csv-cell.ts` exists; 122 hand-built `Content-Disposition` headers | One export pipeline: scope, columns, neutralisation, filename, audit, download headers | duplicated `csvCell` and header builders |
| 16 | **File type lists and download headers** | 62 literal MIME lists; 122 hand-built disposition headers | `file-policy` plus `download-core` as the only builders | literal count |
| 17 | **Idempotency** | `action-idempotency` exists but is not the default for writes | Wrapper option `idempotent: true` on non-repeatable writes | writes without it |
| 18 | **Background jobs and schedulers** | 8 internal job routes each with its own secret env and header names (`WORKER_ENV`, `WORKER_HEADER` are redefined 4 times) | One job registry (name, schedule, secret, lease, tenant mode) | duplicated constants |

## 3. Tier 2: behaviour that must be identical everywhere

| # | Thing | Scatter (measured) | One place it should live |
|---|---|---|---|
| 19 | **Clock and time zone** | 2,590 `new Date(`; 412 `Date.now()`; `Asia/Kolkata` hard-coded in 365 files (526 times); 256 inline `Intl` formatters in 193 files; duplicated formatters `formatWhen` 13, `dateLabel` 7, `formatDate` 7, `formatDateTime` 6, `dayLabel` 6, `formatIst` 4, `currentTimeMs` 8; 109 hand-written millisecond maths | A clock service (injectable for tests), one time-zone setting per college, one formatter set (`format-date.ts` already exists and 330 files use it) |
| 20 | **Currency, numbers, phones** | INR, the rupee sign and "LPA" in 145 places; 52 `toFixed`; 71 phone regexes with `+91` assumptions | A locale/currency/phone module driven by college settings (needed before a non-Indian college) |
| 21 | **Validation primitives** | `z.string().uuid()` 1,179 times, `z.uuid()` 293, a hand-written UUID regex 115; schemas redefined by name: `inputSchema` 27, `querySchema` 22, `idSchema` 9, `pageSchema` 8, `collegeIdSchema` 5; email 29 and phone 71 inline | A shared `schemas.ts` (id, email, phone, page, limit, date, money) and a rule that mutating bodies are strict |
| 22 | **Pagination** | `PAGE_SIZE` defined in 14 files with 6 different values (10, 20, 25, 48, 50, 500); 269 limit constants; 2,760 numeric `.limit(n)`; 6 copies of `decimalPage` | One pager contract: parameter names, defaults and caps per list class, one DB helper, one UI control |
| 23 | **Status vocabulary** | 1,627 status string comparisons; 27 `pgEnum` versus 319 check constraints written as `IN ('...')` lists; label/tone helpers duplicated: `humanize` 15, `statusTone` 9, `tone` 10, `statusLabel` 4 | A status registry per domain feeding the DB checks, TS types, labels and badge tones |
| 24 | **URLs and navigation** | 4,536 route string literals in 1,538 files; 2,407 `href="/..."`; 352 `redirect("/...")`; 302 href-builder functions defined in 298 files | A typed route registry (`routes.college.projects(id)`), also feeding nav, breadcrumbs, redirects and the role matrix |
| 25 | **Legacy compatibility** | 144 files named legacy; 8 alias re-export routes plus about 11 thin forwarding routes; several response envelopes (`{status, message, data}`, plain, `LessonContents`) | One legacy table (old path to new path to removal date) and one envelope adapter |
| 26 | **Notifications, email, SMS** | 18 files send mail or SMS; two ways to insert notifications | One notification service: templates, recipients, quiet hours, outbox, opt-out |
| 27 | **Initials, tones, small helpers** | `first` redefined in 64 files, `when` 23, `humanize` 15, `scope` 14, `isUniqueViolation` 9 | `src/lib/` utilities with tests |
| 28 | **Date and money inputs in forms** | per-form parsing | one input component and parser pair |

## 4. Tier 3: UI and copy

| # | Thing | Scatter (measured) | One place |
|---|---|---|---|
| 29 | **User-facing wording** | 3,430 literal `title="..."` and 1,824 `description="..."`; 455 `Record<..., string>` label maps; 490 toast calls | A copy catalogue by domain (the "exact wording parity" rule needs one source) with error copy keyed by error code |
| 30 | **Design tokens and Tailwind** | 33,892 `className` lines; 2,453 arbitrary pixel values; 604 `!important`; 309 bare links; 46 bare buttons; 135 raw `<input>`; 80 inline styles; 32 hex colours | Tokens and components only; the UI-consistency ratchet already measures this |
| 31 | **Page states** | each page chooses its own loading/empty/error wording | State components take copy from the catalogue |
| 32 | **Forms and field errors** | `form-validation.ts` exists, usage uneven | one form kit |
| 33 | **Tables and lists** | `data-table` and bespoke tables coexist | one table component with pager contract (#22) |

## 5. Tier 4: tests, gates, operations

| # | Thing | Scatter | One place |
|---|---|---|---|
| 34 | **Test actors** | 68 test files define their own `ctx/as/actor` builder; each of the new security suites defines `person()` and `as()` | `tests/support/actors.ts` with persons, roles, colleges |
| 35 | **Fixtures** | course, drive and learner fixtures are partly shared; many tests build their own SQL | fixture builders per domain |
| 36 | **Baseline files** | five ratchet baselines in different folders and formats | one `docs/security/baselines/` with one reader |
| 37 | **Deployment settings** | only a dev manifest in the repo; settings live in cloud, not code | a generated environment matrix from the config module (#9) |
| 38 | **Branding, domains, per-college settings** | read inline in many services | one settings service with a typed schema |

## 6. Suggested order (smallest change that removes the most scatter)

1. **#9 config and flags** and **#13 roles**: pure refactors, no behaviour change, and everything else reads from them.
2. **#3 error model**, **#4 responses**, **#2 request plumbing**: shrinks every route file; one codemod per pattern.
3. **#1 policy registry**: the largest and most valuable; do it route family by route family (placements, courses, people, ...), generating the role matrix as it goes.
4. **#5 activity writer**, **#6 tenant helpers**, **#8 versions**: removes hundreds of inline inserts and comparisons.
5. **#19 clock, #21 validation, #22 pagination, #23 status, #24 URLs**: the behaviour-consistency block.
6. **#29 copy catalogue** and the remaining UI items, then tests and gates.

Every step ships with: the central module, a ratchet counting the old pattern, a codemod or a guided migration list, and a test that
fails if the old pattern reappears.

## 7. Caveats

- Counts are text matches. A few include comments or strings, and some patterns are intentionally local (a one-off constant is fine).
- Not measured: database schema duplication, email template content, and per-college settings reads. They are listed because the
  structure suggests scatter, but they need a closer look before a number is quoted.
- None of this changes behaviour by itself; the risk is in the migrations, which is why each step has a ratchet and a test first.
