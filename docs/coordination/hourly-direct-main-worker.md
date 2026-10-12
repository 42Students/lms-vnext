# LMS vNext main engineering continuation (single tracker)

**Current direction (2026-10-12):** This scheduled workflow works from **one** tracker: [docs/tracker.json](../../docs/tracker.json). The earlier six-chat model, six task claims, lane checkpoint files, per-worker issue updates and Chat-1-only ownership are retired. This file is a continuation runbook, not a separate progress tracker.

When invoked:

1. Fetch latest `main`, read `AGENTS.md`, `docs/tracker.json`, and current domain contracts/test evidence. Run `node scripts/tracker.mjs --check` where available.
2. Select a substantive, relevant `done:false` task in the current shared phase (DATABASE first). The original eleven closure tasks take priority. Do not create cosmetic new queue entries to increase the denominator.
3. Implement and test safely against disposable data. Shared numbered migrations/CI/root changes require serialized review; do not overwrite parallel edits.
4. Commit directly to fresh `main` with optimistic GitHub blob SHAs; verify commit ancestry. No force-push, no ordinary PR/branch churn.
5. Set `done:true` **only** when all task acceptance evidence is actually executed and passed on an identified SHA, and required policy approval exists. Otherwise it remains `done:false`, regardless of how much code has been written.
6. Report DONE / NOT DONE totals, original eleven progress, exact commits, executed versus skipped tests and concrete remaining verification requirements.
7. Keep currentPhase DATABASE until all database prerequisites and independent phase gates pass. The one tracker replaces phase-state.json and work-queue.json as operating authority.

A recurring scheduler runs only when triggered. Do not promise continuous hour-long execution or infer that a future task ran. GitHub Actions may be used as an available test runner, but CI failures and missing PostgreSQL proof must be reported honestly, not ignored.

Historical evidence and old per-worker documents remain readable through Git history. This runbook supersedes their execution policy.
