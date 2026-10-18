# UX route: `/tpo/messages`

**Lane:** chat-12 · first third of TPO routes · source review 33/42. **Archetype:** existing authenticated TPO page.

**Before:** Locally styled controls and page layouts needed a mobile/contrast pass under signed-off conventions.

**Changes:** accessible links; teal contrast. Preserved legacy labels, authorization, filtering, saved data and query semantics.

**States:** Loading, empty, error, stale, partial and denied branches are unchanged where present. No fabricated state. TypeScript, Vitest, phone and WebView checks remain to be run.

**Test:** `tests/unit/UX-tpo-messages-01.test.ts`; source acceptance only until orchestrator runs it. **Page list:** do not tick until tested.

## Shared form controls follow-up

The GET filter form now uses the audited shared `Input`, `Select`, `Button` controls, keeping source-specific labels, defaults, submitted URL parameter names, permission checks and all existing pagination/export behavior. Hidden URL-preservation fields remain native. Browser focus/native picker and TypeScript acceptance await orchestrator runs. **Test:** `tests/unit/UX-tpo-messages-04.test.ts`.

## Single-tree recruiter/notification inbox

Replaced separately rendered phone cards and desktop table with shared DataTable. Preserved record source tabs, filtered/paginated URL state, unread/access flags, status badge, search snippets, IST activity time and authorized thread/job links. Subject and job links remain visible as mobile actions; other facts remain in card/disclosure. Existing exact empty description is supplied to DataTable. Test: `tests/unit/UX-tpo-messages-05.test.ts`. Requires orchestrator TypeScript, Vitest, 320/360/390 and screen-reader acceptance.
