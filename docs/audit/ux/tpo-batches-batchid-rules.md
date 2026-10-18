# UX route: `/tpo/batches/[batchId]/rules`

**Lane:** chat-12 · first third of TPO routes · source review 14/42. **Archetype:** existing authenticated TPO page.

**Before:** Custom controls had mobile size, focus/contrast or duplicated shell landmark inconsistencies.

**Changes:** single shell main. Legacy labels, permission gates, links, form workflows and query contracts were not renamed.

**States:** Existing loading, ready, empty, invalid, partial and denied branches were preserved where present. No data or error state was fabricated. Local source review is not device evidence.

**Test:** `tests/unit/UX-tpo-batches-batchid-rules-01.test.ts` (source contract). **Acceptance:** TypeScript, Vitest and browser/AT pending orchestrator; leave route unticked until acceptance passes.

## Shared-component completion

Reused the shared PageHeader to keep the legacy h1 copy as a single semantic page title within the existing authenticated shell.

**Source tests:** `tests/unit/UX-tpo-batches-batchid-rules-03.test.ts` (where applicable). No permission, notification, write path or API response was altered. Device/AT/typecheck acceptance remains with the orchestrator.
