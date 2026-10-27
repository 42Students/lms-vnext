# Recruiter verified submission cannot be blocked by stale dirty-form listeners

Authenticated Recruiter prototype workflow run 40584893407 failed the real `Send for review → Open the request` navigation. The POST returned a durable request receipt, but the rendered confirmation link remained on `/hr/drives/new`. Root cause: the draft's capture-phase link/unload listeners closed over a dirty draft and only checked `submittedRef.current` when installing the listeners, not at event time. They could therefore intercept links shown **after** `submittedRef.current=true` and receipt rendering.

The guard now exits at event time for both click and beforeunload once verified persistence has succeeded, while retaining dirty-form confirmation for unsubmitted work. The `Open the request` anchor remains scoped to `/hr/drives?collegeId=...&view=WAITING`.

Two browser acceptance corrections: the student-reference <details> is already open so the test must not click it closed; and focused review demands real shared applicants. If the seeded drive has no TPO-shared applicant, assert the explicit secure empty state then mark the positive-path test **skipped due to missing fixture**, never fabricate data or count it as accepted. A fixture-backed focused review is still required for full Green.

Changes include a focused source regression `tests/unit/recruiter-postsubmit-verified-navigation.test.ts` plus Playwright fixes. Await actual CI and browser rerun before acceptance.
