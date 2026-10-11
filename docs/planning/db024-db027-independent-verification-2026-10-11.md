# Independent DB-024/DB-027 hardening and executable-source verification

**Date:** 2026-10-11 · **Global phase:** DATABASE · **Branch:** main · **Worker type:** non-claiming independent reviewer. This does not change any six-chat claims or task status, and does not promote DB runtime verification.

## DB-024: notification claim authorization and immutable receipts

The staged general notice enqueue guard proved the recipient had an active matching college membership/role only on initial INSERT and identity updates. A member can lose the role or be suspended while the notice waits, but a later status-only UPDATE to CLAIMED/HANDED_OFF/SENT originally bypassed this guard. A separate locked authorization recheck now fires when delivery/lease fields change and the new status is deliverable. This intentionally continues to **deny** unproven recruiter grants until the DB09 access contract exists.

The staged mutation trigger also previously prohibited only status changes away from SENT/CANCELLED, allowing same-status edits of final receipts. All such terminal row updates now fail. `claim_fence` cannot decrease, and entering CLAIMED or changing the owner/timestamps of an existing claim must increase it; stale leases cannot be renewed using an old fence. Note the sender must still recheck the fence atomically before provider side effects.

Source commits:
- [Delivery authorization](https://github.com/42Students/lms-vnext/commit/446a2f88cb35742d10cf9e4f009aa89bba42eea4)
- [Terminal immutability and fencing](https://github.com/42Students/lms-vnext/commit/79c7d3b1c27bae74cf1e42cd215011e5936f7bd2)
- [Source regressions](https://github.com/42Students/lms-vnext/commit/fe3df5d594b67d90203a315245736527d269b8eb)
- [DB24-16/17/18 acceptance plan](https://github.com/42Students/lms-vnext/commit/969fc109401ff2d78f8d7cbabb8618e6a7d4372d)

**Actual checks:** 15/15 source invariants passed against the live committed draft, its tests and contract. **Not executed:** PostgreSQL enrollment/revoke race, lease takeover/fence replay, sender receipt, full Node tests, Drizzle replay. DB-024 remains STAGED_UNREGISTERED / DB_NOT_RUN.

## DB-027: SQL preflight must fail closed on malformed lexical syntax

A staged SQL file ending inside a nested block comment, a string, a dollar-quoted body or a double-quoted identifier was previously masked to EOF; preflight could miss CREATE/REFERENCES statements and present a false-clean inventory. `stripSqlLiterals(sql, lexicalErrors = [])` now reports unterminated SQL delimiters; `inspect()` preserves errors; `analyze()` returns `lexicalHazards` and always marks such drafts hazardous. Complex but valid quoted relation names outside the lightweight regular-expression grammar also flag `UNSUPPORTED_QUOTED_DDL_IDENTIFIER` rather than disappear. Trailing line comments remain legal. The CLI prints the lexical warning count.

Source commits:
- [Unterminated delimiter fail-close](https://github.com/42Students/lms-vnext/commit/fd7a3cda9e892de45f578157bdc51eb952f41775)
- [EOF regression tests](https://github.com/42Students/lms-vnext/commit/ae0688f24495634a501d973f3974fe54bbbcda5d)
- [Unsupported quoted DDL detection](https://github.com/42Students/lms-vnext/commit/72efda5ad4ab0302dd85ca15dfb2d472a21a1ff5)
- [Quoted relation regressions](https://github.com/42Students/lms-vnext/commit/7c4c10b6049fb9a83b4b9bcd9af950145a875d49)
- [CLI hazard count](https://github.com/42Students/lms-vnext/commit/82ba39a251f1980f2d7a3f5444d9c67cb2a8f171)

**Executed check:** On source blob `7155f121c0c12a239fe0730dc04cb8263ae4a62c` fetched from main, extracted exact pure exported source functions `stripSqlLiterals`, `inspect` and `analyze`, and executed them in an isolated V8 evaluator with 12 synthetic fixtures: **12 passed / 0 failed**. Cases covered nested block comments; escaped E-string; double-quoted non-DDL; open block/string/dollar/identifier; unsupported quoted CREATE/REFERENCES/ALTER; valid trailing line comment; closed dollar-quoted body. The analyzer returned `hazards: true` with seven diagnostic entries for invalid/unsupported drafts. This is *executed source-function logic*, not the repository's Node test suite and not PostgreSQL/migration replay.

## Remaining acceptance gates

DB-024: independently execute registered migrations and negative tenant/role, concurrent undo/claim, same-status terminal rewrite, lease fencing and provider handoff witnesses against disposable PostgreSQL; only Chat 1 integrates the journal/barrel.

DB-027: run the complete Node regression suite and preflight on the fresh checkout, independently review the dependency graph, and replay the journal from zero. This remains heuristic preflight, not an authoritative SQL parser.

No CI Actions wait is required (billing intentionally unavailable). Neither task was marked DONE_VERIFIED; the global phase stays DATABASE.
