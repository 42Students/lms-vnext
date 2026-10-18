# UX route: `/tpo/drive-day/[roundId]`

**Lane:** chat-12 · first third of TPO routes · source review 28/42. **Archetype:** existing authenticated TPO page.

**Before:** Existing page-level controls needed a source-contract pass for mobile targets, contrast-safe text and landmarks.

**Changes:** Preserved compliant existing elements rather than introduce unapproved copy.

**States:** No success, empty, denied or partial branch was suppressed. Existing guard and persisted-result semantics are unchanged. Phone browser, keyboard and screen reader evidence are pending.

**Test:** `tests/unit/UX-tpo-drive-day-roundid-01.test.ts`. No fixture data is invented. **Acceptance:** source contract prepared; TypeScript/Vitest/browser orchestrator run pending. Keep unchecked until verified.
