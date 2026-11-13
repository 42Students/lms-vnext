# Master plan: everything, in order

Date: 2026-11-14. Covers the 38 centralisation items from `centralisation-audit-2026-11-14.md`, the remaining security work, and the
leftover test and housekeeping items. Code only; nothing here touches the cloud or production.

## How every step is done (the loop)

For each item the loop is the same, and an item is only DONE when all five parts exist:

1. **Central module** written, with unit tests.
2. **Ratchet**: a counter of the old pattern, stored in one baseline file, that may only go down (`scripts/centralisation-metrics.mjs`).
3. **Migration**: a codemod or a guided list moves existing call sites; each batch is its own commit.
4. **Guard test**: fails if the old pattern reappears (new file, new copy).
5. **Gate** passes before the next step: `tsc`, lint, `security:central`, unit suite in the LF worktree, the six security database suites,
   and CI green on the pushed commit. A red gate means revert that batch, never push through it.

"Done tonight" for the large items (policy registry, repositories, copy catalogue) means: module built, ratchet live, the first
route families or directories migrated, and the count visibly falling. The ratchet then guarantees no new scatter while the rest is
migrated over the following days. Pretending 7,000 files can be fully migrated in one sitting would only produce a broken tree.

## Working rules for a long night

- One heavy job at a time (the laptop overheats): no parallel test runs while a codemod is running. Small commits, push after each green batch.
- Other lanes push all day. Before every codemod batch: `git pull --rebase`; keep batches to one directory or one pattern; if a rebase
  conflicts, drop the batch and redo it on the new head instead of hand-merging.
- Never change behaviour inside a refactor commit. If a refactor reveals a bug, record it and fix it in a separate commit.
- Dev only. No deploy, no migration applied anywhere, until you say so.
- After each phase: update `docs/security/CORE-HARDENING-2026-11-13.md` evidence and the memory notes.

---

## Phase 0: baseline and safety (first 30 minutes)

