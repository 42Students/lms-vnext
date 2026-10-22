# Unit-test repair queue (unit12): lane chat-9

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-teacher-shared-surfaces.test.ts` (1 failing) — branch commit b3ed411: checks semantic summary's inline 44px minimum and focus styling, not obsolete Tailwind class.
- [x] `tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts` (1 failing) — branch commit 075b644: checks canonical published-to-closed transition table and service guard.
- [ ] `tests/unit/tpo-recruiters-13-invite-readiness.test.ts` (1 failing) — the branch currently contains both guards before credential rotation; main removed company guard, so reconciliation onto main is still needed.

## Failures (from CI log)

### tests/unit/UX-teacher-shared-surfaces.test.ts

```
 FAIL  tests/unit/UX-teacher-shared-surfaces.test.ts > Faculty shared surface mobile and focus rollout > UX-teacher-courses-shared-02 preserves course summary roles and 44px filter disclosures
AssertionError: expected 'import type { ReactNode } from "react…' to contain 'flex min-h-11 cursor-pointer'

- Expected
+ Received

- flex min-h-11 cursor-pointer
+ import type { ReactNode } from "react";
+ import { cx } from "@/lib/class-names";
+
+ /** Semantic keyboard disclosure. Native details handles Enter/Space and
+  * reduces motion to the shared opacity-only fade in globals.css. */
+ export function Disclosure({
+   title, children, className, defaultOpen = false,
+   id, summaryAriaLabel, summaryTitle, ariaLabel, summaryClassName, contentClassName, preserveSummary = false,
+ }: {
```

### tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts

```
 FAIL  tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts > TPO second-third — close preview and cancellation model state > PLACEMENTS-CLOSE-ENDED-01 both lifecycle and preview permit closing after season closure, never losing applicant reconciliation
AssertionError: expected 'export async function closePlacementJ…' to contain 'current.status !== "PUBLISHED"'

- Expected
+ Received

- current.status !== "PUBLISHED"
+ export async function closePlacementJob(
+   context: RequestContext,
+   jobIdInput: string,
+ ) {
+   const jobId = placementJobIdSchema.parse(jobIdInput);
+   const current = await loadJob(jobId);
+   await requirePlacementManageScope(context, current.collegeId);
+
+   // Closing a published drive remains available after the placement season
```

### tests/unit/tpo-recruiters-13-invite-readiness.test.ts

```
 FAIL  tests/unit/tpo-recruiters-13-invite-readiness.test.ts > TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > requires a linked company before token rotation and avoids claiming delivery without a verified work email
AssertionError: expected -1 to be greater than -1
 ❯ tests/unit/tpo-recruiters-13-invite-readiness.test.ts:8:17
      6|   // Both persisted requirements must be enforced before a credential …
      7|   const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelati…
      8|   expect(pivot).toBeGreaterThan(-1);
       |                 ^
      9|   expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
     10|   expect(service).toContain("TPO_RECRUITER_INVITE_NOT_ALLOWED");

```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-006-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
