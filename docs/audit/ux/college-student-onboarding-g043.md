# UX-G043 — College student onboarding and verification

In scope: `src/app/(authenticated)/college/students/import/`, `register/`, `verification/`, `videos/` (page, error and loading states).

The bulk importer and single-student registration now cross-link with clear destinations, while preserving the student directory return path, college-admin membership checks and the original import/registration services. Import, registration, verification and videos route errors now provide both Retry and safe return navigation. Loading states remain named and bounded.

Test contract: `tests/ux-cross-role-g043-g066-g095.test.mjs`. Browser evidence: `tests/e2e/ux-cross-role-g043-g066-g095.spec.ts`, desktop/mobile screenshot for `college`. [Executed CI](https://github.com/42Students/lms-vnext/actions/runs/42397390851) passed 4/4 grouped source tests, scoped lint and 6/6 grouped browser cases. [Screenshots](https://github.com/42Students/lms-vnext/actions/runs/42397390851/artifacts/13583464464) include College desktop/mobile. The separate global TypeScript step failed in two HR loading files outside group ownership. Source assertions include every owned file.

Regressions reviewed: no new permission grants, no bypass of college-managed scope, no unconfirmed import or deletion claims, no changes to typed forms, exports, or identity data. **Full privileged workflow acceptance is separate from the CI preview** and must not be inferred from this group proof.
