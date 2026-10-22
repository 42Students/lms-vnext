# Unit-test repair queue (unit12): lane chat-3

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/HR-BREAK-chat19-report-joined.test.ts` (1 failing)
- [ ] `tests/unit/chat2-team-people-workload-links.test.ts` (1 failing)
- [ ] `tests/unit/learner-syllabus-soft-delete-visibility.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/HR-BREAK-chat19-report-joined.test.ts

```
 FAIL  tests/unit/HR-BREAK-chat19-report-joined.test.ts > HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers > retains historical college applicants in page counts after graduation or deactivation
AssertionError: expected ' jobIds.length === 0\n    ? []\n    :…' not to contain 'eq(collegeMemberships.status,"ACTIVE")'

- Expected
+ Received

- eq(collegeMemberships.status,"ACTIVE")
+  jobIds.length === 0
+     ? []
+     : await db
+         .select({
+           jobId: placementApplications.jobId,
+           applications: sql<number>`
+             count(
+               distinct ${placementApplications.id}
+             )::integer
```

### tests/unit/chat2-team-people-workload-links.test.ts

```
 FAIL  tests/unit/chat2-team-people-workload-links.test.ts > Team People persisted workload destinations > TPO-inbox-team-31 keeps historical team bookmarks in scoped canonical workspaces
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings/team")'

- Expected
+ Received

- redirect("/tpo/settings/team")
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
+ import { hasMembershipRole } from "@/modules/identity/context";
+
+ type LegacyTeamSearch = Record<string, string | string[] | undefined>;
+
+ function first(value: string | string[] | undefined): string | undefined {
+   return Array.isArray(value) ? value[0] : value;
```

### tests/unit/learner-syllabus-soft-delete-visibility.test.ts

```
 FAIL  tests/unit/learner-syllabus-soft-delete-visibility.test.ts > Learner syllabus soft-delete and audience isolation > continues to deny hidden, deleted and foreign-class content
AssertionError: expected 'const rows = await getDb()\n    .sele…' to contain 'eq(lessonContents.status,'

- Expected
+ Received

- eq(lessonContents.status,
+ const rows = await getDb()
+     .select({
+       lessonId: courseLessons.id,
+       lessonName: courseLessons.name,
+       lessonDescription:
+         courseLessons.description,
+       lessonSequence:
+         courseLessons.sequence,
+       contentId: lessonContents.id,
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-16-005-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
- [ ] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
