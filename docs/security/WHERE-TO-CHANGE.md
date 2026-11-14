# Where to change it (central modules)

When something must change everywhere, change it in one of these places. Each has a test, and the matching counter in
`docs/security/baselines/centralisation.json` is a ratchet: `npm run centralisation:check` (part of `npm run lint`) fails if new
code adds another hand-written copy.

| To change | Edit | Guarded by |
|---|---|---|
| An environment variable's name, kind or the value that turns a readiness flag on | `src/config/env-names.ts` (generated: `scripts/gen-env-registry.cjs`), `src/config/features.ts` | `sec-config-env`, `sec-config-features`, `sec-env-matrix`; regenerate `docs/security/ENVIRONMENT-MATRIX.md` with `npx tsx scripts/gen-env-matrix.ts` |
| A role name | `src/modules/identity/roles.ts` (`ROLE`) | `sec-role-constants` |
| Who may do what | `src/modules/permissions/policy.ts`; the generated matrix `docs/security/baselines/permission-matrix.json` shows the diff (`UPDATE_GOLDEN=1 npx vitest run tests/unit/sec-permission-matrix.test.ts`) | `sec-permission-matrix` |
| "Is this row in my college" / "is this row mine" | `src/modules/permissions/resource-guards.ts` | `sec-guards-concurrency` |
| An HTTP status for a service error code | `src/lib/error-registry.ts` | `sec-error-status-golden`, `sec-error-registry` |
| Wording of an error shown to people | `src/lib/friendly-error.ts` | existing tests |
| Cache headers on a response | `src/security/responses.ts` (`CACHE`, `privateJson`, ...) | `sec-responses` |
| A download's filename or Content-Disposition | `src/security/downloads.ts` | `sec-downloads` |
| How a CSV cell is escaped | `src/security/csv-cell.ts` | `sec-export-contracts` |
| A rate limit or timeout tier | `src/security/limits.ts` | `sec-limits` |
| Session and sign-in cookie attributes | `src/auth/cookies.ts` | `sec-auth-cookies` |
| How a request body is read and capped | `src/lib/request-body.ts` | `sec-request-body` |
| Safe repeat of a write (Idempotency-Key) | `route({ idempotent })` in `src/security/route-core.ts` | `sec-route-idempotency` |
| A machine-called job (credential header, secret variable) | `src/security/jobs.ts` | `sec-job-registry` |
| The platform time zone and locale, and "now" | `src/config/locale.ts`, `src/lib/clock.ts` | `sec-clock-locale` |
| Shared small helpers (`first`, `clamp`, `humanize`, `isUniqueViolation`) | `src/lib/shared.ts` | `sec-shared-utils` |
| Optimistic-concurrency conflicts | `src/lib/concurrency.ts` | `sec-guards-concurrency` |
| An audit/activity event | `src/modules/activity/record-activity.ts` | `sec-record-activity` (unit and PostgreSQL) |
| Id validation in request schemas | `src/lib/schema-primitives.ts` (`zUuid`) | `sec-pagination-schema` |
| A list's page size | `src/lib/pagination.ts` (`PAGE_SIZES`) | `sec-pagination-schema` |
| A link to a page | `src/lib/routes.ts` (`ROUTES`) | `sec-routes` (every route is a real page) |
| Where a ratchet baseline lives | `docs/security/baselines/`, read with `scripts/lib/baselines.mjs` | `sec-baselines` |

Built but not yet used everywhere (use them in new code; old code still has its own copies): permission naming per route, `requireSameCollege`,
`requireCurrentVersion`, `recordActivity`, `route({ idempotent })`, `ROUTES`. See `docs/planning/centralisation-before-after-2026-11-14.md`.
