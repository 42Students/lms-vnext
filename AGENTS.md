# LMS vNext engineering rules

## Engineering DONE vs final RELEASE attestation — binding owner decision (2026-10-28)

**Do not repeatedly reopen completed tasks for deferred final sign-offs.** The
single tracker `docs/tracker.json` uses `done:true` for **executed/tested
engineering acceptance**. If only *independent* security/retention signatures,
final browser/CI release freeze or owner-managed provider smoke remains, record
`deferredRelease` against the task and retain PENDING status in its existing
original decision register. This is not a waiver or a security pass. Reject
deferring actual code defects, missing schema, known failing security tests or
tenant/privacy violations. Final RELEASE cannot be certified with unfinished
deferred checks. Move to next `done:false` engineering task; reopen done work
only for concrete regressions/dependencies or explicit owner instruction.

**DB-004 is ENGINEERING DONE; do not re-audit it. DB-005 is NEXT.** DB-004's
seven independent security signatures, 34 final retirement attestations,
browser/final-head CI and owner-managed Exotel/ZeptoMail live tests are deferred
until final release review. Consult the original DB-004 register only when the
owner initiates that release review, not for ordinary "continue" prompts.

## Locked execution order — owner directive (2026-10-28)

**Before any vNext work, read [the locked execution-order contract](docs/planning/locked-execution-order-2026-10-28.md).** Its sequence is DATABASE → API/user-job parity → page/surface Implementation Green → final Design Green → Release Green. UI/source discovery may run as read-only preparation during DATABASE, but no global phase skips, repeat whole-census audits or parallel status trackers. Explicit user approval is required to change the sequence; the binary `docs/tracker.json` remains the *sole* task/phase status authority.

## Generic continuation and page stop rule (2026-10-27)