| # | Task | Output |
|---|---|---|
| 0.1 | Confirm CI is green on `main` and record the head commit | starting point to revert to |
| 0.2 | Build `scripts/centralisation-metrics.mjs`: counts every pattern in the audit (38 rows) and writes `docs/security/baselines/centralisation.json`; `--check` fails if any count rises | the ratchet engine used by every later step |
| 0.3 | Wire it into `npm run lint` and CI | no new scatter from this point |
| 0.4 | Add `tests/support/actors.ts` (persons, roles, colleges, contexts) and move the six new security suites onto it | one actor builder (audit #34), reused below |
| 0.5 | Tell the UX lanes which directories are being touched (a note in the repo, and lane messages if you want) | avoids rebase storms |

## Phase 1: safety nets before refactoring (so a refactor cannot silently break access)

| # | Task | Why now |
|---|---|---|
| 1.1 | **Production readiness guard**: refuse to boot in production unless tenant scoping is on, row-level security is enforced, the shared store table exists and the runtime role is not a superuser | removes the silent "isolation off" failure |
| 1.2 | Cross-user DB tests, remaining families: **quiz attempts and answers**, **attendance and parent contacts**, **placement offers and recruiter/company data**, **project and mentor workspaces (team files, meeting notes)**, **notifications and staff inbox** | the policy registry (Phase 4) rewrites authorization; these tests catch regressions |
| 1.3 | **Export scope tests**: every CSV/XLSX export limited to the caller's college and role; formula neutralisation | needed before the export pipeline (5.5) |
| 1.4 | **Request-level abuse suite** through the real route wrapper: body size caps, origin check on writes, 429 behaviour, no internals in errors | needed before request plumbing (3.x) |
| 1.5 | **Admin-scope and role-switch tests**: step-up expiry, scope cookies cannot carry between sessions | needed before cookie centralisation (3.5) |
| 1.6 | Freeze a **role-by-route matrix** snapshot (already exists as the baseline) and add a diff check that must be empty after every authorization batch | the oracle for Phase 4 |

## Phase 2: foundations with zero behaviour change

| # | Audit item | Task |
|---|---|---|
| 2.1 | #9 | **Typed config module**: every env var in one validated schema, grouped, fail-closed in production; migrate reads directory by directory (141 names, 217 files) |
| 2.2 | #9, #10 | **Feature registry**: the 50 `*_READY` flags and the module-access system behind one `features.*` API, with owner and default per flag; env flags only for deployment readiness |
| 2.3 | #13 | **Role and capability constants**: no role name literal in pages; pages ask "can" or "portal" (2,543 literals) |
| 2.4 | #19 | **Clock service** (injectable) and **time-zone setting per college**; one formatter set built on `format-date.ts`; remove inline `Intl` and `Asia/Kolkata` (365 files) |
| 2.5 | #27 | **Shared utilities** (`first`, `when`, `humanize`, `initials`, `isUniqueViolation`, `currentTimeMs`, `clamp`...) with tests; delete the copies |
| 2.6 | #36 | **One baselines folder** and one reader for the five ratchet files |

## Phase 3: request, response and error plumbing

| # | Audit item | Task |
|---|---|---|
| 3.1 | #3 | **One error model**: `AppError {code, status, safeMessage, retryable}`, one registry of codes to status and wording, one mapper; fold in the 6 other mappers; convert the 164 error classes and the 1,801 plain `throw new Error("...")` by family |
| 3.2 | #4 | **Response helpers by route class** (private data, public, download, redirect) that set cache and security headers once; replace 1,211 `Cache-Control` literals and 1,747 status literals |
| 3.3 | #2 | **Wrapper owns origin, actor, body and query**: one body reader (retire 5 variants); remove 215 handler-level origin checks and 846 handler-level actor lookups |
| 3.4 | #11 | **`limits.ts`**: rate limits, timeouts and retries by route class and client call type (65 + 116 + 124 literals) |
| 3.5 | #12 | **Session cookie helper**: `setSessionCookies / clearSessionCookies` for all 20 call sites |
| 3.6 | #17 | **Idempotency option** on the wrapper for non-repeatable writes |

## Phase 4: authorization and tenant rules (the biggest, most valuable block)

| # | Audit item | Task |
|---|---|---|
| 4.1 | #1 | **Policy registry**: each route declares a named capability plus a resource resolver; the registry maps capability to roles, scope and step-up; the role matrix is generated from it |
| 4.2 | #1 | Migrate route families in this order, each with the matrix diff empty: people and profiles, courses and assessments, placements (learner), placements (staff and recruiter), projects and mentors, academics, attendance, admin and super admin, internal, legacy aliases |
| 4.3 | #1 | Delete the 59 per-file `requireX` guard copies as their families migrate |
| 4.4 | #6 | `requireSameCollege(context, resource)` and `ownsResource(context, row)`; replace 226 inline comparisons |
| 4.5 | #8 | `requireCurrentVersion(row, expected)` with the standard conflict error (564 uses) |
| 4.6 | #14 | Last 8 server files onto `outboundFetch` |

## Phase 5: data, events, files, exports, jobs

| # | Audit item | Task |
|---|---|---|
| 5.1 | #5 | **`recordActivity(tx, event)`** and one status-transition writer; migrate the 215 inline inserts and 36 history inserts |
| 5.2 | #7 | **Repositories**: first the 52 routes that query the database directly, then the heaviest services; one lock-order convention and one unit-of-work wrapper |
| 5.3 | #16 | **File policy and download headers** as the only builders (62 MIME lists, 122 disposition headers) |
| 5.4 | #15 | **One export pipeline** (scope, columns, neutralisation, filename, audit, headers); retire the 10 `csvCell` copies |
| 5.5 | #18 | **Job registry** (name, schedule, secret, lease, tenant mode) for the 8 internal routes |
| 5.6 | #26 | **Notification service**: templates, recipients, outbox, opt-out; one path for email and SMS |
| 5.7 | #38 | **Settings service** for branding, domains and per-college settings |

## Phase 6: behaviour that must be identical everywhere

| # | Audit item | Task |
|---|---|---|
| 6.1 | #21 | **Shared validation primitives** (id, email, phone, page, limit, date, money); strict bodies; replace about 1,470 inline uuid checks |
| 6.2 | #22 | **One pagination contract**: parameter names, defaults and caps per list class, one DB helper, one UI control; retire 14 `PAGE_SIZE` copies |
| 6.3 | #23 | **Status registry** per domain feeding DB checks, TS types, labels and badge tones (1,627 comparisons, 319 check lists) |
| 6.4 | #24 | **Typed route registry** (`routes.college.projects(id)`) used by links, redirects, breadcrumbs and the role matrix (4,536 literals, 302 builders) |
| 6.5 | #25 | **Legacy table** (old path, new path, removal date) and one envelope adapter |
| 6.6 | #20 | **Locale, currency and phone module** driven by college settings |
| 6.7 | #28 | One date and money input and parser pair |

## Phase 7: UI and wording

| # | Audit item | Task |
|---|---|---|
| 7.1 | #29 | **Copy catalogue** by domain, error copy keyed by error code; migrate by page area, matching the exact-wording-parity rule |
| 7.2 | #30 | Design tokens and components: drive the UI-consistency ratchet down (604 `!important`, 309 bare links, 46 bare buttons, 135 raw inputs) |
| 7.3 | #31, #32, #33 | State components, form kit and table component read copy and pager from the new modules |
| 7.4 | housekeeping | **Repair the 7 quarantined UI-copy tests** against the current pages and delete the quarantine entries |

## Phase 8: tests, operations, close-out

| # | Task |
|---|---|
| 8.1 | #35 domain fixture builders (course, drive, learner, college) shared by tests |
| 8.2 | #37 environment matrix generated from the config module (documents what production must set) |
| 8.3 | Re-run the whole audit: new counts against the baseline; write the before and after table |
| 8.4 | Update `CORE-HARDENING-2026-11-13.md`, the planning docs and the memory notes |
| 8.5 | Final gate: LF-worktree unit suite, all database suites, CI green on the last commit |

## In parallel, not code (yours)

Independent security reviewer, Cloud SQL SSL, secret rotation, a security contact address, and the production environment settings
that Phase 1.1 will start checking.

## Dependency order in one line

`0 baseline` → `1 safety nets` → `2 config, roles, clock, utils` → `3 errors, responses, requests` → `4 authorization and tenant`
→ `5 data, events, files, exports, jobs` → `6 consistency` → `7 UI and copy` → `8 close-out`.

Why this order: tests and ratchets first so nothing breaks silently; config, roles and clock next because every later module reads
them; plumbing before authorization because it removes the most noise from route files; authorization before data because it needs
the matrix oracle; UI and copy last because they depend on the error and route registries.

## Honest scope for one night

Realistic tonight: Phases 0 and 1 complete, Phase 2 complete, Phase 3 modules built with the first batches migrated, Phase 4.1 built
with the first families migrated. The remaining phases get their central module and ratchet where time allows. Everything not
migrated tonight is frozen from growing by the ratchets and continues the next day in the same order.
