# No-mercy strictness plan (A to H)

Owner order (2026-10-22): do all of A to H in vNext. Start after the fix waves are merged, because lanes cannot run code and a measurement taken mid-flux is meaningless.

## Phase 0: baseline (needs one real run, on a machine that can run tsc)
1. Add non-gating configs: `tsconfig.strict.json` (extends tsconfig.json, adds all A flags), `eslint.strict.config.mjs` (all B rules as errors), `knip.json`, `.dependency-cruiser.cjs`, `.jscpd.json`.
2. Run each one once and write counts per rule and per file to `docs/audit/strictness/baseline-*.json`.
3. Rank files by error count: this becomes the packet list.

## Phase 1: fix in packets (lanes, one file per packet, same system as the fix waves)
Order: A compiler flags (one flag at a time, cheapest first: noUnusedLocals, noImplicitReturns, noFallthrough, noImplicitOverride, then noUncheckedIndexedAccess, exactOptionalPropertyTypes), then B rules by group (promises, unsafe-any, exhaustiveness, hooks, a11y, security, tests), then C dead code and cycles.
Rule per packet: fix the cause, never silence it (`@ts-ignore`, `eslint-disable` and `as any` are banned and counted).
Each flag or rule group is promoted to the real config only when its count is 0.

## Phase 2: structure (D and E)
- D: strictObject Zod on every route, one schema shared by client and server, typed env module that fails at boot, branded IDs (CollegeId, UserId, RoleId), server-only/client-only boundaries, typedRoutes, typed copy keys, raw SQL banned outside one module.
- E: schema-lint tests (primary key, tenant column, timestamps, FK indexes), constraints and enums, RLS by college, migration journal/drift checks, transaction rules, drizzle plugin rules (no unscoped update/delete).

## Phase 3: tests and gates (F and G)
- F: no skipped/focused tests, per-folder coverage thresholds, permission-matrix test (route x role), contract tests per route, fast-check for grading/dates/permissions, Playwright per role, axe, console-error-fails, seeded clock; Stryker on core logic.
- G: next build with ignoreBuildErrors false, pre-commit hooks, secret scan, forbidden-pattern script, codeowners and branch protection, pinned tool versions, bundle budgets.
- CI becomes a required check once everything above is green.

## Phase 4: runtime safety (H)
Sentry, structured logs with request ids, health/uptime checks, rate limiting, CSRF, secure headers and CSP, request limits and timeouts, idempotency keys, feature flags with kill switch, tested backups and rollback, staged rollout, synthetic monitoring, alerts.

## Rules
- Never flip a strict flag on main while its count is above 0.
- Heat: one heavy tool (tsc, eslint, knip, vitest) at a time, see the low-CPU memory.
- Every phase ends with a numbers report: errors before and after.

## Fail fast (owner goal, 2026-10-23)
The owner will maintain vNext alone, so every rule exists to make breakage impossible to merge or loud the moment it happens, never quiet.
- Config: one typed env module validated with Zod at boot; a missing or malformed variable stops the server from starting (no defaults for secrets, URLs or feature switches).
- No silent fallbacks: no empty catch blocks, no `catch { return [] }`, no `?? ""` hiding missing required data; errors are typed (AppError subclasses), logged with request id, and shown as a clear user message.
- Exhaustiveness: every switch over a union ends in an `assertNever`; lint rule `switch-exhaustiveness-check` as error.
- Invariants: assert impossible states in services (tenant id present, row counts expected) and throw immediately.
- Data: database constraints (NOT NULL, CHECK, FK, unique) for every rule the code relies on, so bad data is rejected at write time; migration drift check in CI.
- Gates: CI is a required check; pre-commit runs typecheck on changed files, lint, secret scan; main cannot be pushed red.
- Visibility: Sentry (or equivalent free tier) for every unhandled error, uptime check on /health, alert on error-rate spike, so failures are seen without anyone looking.
- Dependencies: pinned versions, lockfile enforced, automated weekly update PRs gated by the full CI, so upgrades never need manual fixing.
- Tests: permission matrix and contract tests per route fail on any new route without a test.
