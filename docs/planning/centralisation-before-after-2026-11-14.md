# Centralisation: before and after (2026-11-14, overnight program)

Counts come from `scripts/centralisation-metrics.mjs`; "before" is the baseline committed in Phase 0, "after" is
`docs/security/baselines/centralisation.json` at the end of the run. 31 of 35 metrics are now enforced ratchets: CI fails if any
of them rises. The process.env row now excludes NODE_ENV (a build-time constant), so its drop overstates the change slightly.

| Metric | What it counts | Before | After | Change |
|---|---|---:|---:|---:|
| `authz.serviceEnforcedRoutes` | routes declaring permission  | 1075 | 1075 | 0 |
| `authz.ownActorGuardDefs` | per-file requireX actor guard definitions | 63 | 63 | 0 |
| `plumbing.handlerOriginChecks` | origin checks inside API handlers | 262 | 262 | 0 |
| `plumbing.handlerActorLookups` | getCurrentRequestContext() inside API handlers | 410 | 410 | 0 |
| `plumbing.bodyReaderModules` | request-body reader modules in src/lib | 4 | 1 | -3 |
| `errors.apiErrorMapperModules` | API error mapper modules in src/lib | 7 | 7 | 0 |
| `errors.plainThrowError` | throw new Error( | 1803 | 1804 | +1 |
| `errors.customErrorClasses` | custom Error classes | 164 | 165 | +1 |
| `errors.messageReturnedFromApi` | error.message used in API routes | 153 | 153 | 0 |
| `responses.cacheControlLiterals` | Cache-Control literals in API routes | 1180 | 915 | -265 |
| `responses.numericStatusLiterals` | numeric status literals in API routes | 1680 | 1680 | 0 |
| `events.inlineActivityInserts` | inline insert into activity_events | 215 | 215 | 0 |
| `tenant.inlineCollegeIdCompare` | inline collegeId equality checks | 227 | 227 | 0 |
| `data.directDbRoutes` | API routes importing the database directly | 52 | 52 | 0 |
| `config.processEnvReads` | process.env reads outside the config module | 401 | 10 | -391 |
| `config.readyFlagReads` | bare READY/ENABLED flag reads | 97 | 0 | -97 |
| `limits.rateLimitLiterals` | inline rateLimit config literals | 65 | 2 | -63 |
| `limits.timeoutLiterals` | inline timeoutMs literals | 116 | 5 | -111 |
| `session.cookieSets` | cookies.set( calls | 20 | 4 | -16 |
| `roles.roleLiterals` | role name string literals | 2806 | 1199 | -1607 |
| `outbound.serverRawFetch` | raw fetch( in server code | 10 | 7 | -3 |
| `exports.csvCellCopies` | csvCell redefinitions | 16 | 7 | -9 |
| `files.dispositionLiterals` | hand-built Content-Disposition headers | 133 | 8 | -125 |
| `files.mimeLiterals` | literal  | 55 | 55 | 0 |
| `time.asiaKolkataLiterals` | Asia/Kolkata literals outside format-date | 526 | 69 | -457 |
| `time.inlineIntlDateFormatters` | inline Intl.DateTimeFormat | 233 | 233 | 0 |
| `validation.inlineUuidSchemas` | inline uuid zod schemas | 1552 | 10 | -1542 |
| `pagination.pageSizeConstants` | PAGE_SIZE constants | 14 | 0 | -14 |
| `status.statusCompares` | status string comparisons | 1810 | 1810 | 0 |
| `routes.routeLiterals` | hard-coded internal route strings | 4859 | 4859 | 0 |
| `legacy.legacyFiles` | files with legacy in the path | 122 | 122 | 0 |
| `copy.titleLiterals` | literal title= | 3481 | 3481 | 0 |
| `copy.descriptionLiterals` | literal description= | 1825 | 1825 | 0 |
| `logging.consoleCalls` | raw console calls | 14 | 14 | 0 |
| `helpers.duplicatedNames` |  | 46 | 40 | -6 |

## What moved and what did not

Moved (central module built, call sites migrated): process.env reads and readiness flags (src/config), role literals (ROLE),
Asia/Kolkata literals (DEFAULT_TIME_ZONE and the clock), Cache-Control literals (src/security/responses), rate-limit and timeout
literals (src/security/limits), cookie writes (src/auth/cookies), request-body readers (src/lib/request-body), download headers
(src/security/downloads), CSV cell copies (spreadsheetCsvCell), uuid schemas (zUuid), PAGE_SIZE constants (src/lib/pagination),
machine-job credentials (src/security/jobs).

Built but call sites NOT migrated (the ratchet only holds the line): authorization (generated permission matrix, resource guards),
requireCurrentVersion, recordActivity, the error registry beyond the status table, the idempotency option, typed routes.

Not built: repositories (5.2), notification service (5.6), settings service (5.7), status registry (6.3), legacy table (6.5),
locale/currency/phone module (6.6), date and money inputs (6.7), copy catalogue (7.1), design-token reduction (7.2).
