# 2026-11-04 — Actor-bound privileged membership and account mutations

**Repository:** `42Students/lms-vnext` — `main`  
**Accepted tested source SHA:** [`53ba088fc89dd22a8d1a337ac4c79e94933c33a6`](https://github.com/42Students/lms-vnext/commit/53ba088fc89dd22a8d1a337ac4c79e94933c33a6)  
**Focused CI:** [run 41815744141](https://github.com/42Students/lms-vnext/actions/runs/41815744141) — **completed SUCCESS**, 66/66 unit tests (5 suites), full TypeScript pass.

This is scoped engineering evidence. It is **not** 493-control certification, independent MFA assurance, live production RLS validation, or a full repository CI receipt. The only live status source is `docs/tracker.json -> security.controls`; this document must never be edited to adjust totals.

## Vulnerabilities and risks addressed

1. **Inconsistent freshness guards on account privilege changes.** Membership `POST/DELETE /api/people/{membershipId}/roles` previously required fresh sign-in only for College Admin/TPO. Learner, Faculty and Mentor assignments/removals could run from an older device session. Membership `PATCH .../lifecycle` and `POST /api/people/onboard` could likewise mutate access without fresh sign-in for ordinary roles.
2. **Potential mismatched device proof.** The shared `requireRecentDeviceAuthentication` previously established freshness of a first-party device session but did not compare its user ID to `getCurrentRequestContext().user.id`. This could confuse request-context and independent device identities, particularly in development E2E impersonation mode. The helper now requires the exact expected user ID, rejects malformed user identifiers, and rejects subject mismatch *before* querying privilege-attestation rows.
3. **Additional privileged account workflows.** Super Admin recruiter account creation/changes, explicit college company-relationship grants/revocation and platform-wide account disable/reactivation now call actor-bound recent sign-in before invoking their protected mutation services.
4. **Unbounded JSON and private response caching.** Membership role and lifecycle requests now use bounded 2 KiB JSON streams; onboarding uses an 8 KiB cap. A large body fails with HTTP 413 even without reliable `Content-Length`. Membership role/lifecycle success responses use `private, no-store` and `Vary: Cookie`.
5. **Operator remediation.** Membership and onboarding UI states now surface `RECENT_SIGN_IN_REQUIRED` with guidance to sign in again rather than presenting it as a generic server fault.

## Changed code areas

- `src/auth/recent-device-auth.ts`: mandatory `expectedUserId`, UUID and exact session subject match; retains DB-backed nonrevoked/unexpired session and ten-minute sign-in creation-time check.
- `src/app/api/people/[membershipId]/roles/route.ts`, `.../lifecycle/route.ts`, `src/app/api/people/onboard/route.ts`: origin, bounded body, permission and fresh identity checks before all affected mutations.
- `src/app/api/admin/hr/route.ts`, `src/app/api/admin/hr/[userId]/route.ts`, `src/app/api/admin/hr/[userId]/grants/route.ts`, `src/app/api/admin/hr/[userId]/grants/[grantId]/route.ts`, `src/app/api/admin/people/platform/[userId]/route.ts`: privileged writes require recent same-user session.
- All existing callers of the shared fresh-authenticated private export guard now pass `context.user.id`, including Super Admin/college people, tenants, roles, companies, placements, hiring and student progress exports.
- `src/components/admin/person-membership-actions.tsx` and `src/components/admin/person-onboard-dialog.tsx`: visible sign-in recovery wording on access denial.

## Executed tests and preservation of positive paths

The dedicated, exact-source workflow tests:

| Suite | Passing |
|---|---:|
| `security-membership-reauth-http.test.ts` | 22 |
| `security-super-admin-account-reauth.test.ts` | 11 |
| `private-bulk-csv-security.test.ts` | 21 |
| `security-recent-device-subject-binding.test.ts` | 8 |
| `recent-device-privileged-role-security.test.ts` | 4 |
| **Total** | **66/66** |

The tests cover positive role/lifecycle/onboarding/admin grant behavior and negative cases: stale session denial before service calls, identity A session disallowed for identity B, E2E/context mismatch, malformed selectors, revoked/old device rows, cross-origin CSRF, malformed role/action and oversized bodies. TypeScript passed at the same code SHA. Existing Super Admin/college privilege checks remain in place; the new guard is additive.

## Residual risks and explicit follow-ups

- This is **recent OTP-backed full sign-in**, not a dedicated independent, phishing-resistant **step-up MFA challenge** at the action. Require independent authenticator enrollment/recovery and a proper step-up UI for high-assurance release.
- Mocked HTTP writers establish denial-before-side-effect ordering, not full PostgreSQL authorization or race proof. Exercise actual runtime-role SQL, row locks, concurrent privilege revocation and cross-tenant relationships on disposable production-equivalent PostgreSQL.
- Inventory all other admin, integration and bulk permission mutations. A passing focused five-suite run does not prove 100% method coverage.
- Some operators must sign in again after ten minutes; improve the reauthentication UX to preserve draft state without weakening the server guard.
- The 493-control tracker remains conservative: focused tests are **PARTIAL_EVIDENCE**, not `VERIFIED` closure; separate deployed-config review and independent approval are mandatory.
- The earlier full-history secret-scan failure and repository main-protection gap are not resolved by this batch.

**Tracking evidence:** `docs/tracker.json` links this passing workflow under SEC-02-013, SEC-03-015, SEC-03-016, SEC-03-019, SEC-03-026 and SEC-14-008, preserving every other previously recorded status.
