# Chat 6 DB-008 — tombstone CAS and authored-content ancestry source-check evidence

**Date:** 2026-10-11 (IST)  
**Global phase:** DATABASE  
**Task:** DB-008 IN_PROGRESS, not DONE_VERIFIED  
**Repository:** `42Students/lms-vnext` main, observed source snapshot `6d9c938f70d0354c5c0962cc778ec7edd5ace250` after direct commits (other workers may advance main concurrently)  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Verification classification:** **JavaScript source-assertion replay only**. Native `node --test`, PostgreSQL SQL execution, API, browser, typecheck, build and CI **were not executed** in this chat.

## Implemented, on main (all unregistered companion SQL, no schema barrel)

1. `311473991f483671cd66b150eef012f7ee88cf3a` — faculty owner delivery guard rejects same-college wrong cohort / academic period.
2. `385a3e0b165a90cb211935760e17eb915d7ebf55` — faculty-owner test correction and cohort/period assertions.
3. `b5cda9276dedaf1ea5ef7d029e080a4f62e6741e` — lesson soft-delete child cascade bumps `lesson_contents.version` for each newly tombstoned child.
4. `1366222218939b85172d1548bd87cbc326401645` — CAS invalidation regression test.
5. `b74d48c1ed16d7b697876eea0f899e24b101f089` — new `db05-tombstone-version-invariant.draft.sql`: BEFORE tombstone updates on courses, lessons, and contents advance version exactly once, whether API pre-bumped it or not.
6. `4c58672829bdd5b5d191fed51c422d6659fe6588` — four tombstone version source tests / TV-01..TV-14 acceptance.
7. `d361417d030d18c30c1105742357a5a8fb126994` — manifest fail-closed TV acceptance and companion dependency.
8. `430556d4553cea81ed273fb222402256fb2ed56b` — new `db05-content-ancestry-with-content-guard.draft.sql`: content, not only class order overrides, blocks reparent of lesson, path, offering, delivery and section.
9. `7abb3a1c50052f06e1594859a5f17de282b9479a` — authored content ancestor test file.
10. `c3cc75bc9c0779e9b1eb80defcb04d20b779aeba` — manifest fail-closed content ancestry/CA acceptance.
11. `75a199b0e1b937d4a1d167804ccd7347632b8fb8` — corrected three brittle lesson deletion regression assertions discovered by replay.
12. `5e971011831d8e6a456504365b69d9782e2b8026` — protect generic NULL-delivery content audience when delivery/section changes scope, not only class-specific content.
13. `83be102a382d6fc1cd9f258a21e90264bcb2bfed` — repaired acceptance-matrix comment ordering.
14. `beaf82f282f0163ad8a56d4a3ec393a205005e21` — generic content audience source assertion + 18 CA cases.
15. `56c5ad06b343f2666dc6691dfc13326ee93ccfa8` — manifest gate extended to CA-17/CA-18.

The 7 independently counted DB05 SQL proposals remain **unregistered**; the version and ancestry drafts are **companions only**. Chat 1 alone owns numbered Drizzle migrations, journal and shared schema-barrel integration. Both new companions require precise installation order and coordinated service writes.

## Source-execution method and actual observations

The connected GitHub tool fetched exact current file content/blob SHAs. In a temporary JavaScript V8 isolate, import statements were stripped; `node:fs` read functions were replaced by read-only in-memory maps of **retrieved GitHub blobs**, and `node:test` callbacks were executed synchronously with real JavaScript `RegExp` matching/assertions. This tests source contracts without running production code, Node's test runner, a filesystem-backed repository, a Drizzle database or PostgreSQL. It must **not** be reported as a successful native Node suite.

Observed suite groups (no observed failing assertions in the successful replays):

| Exact committed test file(s) | V8 assertion callbacks passed | Notes |
| --- | ---: | --- |
| `tests/db05-tombstone-version-invariant.test.mjs` | 4 | Commit/source blob `d7cbc18297f924f970cbf2fe5338b39670224273` |
| `tests/db05-content-ancestry-authored-guard.test.mjs` | 6 | Source blob `0d47c5f80831f005501ad36b991b325f18365025` |
| `tests/db05-lesson-delete-restore-and-owner.test.mjs` | 10 | Before fixing stale assertions 3 failures; after `75a199b0` re-run 10/10 |
| `tests/db05-lesson-faculty-owner-guard.test.mjs` + `tests/db05-delivery-cohort-period-integrity.test.mjs` | 12 | Five + seven source-assertion callbacks |
| `tests/db05-course-soft-delete-guard.test.mjs`, `tests/db05-course-parent-integrity.test.mjs`, `tests/db05-course-receipt-college-scope.test.mjs` | 16 | All 16 assertions succeeded |
| `tests/db05-lesson-content-tenant-scope.test.mjs`, `tests/db05-progress-deletion-attempt.test.mjs`, `tests/db05-lesson-discussion-college-scope.test.mjs` | 13 | All 13 assertions succeeded |
| **Total** | **61** | **Mocked Node imports / in-memory source only** |

Additional read-only GitHub structural sweep: 24 distinct unregistered `scripts/sql/db05-*.draft.sql` sources scanned in two groups (12+12); every source contained one top-level `BEGIN;` and `COMMIT;`, no noncomment executable tail, balanced named PL/pgSQL dollar delimiters. No repeated `CREATE TRIGGER` names were found across the two groups. A repeated *function* name `db05_lesson_discussions_tenant_guard` is **intentional**: the more specific lesson discussion same-college companion replaces the canonical function once; Chat 1 must not add a second trigger.

## Critical outstanding runtime acceptance

- **TV-01..TV-14:** Verify tombstone version increments exactly once on delete/restore; app CAS conflict, child cascade and rollback; wrong tenant/role, overflow and concurrent two-session deletes.
- **CA-01..CA-18:** Verify authored content scope changes with and without order overrides, with class-targeted and generic NULL-delivery content; concurrent parent move vs child INSERT and actual learner visibility; section/offering cohort/term mismatch.
- **Integration order:** versions first, tombstone columns second, child CAS cascade and shared upstream companion last; coordinate with existing content-delivery/ordering 605008003 advisory key and DB02 scope guards.
- **Broader gaps:** upstream `academic_periods.college_id`, `departments.college_id`, membership reassignment, hard-delete cascades, DB06 assignment-only lessons and private receipt/service integration are **not proven** by these two companions.
- **Performance:** global advisory key `605008003` serializes relevant mutations; quantify contention/load before production. Deadlocks and transaction isolation must be proved on disposable PostgreSQL.
- **No runtime proof:** zero of 92 top-level DB05 fields formally database-verified; outstanding semantic decisions remain. CI billing is not a coding blocker, but absence of actual PostgreSQL/Node runner evidence means release gates stay closed.

## How Chat 1 / an independent runner can reproduce

From a fresh checkout of the recorded main SHA or a later reconciled SHA:

```sh
node --test \
  tests/db05-tombstone-version-invariant.test.mjs \
  tests/db05-content-ancestry-authored-guard.test.mjs \
  tests/db05-lesson-delete-restore-and-owner.test.mjs \
  tests/db05-lesson-faculty-owner-guard.test.mjs \
  tests/db05-delivery-cohort-period-integrity.test.mjs
```

Then run the full DB05 `node --test tests/db05-*.test.mjs` on the real filesystem plus actual disposable PostgreSQL journal/replay, race fixtures, tenant/role negatives, lint/typecheck/unit/build on the **exact merged SHA**, recording commands/output/redacted environment. Do not mark any TV/CA or manifest gate PASS until independently executed and documented.
