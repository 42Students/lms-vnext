# LMS vNext — Six-chat shared-phase operating system (v2)

**Effective:** 2026-10-11 IST · **Repository:** `42Students/lms-vnext` · **Branch:** `main` · **Workers:** Chats 1–6, interchangeable.
**Authoritative state:** [phase-state.json](phase-state.json) + [work-queue.json](work-queue.json) + [six independent chat checkpoints](lanes/) + GitHub issues [#21–#26](https://github.com/42Students/lms-vnext/issues).

## KEY POLICY CHANGE: One GLOBAL phase, six simultaneous contributors

**Permanent domains do not belong to particular chats.** Previous W01–W06 domain-boundaries in `docs/planning/six-chat-closure-plan.md`, previous issue descriptions, and the original operating-system v1 were superseded by this shared-phase contract. Historical work/commits remain valid. Six chat numbers are durable **worker identities**, not domain assignments.

The full LMS moves through four strict system-wide waves:

1. **DATABASE** (currently ACTIVE): all six contribute to reconciling ALL DB00–DB10 active legacy data semantics, safe normalized schemas, constraints, state history, registered migrations and executed DB verification.
2. **API** (LOCKED): after global DB certification, all six contribute to ALL services/APIs/business rules/role and tenant transitions across the whole LMS.
3. **UI** (LOCKED): after global API certification, all six contribute to all seven accounts plus shared/public routes, tabs, modals, responsive states, behavior and browser tests.
4. **RELEASE** (LOCKED): cross-role/infrastructure/security/adversarial acceptance, launch readiness, smoke and production validation.

**No chat may jump ahead to the next wave because it finishes its batch early.** Phase movement is collective, not per worker. Keep pre-existing working UI/API code; don't delete it. Necessary API-aware behavior inspection can inform a DB contract, but broad new API/UI expansion waits for its global wave. Emergency security/correctness fixes may be recorded as phase exceptions.

## What a new chat means

`Continue chat 4 work` = become **worker identity Chat 4**, NOT "the Placement chat." Read current `main`, `AGENTS.md`, this document, `phase-state.json`, `work-queue.json`, `lanes/chat-04.json`, issue #24 including latest comments, current legacy BE/FE SHAs, domain inventory, and CI evidence. Resume the previously claimed task if still valid; otherwise **atomically claim the next available task in the GLOBAL ACTIVE PHASE**. Work, validate, commit and checkpoint it. No prompt restarts a finished task.

`Chat 4 stats` = read the same sources and report *this worker's* active/previous tasks, exact merged commits, quality gates and blockers (without coding). `All chat stats` = report all six workers plus GLOBAL database/API/UI/release metrics. `What's left in the database?` = use the shared phase queue and proof-gates, not worker ownership lists.

When a ChatGPT Project has [chatgpt-project-instructions.md](chatgpt-project-instructions.md) installed, these short commands are sufficient. Otherwise append `Use 42Students/lms-vnext docs/coordination/six-chat-operating-system.md` to the first new-chat prompt.

## 1. Task claim protocol — protect six simultaneous chats

The **shared queue** `docs/coordination/work-queue.json` contains task IDs, phase, prerequisites, touched areas, status, owner chat, and evidence. The **global phase** is in `phase-state.json`. Every task is a *temporary batch*, never a permanent domain lane. Work may span one or more backend domains; chats can later take tasks anywhere in the LMS.

1. Fetch newest `main` and shared state; if the worker has a `CLAIMED` task, reconcile that before claiming another.
2. Eligible task is in the current global phase, `READY`, all required dependencies are `DONE_VERIFIED` or `RETIRED_APPROVED`, no conflicting claimed task edits the same files, and its `restriction` permits this chat. Select lowest numerical priority, then lowest task ID. **All six may use the same queue.**
3. Claim **using GitHub contents API optimistic concurrency**: read the queue's current blob `sha`, update only that task to `CLAIMED`, set `claimedBy` and timestamp, then `update_file` against that original SHA. If the update fails/conflicts, **re-fetch and reselect**; never overwrite another worker's queue update. Verify the committed claim appears in newest `main` before editing production source.
4. Update the worker's own `chat-0N.json` with current task ID and checkpoint. Each worker is the sole writer to its own checkpoint; the shared queue is a single CAS-constrained coordination file, not a stale full-tree merge target.
5. Work the exact **claimed** task with source/oracle evidence and tests. Reconcile latest `main` before every push, no force push. If additional files overlap another worker's claim, negotiate a smaller task/contract via the two issue threads before changing them.
6. Mark `DONE_VERIFIED` only with executed accepted evidence, exact committed implementation SHA, field dispositions/proofs, test names and results. `IN_REVIEW` means source-complete but missing independent/runtime proof; `BLOCKED` means no unblocked progress on this task; neither closes the phase. Record blockers in task and own issue.
7. **When finished early:** release the task as `DONE_VERIFIED`/`IN_REVIEW`/`BLOCKED`, then claim the next eligible task **within the same phase**; repeat while the current user turn and tools permit. If no eligible task exists, inspect blocked tasks, offer independent peer review/CI help *without stealing an existing claim*, or identify/document a real untracked gap as a fresh non-duplicating task. Never mark worker permanently DONE or start the next phase prematurely.
8. If a previous owner appears stale, **do not silently steal**; check its checkpoint/issue commits, and reassign only with explicit recorded coordination and CAS update. A time-stale timestamp does not prove the other conversation is inactive.
9. New issues/fields found during work become new queue items through the same SHA-checked update. Keep the queue exhaustive and monotonic; "there are no READY tasks" does not prove the phase is complete.

**Necessary concurrency limitation:** GitHub blob-SHA updates reduce stale-file overwrite conflicts but are not a lock over arbitrary source files or a distributed transactional scheduler. Always inspect current changes and coordinate overlapping paths. A task claim is a reservation record, not an autonomous worker process.

## 2. Cross-workstream shared writers

**One restricted coordinator remains for migration registration, not domain ownership:** Chat 1 is the sole writer of `drizzle/**`, `drizzle/meta/**`, `src/db/schema/index.ts`, CI/root package workflow and global platform primitives unless coordination explicitly transfers that role. Chats 2–6 also work on database tasks across *all* domains, author safe domain-specific schema/service drafts or `scripts/sql/`/docs drafts, and hand off registration to Chat 1. This is a collision-prevention role; Chat 1 can also claim unrelated unblocked DB work. Other domain-specific files are assigned dynamically at the task level, not by chat number.

Public API signatures, permission/tenant core and shared utilities require explicit small coordination handoffs; no independent competing helpers. Where one worker holds a shared-file claim, peers stage isolated changes or reviews, not overlapping edits.

## 3. Global phase transitions — automatic at next interactive execution, not background

The next active worker may evaluate and commit a phase transition **only after all five conditions**:

1. Every planned required task in the current phase is `DONE_VERIFIED` or `RETIRED_APPROVED`, including newly discovered tasks.
2. ALL checklist requirements in `phase-state.json` for the current phase have concrete, executed evidence attached to exact source+test SHAs; no critical unresolved blocker, source-gap or known untracked active legacy behavior.
3. Independently re-audit all active domains/pages/workflows applicable to the phase against **current** legacy FE/BE SHAs; a stale source oracle invalidates affected gate evidence.
4. The next phase has an **enumerated, nonempty** detailed work queue covering the entire LMS, not just known hot spots; its tasks remain `LOCKED` until promotion.
5. Use compare-and-swap update against the freshest phase-state blob, atomically with coordination best effort, set previous `CERTIFIED`, next `ACTIVE`; update queue items after promotion, verify latest `main`. If coordination races, stop, reconcile and retry. A half-updated phase/queue is NOT authorization to work in the wrong phase.

A chat *cannot* make global certification simply because its personal task list is empty. No background work runs after a conversation ends. Future user-initiated chats continue from durable records and may perform a promotion when all proof gates hold.

## 4. Six durable identities and status questions

Chat 1..6 = six worker IDs tracked in `docs/coordination/lanes/chat-01.json` .. `chat-06.json` and GitHub issues #21..#26. Worker JSON contains `activeTaskId`, completed/reviewed tasks, exact last checked source SHAs, test evidence and blockers; **not** fixed DB domain ownership. Old per-lane domain candidate counts are historical and must never be summed as if they were current assignments.

The offline `node scripts/six-chat-status.mjs` (or `--lane 4`, `--json`) reads current working tree phase, queue, workers and detailed page checklist. It does not consult live GitHub or run CI; fresh status queries also inspect current GitHub HEAD/issue/PR/CI.

**Report for one chat:** global phase, active task and age, completed verified vs blocked/review tasks, latest verified merged SHAs, tests authored/executed/passed, next eligible task and dependencies. **All chat stats:** one row per worker **plus one global phase/queue breakdown**, DB source candidates/disposition evidence, API operation inventory (if measured), UI parity gate (if phase active), CI and launch proof. Never invent a completion percentage: use only closed/eligible fully enumerated denominators and distinguish authored vs proven.

## 5. Phase work rules

**DATABASE:** active/retired source inventory; normalized mapping of every required table, field, FK, unique/index/check/default, state history/undo, tenant/role scoping and race behavior. Generated migrations (only integrator), PostgreSQL structural drift, disposable replay and adversarial DB tests. DB fields may map to calculated/managed/external values and need not preserve legacy table names. Historical records are greenfield; there is no active data migration requirement. No superficial same-name equivalence.

**API:** enumerate exact legacy endpoints *and* service mutations/user jobs originating from UI, and prove corresponding canonical vNext functionality, authorization, side effects, validation/error/safety/races and cross-role producer→consumer operations using real API/DB tests. All six dynamically claim API tasks across the whole codebase, no permanent domain owner.

**UI:** legacy navigation/routes, pages, sections, cards, tables, actions, forms, dialogs/drawers/popovers, transitions, empty/error/permission states, mobile/responsive, old-to-vNext deep links. All six dynamically claim non-overlapping UI work packages. Required final `parity:status`, `parity:pages`, `parity:clone-gate` and browser evidence.

**RELEASE:** infrastructure, real auth/storage/outbound, full regression/negative/load/security/rollback and smoke deployment. No premature "production ready."

## 6. Operational commands

- `Continue chat 1 work` ... `Continue chat 6 work`: use same shared phase; resume or claim queued batch.
- `Chat 2 stats` / `What is chat 4 doing?`: read-only per worker status.
- `All chat stats`: aggregate all six + phase queue, provenance and quality gates.
- `What's the current phase?` / `DB phase stats`: global phase/gates/remaining work.
- `Handoff chat 5`: snapshot work and release/retain task claim responsibly.
- `Continue all six chats`: only the **currently active** conversation can work; it cannot activate five other conversations. Suggest initiating worker chats as needed; shared GitHub logs coordinate.

Suggested manual chat titles: `LMS vNext | Chat 1` through `LMS vNext | Chat 6`. There is no available ChatGPT conversation-renaming tool. Chats may be named manually in the app.

## 7. Bootstrap / legacy compatibility

1. `AGENTS.md` remains architectural/security authority.
2. This v2 protocol, phase state and shared queue **override old permanent-domain ownership wording** in `docs/planning/six-chat-closure-plan.md` and issue bodies. That old plan remains a history of earlier work only.
3. Six GitHub issues remain durable worker journals; do **not** close them when a batch is complete.
4. Existing historical code, API and UI changes remain preserved; only new priority follows the strict global phase.
5. Seeded queue is a **starting audit backlog, not a certified exhaustive inventory**. Workers must extend it for any proven missing active scope before certifying a phase.
6. All task and test completion claims require exact merged SHA, relevant executed evidence and refreshed legacy oracle SHA. Missing runtime is `IN_REVIEW` or `BLOCKED`, never `DONE_VERIFIED`.
