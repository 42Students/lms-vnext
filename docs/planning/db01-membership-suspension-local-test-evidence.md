# DB01 membership-state proposal — executed Node source test evidence

**Date:** 2026-10-11 IST · **Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE  
**Runner:** independent local Node.js v22.16.0; **not GitHub Actions**.  
**Scope:** exact-source structural checks, **NOT PostgreSQL migration acceptance**.

## Exact-source fixture attestation

A local checkout-shaped directory held byte-for-byte copies of these five
repository files. Each was compared with the GitHub response blob identity
using local `git hash-object` (Git SHA-1 blob encoding).

| File | Exact Git blob SHA |
| --- | --- |
| `docs/planning/sql/db01-membership-suspension-state-staging.sql` | `82bb5023856d161cdc23be03075ce130f303d202` |
| `src/modules/people/membership-domain.ts` | `0fb5b8083796a8b9f7e0fd385f209a21f2fde171` |
| `src/db/schema/memberships.ts` | `2d5caf2676d00982014ca5e785e237e178f1f06f` |
| `src/modules/people/validation.ts` | `e9bbb0b8ed060f3b9a9629930e61c0bc0c0bf815` |
| `tests/db01-membership-suspension-source.test.mjs` | `f14b63e6eeb578dce6c5645346cb6b2d31fe744c` |

## Commands actually executed

```bash
node --version
# v22.16.0
node --check tests/db01-membership-suspension-source.test.mjs
node --test tests/db01-membership-suspension-source.test.mjs
```

Observed `node --test` results:

```text
TAP version 13
ok 1 - staged SQL enforces the suspension state shape and contains no destructive operations
ok 2 - proposal concerns real unconstrained columns in the registered membership schema
ok 3 - application producer has all three transitions and clears metadata on reactivation and end
ok 4 - mutation: removing active/ended metadata clearing becomes visible
ok 5 - mutation: allowing blank suspension reason becomes visible
ok 6 - mutation: missing suspended timestamp becomes visible
ok 7 - mutation: destructive cleanup is rejected even if comments claim staging
ok 8 - mutation: reenrollment trigger is rejected until product policy is decided
1..8
# tests 8
# pass 8
# fail 0
# skipped 0
# cancelled 0
```

## Acceptance boundary

This verifies source-consistency of a proposed CHECK, plus five destructive/
unsafe mutation detectors; it does **not** execute SQL or certify the existing
membership database. There is no PostgreSQL client/server in the local runner.

The new constraint must remain unregistered until Chat 1 reviews nullable
existing rows, terminal ENDED/rejoining policy, generated Drizzle migration,
replay, actual SQLSTATE 23514 negative tests and authorization/concurrency
behavior. This evidence does not advance a runtime semantic field or the
global DATABASE gate.

GitHub Actions is intentionally disabled for billing. Its absence is not
recorded as an implementation blocker; independent PostgreSQL acceptance
remains genuinely outstanding.
