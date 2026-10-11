# DB01 role grant vs ended membership: parent-row serialization gate

**Worker:** Chat 2 · **Task:** DB-004 · **Phase:** DATABASE
**State:** SOURCE-CONFIRMED GAP; implementation and PostgreSQL race proof PENDING.

## Current vNext call chain

- `src/modules/people/membership-service.ts` loads authorized membership detail, checks its status with `requireMutableRoleMembership`, then calls the repository mutation. This check is outside the repository's SQL transaction and therefore can be stale.
- `src/modules/people/repository.ts` `addMembershipRole` selects current `membership_roles` rows using `FOR UPDATE`, but does **not** lock `college_memberships` to check current parent status. The protected rows are role grant rows, not the parent membership.
- `transitionMembershipLifecycle` *does* lock the parent membership using `FOR UPDATE` and writes `status='ENDED'`.
- `src/modules/people/membership-domain.ts` regards ENDED as terminal and denies application role mutation on an ENDED membership, but this is not an atomic DB invariant.

### Reproducible interleaving (source-level vulnerability, NOT a performed exploit)

1. Request A (grant a role) loads the person while membership status is ACTIVE and passes the service check.
2. Request B (END membership) takes the parent `college_memberships` row lock, updates it to ENDED, commits.
3. A enters `addMembershipRole`, locks only `membership_roles` rows, inserts a grant and commits without rechecking parent.
4. The database now has a role grant that was created **after** membership ended. Existing request-context resolution excludes non-ACTIVE memberships, so this does *not* by itself prove an immediately usable privilege; it does break the intended terminal role-mutation invariant and can affect audit/rejoin semantics.

## Intended persistence contract to review with Chat 1

- Serialize every new `membership_roles` grant and role change on the same `college_memberships` row lock that lifecycle END uses.
- After acquiring the parent lock, reject an insert or change when the parent's status is ENDED, with a stable DB error and no audit event.
- The original service must still authorize tenant scope and actor role: a trigger/constraint is not a substitute for permission checks.
- Role grants that were committed *before* END may remain stored for history, but must have no effective permission unless the membership is ACTIVE. Whether ENDED may ever be re-enrolled on the same record is an independent product decision.
- Avoid silently changing current SUSPENDED behavior: the application currently prohibits role changes for ENDED, not SUSPENDED.
- Source-only proof cannot establish the chosen database locking pattern will work. Chat 1 owns registered Drizzle schema/migration and core transactional design; implement either a trusted fixed-search-path trigger or an in-transaction parent lock that every grant code path obeys, backed by database-level concurrent insertion tests.

## Independent PostgreSQL gate (NOT EXECUTED)

Use an isolated disposable DB with at least two separate connections:

1. **END wins lock:** Tx B locks parent, changes ACTIVE → ENDED, while Tx A attempts new grant. After B commits, A must reject the grant; no new row or grant activity event.
2. **Grant wins lock:** Tx A locks parent and grants role; Tx B attempts END and must wait. Once A commits, B ends membership; effective roles must be denied despite the historical grant row.
3. **Already ENDED:** direct SQL role insert or role change must reject, even when bypassing service logic.
4. **SUSPENDED case:** only the product-approved behavior is accepted, and unrelated colleges/memberships remain independent.
5. **Cross-tenant actor:** a forged different-college membership ID must fail the authorization gate, not merely referential integrity.
6. **Replay/stale context:** a client that holds a previously ACTIVE membership object cannot grant after END.
7. **Full migration replay:** clean and incremental journal tests under independently disposable PostgreSQL; role/event audit must remain atomic.

**Present evidence:** pinned source inspection and authored source-drift witness only; no new schema registered, no SQL applied, no PostgreSQL race run, and no vNext semantic field verified. Do not use global CI billing to delay unrelated DATABASE engineering.
