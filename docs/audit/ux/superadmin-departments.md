# /superadmin/departments — UX source review

- **Surface:** `src/app/(authenticated)/superadmin/departments/page.tsx`.
- **Before:** Legacy department bookmark must not bypass global permission scope.
- **After:** Preserved context-aware legacyDepartmentDestination(context, SUPER_ADMIN), avoiding a second directory.
- **Access and state contract:** Authorization and UX inherited from canonical destination.
- **Test:** `tests/unit/UX-superadmin-departments-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.
