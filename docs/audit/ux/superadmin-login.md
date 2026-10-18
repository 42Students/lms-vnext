# /superadmin-login — UX source review

- **Surface:** `src/app/superadmin-login/page.tsx`.
- **Before:** Legacy superadmin sign-in route must not fork login/MFA handling.
- **After:** Preserved existing redirect to shared authentication entrypoint; no competing privileged form created.
- **Access and state contract:** Privileged second-factor and form states remain responsibility of shared sign-in.
- **Test:** `tests/unit/UX-superadmin-login-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.
