# UX-G043 / UX-G066 / UX-G095 — Role-specific route UX

**Canonical tracker:** `docs/tracker.json#uxReview`  
**Owner:** `ux-profile-cross-role-2026-11-07`  
**Source branch:** `main` (parallel, concurrency-safe path updates)

## G043 — College student onboarding, verification and course videos

- The bulk student importer now provides a direct “Register one student” alternative; individual registration points to “Import a CSV instead.” Both retain their directory return and original college-scoped form services.
- Student import, registration, profile verification and video error screens retain Retry and gain a visible route out to the appropriate college directory or lesson list. A failed data read is not shown as an empty saved list or successful mutation.
- Existing authorization (`hasMembershipRole`, `people.manage`, scoped service access), student validation and import dry-run remain untouched.
- Loading components keep bounded, named loading behavior.

## G066 — Learner verification, projects and quizzes

- Verification load errors now offer a return to the learner's profile alongside Retry, without interpreting the failure as a rejection.
- Projects listing errors offer an exit to learner home, without implying the user has lost project data.
- Project detail's existing tab-specific skeleton is now wrapped in the shared bounded slow-load retry, retaining exact canonical tab logic. Project detail access, not-found protections, filters, and the /learn/quizzes alias are unchanged.
- Private verification status still derives only from `getOwnLearnerVerificationStatus` and never equates saved identity data with approved verification.

## G095 — Faculty student details, courses, notifications and profile

- Invalid student history timestamps now show “Time unavailable” rather than crashing the teacher's student detail screen.
- Live-class scheduling has an explicit keyboard-accessible link to teaching courses; faculty profile and contact error controls keep 44px mobile retry targets.
- Existing faculty-role membership checks, scoped student reads, contact-data ownership, profile management and notifications remain unchanged.

## Acceptance strategy and release boundary

- All inventory files are asserted to exist by `tests/ux-cross-role-g043-g066-g095.test.mjs`; route-local positive/negative invariants are additionally asserted.
- `tests/fixtures/ux-cross-role-proof-page.tsx` imports real route-level error/loading components and is copied to a **temporary CI-only route**, never committed to production `src/app`.
- `tests/e2e/ux-cross-role-g043-g066-g095.spec.ts` tests Retry action, named recovery, keyboard focus, route exit destination, loading status, desktop/mobile overflow and runtime errors for one representative route per group.
- **Scoped UX DONE (G043/G066/G095).** [Executed GitHub Actions](https://github.com/42Students/lms-vnext/actions/runs/42397390851): 4/4 Node source-and-inventory contracts, scoped ESLint and 6/6 desktop/mobile Chromium route recovery scenarios passed. [Six screenshots](https://github.com/42Students/lms-vnext/actions/runs/42397390851/artifacts/13583464464) were retained. The **global TypeScript check failed in two concurrently edited HR loading files**, not these groups; no full-repository CI green is asserted. The exact paths and limitation are recorded in `docs/tracker.json#uxReview`.
- This component preview is not evidence of privileged end-to-end data writes or actual logged-in role sessions. Those are subject to the existing integration/security tests and require authorized test accounts.
- No auth, tenant selection, RLS, API service, database, roster import, read authorization, or server mutation code changed. Never weaken tests to manufacture closure.
