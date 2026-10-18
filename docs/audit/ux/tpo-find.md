# UX route: `/tpo/find`

**Lane:** chat-12 · first third of TPO routes · source review 30/42. **Archetype:** existing authenticated TPO page.

**Before:** Existing page-level controls needed a source-contract pass for mobile targets, contrast-safe text and landmarks.

**Changes:** accessible links; teal contrast; single shell main. Legacy copy, access checks and form/query behavior were preserved.

**States:** No success, empty, denied or partial branch was suppressed. Existing guard and persisted-result semantics are unchanged. Phone browser, keyboard and screen reader evidence are pending.

**Test:** `tests/unit/UX-tpo-find-01.test.ts`. No fixture data is invented. **Acceptance:** source contract prepared; TypeScript/Vitest/browser orchestrator run pending. Keep unchecked until verified.

## Shared-component completion

Reused shared PageHeader and/or Input, Select, Button with native keyboard behavior, 44px minimum targets, focus outlines and 16px phone form text. Original labels, defaults and URL GET semantics remain unchanged.

**Source tests:** `tests/unit/UX-tpo-find-03.test.ts` (where applicable). No permission, notification, write path or API response was altered. Device/AT/typecheck acceptance remains with the orchestrator.
