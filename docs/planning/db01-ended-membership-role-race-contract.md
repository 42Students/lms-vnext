# DB01 role grant vs ended membership: parent-row serialization gate

**Worker:** Chat 2 · **Task:** DB-004 · **Phase:** DATABASE
**State:** TRANSACTIONAL PARENT-LOCK IMPLEMENTATION ON MAIN; independent PostgreSQL race proof PENDING.

## Original vulnerable call chain (before mitigation)

- `src/modules/people/membership-service.ts` loads authorized membership detail, checks its status with `requireMutableRoleMembership`, then calls the repository mutation. This check is outside the repository's SQL transaction and therefore can be stale.
- Previously, `src/modules/people/repository.ts` `addMembershipRole` locked current `membership_roles` rows using `FOR UPDATE`, but did **not** lock `college_memberships` to check parent status. The protected rows were role grants, not the parent membership.
- `transitionMembershipLifecycle` *does* lock the parent membership using `FOR UPDATE` and writes `status='ENDED'`.
- `src/modules/people/membership-domain.ts` regards ENDED as terminal and denies application role mutation on an ENDED membership, but this is not an atomic DB invariant.

### Historical vulnerable interleaving (source-level finding, NOT a performed exploit)

1. Request A (grant a role) loads the person while membership status is ACTIVE and passes the service check.
2. Request B (END membership) takes the parent `college_memberships` row lock, updates it to ENDED, commits.
3. A enters `addMembershipRole`, locks only `membership_roles` rows, inserts a grant and commits without rechecking parent.
4. The database now has a role grant that was created **after** membership ended. Existing request-context resolution excludes non-ACTIVE memberships, so this does *not* by itself prove an immediately usable privilege; it does break the intended terminal role-mutation invariant and can affect audit/rejoin semantics.

## Implemented transaction-level mitigation and remaining Chat 1 review

- **Implemented directly on main:** `addMembershipRole` and `removeMembershipRole` now lock their `college_memberships` parent row using `FOR UPDATE`, check for parent existence and reject ENDED *before* reading child roles. `persistPersonMembership` now locks and rechecks the exact parent membership as ACTIVE *before* assigning onboarding roles. Lifecycle END already locks that parent. These changes stay in the current database transaction, including activity-event writes.
- After acquiring the parent lock, reject role insertion/removal when the parent's status is ENDED with `PeopleServiceError('MEMBERSHIP_ENDED')`; a missing parent fails with `MEMBERSHIP_NOT_FOUND`. The mutation/event write is never reached in that transaction.
- The original service must still authorize tenant scope and actor role: a trigger/constraint is not a substitute for permission checks.
- Role grants that were committed *before* END may remain stored for history, but must have no effective permission unless the membership is ACTIVE. Whether ENDED may ever be re-enrolled on the same record is an independent product decision.
- Avoid silently changing current SUSPENDED behavior: the application currently prohibits role changes for ENDED, not SUSPENDED.
- Source-only proof cannot establish the selected locking pattern actually works in PostgreSQL. Chat 1 still owns registered migrations, and any future raw-SQL/admin job that inserts roles must follow the same parent-lock rule or gain an approved database trigger. The current application writers implement the row lock, but two-connection database evidence remains required.

## Independent PostgreSQL gate (NOT EXECUTED)

Use an isolated disposable DB with at least two separate connections:

1. **END wins lock:** Tx B locks parent, changes ACTIVE → ENDED, while Tx A attempts new grant. After B commits, A must reject the grant; no new row or grant activity event.
2. **Grant wins lock:** Tx A locks parent and grants role; Tx B attempts END and must wait. Once A commits, B ends membership; effective roles must be denied despite the historical grant row.
3. **Already ENDED:** direct SQL role insert or role change must reject, even when bypassing service logic.
4. **SUSPENDED case:** only the product-approved behavior is accepted, and unrelated colleges/memberships remain independent.
5. **Cross-tenant actor:** a forged different-college membership ID must fail the authorization gate, not merely referential integrity.
6. **Replay/stale context:** a client that holds a previously ACTIVE membership object cannot grant after END.
7. **Full migration replay:** clean and incremental journal tests under independently disposable PostgreSQL; role/event audit must remain atomic.

**Present evidence:** direct-main TypeScript repository mutation and updated authored source-drift witness; source evidence is distinct from executed Node/Vitest/PostgreSQL. No new schema registered, no SQL applied, no PostgreSQL race run, and no vNext semantic field verified. Do not use global CI billing to delay unrelated DATABASE engineering.
