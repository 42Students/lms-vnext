# UX-G050 — /enterprises public marketing journey

**Owner:** ux-marketing-trio-2026-11-07  
**Source:** `src/app/enterprises/{page,error,loading}.tsx`  
**Status:** scoped browser and source acceptance passed (7 November 2026); independent group closeout recorded in canonical tracker.

## Implemented UX
- Early Request a Demo CTA and keyboard-accessible shortcuts to the connected-workflows and capabilities sections, with stable anchors and 44px targets.
- Kept the established enterprise outcomes disclaimer, non-AI product claims, existing canonical/structured metadata, and shared marketing shell intact.
- Contextual marketing loading skeleton uses the existing bounded retry; public error fallback returns to /home.

## Executed evidence
- [GitHub Actions scoped acceptance run](https://github.com/42Students/lms-vnext/actions/runs/42390390665): `node --test tests/ux-marketing-trio-group.test.mjs` (all 3 groups pass), scoped ESLint and 6/6 Chromium browser cases pass.
- `UX-G050` has one **1280×800 desktop** and one **390×844 mobile** test. Rendered desktop/mobile routes assert heading, anchor navigation, keyboard focus, horizontal overflow, runtime errors, and real /request-demo destination.
- [Screenshot artifact with all six captures](https://github.com/42Students/lms-vnext/actions/runs/42390390665/artifacts/13580969005): `ux-marketing-trio-evidence/enterprises-desktop.png` and `ux-marketing-trio-evidence/enterprises-mobile.png`.
- Source SHA used for acceptance: `38fa70d71d4b282b73f18d32b7e2b21c1be61bfe`.
- Any repository-wide CI/typecheck status is separate from these scoped tests; check the linked run for exact outcome. Do not claim all global checks green from this file.

## Shared/cross-role regression and security
- Route-local public presentation only. Existing marketing layout, link destinations and shared CTAs remain unchanged.
- No auth, role, RLS, tenant, API, user-data, outbound-message, payment, or persistence paths were edited.
- New links use internal safe destinations; no untrusted URLs, claims of automatic hiring, private student records or third-party integration are introduced.
- Canonical status and evidence: `docs/tracker.json#uxReview.groups[UX-G050]` and `docs/parity/shared-public-ops.md`.
