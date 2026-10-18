# UX route: `/tpo/placements/jobs/[jobId]/applicants-pipeline`

**Lane:** chat-12 · first third of TPO routes · source review 42/42. **Archetype:** authenticated TPO placement workspace.

**Before:** Placement workspace retained legacy UI with custom spacing, link contrast and layout.

**Changes:** touch targets; accessible links; teal contrast; single shell main. Preserved applicant navigation, pagination, filtering, authorization and legacy copy.

**States:** Existing empty/pending/error and scoped view states untouched; no generated records. Full browser/typecheck suite unverified.

**Test:** `tests/unit/UX-tpo-placements-jobs-jobid-applicants-pipeline-01.test.ts`. Keep route unticked until orchestrator runs tests and captures.

## Shared form controls follow-up

The GET filter form now uses the audited shared `Input`, `Select`, `Button` controls, keeping source-specific labels, defaults, submitted URL parameter names, permission checks and all existing pagination/export behavior. Hidden URL-preservation fields remain native. Browser focus/native picker and TypeScript acceptance await orchestrator runs. **Test:** `tests/unit/UX-tpo-placements-jobs-jobid-applicants-pipeline-04.test.ts`.
