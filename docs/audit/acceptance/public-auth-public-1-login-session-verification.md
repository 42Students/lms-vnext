# Public login / session — chat-11 round-two verification

DONE below means implemented plus a named acceptance test written, **not that the test passed**. The orchestrator runs the test suite, typecheck, lint and browser checks after merge.

| Gap ID | Status | Evidence |
|---|---|---|
| PUB-auth-public-01 | DONE | src/modules/auth/runtime.ts; src/modules/colleges/public-signin-policy-service.ts; src/app/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-01 enforces per-college allowed login methods on client and server")` |
| PUB-auth-public-02 | DONE | src/modules/colleges/signin-methods-model.ts; src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-02 defaults email first and preserves the college method order")` |
| PUB-auth-public-03 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-03 restores registered contact, code and resend labels")` |
| PUB-auth-public-04 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-04 uses exact legacy guidance for wrong and expired OTP")` |
| PUB-auth-public-05 | DONE | src/app/page.tsx; src/app/layout.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-05 uses 42LMS branding tenant title and legal footer")` |
| PUB-auth-public-06 | DONE | src/components/auth/login-form.tsx; src/app/page.tsx; public/assets/static/terms-and-conditions-view.html; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-06 consent and privacy terms are available on both steps")` |
| PUB-auth-public-07 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-07 validates mobile and email inline before sending")` |
| PUB-auth-public-11 | DONE | src/app/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-11 expired session shows the legacy re-login sentence")` |
| PUB-auth-public-12 | DONE | src/components/auth/session-response-guard.tsx; src/app/(authenticated)/layout.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-12 intercepts revoked or expired sessions on open tabs")` |
| PUB-auth-public-13 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-13 restores an unexpired one-time-code attempt after refresh")` |
| PUB-auth-public-16 | DONE | src/app/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-16 displays the college logo or initials monogram fallback")` |
| PUB-auth-public-17 | DONE | src/app/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-17 shows unknown-college recovery instructions and main sign-in link")` |
| PUB-auth-public-19 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-19 wrong-college contact offers a platform sign-in recovery link")` |
| PUB-auth-public-25 | DONE | src/app/superadmin-login/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-25 retains secure superadmin-login legacy bookmark redirect")` |
| PUB-auth-public-33 | DONE | src/app/login/page.tsx; src/app/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-33 recruiter=email legacy invitation opens email first")` |
| PUB-auth-public-34 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-34 method tabs announce selection and allow keyboard arrows")` |
| PUB-auth-public-37 | DONE | src/app/auth/handoff/page.tsx; tests/unit/public-auth-login-gap-verification.test.ts — `it("PUB-auth-public-37 safely retires legacy handoff tokens by redirecting to fresh login")` |

| PUB-auth-public-08 | DONE | src/components/auth/membership-chooser.tsx; tests/unit/public-auth-chooser-graceful-gap.test.ts — `it("PUB-auth-public-08 restores last used active college as radio default")` |
| PUB-auth-public-09 | DONE | src/components/auth/membership-chooser.tsx; tests/unit/public-auth-chooser-graceful-gap.test.ts — `it("PUB-auth-public-09 shows suspended memberships but never allows selection")` |

| PUB-auth-public-10 | DONE | src/lib/return-to.ts; src/app/(authenticated)/layout.tsx; src/components/auth/login-form.tsx; tests/unit/public-auth-round3-gap-verification.test.ts — `it("PUB-auth-public-10 preserves authorized returnTo through re-login")` |
| PUB-auth-public-14 | DONE | src/components/auth/login-form.tsx; tests/unit/public-auth-round3-gap-verification.test.ts — `it("PUB-auth-public-14 leaves unusable OTP screen open with immediate resend")` |
| PUB-auth-public-15 | NOT-A-GAP | docs/audit/owner-decisions-resolved.md OD-19 explicitly excludes login mascot; tests/unit/public-auth-round3-gap-verification.test.ts — `it("PUB-auth-public-15 legacy mascot is NOT-A-GAP by owner decision OD-19")` |
| PUB-auth-public-18 | DONE | src/modules/auth/request-tenant.ts; src/app/page.tsx; tests/unit/public-auth-round3-gap-verification.test.ts — `it("PUB-auth-public-18 never caches domain lookup outages as unknown tenants")` |
| PUB-auth-public-27 | DONE | src/app/not-found.tsx; src/components/public/graceful-screen.tsx; tests/unit/public-auth-round3-gap-verification.test.ts — `it("PUB-auth-public-27 maintains legacy 404 text on graceful recovery")` |

