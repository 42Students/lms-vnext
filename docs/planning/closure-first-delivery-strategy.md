# LMS vNext — closure-first delivery strategy

## Binding priority order (2026-10-28)

Follow [the owner-locked execution order](locked-execution-order-2026-10-28.md) for the exclusive cross-chat phase/priority sequence: DATABASE → API/user jobs → per-family UI Implementation Green → final Design Green → Release Green. This strategy continues to define **how** each safe batch is delivered, while `docs/tracker.json` alone defines **what is accepted**. Do not mistake source-census or historic parity counts for closure, and do not create another tracker.

**Effective:** 2026-10-13. **Repository:** `42Students/lms-vnext`, direct to `main`.
**Operational status:** `docs/tracker.json` is the **only** live task/phase tracker. This file is the execution method, not another queue or source of completion claims.
**Supersedes** retired six-chat plans and historical checklists for *how to work*. It does **not** waive existing database acceptance, privacy, tenant-security or release gates.

## North star: observable product progress, not activity

The goal is an actually usable, legacy-complete LMS with the same daily jobs for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and HR—not the maximum number of draft migrations, tests, documents or CI jobs.

A productive batch leaves at least **one concrete observable result**:
1. An existing draft is integrated into **registered** schema/migration/code, replays from empty disposable PostgreSQL, and passes the relevant negative/functional tests.
2. A previously blocked end-to-end user job or database-backed workflow now **executes** correctly, with its tested commands and immutable commit SHA.
3. A complete existing tracker task changes from NOT DONE to DONE based on **all** acceptance evidence and required approval, without relaxing its criteria.
4. An actual blocker preventing 1–3 is fixed and the exact failing test goes from red to green. Name the still-open acceptance gate.

New source-only prose, another audit pass, test count inflation, extra tasks, a staged SQL file, or just another green isolated test **do not by themselves count as a closure**. If no blocker has moved, report **zero closures**.

## Starting reality and priorities

At strategy adoption the strict tracker was **6/81 DATABASE DONE**; original core **4/11 DONE**. These counts measure completed acceptance, not percentage of code authored. Do not backfill historical `COMPLETED` states as proof.

**Priority order, revised for dependency and maximum closure return:**

- **Wave A — Promote upstream parent schemas:** DB-004 tenant/identity, DB-005 academics and DB-007 profiles/privacy. Use existing source drafts and PostgreSQL evidence; reconcile their dependencies and semantic/product decisions. Promote in the smallest **cohesive dependency-safe** registered Drizzle batch, not isolated schema patches.
- **Wave B — Activate downstream persisted contracts:** DB-008 courses/content and DB-012 placements/TPO; reconcile the already-authored DB05/DB08/DB09 work into the current canonical schema. Do not merge incompatible alternatives. Prove parent ownership, learner visibility, state transitions and cross-tenant negative paths.
- **Wave C — Global acceptance and certification:** DB-019 active-field disposition and DB-020 clean schema drift, migration replay and phase-gate review, plus every remaining required DATABASE task. The original seven are the **first** closure focus, not the only tasks needed for global phase exit.

The real next implementation batch should begin with **DB-005 academic staged-to-registered reconciliation** after checking DB-004 parent dependencies. The desired output is **registered, replayable, tested behavior**. If an exact missing approval or incompatible DDL blocks promotion, fix the dependency or record that precise blocker and move to the next safe eligible integration—not another generic research sweep.

## One-batch delivery loop (mandatory)

1. **Pick an outcome, not a document:** On fresh `main`, read `AGENTS.md`, `docs/tracker.json`, the exact domain contract, registered journal/schema and latest executed CI evidence. Identify the task ID(s) and **one demo/testable before→after outcome**. Check dependency ordering and existing branches/drafts only where relevant.
2. **Implement through the real path:** Favor adapting an existing stage into the canonical schema, data constraints and callers. Complete related changes together: Drizzle tables, migration SQL/journal/snapshot, services where required, and acceptance tests. No source-only duplicate schema, new queue or speculative architecture.
3. **Run proportionate evidence:** Test affected code locally or in approved isolated PostgreSQL. For migration work: replay the **whole registered chain** from zero, catalog/drift checks, tenant/FK/delete/state/concurrency negatives and affected service integration. Independently scoped staged tests are useful but **not migration-registration proof**. Never run destructive steps against production/shared databases.
4. **Push once per cohesive batch:** On fresh `main`, use one atomic commit when practicable, with optimistic commit/blob-SHA checks, no force-push or PR detour. Serialize edits to journal/snapshot/schema barrel/CI; verify remote HEAD. Avoid multiple tiny pushes just to provoke another full serial CI run.
5. **Certify truth:** Inspect the run at the **exact SHA**. Set `done:true` in the sole tracker **only** after every acceptance and required owner/product/privacy approval passes. Never hide failed/skipped tests or mark a whole original-core task DONE from a partial witness. If still false, do **not** invent an intermediate task status.
6. **Show the outcome immediately:** Report what was actually integrated/changed, exact commit, *executed* test result, the tracker count before→after, the remaining specific blocker, and the next highest-value executable step. A batch with zero task closures must still state whether a real runnable blocker was removed.

