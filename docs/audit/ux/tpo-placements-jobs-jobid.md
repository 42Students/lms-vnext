# UX route: `/tpo/placements/jobs/[jobId]`

**Lane:** chat-12 · first third of TPO routes · source review 39/42. **Archetype:** existing authenticated TPO page.

**Before:** Locally styled controls and page layouts needed a mobile/contrast pass under signed-off conventions.

**Changes:** Existing shared UI structure and scoped states retained.

**States:** Loading, empty, error, stale, partial and denied branches are unchanged where present. No fabricated state. TypeScript, Vitest, phone and WebView checks remain to be run.

**Test:** `tests/unit/UX-tpo-placements-jobs-jobid-01.test.ts`; source acceptance only until orchestrator runs it. **Page list:** do not tick until tested.