| PUB-auth-public-28 | DONE | src/app/(authenticated)/error.tsx, src/components/public/graceful-error-boundary.tsx; tests/unit/public-auth-error-retry-round5.test.ts — `it("PUB-auth-public-28 retains legacy workspace failure text without exposing errors")` |
| PUB-auth-public-32 | DONE | src/lib/api-fetch.ts, src/components/auth/login-form.tsx; tests/unit/public-auth-error-retry-round5.test.ts — `it("PUB-auth-public-32 respects bounded Retry-After seconds for login backoff")` |

| PUB-auth-public-36 | DONE | src/modules/notifications/exotel-sms.ts, zeptomail-email.ts, src/modules/auth/login-service.ts; tests/unit/chat11-provider-copy-round5.test.ts — `it("PUB-auth-public-36 preserves registered DLT SMS and the legacy ZeptoMail OTP merge fields")` |

| PUB-auth-public-35 | NOT-A-GAP | docs/audit/decisions/session-absolute-expiry.md; src/modules/auth/config.ts, session-service.ts; tests/unit/chat11-session-course-gap-verification.test.ts — `it("PUB-auth-public-35 documents five-day absolute session expiry without sliding tokens")`. Deliberately favors shorter absolute device-session expiry and per-device revocation over legacy 30-day refresh. |

## Outstanding gaps (not claimed closed)
`PUB-auth-public-20/21/22/23/24/26/29/30/31/38/39` remain pending implementation, context verification or other lane integration. They are not classified BLOCKED merely for complexity. The shared graceful error / guarded-action helpers are not yet present on this branch, so page adoption awaits their merge.

No test execution in this builder lane; orchestrator owns test runs.

## Chat-9 decided UNCONFIRMED (round 7; source checks, CI pending)
| Gap ID | Status | Decision and evidence |
|---|---|---|
| PUB-auth-public-22 | DONE source | Single active college renders its name, not a pointless selector. Multi-college selector remains. `src/components/shell/membership-switcher.tsx`; `tests/unit/chat9-unconfirmed-public-auth-round7.test.ts` PUB-auth-public-22. |
| PUB-auth-public-23 | NOT-A-GAP | Clearing a session-scoped membership by accidentally selecting the blank placeholder is unsafe; the placeholder is disabled and no DELETE is issued by the switcher. Explicit account switching remains. `src/components/shell/membership-switcher.tsx`; same test PUB-auth-public-23. |
| PUB-auth-public-26 | NOT-A-GAP | Retire college-specific roll-number/PIN login in favor of centralized email/phone OTP on resolved tenant hosts; do not revive a weaker school-specific credential or unverified college skin. `src/modules/auth/config.ts`; same test PUB-auth-public-26. |
| PUB-auth-public-30 | DONE source (learner projects) | When college disables Projects, fail closed before reads and display exact legacy message instead of silently redirecting. `src/app/(authenticated)/learn/projects/page.tsx`; same test PUB-auth-public-30. Other disabled module routes to verify. |
| PUB-auth-public-35 | NOT-A-GAP | Keep five-day absolute device-session lifetime; last_seen_at is observational, not a silent 30-day extension. `docs/audit/decisions/session-absolute-expiry.md`, `src/modules/auth/session-service.ts`; same test PUB-auth-public-35. |
| PUB-auth-public-36 | DONE source | Existing Exotel DLT OTP body and ZeptoMail merge fields preserve verified template semantics; no delivery claim. `src/modules/notifications/exotel-sms.ts`, `src/modules/notifications/zeptomail-email.ts`; same test PUB-auth-public-36. |
