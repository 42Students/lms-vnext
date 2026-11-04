# 2026-11-04 — Notification SSE and explicit-role fail-closed hardening

**Repository:** `42Students/lms-vnext` / `main`  
**Status:** Source changes and adversarial test files committed. **CI did not execute its steps and no passing tests, real PostgreSQL tenant witness or production assurance are claimed.** This packet is engineering evidence, **not** a second execution tracker; authoritative security states remain `docs/tracker.json -> security.controls`.  
**Control linkage (partial, not VERIFIED):** SEC-02-008, SEC-02-014, SEC-02-016, SEC-03-008, SEC-03-009, SEC-03-010, SEC-03-024, SEC-04-008, SEC-05-018, SEC-05-019, SEC-05-020, SEC-08 and SEC-23.

## Slice A — authenticated notification EventSource stream

- `src/app/api/notifications/stream/route.ts`: rejects unknown, duplicate, empty or malformed selectors; denies bearer tokens in query strings and keeps error responses private/no-store.
- A supplied `classId` no longer becomes a class-size oracle merely because the actor belongs to the same college. It first passes `canSubscribeToClassNotificationStream`:
  - Learner: live persisted membership plus current enrollment in the section.
  - Faculty: active assignment to the particular class and validated teaching permission.
  - College Admin: live scoped course administration permission.
  - Super Admin: requires a deliberately selected college scope; an absent/foreign scope is denied.
  - Mentor, TPO, Recruiter and unselected roles: no implicit class-stream permission.
- After successful subscription, **each 15-second poll** revalidates the opaque first-party device session (revocation, account status and idle/absolute expiry), the exact identity subject, freshly loaded system/membership/recruiter grants, selected-role and tenant scope, and if class-scoped, the live enrollment or staff assignment **before querying notifications**. A mismatch terminates the stream without emitting a private payload.
- Existing own-recipient data selection, maximum three streams per user per instance, 3,000-person class guard and 110-second connection TTL remain. Development E2E impersonation remains supported only under its separate non-production gate; production requires the first-party token.
- New `src/modules/activity/notification-stream-authorization.ts` centralizes audience verification and role/tenant/grant snapshot comparison. Negative fixtures cover revoked role, tenant switch, disabled user, revoked recruiter grant, foreign class, absent operator role, unauthorized faculty, unscoped Super Admin, revoked device token and subject mismatch.
- Tests: `tests/unit/security-notification-stream-authorization.test.ts`, `tests/unit/security-notification-stream-route.test.ts`. Focused workflow: `.github/workflows/security-notification-stream.yml`.

**Source commits:** `8b942927418e762084e9a03973757ab318a6272a` (helper), `d31f750aee36bc44d9b55aff4306976e36573b94` (class boundary), `4a57ba9420ceef411e5d0fcec01e634fb0514ba5` (device live check), `85729a160e09df75226edc7f053a98b2a228721c` (grant comparison refinement).

## Slice B — no privilege from a missing or stale role cookie

- `src/modules/identity/context-service.ts::narrowToActiveRole` no longer selects College Admin (or another priority role) when one of several available roles was not explicitly selected. Invalid/revoked role selectors and no-role memberships resolve to an empty selected-role set, **never** a different role.
- `src/auth/request-context.ts` rejects every protected request whose active membership contains zero or multiple selected roles. This prevents older services from accidentally treating a mere membership ID as sufficient authorization. Platform/recruiter contexts without a college membership remain separate.
- `POST /api/auth/memberships` refuses to set any workspace/role cookie unless exactly one live selected role was returned by the trusted persisted resolver; absent role yields `ROLE_SELECTION_REQUIRED`, invalid/revoked role `ROLE_NOT_GRANTED`. A valid explicit Learner or College Admin role still receives its intended cookie.
- `GET /api/auth/memberships` reports `roleSelectionRequired:true` and no `currentRole` for an ambiguous selected membership instead of advertising a priority role.
- `src/components/shell/membership-switcher.tsx` no longer treats the first available role as already selected when none is authorized. The first legitimate option remains clickable for recovery.
- Tests: `tests/unit/security-explicit-selected-role.test.ts`, `tests/unit/security-explicit-role-switch-http.test.ts`, `tests/unit/security-auth-context-role-boundary.test.ts`. Focused workflow: `.github/workflows/security-role-selection.yml`.

**Source commits:** `fea451ded246e7050215938ca7f6dbae18aa1b4f` (central deny default), `3b90de498a0a4dd1efdd6d8620452e7526b33d93` (HTTP switch), `6821f04c74a45a40e27eeb0351794725a549588b` (UI recovery), `53d388b0e3fc1558774955eb498f20db22e90ed6` (common protected-request rejection), `2e98c5b22047fc32a7f2b1e74467870afa6d8f98` (CI gate).

## Acceptance still required — do not close controls

Run these commands on a trusted exact-SHA checkout with Node 22, committed dependencies and isolated fixtures:

```bash
npx vitest run \
  tests/unit/security-notification-stream-authorization.test.ts \
  tests/unit/security-notification-stream-route.test.ts \
  tests/unit/security-explicit-selected-role.test.ts \
  tests/unit/security-explicit-role-switch-http.test.ts \
  tests/unit/security-auth-context-role-boundary.test.ts \
  tests/unit/chat6-auth-memberships-private-16.test.ts \
  tests/unit/mentor-shell-role-skin-matrix.test.ts
npm run typecheck
npm run lint
```

A source-patched file or an authored test is not an executed test. The security stream job in [Actions 41836537618](https://github.com/42Students/lms-vnext/actions/runs/41836537618) and other jobs on that revision were recorded as **failure with zero executed steps**; that is an infrastructure/pre-execution blocker, not evidence that the assertions passed or failed. Preserve a passing exact-SHA test receipt when independent CI or a trusted local runner is available.

Follow-up acceptance must include real disposable PostgreSQL two-college/two-user/dual-role fixtures, verified no-unauthorized-row-count and no-notification side effects, role revocation during a live SSE connection, device logout concurrently with polling, no stale data after switching, platform/recruiter cross-tenant access, browser recovery for a missing role cookie, full app TypeScript/lint/build and deployment ingress stream quotas. The 15-second polling interval bounds normal revocation detection but is **not atomic concurrency protection**, and distributed rate limiting remains an external deployment requirement. Independent production restricted-role RLS and branch-protection verification remain open.
