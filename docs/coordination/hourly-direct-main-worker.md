# LMS vNext continuation runbook — closure-first, single tracker

This is a **runbook**, not a second tracker or a promise of continuous/asynchronous execution. The six-chat system and all worker lanes are retired. Authority: [AGENTS.md](../../AGENTS.md), [closure-first delivery strategy](../planning/closure-first-delivery-strategy.md), [docs/tracker.json](../tracker.json).

For each actual user-triggered or scheduled run:

1. Fetch `42Students/lms-vnext@main`, read the one tracker and the current dependency, migration and test evidence.
2. Choose a **specific executable outcome** in DATABASE—prefer moving an original-core blocker into registered, PG-replayable, tested functionality. Prioritize upstream DB-004/005/007, then DB-008/012, then global DB-019/020; do not spawn another project plan or staging-only task.
3. Implement a cohesive code/DDL/consumer/test change. Check the real registered Drizzle journal and safely run targeted and cross-tenant negative tests on **disposable PostgreSQL only**; no production/shared writes. Don't hide a failing test.
4. Use one atomic optimistic-SHA direct-`main` commit where practicable; serialize shared journal/schema barrel/CI changes; verify remote HEAD and exact acceptance SHA. Avoid re-triggering serial Actions for every small file.
5. Change the sole tracker DONE Boolean **only** with full independently executed acceptance and any required product/privacy approval. Never unlock API/UI/RELEASE until the five global DATABASE gates pass.
6. Report: code change, SHA, genuinely executed test results, total DONE/NOT DONE, original-core DONE/NOT DONE, precise unresolved blocker and the next runnable integration. If no task closed, explicitly state zero closures.

A recurring scheduler only works when it actually runs. No promise of an hour of uninterrupted work, no invented later completion, no worker claims or secondary progress statuses.