**Stop the paperwork loop:** Avoid another integration manifesto, gap ledger, speculative migration proposal, coordinator, or custom CI lane if existing evidence already names the required code. Write or revise other docs only when a domain decision, migration contract, privacy requirement or legacy parity exception demands it.

## Visible progress scorecard — derived, never a second tracker

Use `npm run progress` (an alias of `node scripts/tracker.mjs`). It reports DATABASE DONE/NOT DONE, the **original core eleven** and the exact core IDs remaining. `npm run progress -- --check` checks tracker structure, **not** runtime acceptance or gate sign-off.

Each user-facing batch report includes these **separate** measurements:

| Measure | Evidence | What it does / does not mean |
|---|---|---|
| Tracker tasks DONE / total, original core DONE / 11 | `docs/tracker.json` | **Only official progress counts**; full acceptance required |
| Registered schema change | Commit diff, Drizzle journal and clean PG replay | Integrated database work; not automatically a DONE task |
| Executed workflow or negative test | Exact SHA, command and job/log with pass/fail | Visible functional proof; staged-only must say **staged** |
| Top 1–3 remaining blockers | Named failing gate, owner/decision and next code fix | No vague “almost done” estimates |
| Working application demonstration (when safe/eligible) | Existing app's actual navigation/workflow, no mock result | Product visibility; preview ≠ verified parity or launch |

**Reporting template:** `Commit: <sha> | Changed: <concrete working path> | Verified: <executed pass/fail/not run> | DB: <before>→<after>/81 | Core: <before>→<after>/11 | Blocking: <exact condition> | Next: <specific integration>`.

Do **not** add milestone checkmarks, progress percentages or per-chat task statuses in another document. The historical plan/checklist and old work queues are reference material only.

## Test effort without lowering the bar

- **During implementation:** fast affected test(s), SQL preflight and smoke; run once after the *cohesive* commit. Do not rerun the entire workflow after every doc/test tweak.
- **Before accepting a database integration:** fresh disposable PostgreSQL **registered** migration replay + relevant integration/negative tests, journal and schema drift. Verify no staged suite was silently excluded; independent tests must still run and their status must be reported.
- **Before phase certification or release:** all required lint/typecheck/build/unit/integration/browser/security gates executed and passing on the accepted revision or explicitly approved equivalent test environment. Baseline red jobs remain real blockers; distinguish unrelated red checks from successful touched-domain acceptance.
- A fast targeted run is never a reason to waive an applicable final gate. Fix root causes rather than multiplying skip flags, suppressing errors or calling draft SQL “promoted.”

## Phase boundaries and product visibility

**Current global phase stays DATABASE.** API/UI/RELEASE are **not unlocked** by this strategy or by the original eleven alone. The five database gates in `docs/tracker.json` remain mandatory. Existing implemented UI can be **demonstrated for visibility** in a disposable sandbox when safe, but neither preview nor source parity counts as approved API/UI phase completion. Do not start new API/UI parity execution until phase sign-off.

After independent DATABASE sign-off, prioritize **complete user jobs**, not file type: API/service parity for a coherent learner/course/admin/TPO journey, then the corresponding UI journey with saved state, real data, permissions, error cases and browser proof. Work role by role without removing legacy pages silently. Every demonstrated user job must be backed by actual persisted data and correct authorization.

**Never** enable real outbound sending, production credentials, destructive operations or customer access solely to generate a demo.

## Anti-stall rules

- After **two consecutive batches with no accepted task closure**, do a narrow root-cause review of the *specific* blocker and stop creating new staging docs/tests until a real integration or approval moves.
- If an indispensable approval is missing, name its exact decision and continue a different independent ready integration; do not declare the phase complete.
- Do not start new tasks to make the numerator look better, and do not expand the 81-task denominator without a genuinely missing legacy requirement and explicit user decision.
- No work is silently deferred, claimed as asynchronous or reported from a different commit.
