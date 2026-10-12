# DB-076 — independent verifier schema-drift and catalog hardening

**Observed:** 2026-10-12 IST  
**Worker:** Chat 1  
**Phase:** DATABASE

## Gap

The CI-independent verifier previously ran journal validation, destructive zero-to-head replay, idempotent migration, source/static contracts and broad PostgreSQL integration. It did not prove that the current canonical Drizzle schema generated **zero unregistered migration/snapshot drift**, and it did not run the read-only DB-002 catalog witness.

That allowed a checkout to replay its registered journal successfully while canonical TypeScript schema had already moved ahead.

## New fail-closed order

`scripts/db-independent-verify.mjs` now runs nine ordered gates:

1. migration journal integrity;
2. canonical `db:generate`;
3. tracked `drizzle/` diff must be empty;
4. untracked `drizzle/` files must be empty;
5. destructive disposable reset + zero-to-head migration + seed;
6. migration idempotence;
7. read-only PostgreSQL migration/catalog witness;
8. database source/static contracts;
9. PostgreSQL integration/negative witnesses.

The evidence document can only report `passed=true` when all nine records exit zero, and any step declared `expectedEmptyStdout` actually produced no output.

## Catalog target safety

The DB-002 catalog witness now reuses `assertSafeDb01TestTarget` rather than inventing a localhost-only target policy.

That means:

- explicit local test/E2E databases remain valid;
- remote disposable targets require the same exact `DB01_REMOTE_TEST_DATABASE_CONFIRM=RESET:<host>/<database>` contract;
- target-redirection URL parameters stay rejected;
- application DB fallback is not introduced.

The catalog connection remains read-only.

## 0044 structural witness

The catalog required-table set now includes:

- `placement_company_relationships`;
- `placement_college_rules`;
- `placement_company_visibility_settings`;
- `placement_tpo_leads`;
- `placement_tpo_lead_activities`;
- `placement_tpo_followups`.

Thus the next independent verification cannot accept the new 0044 journal head merely from migration count; those structural objects must actually exist.

## Regression coverage

Dedicated static regression: `tests/db076-independent-verifier-drift.test.mjs`.

It is registered in `test:db:parity` and guards gate ordering, tracked and untracked drift detection, evidence fail-closed semantics, catalog ordering, remote-target policy reuse and explicit 0044 table requirements.

## Evidence boundary

This task hardens the verification **mechanism**. It does not claim that the nine-step verifier has already passed on the current 0044 commit. A later execution must retain exact git SHA, PostgreSQL version, step exits and output hashes before DB-076 or downstream DB readiness can be called runtime-verified.
