# College administrator membership and device-session lifecycle

This records the vNext membership model and highlights the historical behavioral difference in G2-18-031-054. It is not a deployment test or approval to change authentication.

## Membership versus global account
- A person may own several college memberships and roles. Suspending or ending one membership must remove access through that membership, without silently ending unrelated college memberships or deleting the user record.
- The identity-device session is attached to a user, not to one college. Where a privileged administrator action explicitly revokes all active devices, that sign-out is **user-wide across colleges**. Do not describe it as a membership-only session revocation.
- `src/modules/colleges/admin-session-service.ts` already implements the explicit `SUPER_ADMIN_SIGN_OUT_EVERYWHERE` action by updating all current unrevoked `identity_device_sessions` for the target user, under a selected-college authorization check and persisted permission transaction. Audit is written only when sessions actually changed.
- The old administrator lifecycle stored suspendedAt/reason, token/session invalidation and reversible reactivation as one account-style control. vNext expresses access through membership status ACTIVE/SUSPENDED/ENDED; a reactivation must restore only an eligible suspended membership and must not manufacture a new role or resurrect a different ended membership.

## Required verification before parity closure
1. Confirm which vNext lifecycle mutations revoke all user sessions versus only invalidate the selected membership's permission checks. Never assume membership status has the same blast radius as global device logout.
2. Under a persisted active actor check, verify that SUSPENDED membership cannot pass role/membership authorization, including API calls with a preexisting session; other active colleges remain accessible only when session is still valid and actor is authorized.
3. Verify reactivation clears suspended membership state/reason according to its domain contract, produces a fresh authorization decision, and does not automatically restore revoked sessions.
4. Verify a suspended person's subsequent sign-in still obeys other active memberships and account platformStatus, rather than bypassing policy through the college x role switcher.
5. Verify audit events and explicit session revocation/activation receipts under concurrent requests; do not claim token-version semantics until auth-service inspection confirms them.

## Product decision
Retain one workspace per role and explicit college × role switcher. Clarify in UI when a action signs out all devices versus suspending one membership; keep irreversible deletion separate from reversible suspension. No code, migration, session revocation or tests were performed as part of this note.
