# /superadmin/programs — UX source review

- **Surface:** `src/app/(authenticated)/superadmin/programs/page.tsx`.
- **Before:** Legacy programs bookmark must not bypass global permission scope.
- **After:** Preserved context-aware legacyProgramDestination(context, SUPER_ADMIN), avoiding a second directory.
- **Access and state contract:** Authorization and UX inherited from canonical destination.
- **Test:** `tests/unit/UX-superadmin-programs-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.
