# Shared UX kit: UX-G163 and UX-G164

8 November 2026 · `42Students/lms-vnext` · `main`.

This is **implementation and UX acceptance evidence**, not a separate tracker. The sole ownership and closure status lives at `docs/tracker.json#uxReview.groups`. This does not certify release readiness, tenant security, or whole-app parity.

## UX-G164 — shared forms, states and pagination

Reviewed **15** canonical files: `form-field`, `graceful-page-loading`, `inline-notice`, `input`, `loading-state`, `long-text`, `page-header`, `page-loading`, `pagination`, `permission-action`, `select`, `selection-controls`, `skeleton`, `stat-tile`, and `status-badge`. No unnecessary rewrite of native keyboard behavior, labels, permissions or status text was performed.

Implementation `47d9772e02d0700a995708660c9d252433cea8de`:
- `Skeleton` supports an `aria-hidden` decorative option for nested placeholders. Standalone skeleton loading remains announced. This eliminates duplicate nested status announcements in `GracefulPageLoading` and `PageLoading`.
- Faculty-course placeholder motion honors reduced-motion preferences; slow loading retains a native recovery button with a mobile touch target.
- `InlineNotice` aligns ARIA live priority with an explicit alert/status role override.
- `Pagination` reports `Showing 0–0` rather than inventing visible records for stale out-of-range filtered pages.

A test-only change in `a72d618455a3156119f732063e2b5a320718c25a` clicks the styled switch via its visible label. First CI run <https://github.com/42Students/lms-vnext/actions/runs/42460842220> had passing lint and unit tests but failed browser interaction due to the test attempting `check()` directly on a visually hidden native input; no production code was altered for that failure.

**Acceptance:** <https://github.com/42Students/lms-vnext/actions/runs/42461197085> triggers scoped ESLint, Vitest (`tests/unit/ux-g164-shared-kit.test.tsx` and `tests/ux-playbook-primitives.test.tsx`), Chromium (both viewport sizes in `tests/e2e/ux-g164-shared-kit.spec.ts`), full TypeScript check, screenshots and traces. The `/e2e/ux-shared-kit` fixture is unavailable outside `NODE_ENV=development` and explicit `E2E_AUTH_ENABLED=true`.

## UX-G163 — shared interactions, overlays and files

Reviewed **15** canonical files: `avatar`, `bottom-sheet`, `breadcrumbs`, `button`, `card`, `confirm-action-dialog`, `confirm-dialog`, `data-table`, `dialog`, `disabled-reason`, `drawer`, `empty-state`, `error-state`, `file-upload`, and `filter-bar`. Existing native dialog focus behavior, validation and permission-scoped data-table field handling remain.

Implementation `098d3d00b1fe62fea6ad939212477242483a3f59`:
- Avatar initials and images have an accessible image name even if the supplied label is blank.
- `Button variant="bare"` now disables and sets `aria-busy` during pending work, just like styled button variants; this prevents repeated actions.
- Filter bars without actual filters no longer render empty dialog/drawer content.
- Empty breadcrumb sets no longer create an empty landmark; unsafe URLs remain unlinked.
- `ErrorState` respects alert/status live announcement priority without weakening safe retry-link filtering.

**Acceptance:** <https://github.com/42Students/lms-vnext/actions/runs/42461350528> runs scoped ESLint, Vitest (`tests/unit/ux-g163-shared-actions.test.tsx` and existing playbook tests), Chromium desktop/mobile (`tests/e2e/ux-g163-shared-actions.spec.ts`), and full TypeScript. The synthetic `/e2e/ux-kit-actions` fixture exercises confirmation/cancel, responsive filtering, file type rejection/removal, busy buttons and no page overflow; no real backend mutation is possible in this fixture. It is guarded to development plus explicit `E2E_AUTH_ENABLED=true`.

## Regression and security boundary review

No API, database migration, authentication, tenant scoping, file access, provider credential or authorization rule was changed in either group. Existing safe internal href checks, per-row data visibility checks, modal dismissal guards, and server-side file validation boundaries are not loosened. Upload preview/accept/size checks are **only UX prechecks** and never grant upload authority. Both fixture routes return not-found in production.

**Closure gate:** Groups remain `DOING` until exact-SHA CI succeeds at all steps and archived desktop/mobile screenshot artifact links are recorded under each group's canonical evidence object, with test outputs and regression/security review. A passing browser step alone is not sufficient.


## UX-G164 exact-SHA verified results — CLOSED GATE

- Head SHA: `a72d618455a3156119f732063e2b5a320718c25a`, workflow <https://github.com/42Students/lms-vnext/actions/runs/42461197085>; checkout SHA assertion, scoped ESLint, unit tests, browser tests and full TypeScript **all succeeded**.
- Unit: `npx vitest run tests/unit/ux-g164-shared-kit.test.tsx tests/ux-playbook-primitives.test.tsx --reporter=dot`: **18/18 passed** (2 files).
- Browser: `npx playwright test tests/e2e/ux-g164-shared-kit.spec.ts --project=chromium --reporter=line`: **2/2 passed**, desktop 1280×800 and mobile 390×844, including real input, polite notice, labels, grouped status, pagination transition, horizontal overflow and no JS errors.
- Screenshot artifact: <https://github.com/42Students/lms-vnext/actions/runs/42461197085/artifacts/13609419570> — `ux-g164-desktop.png`, `ux-g164-mobile.png`. The exact-SHA CI stored both views; the browser suite asserts each view's interactive behavior. This fixture does not exercise a live tenant's backend.
- Regression boundary: existing shared playbook tests passed; no production app-wide regression claim, security policy, API endpoint or DB schema was modified. No role permission or internal-link sanitization change was made.

The independent UX-G164 tracker entry may be set to DONE with this run and artifact as evidence.
