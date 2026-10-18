# UX route: `/tpo/placements/jobs/[jobId]/applicants`

**Lane:** chat-12 · first third of TPO routes · source review 41/42. **Archetype:** canonical redirect.

**Before:** Canonical redirect without separate authored page.

**Changes:** Kept applicant tab deep link to the canonical pipeline with encoded drive ID.

**States:** Destination owns display states. Full browser/typecheck suite unverified.

**Test:** `tests/unit/UX-tpo-placements-jobs-jobid-applicants-01.test.ts`. Keep route unticked until orchestrator runs tests and captures.
