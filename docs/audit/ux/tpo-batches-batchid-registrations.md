# UX route: `/tpo/batches/[batchId]/registrations`

**Lane:** chat-12 · first third of TPO routes · source review 11/42. **Archetype:** existing authenticated TPO page.

**Before:** Custom controls had mobile size, focus/contrast or duplicated shell landmark inconsistencies.

**Changes:** touch targets; accessible links; teal contrast; single shell main. Legacy labels, permission gates, links, form workflows and query contracts were not renamed.

**States:** Existing loading, ready, empty, invalid, partial and denied branches were preserved where present. No data or error state was fabricated. Local source review is not device evidence.

**Test:** `tests/unit/UX-tpo-batches-batchid-registrations-01.test.ts` (source contract). **Acceptance:** TypeScript, Vitest and browser/AT pending orchestrator; leave route unticked until acceptance passes.

## Shared-component completion

Reused shared PageHeader and/or Input, Select, Button with native keyboard behavior, 44px minimum targets, focus outlines and 16px phone form text. Original labels, defaults and URL GET semantics remain unchanged.

**Source tests:** `tests/unit/UX-tpo-batches-batchid-registrations-02.test.ts` (where applicable). No permission, notification, write path or API response was altered. Device/AT/typecheck acceptance remains with the orchestrator.
