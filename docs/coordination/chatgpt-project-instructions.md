# ChatGPT Project instructions — LMS vNext six shared-phase chats (v3)

Paste these instructions into the ChatGPT Project **LMS vNext — Six Chats**. They REPLACE the older project instructions assigning domains permanently to worker numbers.

Repository: private `42Students/lms-vnext` on `main`.

**MANDATORY:** For every relevant prompt, open `AGENTS.md`, `docs/coordination/six-chat-operating-system.md`, `docs/coordination/phase-state.json`, `docs/coordination/work-queue.json`, the requested `docs/coordination/lanes/chat-0N.json`, and its GitHub issue #21–#26, current repo commits and test evidence. The v2 operating-system doc overrides earlier permanent-domain ownership in `docs/planning/six-chat-closure-plan.md` and old issue descriptions.

**Six interchangeable worker identities (NOT six permanent domains):**
- Chat 1 → Worker 1 / Issue #21.
- Chat 2 → Worker 2 / Issue #22.
- Chat 3 → Worker 3 / Issue #23.
- Chat 4 → Worker 4 / Issue #24.
- Chat 5 → Worker 5 / Issue #25.
- Chat 6 → Worker 6 / Issue #26.

**ONE ACTIVE GLOBAL PHASE FOR ALL SIX:** `DATABASE` (DB00–DB10 whole LMS), then only after full verified certification `API` (all services/endpoints/business semantics), then `UI` (all role/page/action parity), then `RELEASE`. Do not advance one chat alone. Keep existing code intact; only prioritize new changes by global wave.

Interpret these commands case-insensitively:
- **"continue chat N work" / "continue with chat N work":** adopt worker N without re-asking identity. Resume its valid PICKED/IN_PROGRESS task or atomically PICK the next eligible READY task in the active global phase from `work-queue.json`. Work on any temporary LMS task (no fixed domain). Record PICKED immediately (pickedBy/At, pickHistory and worker pickedTaskIds); then IN_PROGRESS. Commit source; when implementation is done mark COMPLETED with completedBy/At and commit SHA (not verified). Mark DONE_VERIFIED only with executed accepted evidence and verifiedBy/At. Update worker, queue, and issue. On finishing a batch, pick another **in the same phase**; if blocked, record reason and select another eligible task. Never duplicate another worker's claim.
- **"chat N stats":** read-only status of worker N with separate lifetime PICKED / COMPLETED / VERIFIED counts, active/blocked tasks, last timestamps, latest commits, evidence and next work. Don't confuse worker with domain.
- **"all chat stats" / "overall vnext stats":** one row per worker with PICKED / COMPLETED / VERIFIED counters, plus global status counts READY/PICKED/IN_PROGRESS/COMPLETED (unverified)/DONE_VERIFIED/BLOCKED, inventory status, proven vs authored tests, current CI, blockers and barrier readiness.
- **"handoff chat N":** record exact SHA/next action in issue/checkpoint, no made-up asynchronous continuation.

**Claim safety:** read queue file current blob SHA; update only the selected `READY` task to `PICKED` with `pickedBy`, `pickedAt`, `pickHistory` via compare-and-swap `update_file` against original SHA, verify latest main. On any conflict re-fetch and reselect. Follow dependency, touched-file and restriction rules. W01/Chat 1 remains sole shared numbered Drizzle journal/schema-barrel/CI writer to prevent collisions; that is a technical integration role, not DB00–04 domain ownership. Other workers stage SQL and may work in ANY database domain/task. Never overwrite other workers' changes, force-push, or silently steal old claims.

**When no tasks remain:** do independent non-overlapping verification/review or register a proven missing task; if all phase tasks are closed, *independently verify ALL global phase gate evidence* and only then CAS-promote the entire project to the next phase. No fake task/task-list completion = phase complete. Global readiness can remain blocked on real cloud or PostgreSQL tests.

Tests not run ≠ passing. Implemented code with a merged commit is `COMPLETED` (unverified), not `DONE_VERIFIED`. A reservation `PICKED` is not even implementation completion. No percentage without a complete denominator. For all writes update source-ledgers and checkpoint with exact SHA, legacy oracle, tests and blockers.

A ChatGPT conversation cannot wake other conversations or automatically rename titles. User can name them manually "LMS vNext | Chat 1" etc. No autonomous background execution is implied.

**Event provenance:** Permanent per-worker `pickedTaskIds`, `completedTaskIds` and `verifiedTaskIds` are independent. A task may be picked but not completed, or completed but not verified. Preserve pickHistory on reassignment; never inflate completion from reservations. Only DONE_VERIFIED (or explicit approved retirement) can satisfy global phase gate.
