# UX-G135 — College public contact profile form (2026-11-07)

Engineering UX status: `DONE` (2026-11-08). Canonical authority: `docs/tracker.json#uxReview.groups`. Release-wide security/browser gates remain independent.

- Scope: `src/components/colleges/college-contact-profile-form.tsx`, consumed by the existing college-profile page. No change to the server's tenant authorization, field whitelist, optimistic version contract or update API.
- Before: `Reset` immediately deleted every unsaved field edit with no confirmation. After: a dirty-state screen reader announcement accompanies changes, and Reset opens a cancellable danger-style confirmation. Cancel retains every unsaved field; confirmation restores the last successfully saved name, public support email/phone, terms and privacy URLs. Pending save disables discard.
- Submit still shows the existing confirmation review before the PATCH with `expectedVersion` and `confirm:true`. Failed/stale saves keep the draft, and known server conflict codes are translated into actionable plain-language guidance; success refreshes the visible saved profile. None of the added UI stores or exposes private college data.
- Development-only test page `/e2e/ux-g135-contact-profile` mounts the real component with synthetic public contacts and does not render outside `NODE_ENV=development`. Playwright intercepts **every** write; no production contact profile or authorization test account is used.
- Focused unit checks `tests/unit/ux-g135-college-contact-profile.test.tsx` and existing `UX-college-college-college-profile-01.test.ts`; Chromium tests `tests/e2e/ux-g135-college-contact-profile.spec.ts` at 390 and 1280 test destructive reset cancellation, confirmed reset, invalid email and non-HTTPS policy link rejection, failed/stale save, successful versioned save, responsive overflow and screenshot proof.
- Dedicated `.github/workflows/ux-g135-college-contact-acceptance.yml` requires ESLint, TypeScript, unit tests and exactly **6/6** browser scenarios with zero flaky/unexpected/skipped outcomes. Update status to DONE **only after execution passes** and attach the exact commit/run/artifact.

## Executed closure evidence — 2026-11-08

- Exact source revision: `4d303ffae0f0acc753b05b049e4086d92e2cdb80`.
- [GitHub Actions 42458499414](https://github.com/42Students/lms-vnext/actions/runs/42458499414) finished **success**: scoped ESLint, full TypeScript, 5/5 unit and preexisting college regression cases, 6/6 Playwright Chromium cases at 390px and 1280px (0 skipped/flaky/unexpected).
- [Browser artifact 13609071161](https://github.com/42Students/lms-vnext/actions/runs/42458499414/artifacts/13609071161) captures synthetic form reset/cancel, invalid validation, stale conflict, confirmed versioned save and viewport screenshots.
- The original failing run 42457371942 demonstrated an ambiguous `role=alert` locator matching the Next route announcer. Assertion corrected to require the exact stale-message content, with full expectation intact. The component/service tenant policy and versioned PATCH contract were not loosened.
- Acceptance is **component UX** and dev-only intercepted network browser proof, **not** real college API authorization or full production release certification. Existing college service regression was exercised by the accepted unit job; role/tenant server invariants remain separately gated.
