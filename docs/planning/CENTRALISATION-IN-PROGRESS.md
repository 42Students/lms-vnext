# Centralisation in progress: read this before editing shared patterns

Owner programme started 2026-11-14. Plan: `overnight-master-plan-2026-11-14.md`. Live status: `overnight-progress.md`.
Audit with counts: `centralisation-audit-2026-11-14.md`. GCP and Cloudflare are out of scope for this programme.

## What changes for you

Large mechanical refactors are landing in small commits on `main`. They do not change behaviour. If you edit the same files you
may get a rebase conflict: drop your side of the conflicting hunk, take the new central call, and re-apply your intent on top.

| If you are about to write... | Use this instead (as each lands, see the progress file) |
|---|---|
| `process.env["X"]` | the typed config module (Phase 2.1) |
| a `*_READY` flag read | the feature registry (Phase 2.2) |
| `"COLLEGE_ADMIN"` / `"TPO"` ... string checks in pages | role and capability constants, `can(...)` (Phase 2.3) |
| `new Intl.DateTimeFormat`, `"Asia/Kolkata"`, `toLocale*String` | `@/lib/format-date` and the clock service (Phase 2.4) |
| another `first`, `humanize`, `initials`, `isUniqueViolation` | the shared utilities (Phase 2.5) |
| a new API error class or a `*-api-error.ts` mapper | the one error model (Phase 3.1) |
| `NextResponse.json(...)` with a hand-set `Cache-Control` | response helpers (Phase 3.2) |
| `isSameOriginRequest(` or `getCurrentRequestContext(` inside a route handler | nothing: `route()` already provides both (Phase 3.3) |
| `permission: "service-enforced"` on a new route | a named capability in the policy registry (Phase 4.1) |
| `insert(activityEvents)` | `recordActivity(tx, event)` (Phase 5.1) |
| your own `PAGE_SIZE` | the pagination contract (Phase 6.2) |
| a hard-coded `"/college/..."` path | the typed route registry (Phase 6.4) |
| literal user-facing copy | the copy catalogue (Phase 7.1) |
| a test `const ctx = ...` or `person()` | `tests/support/actors.ts` (available now) |

## How you are protected from surprises

`npm run centralisation:check` (part of `npm run lint`) counts 35 scattered patterns and compares them with
`docs/security/baselines/centralisation.json`. A metric is only **enforced** (can fail your build) once its central module exists and
is announced in the progress file; until then it is tracking only. When a metric is enforced and you add a new use of the old
pattern, the check names the metric and the count; fix it by using the central tool, not by editing the baseline.

## Directories being touched, in order

1. `src/lib`, `src/config`, `src/security` (new central modules)
2. `src/app/api/**` (request, response and error plumbing; policy registry route family by route family)
3. `src/modules/**` (activity writer, repositories, tenant helpers)
4. `src/components/**` and `src/app/(authenticated)/**` (copy, routes, tokens): last

Each batch is one directory or one pattern. Pull with rebase before you start a long edit in any of these.
