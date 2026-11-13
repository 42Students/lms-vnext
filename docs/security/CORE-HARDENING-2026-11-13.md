# Core hardening pass, 2026-11-13 (code only, nothing touched on GCP)

Scope the owner set: the basic, core gaps only, no "nice to have". Each item below was checked in the code first; what was already
solid is recorded as such and locked with a test, so it cannot quietly regress.

| # | Item | Finding | What changed | Locked by |
|---|---|---|---|---|
| 1 | Rate limits across replicas | A shared, database-backed store already existed but was OFF unless an env var was set, so any environment that forgot it ran per-process limits. | `sharedStoreEnabled()` (`src/security/shared-store-flag.ts`): ON by default in production, `SECURITY_SHARED_STORE=off` to opt out. A database error still degrades to memory (availability). | `tests/unit/sec-core-hardening.test.ts` |
| 2 | Shared campus address | Sign-in start and verify allowed 10 requests a minute per address, and 20 code sends per 10 minutes per address. One college behind one public address could be locked out by a handful of students. | Per-address ceilings raised to coarse backstops (`src/modules/auth/ip-limits.ts`: 240, 300, 120, 120 a minute). A verified college host gets 600 sends per 10 minutes per address; the unresolved-host budget stays 20. Per-contact budgets (5 and 8) and the 5-try verification budget per challenge are unchanged and stay the real defence. Codes are only sent to registered users. | sec-core-hardening, `auth-login-service.test.ts` (budget per host kind), `auth-send-caps` integration |
| 3 | Pooling and the college setting | Settings are session-level, applied at checkout and reset on release (connection destroyed if the reset fails). Safe for the app's own pool; unsafe behind a transaction-mode pooler. | `src/db/pooling-guard.ts`: with `DB_TENANT_SCOPE=on` the app refuses to start against a pooler-looking address (port 6432/6543, `pooler.`, `pgbouncer`, `hyperdrive`) unless `DB_ALLOW_TRANSACTION_POOLER=acknowledged`. Rule recorded: do not place Hyperdrive or PgBouncer in transaction mode in front of the database until settings move to `SET LOCAL`. | sec-core-hardening (also: only `tenant-context.ts` writes `app.*` settings) |
| 4 | Row-level security proof | CI proved the policy text on a probe table only. | `tests/integration/sec-rls-live-catalog.test.ts`, run in the CI `database` job: every public table is RLS-enabled, FORCED and policied, or explicitly classified as not tenant data; classified tables carry no `college_id`; and on real tenant tables a non-owner role under enforce mode sees nothing without a scope, only its own college with one, cannot update or delete another college's rows, and platform and system scopes see all; a malformed college id errors. Throwaway role, rolled back. | The test itself, `.github/workflows/ci.yml` |
| 5 | Session lifecycle | Already solid: token stored only as a keyed digest, account status and revocation re-checked on every request, 8 h idle limit, 5 day absolute limit, Super Admin 30 min idle and 8 h absolute, previous session revoked in the same transaction as the new sign-in, HttpOnly + SameSite + Secure cookies. | No code change needed; behaviour locked. | sec-core-hardening (section 5) |
| 6 | Uploaded files never active | Two paths could serve a stored object inline with its stored type: the course content file route and the generic private read grant. | `src/modules/storage/inline-safe.ts`: only PDF, PNG, JPEG, GIF, WebP, MP4, WebM, QuickTime and common audio render inline; everything else (HTML, SVG, XML, unknown or missing type) is always an `attachment`. Both paths use it. The central signed-link path already did. | sec-core-hardening, `chat7-learner-course-file-route-boundaries.test.ts` |
| 7 | Every mutating route guarded | Measured: 673 mutating routes, 0 unguarded. | Permanent zero-tolerance test. Also fixed a regression from the course coordinator work: its two routes used `service-enforced`; they now use named permissions (`courses.manage` for the admin route, `courses.read` plus the handler's FACULTY check for "my coordinated courses"). `security:central` is green again. | sec-core-hardening (section 7), `npm run security:central` |
| 8 | Errors and logs | Responses: the fallback for unknown errors is a generic `INTERNAL_ERROR`; no route returns a stack; the 46 routes that return `error.message` do it for typed domain errors. Logs: INFO was filtered, ERROR and WARNING were not, so a database error echoing a row value (`Key (phone_e164)=(...)`) reached the log store. | `src/observability/redact.ts`, applied to every severity when a record is built: row-value echoes, connection strings, URL credentials, signed-URL parameters, bearer tokens, JWTs, emails, phone numbers, and values under keys like password, token, otp, cookie, secret, signature. The request reference is preserved. | sec-core-hardening (section 8), `logger.test.ts` |

## Rules this pass leaves in force

- Do not put an external transaction-mode pooler in front of the database while tenant row-level security is on. If one is needed
  later, first move the `app.*` settings to `SET LOCAL` inside every transaction, then set `DB_ALLOW_TRANSACTION_POOLER=acknowledged`.
- Hyperdrive query caching must stay off.
- New tables must carry a tenant policy or be listed with a reason in `docs/security/table-classification.json`; the new CI test fails
  otherwise.
- Do not lower the per-contact or per-challenge sign-in budgets to "fix" a shared-address complaint; adjust the per-address backstops.

## Not done here (needs owner or a cloud change)

Independent reviewer, Cloud SQL SSL enforcement, secret rotation, security contact address. Unchanged from `OWNER-ACTIONS.md`.

---

# Pass 2: what is still unproven, and the tests that now cover it

Pass 1 closed eight core gaps. Pass 2 went after the biggest unknown: access *between people of the same college*, which row-level
security cannot see (it only separates colleges), plus validation, list bounds and the red CI gate.

| # | Item | Finding | Result | Locked by |
|---|---|---|---|---|
| 1 | Same-college object access | About 1,075 routes decide access inside their own service. Measured: every signed-in route reaches an actor-based authorization decision; the 52 routes that query the database directly were read for scoping and are re-checked by the service. | Executable cross-user tests on a real database: device sessions (list, revoke, sign-out-others) and notices addressed to one learner cannot be seen, changed, withdrawn or restored by another learner, a faculty member, or another college's admin. Existing suites already cover files, profile, saved jobs, attendance and course access. | `tests/integration/sec-same-college-isolation.test.ts`, `tests/unit/sec-route-contracts.test.ts` (A, A2) |
| 2 | Input validation | The audit's 286 "no schema in the route file" were checked downstream: 284 reach a schema in the service; the other 2 are machine routes with no body. The 76 "not strict" drop unknown keys (Zod default), so mass assignment is not possible; they just do not reject extras. | Zero-tolerance contract: every body-reading mutating route reaches a schema. | `sec-route-contracts` (B) |
| 3 | List bounds | Of 122 routes mentioning a page size, all but one alias reach a hard maximum (for example `limit` max 100 in the people schema); the rest were the word "limit" meaning a rate limit. | Contract: every page-size route reaches an upper bound; six reviewed rate-limit-only exceptions are named in the test. | `sec-route-contracts` (C) |
| 4 | CI gate | 8 tests in 5 files failed because layouts moved their guard into the central `canAccessRolePortal(context, role)` policy and the tests still searched for the old inline form. The guards were intact. | Tests updated to the current form, with the same ordering checks (guard before children). | the five files, plus `chat17-identity-portal-matrix` |

How strong the contracts are: they prove a check is *reachable* from a route, following service imports two levels deep (the wrapper,
shared helpers and auth plumbing are excluded, because they mention these words themselves). A deliberately bad canary route fails
all three. They do not prove the check is *correct* for every object; that is what per-family tests like the same-college file are for,
and each new family should add one.
