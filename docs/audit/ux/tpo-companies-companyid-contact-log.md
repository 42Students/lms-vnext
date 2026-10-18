# UX route: `/tpo/companies/[companyId]/contact-log`

**Lane:** chat-12 · first third of TPO routes · source review 22/42. **Archetype:** existing authenticated TPO page.

**Before:** Existing page-level controls needed a source-contract pass for mobile targets, contrast-safe text and landmarks.

**Changes:** touch targets; accessible links. Legacy copy, access checks and form/query behavior were preserved.

**States:** No success, empty, denied or partial branch was suppressed. Existing guard and persisted-result semantics are unchanged. Phone browser, keyboard and screen reader evidence are pending.

**Test:** `tests/unit/UX-tpo-companies-companyid-contact-log-01.test.ts`. No fixture data is invented. **Acceptance:** source contract prepared; TypeScript/Vitest/browser orchestrator run pending. Keep unchecked until verified.

## Shared form controls follow-up

The GET filter form now uses the audited shared `Select`, `Button` controls, keeping source-specific labels, defaults, submitted URL parameter names, permission checks and all existing pagination/export behavior. Hidden URL-preservation fields remain native. Browser focus/native picker and TypeScript acceptance await orchestrator runs. **Test:** `tests/unit/UX-tpo-companies-companyid-contact-log-04.test.ts`.

## Contact interactions responsive data table

Removed fixed 40rem scrolling-only table and reused the shared DataTable. The Contact name is the phone primary field, with type, outcome and IST timestamp always accessible. Preserved the original explicit empty copy via the required `empty` prop, and existing 25-row URL pagination. Test: `tests/unit/UX-tpo-companies-companyid-contact-log-05.test.ts`. Orchestrator must run TypeScript, Vitest and mobile/AT checks before sign-off.
