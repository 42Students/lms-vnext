# /superadmin — UX source review

- **Surface:** `src/app/(authenticated)/superadmin/page.tsx`.
- **Before:** Legacy bookmark is a route bridge, not an independent dashboard.
- **After:** Preserved same-tab redirect to existing canonical Super Admin academics page; no parallel UI or undocumented navigation text.
- **Access and state contract:** Canonical /admin page owns shared component design and authorization.
- **Test:** `tests/unit/UX-superadmin-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.

- **Route boundary:** Added `loading.tsx` with a bounded shared skeleton/retry and `error.tsx` using the shared privacy-safe error/recovery UI. Canonical redirect and role guards are unchanged. Both are now checked by the route-specific UX test (not executed).
