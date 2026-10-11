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
