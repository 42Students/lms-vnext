# Hourly LMS vNext worker — direct-to-main execution contract

**User directive:** 2026-10-11 (Asia/Kolkata)  
**Scope:** This recurring ChatGPT engineering worker. Other parallel worker journals, claims and Chat 1's migration integration authority remain in effect.  
**Repository:** `42Students/lms-vnext`, target `main`.

## North star

Use every scheduled invocation for the **largest safe, substantive engineering batch available**. When one task, GitHub Actions, provider or write attempt is blocked, move to non-overlapping active-phase database engineering instead of repeatedly diagnosing the same blocker.

The user requested an hourly continuation as a safety net. A scheduled invocation **does not guarantee a full one-hour execution window or continuous execution between invocations**. It resumes only when the scheduler actually starts it; never claim unattended time or progress that did not occur.

## No new branches or PRs for this worker

Two preexisting review PRs were consolidated **once**: [#79](https://github.com/42Students/lms-vnext/pull/79) (DB23 log-alert parser) and [#80](https://github.com/42Students/lms-vnext/pull/80) (DB22 usage-key semantics). All corresponding five file blobs are present on `main`. For subsequent work by this worker:

1. Read fresh `main` SHA, `AGENTS.md`, `docs/coordination/six-chat-operating-system.md`, `phase-state.json`, `work-queue.json`, all worker checkpoints and relevant issues.
2. Follow current globally **ACTIVE** phase only: DATABASE → API → UI → RELEASE. No advancement without all global gates.
3. Select only unclaimed / authorized non-overlapping work. If no eligible task exists, independently verify a COMPLETED task or strengthen a missing source-backed contract without stealing completion credit or editing an active owner's paths.
4. Fetch the **latest file blob SHA immediately before every GitHub contents API write**, update directly on `main` against that SHA, then verify the committed content. A write conflict means refresh/reconcile, **never force push or overwrite**.
5. Do **not** create a branch, PR or merge. In case a change cannot safely be committed to `main`, stage a clearly labeled local patch/findings and try another independent task instead.
6. Respect Chat 1's exclusive `drizzle/**`, schema barrel, shared CI/root package and global infrastructure writer role. No risky writes to production databases, no legacy user data migration, no deletion or irreversible schema change without evidence.
7. Treat GitHub Actions billing as deliberately unavailable, **not** as a blocker. Execute independently available Node/source checks and, when actually accessible, a disposable PostgreSQL test. Mark tests **authored**, **executed**, and **passing** separately; never infer runtime correctness from a SQL comment, diff or regex.
8. Keep task statuses distinct: PICKED / IN_PROGRESS / COMPLETED (code committed) / DONE_VERIFIED (acceptance actually passed). Do not mark a global phase certified without PostgreSQL and other required proof.
9. Finish each invocation with precise `main` commit URLs, executed command/output, open blockers and the next current-phase target. Commit substantial coherent batches, not cosmetic status churn.

## Direct-main consolidation evidence (2026-10-11)

- DB23 PR #79 → `main` [ed145273](https://github.com/42Students/lms-vnext/commit/ed145273837ce790664cbf2a7396701336cc9869)
- DB22 PR #80 → `main` [6672c7a1](https://github.com/42Students/lms-vnext/commit/6672c7a11daa88b40af1d3edbf44bd5286e4a4d7)
- DB24 role-aware general-notification uniqueness, scoped role-row locking, source regression guards and DB24-13/14 unexecuted acceptance witnesses were subsequently committed directly to `main`.
- A new `tests/db10-draft-schema-parser.test.mjs` guard inventories and parses all staged DB10 Drizzle files without registering migrations.

**Verification caution:** The above source and authored guard changes do not claim a fresh migration replay, PostgreSQL negative tests, production sender, or global phase completion.
