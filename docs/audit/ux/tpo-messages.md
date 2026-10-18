# UX route: `/tpo/messages`

**Lane:** chat-12 · first third of TPO routes · source review 33/42. **Archetype:** existing authenticated TPO page.

**Before:** Locally styled controls and page layouts needed a mobile/contrast pass under signed-off conventions.

**Changes:** accessible links; teal contrast. Preserved legacy labels, authorization, filtering, saved data and query semantics.

**States:** Loading, empty, error, stale, partial and denied branches are unchanged where present. No fabricated state. TypeScript, Vitest, phone and WebView checks remain to be run.

**Test:** `tests/unit/UX-tpo-messages-01.test.ts`; source acceptance only until orchestrator runs it. **Page list:** do not tick until tested.
