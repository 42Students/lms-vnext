# /superadmin/[...legacy] — UX source review

- **Surface:** `src/app/(authenticated)/superadmin/[...legacy]/page.tsx`.
- **Before:** Legacy deep links require explicit safe handling and role scope, not a second admin UI.
- **After:** Preserved role fence, allowlisted legacy destination lookup, unknown-path 404 and bounded q forwarding; no new DOM or popup.
- **Access and state contract:** Authenticated Super Admin role remains mandatory; unknown query keys are dropped.
- **Test:** `tests/unit/UX-superadmin-legacy-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.
