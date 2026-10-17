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

## Outstanding gaps (not claimed closed)
`PUB-auth-public-08/09/10/14/15/18/20/21/22/23/24/26/27/28/29/30/31/32/35/36/38/39` remain pending implementation, context verification or other lane integration. They are not classified BLOCKED merely for complexity. The shared graceful error / guarded-action helpers are not yet present on this branch, so page adoption awaits their merge.

No test execution in this builder lane; orchestrator owns test runs.
