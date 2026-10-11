# DB01 tenant-domain tombstone parity — staged decision

**Worker:** Chat 2 · **Claim:** DB-004 · **Phase:** DATABASE · **Status:** UNREGISTERED / NOT EXECUTED

## Legacy proof and vNext divergence

At legacy backend `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`:

- `src/main/java/com/_42students/lms/model/TenantDomain.java` extends `BaseModel`, which persists `is_deleted`.
- `src/main/java/com/_42students/lms/repository/TenantDomainRepository.java` filters `isDeleted = false` for host resolution, college listings, and primary-host discovery.
- `src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java` refuses deleted records before issuing DNS tokens or verifying.
- `src/main/java/com/_42students/lms/controller/PublicTenantController.java` uses active domains and verified-primary lookup for canonical-host selection.

At current vNext main, `src/modules/tenant-domains/repository.ts` instead calls `.delete(tenantDomains)` and loses the row. `src/db/schema/tenant-domains.ts` has no deletion marker. Hard deletion *does* stop routing but does not preserve history. **No claim that legacy data is being migrated**.

## Proposed conservative contract

`docs/planning/sql/db01-tenant-domain-tombstone-staging.sql` proposes `deleted_at`, optional deleting actor and reason, a deleted-domain/nonprimary check, and an active-college query index. These are **only proposed fields**; Chat 1 alone registers typed Drizzle schema and numbered migrations.

Security decisions:

1. Keep the currently registered `tenant_domains_host_uq` case-insensitive hostname uniqueness **across both live and deleted rows** until a deliberate, approved host-reuse policy exists. Do not silently convert it to an active-only partial index.
2. Tombstone and clear `is_primary` together; retain `is_verified` / `verified_at` only as historical diagnostics, never as permission for routing.
3. Every host resolution, active listing, set-primary, verify/recheck and tenant-bootstrap query must explicitly require `deleted_at IS NULL`. An active-host cache must not bypass this.
4. Concurrent delete/recheck/update must serialize or guard writes by `deleted_at IS NULL`; a stale DNS check cannot resurrect a deleted domain.
5. Continue to require active college + active organization + verified host for tenant resolution. No unverified-host permissive fallback.
6. Actor/reason retention, privacy and host reuse policies are open design decisions. Deletion metadata cannot be stored on a non-deleted row.
7. API work to change the hard-delete service is gated by the later global API phase (or an explicitly approved immediate security correction). A DB column alone is not parity.

## Required actual PostgreSQL acceptance (all NOT RUN)

- Tombstoned primary domain fails the deleted/nonprimary check.
- Tombstoning clears primary in the same transaction and preserves historical row.
- Deleted verified alias never resolves; active verified alias still resolves.
- Deleted hostname collision remains denied under all-time case-insensitive uniqueness.
- Stale verification or set-primary after deletion cannot revive routing, including concurrently.
- Domain deletion by wrong college actor fails; audit actor cannot be forged.
- Clean Drizzle migration replay and snapshot drift validation succeed.

This draft is a decision aid, **not registered schema, not an executed test, and not verified DB01 parity**. Keep DB-004 IN_PROGRESS until the required source-to-vNext proofs, migration, runtime acceptance, and cross-tenant security gates complete.

## 2026-10-11 staged race-resistant tombstone transitions

Chat 2 added the **unregistered** candidate
`docs/planning/sql/db01-domain-tombstone-state-guard-staging.sql`,
its mutation/source test `tests/db01-domain-tombstone-state-source.test.mjs`,
and disposable two-session PostgreSQL witness
`tests/db01-domain-tombstone-state-pg.test.mjs`. The dependency manifest now
requires `DB01-DOMAIN-TOMBSTONE` before
`DB01-DOMAIN-TOMBSTONE-STATE`. These are source-authored proposals,
**not** active Drizzle migrations, activated triggers or PostgreSQL proof.

The previous `deleted_at` candidate permitted a stale DNS verifier to
update a tombstoned row and did not stop a direct SQL hard DELETE from
discarding audit/history. The new `BEFORE UPDATE` trigger rejects **all**
updates once `OLD.deleted_at` exists. A concurrent write waiting behind
a delete will receive the terminal-state SQLSTATE `23514` after it sees
the committed tombstone. A `BEFORE DELETE` trigger blocks hard deletion
until a separately approved bounded-retention purge policy exists.

The *deletion transition* may atomically clear `is_primary`, set
`deleted_at`, the deleting actor and reason, and null the outstanding DNS
verification token. It cannot rewrite the historic host, verified status,
verified timestamp or diagnostic timestamps/results in the same deletion.
`college_id` cannot change on any update. A nondeleted record's
**hostname change** must clear `is_verified`, `is_primary`,
`verified_at`, `last_checked_at` and `last_check_result`, and supply a
new non-null proof token distinct from the old one. This is a guard for
future/direct database writes; current application code has no domain-host
edit operation. Pending product decision: whether a verified domain may
be administratively revoked without changing the host is **not** altered
by this guard.

**Compatibility requirement:** Current vNext
`src/modules/tenant-domains/repository.ts.deleteDomain` executes
`DELETE FROM tenant_domains`; activating the hard-delete prevention
trigger before replacing that operation would break the deletion workflow.
Activation must bundle repository tombstone mutation, all active-list and
host-lookup `deleted_at IS NULL` filters, verifier/set-primary race
protection, and the DB migration. Current all-time hostname uniqueness
must not be converted to a partial unique index just to allow reuse.

A separate approved disposable PostgreSQL may run:

```sh
node --test tests/db01-domain-tombstone-state-source.test.mjs
DB01_DOMAIN_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA TEST_DATABASE_URL='<approved disposable URL>' node --test tests/db01-domain-tombstone-state-pg.test.mjs
```

The PostgreSQL witness uses a randomized temporary schema, synthetic user
and college parents, and two separate writers. It asserts *both*
delete-first (stale verifier must fail) and verify-first (tombstone must
preserve the committed historical proof), direct owner/host/replay/history
negatives, and case-insensitive host reservation after delete. It cleans
up its own schema. **It has not been executed and is not a substitute
for clean registered Drizzle migration replay, current route/tenant
authorization, or full cross-domain schema tests.** GitHub Actions
billing is intentionally not a development blocker.
