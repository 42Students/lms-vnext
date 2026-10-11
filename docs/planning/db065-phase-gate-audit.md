# DB-065 — Shared DATABASE phase and six-worker claim preflight

**Scope:** Read-only coordination integrity checker, source tooling only. **This is not PostgreSQL schema validation, migration replay, or a global DATABASE phase certification.**

## Why this is an independent task

All original READY tasks are unavailable to a general worker: DB-002 and DB-017 are exclusively Chat 1's migration-integration lane, while DB-019 and DB-020 depend on unclosed upstream work. DB-004/005/008/064 have existing active worker claims, and DB-003/007/012/030 are blocked on product decisions, integration or executed PostgreSQL acceptance. To avoid overwriting peers, Chat 5 (checkpoint initially AVAILABLE) CAS-picked the distinct, previously unguarded global coordination-safety contract in DB-065.

The deliverable is `scripts/db065-database-phase-gate.mjs`, plus `tests/db065-database-phase-gate.test.mjs`. The tool reads `docs/coordination/phase-state.json`, `docs/coordination/work-queue.json`, and all six checkpoints without mutation. A structural error yields CLI exit **2**; a clean structural read yields exit **0**, while the reported `readyForNextPhase` is **always false** because database certification requires independent schema, live PostgreSQL and domain acceptance evidence.

## Checks provided

- Validate exactly six uniquely identified worker checkpoints, no two in-progress/picked tasks for one worker, and agreement between live queue claims and the corresponding worker checkpoint.
- Enforce Chat 1 exclusively for both `MIGRATION_INTEGRATOR` and `CORE_INFRA` picked/in-progress tasks.
- Detect duplicated/invalid task IDs, task states, missing dependency references, dependency cycles, wrong phase labels and premature API/UI/RELEASE activation.
- Distinguish `COMPLETED` implementations from `DONE_VERIFIED` acceptance; require a syntactically plausible completion SHA, verified timestamp, verifying worker and nonempty evidence for accepted tasks. This structural check **cannot authenticate external test evidence**, hence it never certifies a phase.
- Flag non-verified dependencies of active tasks, absent required phase gates, and phase certification while required tasks remain open.

## Actual independent Node execution

The exact committed GitHub blob contents were used in a clean local copy with Node **v22.16.0**. Local `git hash-object` and connected GitHub file metadata agreed for both source and tests:

| File | Git blob SHA |
|---|---|
| `scripts/db065-database-phase-gate.mjs` | `947ecb6a87f4c7a9c66bbd4ac487c84351e68452` |
| `tests/db065-database-phase-gate.test.mjs` | `be55547b4a68fbc0c4f8a680bd72eeac09090b62` |

```
node --version
v22.16.0

node --check scripts/db065-database-phase-gate.mjs
node --check tests/db065-database-phase-gate.test.mjs
# both exit 0

node --test tests/db065-database-phase-gate.test.mjs
# tests 30
# pass 30
# fail 0
# cancelled 0
# skipped 0
# todo 0
# exit 0
```

The 30 tests include pure fake work queues, guarded false phase-certification and source-only vs verified status handling, a dependency-cycle matrix, worker collision checks, both Chat1 writer protections, and two **actual Node CLI subprocess** tests using isolated temporary checkout fixtures. They do not require GitHub Actions or a database and do not modify external systems.

## Current repository live check

The exact committed pure `inspectGate()` function was independently executed in the connector's JavaScript runtime against freshly fetched GitHub `main` phase/queue/all six checkpoint blobs. This does not replace the Node checkout test: it is an additional read-only exact-source-data check.

- Global phase: `DATABASE`, ACTIVE; API/UI/RELEASE remain LOCKED.
- Live task status before DB-065 closure: 52 `COMPLETED`, 5 `IN_PROGRESS` including DB-065, 4 `READY`, 4 `BLOCKED`, 0 `DONE_VERIFIED`, 0 `RETIRED_APPROVED`.
- Structural **errors: 0**.
- Warning: `DB-064` is in progress while prerequisite `DB-056` is still `COMPLETED` (not `DONE_VERIFIED`). This is **not** repaired or reassigned because Chat 3 owns DB-064; dependency proof is still outstanding.
- All **65** tasks are unverified for the global database phase; `NO_PHASE_CERTIFICATION` remains expected.
- `readyForNextPhase=false` by construction.

**Proven completion criterion for DB-065:** read-only executable structural analyzer committed, exact-source Node regression and CLI positive/negative cases passed, real current coordination objects checked, no protected files touched. The task's own source-only acceptance may be `DONE_VERIFIED` based on these executed Node checks; this **must not** be interpreted as a PostgreSQL migration or domain source-to-live pass.

## Unresolved DATABASE phase gates

Chat 1 retains exclusive migration, schema-barrel and shared infrastructure authority. Full registered replay, PostgreSQL negative tenant/authorization FK/race tests, live-vs-snapshot drift, and source semantic reconciliation remain mandatory. DB-003 requires a true active/retired Smrithi product decision and producer/consumer evidence. DB-004, DB-005, DB-008, DB-064 are active owner tasks, while DB-007/012/030 remain blocked for integration or acceptance. DB-019/020 cannot close until their dependencies actually pass.

GitHub Actions remains intentionally unused because of billing and is not classified as an engineering blocker. Never mark the phase certified from this static check.
