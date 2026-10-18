# UX route: `/tpo/placements/jobs/[jobId]/about`

**Lane:** chat-12 · first third of TPO routes · source review 40/42. **Archetype:** existing authenticated TPO page.

**Before:** Locally styled controls and page layouts needed a mobile/contrast pass under signed-off conventions.

**Changes:** touch targets; accessible links. Preserved legacy labels, authorization, filtering, saved data and query semantics.

**States:** Loading, empty, error, stale, partial and denied branches are unchanged where present. No fabricated state. TypeScript, Vitest, phone and WebView checks remain to be run.

**Test:** `tests/unit/UX-tpo-placements-jobs-jobid-about-01.test.ts`; source acceptance only until orchestrator runs it. **Page list:** do not tick until tested.

## Branch and role-package tables (shared component)

Replaced two page-local horizontally scrolling tables with the shared DataTable. Each has an explicit honest empty state; the original missing-branch copy is unchanged. Role, CTC, eligible and applied evidence is visible on 320px cards without horizontal viewport scroll. Source test: `tests/unit/UX-tpo-placements-jobs-jobid-about-05.test.ts`. Typecheck and mobile/AT acceptance remain pending.
