# UX route: `/tpo/companies`

**Lane:** chat-12 · first third of TPO routes · source review 20/42. **Archetype:** existing authenticated TPO page.

**Before:** Custom controls had mobile size, focus/contrast or duplicated shell landmark inconsistencies.

**Changes:** touch targets; accessible links; teal contrast. Legacy labels, permission gates, links, form workflows and query contracts were not renamed.

**States:** Existing loading, ready, empty, invalid, partial and denied branches were preserved where present. No data or error state was fabricated. Local source review is not device evidence.

**Test:** `tests/unit/UX-tpo-companies-01.test.ts` (source contract). **Acceptance:** TypeScript, Vitest and browser/AT pending orchestrator; leave route unticked until acceptance passes.

## Shared form controls follow-up

The GET filter form now uses the audited shared `Input`, `Select`, `Button` controls, keeping source-specific labels, defaults, submitted URL parameter names, permission checks and all existing pagination/export behavior. Hidden URL-preservation fields remain native. Browser focus/native picker and TypeScript acceptance await orchestrator runs. **Test:** `tests/unit/UX-tpo-companies-04.test.ts`.

## Single responsive company directory

Replaced duplicate mobile-card and desktop-table subtrees with the shared single-tree DataTable, retaining existing linked/unlinked employer status, website evidence, all five historical metrics, and authorized Create drive action. Responsive cards show all secondary fields via the audited More details disclosure. The caller supplies the required exact existing empty text. Test: `tests/unit/UX-tpo-companies-05.test.ts`; pending real typecheck, test runner and phone AT validation.
