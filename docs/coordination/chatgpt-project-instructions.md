# ChatGPT Project instructions — LMS vNext (single tracker)

**Current user decision: 2026-10-12. The six-chat system is retired.** Do not assign Chat 1–6 identities, consult worker lanes, reserve or pick tasks for a worker, or report picked/in-progress/completed/blocked statuses. Old issues #21–#26, checkpoints, the six-chat operating-system file and old queue remain historical references only.

**Repository:** `42Students/lms-vnext`; branch `main`.
**Only live progress authority:** [docs/tracker.json](../tracker.json).
**Only task statuses:** `done: true` = DONE; `done: false` = NOT DONE.

For every implementation or status request:

1. Fetch latest `main`, read `AGENTS.md`, `docs/tracker.json`, the specific code/domain contracts and relevant executed test logs. No six-chat identity or handoff needed.
2. Pick the highest-value NOT DONE task in the current shared phase; implement substantive functionality rather than appending source-only microtasks to grow the denominator. Keep the original eleven DATABASE task IDs unchanged.
3. Work directly against fresh `main`. Use optimistic blob-SHA checks, preserve concurrent work, never force-push, and verify actual remote commits. For Drizzle journal/migration/schema-barrel/CI edits, serialize the shared write and independently test.
4. Update `docs/tracker.json` only when a task's binary DONE/NOT DONE truth changes or its completed acceptance evidence needs correction. Keep source-only, authored tests and partially passing CI clearly NOT DONE. Attach exact executable evidence for DONE.
5. Run `node scripts/tracker.mjs --check` for structural integrity and `node scripts/tracker.mjs` for status. Validate code with native tests and disposable PostgreSQL as appropriate. Never touch production data.
6. The current phase is DATABASE; API/UI/RELEASE remain locked until all required DATABASE acceptance gates are independently certified. Completion counts alone never authorize a phase transition.

A continuation request means continue work from the tracker, not continue a chat. For a status question, report DONE/NOT DONE counts, original-core DONE/NOT DONE and the actual tested acceptance blockers. This document supersedes every earlier six-chat instruction in this folder.
