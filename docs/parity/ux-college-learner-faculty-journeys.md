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
- [Scoped acceptance GitHub Actions](https://github.com/42Students/lms-vnext/actions/runs/42397390851) has the authoritative lint, contract, browser, screenshot and TypeScript results. **Do not mark DONE until executed evidence is available.**
- This component preview is not evidence of privileged end-to-end data writes or actual logged-in role sessions. Those are subject to the existing integration/security tests and require authorized test accounts.
- No auth, tenant selection, RLS, API service, database, roster import, read authorization, or server mutation code changed. Never weaken tests to manufacture closure.
