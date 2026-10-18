# UX route: `/tpo/messages/[threadId]`

**Lane:** chat-12 · first third of TPO routes · source review 34/42. **Archetype:** existing authenticated TPO page.

**Before:** Locally styled controls and page layouts needed a mobile/contrast pass under signed-off conventions.

**Changes:** accessible links; single shell main. Preserved legacy labels, authorization, filtering, saved data and query semantics.

**States:** Loading, empty, error, stale, partial and denied branches are unchanged where present. No fabricated state. TypeScript, Vitest, phone and WebView checks remain to be run.

**Test:** `tests/unit/UX-tpo-messages-threadid-01.test.ts`; source acceptance only until orchestrator runs it. **Page list:** do not tick until tested.

## Shared-component completion

Reused the shared PageHeader to keep the legacy h1 copy as a single semantic page title within the existing authenticated shell.

**Source tests:** `tests/unit/UX-tpo-messages-threadid-03.test.ts` (where applicable). No permission, notification, write path or API response was altered. Device/AT/typecheck acceptance remains with the orchestrator.
