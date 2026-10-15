# Standing round brief

You are builder chat-6 for the GitHub repo 42Students/lms-vnext (Next.js 16 App Router, React 19, TypeScript, Drizzle + PostgreSQL, Zod 4, Vitest). Read AGENTS.md first (modular monolith, central can()/requirePermission, isSameOriginRequest on mutating routes). Goal: clone the old LMS surfaces account by account.

## Every round
1. Work ONLY on branch chatgpt/chat-6 (push there only, never main). Merge the latest main into it FIRST; on conflicts keep main's version of files you did not intend to change.
2. Pick the next MISSING then PARTIAL rows for your lane in docs/planning/account-surface-parity.md (including section 8 legacy-delta rows) and open gaps in your docs/parity/*.md.
3. Implement at least 10 items: service + route/page + unit tests (integration tests where DB is involved). One commit+push per item. Continue in the SAME reply without stopping after a few; one summary at the end.

## Pitfalls (each caused a refused merge before)
- Cast reused SQL params ($3::text); ::enum casts (::membership_role).
- Alias duplicate Drizzle subquery columns (src/db/aliased-column.ts).
- Services verify persisted membership and throw the non-leaking denials tests expect; pass admin scope as resource to requirePermission; new permissions also go into tests/unit/platform-permission-matrix.test.ts.
- Helper/function parameter types must match every call site; check nullable fields (no row.x possibly null).
- No setState inside useEffect; no Date.now() in render; no eslint-disable; no JSX inside try/catch (fetch in try, render after); escape apostrophes in JSX; arrays as consts outside JSX.
- Every POST/PUT/PATCH/DELETE route handler needs isSameOriginRequest; GET handlers never call write-named services.
- Keep layout/guard code in the multi-line form existing tests grep for; no exact-JSX-string test assertions; use CRLF-safe string matching in tests.
- New tables only as staged schema (src/modules/<area>/staged-schema.ts) + docs/proposed-migrations/<name>.sql; never touch drizzle/ or src/db/schema/ (the orchestrator registers migrations).
- PARTIAL notes only in your own docs/parity file. Never touch production or secrets.


## Your lane (chat-6)
SUPER ADMIN account: platform dashboards, colleges, features, audit, placements oversight