When asked to **"continue LMS vNext works"**, use the current repository state rather than redoing prior chat research. Start with `docs/tracker.json` and the [cross-chat Green-and-Move protocol](docs/parity/README.md#green-and-move-stop-rule-binding-for-page-execution). The official phase/task progress is **only** `docs/tracker.json`; the parity page files are detailed acceptance evidence, not a competing tracker.

- Respect a named account or page scope, continue its first not-yet-implementation-green eligible family, and skip already accepted pages. Without an account scope, choose the earliest executable blocker in the current official phase; do not guess another chat's context.
- **Implementation Green** is the stop point for functional page work once the finite legacy surface/action/state contract, P0/P1 repairs, permission/data tests and focused post-change evidence pass. Record it and move to the next independent page. Design Green and Release Green are separate later gates. Never mark blocked required functionality green.
- After two focused repair rounds with an unresolved external or dependency blocker, preserve the exact failure and attempted evidence, leave the family not green and move to the next independent eligible unit. Do not repeat full audits of already-green families; revalidate only demonstrably impacted requirements after material changes.
- For simultaneous chats, constrain concurrent workers to disjoint account/page families and serialize edits to shared components, schema, migration and CI. Generic unscoped prompts are not a concurrency lock. Before changing code, check newest `main` and reconcile other chats' commits.

## Closure-first delivery: authoritative execution method (2026-10-13)

**Read [docs/planning/closure-first-delivery-strategy.md](docs/planning/closure-first-delivery-strategy.md) before beginning an engineering batch.** Optimize for an integrated, runnable, tested capability and a safely closable existing task—not additional source-only plans, parallel trackers, duplicate audits or CI jobs. This delivery method does **not** replace the binary tracker, waive task acceptance, or unlock DATABASE phase gates.

- Each batch declares a testable **before → after outcome**, targets the highest-value prerequisite for the original seven open core tasks, implements real migration/service integration, and produces a remote commit plus executed evidence. Report task counts even if unchanged; never count a green staged-only witness as registered migration completion.
- Prefer a **single coherent, optimistic-SHA direct-main commit** over repeated tiny pushes and serial GitHub Actions restarts. For shared Drizzle journal/snapshot/schema barrel/CI edits use one writer and fresh ancestry.
- Start with DB-004/005/007 parent integration, then DB-008/012 downstream, then DB-019/020 global certification (subject to verified dependencies); work on other tasks as required for safe closure, not task inflation.
- The read-only `npm run progress` command reports the **sole tracker** counts and remaining original core IDs. No secondary kanban/checklist statuses.

## Single tracker and direct-main engineering (2026-10-12 — current authority)

**User directive:** The six-chat system is retired. There are no Chat 1–6 assignments, claims, lane checkpoints, picked/in-progress/completed/blocked statuses, or chat-specific migration/CI ownership. **The sole live tracker is [docs/tracker.json](docs/tracker.json)**. All older files under docs/coordination/ (including work-queue.json, phase-state.json, lanes/ and six-chat-operating-system.md) are historical evidence, not instructions or a second progress tracker. Issues #21–#26 are historical journals.

- Every task has exactly one Boolean: done = true (**DONE**) or done = false (**NOT DONE**). There is no intermediate task status. An implementation can be committed and useful while the task is still NOT DONE.
- Only mark DONE when the full task's required behavior has independently executed, passing acceptance evidence at the specified source commit and any necessary product/privacy disposition is approved. Source-only scans, PRs, schema drafts, authored-but-unrun tests, and partial passing jobs do **not** qualify. Keep the acceptance evidence attached to that task in the same tracker.
- Read docs/tracker.json first. Validate with `node scripts/tracker.mjs --check`, report with `node scripts/tracker.mjs`, and maintain the 11 original core DATABASE task IDs as a fixed denominator. No more task inflation to game completion statistics.
- The current phase is **DATABASE**. API, UI and RELEASE cannot be declared ready until all database tasks, required real PostgreSQL tenant/FK/state/history/concurrency gates, field dispositions, and independent phase certification are satisfied. The tracker validator is only structural; it NEVER certifies a phase.
- Work directly on fresh `main` in substantial safe batches. Fetch latest Git file blob SHA before each write; reject/reconcile conflicts and verify resulting commits. Never force-push or silently clobber concurrent changes; no new PRs/branches for the ordinary worker.
- There is no chat-specific file ownership. Changes to numbered migrations, Drizzle journal, schema barrel, CI and root infrastructure still require **single-writer serialization for each change**, explicit dependency review, migration replay and tests; no two simultaneous authors should modify those shared files.
- Use only disposable/test PostgreSQL; never operate on production/shared databases. GitHub Actions now allocates public-repository runners in practice, although multiple jobs still fail; use available execution paths and report executed/passed/failed/skipped steps truthfully. Missing CI provider is not a reason to fake runtime evidence.

## Non-negotiable architecture rules

- Keep one repository and one deployable application.
- Keep the system a modular monolith.
- TypeScript is the application language.
- PostgreSQL is the system of record.
- Do not add microservices, Redis, Pub/Sub, Kafka, GKE, GraphQL, or a second database without a demonstrated production requirement.
- Do not split frontend and backend into separate repositories.
- Do not port legacy Java classes file-for-file.
- Preserve business behavior, not legacy implementation structure.

## Module rules

- Core business logic belongs in `src/modules/*`.
- React components should orchestrate UI, not encode domain invariants.
- Validate untrusted inputs with Zod at boundaries.
- Authorization must be explicit and centralized; avoid scattered role string checks.
- Tenant-owned data must be scoped by college/tenant context.
- Database access must use shared pooled Drizzle/Postgres infrastructure.
- New abstractions require a concrete use case.

## Quality gates — targeted during implementation, full at acceptance

- **Inside a cohesive batch:** run the relevant focused lint/typecheck/unit or SQL/database tests that can detect the touched regression quickly. Keep the known full-suite failures visible; do not add skip flags to hide them.
- **Before declaring a database migration or a task DONE:** independently execute the required **registered-journal replay, drift check, tenant/FK/history/state/concurrency and affected service tests on disposable PostgreSQL**, plus all other task-specific acceptance and approvals. A staged-only test is not promotion proof.
- **Before phase or release sign-off:** execute and pass the complete applicable lint, typecheck, unit, build and relevant browser/Playwright matrix on an identified revision. Unrelated red CI jobs remain blockers to global acceptance, even if the focused batch succeeds.
- Commit and test **one coherent batch**, rather than causing a full serial GitHub Actions run on every small document/test adjustment.

Every migrated legacy rule should gain a meaningful regression test where practical.

## Migration principle

For each legacy feature:

1. understand current behavior
2. classify it as business rule, intentional legacy behavior, or bug
3. design the vNext domain model
4. implement cleanly
5. verify against the legacy system
6. migrate data separately
7. cut over only after reconciliation

During clone parity, never silently change user-visible legacy behavior merely because it appears buggy. Record the behavior first. Security, privacy or data-corruption defects may be corrected immediately, but the deviation must be documented as a parity exception. Non-critical product quirks should be preserved until parity is proven or the user explicitly approves a redesign.

## UI visual identity rules

- The existing LMS production palette is the vNext color source of truth.
- Canonical mapping lives in `docs/design-system/lms-color-parity.md` and `src/app/globals.css`.
- Use semantic LMS tokens instead of raw Tailwind zinc/slate/blue palettes for product UI.
- Never accept shadcn default colors as a substitute for the LMS brand palette.
- Do not introduce a new raw UI color without a concrete semantic need and a documented parity decision.
- Treat palette mismatch as an implementation defect in the same batch, not later polish.


## Greenfield data rule

- LMS vNext is a fresh system. No production/legacy LMS data needs to be migrated.
- Do not build legacy DB connections, extractors, reconciliation tooling, migration runners, or data backfills unless the user explicitly changes this decision later.
- The legacy `lms` / `lms2-fe` repositories remain behavior, UX and regression references only.
- New vNext data should be created through vNext application flows, seeds, fixtures, or test factories.
- The existing `legacy_id_map` schema artifact is not an active product dependency and must not be used as justification to restart migration work.


## Legacy account-surface parity — release gate

Until account parity is closed, `42Students/lms2-fe@prod-2026` is the user-facing product oracle for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and HR/Recruiter.

For every legacy page, tab, section, card, modal, action and meaningful workflow:
1. classify the route in `docs/planning/legacy-ui-route-manifest.md` and inventory the user job in `docs/planning/account-surface-parity.md`;
2. open the matching account spec under `docs/parity/` and account for the page's sections, tabs, actions, forms, filters, modals, drawers, states, permissions, responsive behavior and regression coverage;
3. recreate the user-visible capability in vNext before redesigning it away;
4. implement it with the vNext architecture — do not paste legacy Pages Router, Redux, Ant Design or service-layer code;
5. update the master matrix and the detailed page checklist in the same implementation commit;
6. preserve tenant/role safety and add regression coverage where practical;
7. classify intentional deviations explicitly as REDESIGNED or RETIRED with a reason.

No legacy surface may disappear silently. A consolidated vNext workspace does not automatically count as page parity when the legacy product had a distinct daily-use surface. First reach parity; then consolidate/redesign as a separate pass.

Do not call LMS vNext feature-complete while `npm run parity:status` reports PARTIAL, MISSING, VERIFY or BLOCKED rows, while `npm run parity:pages` reports any open detailed checks, or while any account parity checkbox remains open. A master-matrix DONE row is not deeply closed if its corresponding `docs/parity/*.md` contract still has unresolved required behavior. Refresh the frozen legacy route manifest and affected page specs when `lms2-fe/prod-2026` materially moves.




## No-surprise clone protocol — highest parity authority

Read `docs/planning/clone-parity-protocol.md` before account parity work. It is the release gate above the route manifest, master matrix, detailed page specs and account ledgers.

Key rules:
- exact legacy FE/BE SHAs are evidence, not branch names;
- a family-level verification record is required in addition to surface checkboxes;
- when legacy `prod-2026` materially moves, affected family evidence becomes STALE even if individual rows remain historically CLOSED;
- source comparison alone cannot close browser-sensitive UI;
- consumer UI cannot be final-verified if the upstream producer workflow is missing;
- REDESIGNED/RETIRED cannot hide a daily-use feature;
- final cutover freezes exact legacy oracle SHAs and re-diffs every earlier family against that frozen oracle;
- `npm run parity:clone-gate` must report READY: YES before vNext may be called an as-is replacement.

## Learner parity execution ledger — mandatory workflow

For Learner work, `docs/planning/learner-ui-surface-ledger.md` is the operational queue and `docs/planning/learner-family-verification.md` is the freshness/evidence gate above it. It is intentionally more granular than the route manifest or the prose parity spec.

Every coding chat working on Learner parity must:
1. read the ledger before editing;
2. refresh `lms2-fe/prod-2026`, `lms/prod-2026`, and `lms-vnext/main` heads;
3. continue from the first unresolved ledger row unless the user explicitly selects another row/family;
4. compare the exact legacy page/component behavior before coding;
5. add newly discovered UI surfaces to the ledger before implementing them;
6. move a row through `UNCHECKED → AUDITING → GAP → FIXED → CLOSED` as appropriate;
7. mark `CLOSED` only after a second legacy-vNext comparison and required regression/browser verification;
8. update the ledger and affected parity docs in the same commit as the implementation;
9. update the matching family verification row with exact legacy FE/BE SHA, vNext SHA, source/test/browser/cross-role evidence before marking a family VERIFIED;
10. if legacy moved since that family was verified, mark the family STALE and diff old verified SHA → current SHA;
11. hand off the current row ID + next unresolved row when chat context is ending.

Run `npm run parity:learner` for the machine-counted Learner ledger + family-evidence status. `FIXED` is not closed; `BLOCKED` and `STALE` are not release-ready.

## Authentication rule

- Sign-in is **first-party phone/email one-time codes**, as in the legacy LMS: Exotel SMS and ZeptoMail email, opaque per-device sessions. See `docs/architecture/first-party-login.md`.
- Do **not** reintroduce Firebase / Google Identity Platform for sign-in, session cookies or user creation. Older handoff and checklist text that mentions Identity Platform is superseded by this rule.
- A college host serves only that college, enforced at login and on every authenticated request (`src/modules/auth/tenant-access.ts`). Do not bypass it.
- Test one-time codes exist only when `APP_ENV=development` and are never accepted in production. Never send a real SMS or email from tests; use the fakes.
- Production SUPER_ADMIN access needs a second factor before launch (`docs/architecture/privileged-authentication.md`).
