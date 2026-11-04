# 2026-11-04 — Session lifetime and privilege-change invalidation (implementation; CI blocked)

**Workstream:** 42LMS vNext security hardening on `main`.  
**Status:** Source changes committed, adversarial unit and disposable PostgreSQL tests registered. **NOT VERIFIED/CLOSED**: GitHub Actions jobs are failing before executing any steps. Do not promote any 493-control statuses on this evidence alone.

## Applied security changes

1. `src/modules/auth/session-service.ts`:
   - The database-backed session resolver denies ordinary devices after **8 hours of inactivity** and any Super Admin identity after **30 minutes of inactivity**, regardless of active college-role cookie.
   - Super Admin identities have a **hard 8-hour absolute session lifetime** even with regular activity. Ordinary sessions retain their existing five-day absolute lifetime subject to the 8-hour inactivity limit.
   - Both policies derive from persisted `system_roles` and PostgreSQL `clock_timestamp()`; caller-provided role, clock or Host cannot extend them.
   - Atomic `UPDATE ... RETURNING` requires valid absolute expiry, valid current heartbeat, both idle and privileged absolute bounds, nonrevocation and an active user. The diagnostic SELECT returns `SESSION_EXPIRED` for idle/old/future timestamps without restoring access.
   - The account-security active-device listing applies the same idle and privileged absolute predicate so it does not display dead credentials as live.

2. `src/modules/people/repository.ts`:
   - A *successful new* college membership role grant, role removal or role addition through re-onboarding revokes **all active device sessions belonging to the target user**, not the actor or another tenant user.
   - The revocation is executed inside the same PostgreSQL transaction as the role grant/removal and audit write. Failure rolls back the privilege mutation.
   - Duplicate/idempotent grants do **not** revoke a new session unnecessarily.
   - Existing membership SUSPEND/END revocation remains intact.

3. `src/modules/system-roles/repository.ts`:
   - A genuinely new `SUPER_ADMIN` assignment invalidates the target user's prior device sessions in the same transaction as the persisted role grant and critical audit event.
   - Operator-only CLI bootstrap of an existing identity also revokes its pre-existing sessions before the new system role is committed.
   - Repeated bootstrap/assignment that adds no new role remains idempotent without session revocation.

## Adversarial tests added / extended (awaiting actual execution)

- `tests/unit/security-device-session-idle-policy.test.ts`: assert DB-derived privilege policy, per-query idle and absolute bounds, no future timestamp accept, no eligible session from error classification and zero-success-on-DB-error behavior.
- `tests/integration/db01-session-atomic-authorization.test.ts`: disposable PG17 checks against actual `resolveSession`, including inactive ordinary and privileged devices, absolute Super Admin expiry despite fresh heartbeat, future heartbeat fail-closed, no idle heartbeat resurrection, and existing concurrent revocation tests.
- `tests/integration/db01-membership-role-parent-lock.test.ts`: actual Drizzle repository should revoke on grant/removal/onboarding role addition, scope revocation to the target, preserve no-op behavior, and retain existing cross-tenant/race checks.
- `tests/integration/identity-system-roles.test.ts`: existing user and seed learner device invalidation on Super Admin grant, CLI bootstrap of pre-existing user, and idempotent retry preservation.
- `.github/workflows/security-session-idle.yml`: exact-SHA npm/TypeScript job and a disposable PostgreSQL 17 job with migration-journal integrity check, both watching the security implementation and tests.

## Why closure is blocked

The dedicated workflow [run 41833635712](https://github.com/42Students/lms-vnext/actions/runs/41833635712) **failed before running its first step**. Both jobs reported `failure` with **0 executed steps**, approximately 1–2 seconds after starting. Unrelated project [CI run 41833646362](https://github.com/42Students/lms-vnext/actions/runs/41833646362) failed the same way across numerous jobs with no executed steps. This is not an observed Vitest, TypeScript or PostgreSQL failure. The precise Actions service/account cause is not available from these results; repository administration should check Actions availability, spending limits, billing and runner eligibility.

**This batch must not be counted as verified**. On runner recovery, inspect the new exact-SHA workflow and fix any actual code/test issues, then update the relevant canonical `docs/tracker.json` controls with only successful exact-SHA acceptance evidence. In particular, future signoff must cover SEC-02-004, SEC-02-005, SEC-02-006, SEC-02-008, SEC-03-020 and SEC-23-013 as appropriate.

## Important residual work

- Test role revocation versus session issuance under racing transactions using the real restricted runtime principal, not just the existing role-parent-lock and resolver-revocation tests.
- Expand security coverage to all routes assigning system roles, module-specific access grants, API authorization, tenant restrictions and RLS.
- Add an interactive step-up MFA challenge, enterprise session-risk management, conditional access and legitimate user-facing session expiration/recovery.
- Resolve the earlier 240 potential secret-history scan findings and make `main` branch protection mandatory. No production security certification is claimed.
