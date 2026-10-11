# DB01 tombstone proposal — executed portable Node test evidence

**Date:** 2026-10-11 IST  
**Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE
**Runner:** isolated local container (Node.js v22.16.0), independent of GitHub Actions.
**Repository branch:** `chat-02-db004-tenant-domain-tombstone`.
**Status:** SIX STATIC SOURCE TESTS EXECUTED/PASSED; ZERO POSTGRESQL TESTS.

## Exact-source fixtures (verified content-addressed Git blobs)

The local runner was provisioned with *byte-for-byte copies* of these two
GitHub files, confirmed by independent local `git hash-object` checks:

| File | Git blob SHA-1 |
| --- | --- |
| `docs/planning/sql/db01-tenant-domain-tombstone-staging.sql` | `7c35723cecbe8851a52298dbdf8729fde9a30a58` |
| `src/db/schema/tenant-domains.ts` (registered existing index definition) | `a60513d017138c9d5e2abdc0ab426eb7143cc8cf` |
| `tests/db01-tenant-domain-tombstone-source.test.mjs` (executed test source) | `21d8429bca59089a0d4294afd88077de580a2dd0` |

The test source was run locally before pushing and then its GitHub file blob
was separately compared with the local file SHA-1. Source, proposal and active
schema hashes all matched. This is **not a database connection or migration**.

## Executed commands and output

Executed from an isolated checkout-shaped directory containing those exact
three files at their original relative paths:

```bash
node --version
# v22.16.0
node --check tests/db01-tenant-domain-tombstone-source.test.mjs
node --test tests/db01-tenant-domain-tombstone-source.test.mjs
```

Observed local `node --test` summary:

```text
TAP version 13
ok 1 - staged SQL preserves deletion history and all owner/state guards
ok 2 - the existing registered host uniqueness is still global and case-insensitive
ok 3 - guard catches removal of deleted-domain nonprimary invariant
ok 4 - guard catches unsafe hostname-index replacement even if mentioned in comments
ok 5 - guard catches removal of required actor/tenant deletion metadata shape
ok 6 - guard catches removal of active-query-only partial index
1..6
# tests 6
# pass 6
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

## Evidence boundary

This proves the static guard checks against the two hashed source files and
that four mutation witnesses reject unsafe proposal edits. It **does not**
prove that PostgreSQL applies the proposed SQL, that a tenant disappears from
runtime host routing, that an actor has deletion permission, or that a
concurrent DNS verifier cannot resurrect a tombstoned domain.

Remaining before DB01 parity: approved product lifecycle decision, Chat 1
registered Drizzle migration and replay, guarded repository/API changes in
the appropriate global phase, and executed disposal/host-resolution/concurrent
mutations on an isolated PostgreSQL database. GitHub Actions billing is *not*
the blocker or an acceptance requirement.
