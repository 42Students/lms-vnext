# ChatGPT Project instructions — LMS vNext (closure-first)

> **Updated 2026-10-29:** For DB scheduling and default continuation use [the Database Domain Closure Protocol](../planning/database-domain-closure-protocol-2026-10-29.md) first. This supersedes the earlier item-by-item DB queue and the prohibition on domain-local API/UI consumer proof while DATABASE remains the active global phase. Do not change the sole tracker or weaken global phase gates.

**Current direction (2026-10-13):** Implement visible, runnable closure—not repeated planning and source-only tests. Read [closure-first delivery strategy](../planning/closure-first-delivery-strategy.md) and [AGENTS.md](../../AGENTS.md) first. Six-chat assignments, lane checkpoints and worker queues are **retired**.

**Repo:** `42Students/lms-vnext` on fresh `main`.
**Only live progress authority:** [docs/tracker.json](../tracker.json). Every task is exactly `done:true` or `done:false`; never create extra trackers or statuses.
**Current phase:** DATABASE. API/UI/RELEASE cannot unlock before independent global database gates.

### Every "continue" instruction means execute a batch

1. Read fresh `main`, tracker, relevant service/Drizzle/journal, current failures and existing staged evidence. **Pick one runnable before→after outcome** from the highest-impact original-core dependency; don't spend the batch writing a plan.
2. Prefer integrating approved drafts into **registered schema and real consumers**; repair actual PostgreSQL failures rather than adding another test-only CI lane. Sequence DB-004/005/007 parents → DB-008/012 domains → DB-019/020 gates, adapting to genuine dependencies.
3. Run focused tests during implementation and **actual clean registered migration replay, cross-tenant/state/race negatives** for affected DB integration on disposable PostgreSQL. A staged-only passing suite is supporting evidence, not migration acceptance. Never connect destructively to shared or production databases.
4. Commit **once per cohesive safe batch** directly to fresh `main` with optimistic SHA conflict checks. Serialize Drizzle journal/schema barrel and CI edits. Verify the resulting remote commit and tested SHA. Don't create branches, PRs, duplicate queue tasks or a new workflow to manufacture apparent activity.
5. Update `docs/tracker.json` only when **every** acceptance gate for a task is actually met and needed product/privacy approvals exist. Don't lower acceptance standards or infer sign-off from counts.
6. **Show evidence immediately:** integrated feature or concrete blocker removed, SHA, executed/passed/failed tests, DONE/NOT DONE before→after, original-core before→after and exact remaining blocker. Never present source-only work as complete.

Use `npm run progress` for live checkout counts; `node scripts/tracker.mjs --check` checks only tracker structure. Full lint/typecheck/build/browser/security gates remain required for the relevant phase certification, even when a targeted batch is green.

The historical `docs/planning/vnext-master-plan.md`, old checklist, issues #21–#26, old phase-state/work-queue and six-chat plans are references **only**. If a dependency or approval blocks the selected batch, move to the next independently safe integration and name the blocker; do not stop with generic process notes.
