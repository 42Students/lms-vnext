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
