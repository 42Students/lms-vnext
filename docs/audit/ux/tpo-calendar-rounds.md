# UX route: `/tpo/calendar/rounds`

**Lane:** chat-12 · first third of TPO routes · source review 19/42. **Archetype:** existing authenticated TPO page.

**Before:** Custom controls had mobile size, focus/contrast or duplicated shell landmark inconsistencies.

**Changes:** touch targets; accessible links; teal contrast. Legacy labels, permission gates, links, form workflows and query contracts were not renamed.

**States:** Existing loading, ready, empty, invalid, partial and denied branches were preserved where present. No data or error state was fabricated. Local source review is not device evidence.

**Test:** `tests/unit/UX-tpo-calendar-rounds-01.test.ts` (source contract). **Acceptance:** TypeScript, Vitest and browser/AT pending orchestrator; leave route unticked until acceptance passes.
