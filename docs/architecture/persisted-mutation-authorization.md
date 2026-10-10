# Persisted mutation authorization contract

**Owner:** W01 / issue #21  
**Status:** source-authored; PostgreSQL execution evidence pending

Request authentication builds a useful `RequestContext`, but that snapshot can become stale while a browser session remains alive. Any sensitive mutation whose authorization can be revoked must re-check the actor inside the same database transaction as the write.

Use `assertPersistedPlatformPermission(tx, context, permission, resource)` from `src/modules/permissions/persisted-actor.ts` after locking the target resource row and before mutation. The helper:

- takes SHARE locks on the persisted user row, selected membership and role rows until transaction commit;
- rebuilds system roles and membership roles from the database rather than trusting the request snapshot;
- reconstructs college and organization scope from persisted membership → college relationships;
- runs the existing centralized permission policy against the persisted context;
- fails closed for recruiter-only permissions, whose company/grant relationships require a dedicated persisted recruiter guard.

The intended lock order is **resource row → persisted actor/roles → write**. Feature owners must keep that order consistent in a domain to avoid lock-order inversions.

This contract addresses W05's TPO CRM TOCTOU request and is reusable by W02/W04/W06 transactional writes. It does not automatically secure existing services: each feature owner must call it inside its own mutation transaction. The Groups subsystem retains its stricter group-specific actor guard.

`tests/integration/persisted-permission.test.ts` authors cases for membership suspension, membership-role revocation, user disable, SUPER_ADMIN revocation and cross-college denial. These tests remain NOT VERIFIED until a disposable PostgreSQL runner executes them.
