# DB01 parent–child lifecycle race: organization and college

**Chat 2 / DB-004 · global DATABASE phase · staged only.** No numbered migration or PostgreSQL acceptance has been performed.

## Verified source problem

- In `src/modules/organizations/service.ts:archiveOrganization`, a query tests for active colleges and a later separate operation changes `organizations.status` to ARCHIVED.
- In `src/modules/colleges/service.ts:createCollege`, a query tests for an ACTIVE organization and a later separate operation inserts an ACTIVE college.
- `colleges.organization_id` has an FK but no database rule requiring an ACTIVE parent for an ACTIVE college.

**Concurrent READ COMMITTED interleaving:** Session A checks that organization is ACTIVE, pauses; Session B finds zero active colleges and commits the organization archive; Session A inserts the college. Both individual service checks passed, yet the database contains an ACTIVE college beneath an ARCHIVED organization. VNext request-context filtering may hide that college, which is not a substitute for a correct persisted invariant.

## Proposed fix (not registered)

Source candidate: `docs/planning/sql/db01-org-college-archive-race-staging.sql`.

1. A trigger for INSERT or organization/status UPDATE of an ACTIVE college locks its organization row `FOR UPDATE` and verifies ACTIVE status. The lock serializes this DML transaction with parent status updates.
2. A trigger for organization transition to ARCHIVED checks that no ACTIVE college references it. If a child wins the lock, archive fails; if archive wins, a delayed ACTIVE child insert fails.
3. These are cross-table constraints, not valid standalone row CHECKs; the existing FK only establishes existence. The proposal preserves historical ARCHIVED college rows.
4. SQLSTATE 23514 and stable constraint identifiers are for controlled error translation, not proof that a PostgreSQL run passed.

The proposal deliberately does **not** solve concurrent college archive vs membership, department, project or placement creation; those require cross-domain review.

## Required disposal-only PostgreSQL acceptance

- Query pre-existing illegal state: `SELECT c.id FROM colleges c JOIN organizations o ON o.id=c.organization_id WHERE c.status='ACTIVE' AND o.status<>'ACTIVE';` (must return zero).
- Parent archive commits first, then ACTIVE college insert fails with `23514`.
- ACTIVE college insert commits first, then parent archive fails with `23514`, including lock/transaction scheduling.
- Reactivating/moving a college under an ARCHIVED organization fails, while historical ARCHIVED colleges remain legal.
- Two unrelated organizations continue independent writes; inspect lock waits/deadlock/retry paths.
- Empty and latest Drizzle migration replay plus all real negative tests must pass before the constraint is promoted.
- Recheck all tenant descendants, not just colleges, for analogous archive races.

**Source guard:** `tests/db01-org-college-archive-race-source.test.mjs` uses nine source/mutation checks. Source checks are not a PostgreSQL execution witness. Chat 1 alone integrates generated numbered migrations and snapshots. DB-004 remains IN_PROGRESS with 0 runtime-semantic fields verified.
