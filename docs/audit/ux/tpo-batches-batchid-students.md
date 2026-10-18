# UX route: `/tpo/batches/[batchId]/students`

**Lane:** chat-12 · first third of TPO routes · source review 15/42. **Archetype:** existing authenticated TPO page.

**Before:** Custom controls had mobile size, focus/contrast or duplicated shell landmark inconsistencies.

**Changes:** touch targets; accessible links; teal contrast; single shell main. Legacy labels, permission gates, links, form workflows and query contracts were not renamed.

**States:** Existing loading, ready, empty, invalid, partial and denied branches were preserved where present. No data or error state was fabricated. Local source review is not device evidence.

**Test:** `tests/unit/UX-tpo-batches-batchid-students-01.test.ts` (source contract). **Acceptance:** TypeScript, Vitest and browser/AT pending orchestrator; leave route unticked until acceptance passes.

## UX form-component follow-up (chat-12)

Replaced page-local controls with shared `PageHeader`, `Input`, `Select`, `Button` where applicable. Form field names, labels, default values, GET URL filtering, safe post actions, required validation and legacy copy are unchanged. Shared controls supply 16px phone input text, a 44px target and visible keyboard focus. Existing authorization checks, error branches and mobile navigation remain in place.

Source contract: `tests/unit/UX-tpo-batches-batchid-students-04.test.ts`. Browser, TypeScript and unit execution remain orchestrator acceptance tasks, not claimed passing here.
