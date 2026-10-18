# UX route: `/tpo/drive-day/[roundId]/no-shows`

**Lane:** chat-12 · first third of TPO routes · source review 29/42. **Archetype:** existing authenticated TPO page.

**Before:** Existing page-level controls needed a source-contract pass for mobile targets, contrast-safe text and landmarks.

**Changes:** touch targets; accessible links; teal contrast. Legacy copy, access checks and form/query behavior were preserved.

**States:** No success, empty, denied or partial branch was suppressed. Existing guard and persisted-result semantics are unchanged. Phone browser, keyboard and screen reader evidence are pending.

**Test:** `tests/unit/UX-tpo-drive-day-roundid-no-shows-01.test.ts`. No fixture data is invented. **Acceptance:** source contract prepared; TypeScript/Vitest/browser orchestrator run pending. Keep unchecked until verified.

## Responsive data-table follow-up

Replaced the dense fixed-width native table with shared `DataTable`, keeping the exact existing empty-state text through the required `empty` prop. The phone renders primary/action cells with further fields in the accessible disclosure. Row identity, permission and persisted business facts remain unchanged. Source contract: `tests/unit/UX-tpo-drive-day-roundid-no-shows-02.test.ts`; TypeScript/browser confirmation pending.
