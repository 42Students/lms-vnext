# Unit-test repair queue (unit13): lane chat-1

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (2 failing)
- [ ] `tests/unit/chat2-tpo-team-open-increments.test.ts` (1 failing)
- [ ] `tests/unit/learner-syllabus-soft-delete-visibility.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/COURSES-BREAK-FACULTY-06.test.ts

```
 FAIL  tests/unit/COURSES-BREAK-FACULTY-06.test.ts > COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency > FAC-assessments-01 retains delivery-authorized historical attempts while current roster controls missing counts
AssertionError: expected [ { …(6) }, { …(6) } ] to have a length of 3 but got 2

- Expected
+ Received

- 3
+ 2

 ❯ tests/unit/COURSES-BREAK-FACULTY-06.test.ts:89:27
     87|  it("FAC-assessments-01 retains delivery-authorized historical attempt…
     88|   const report=await getFacultyQuizReport(actor,quizId,deliveryId);
     89|   expect(report.attempts).toHaveLength(3);
       |                           ^
     90|   expect(report.latestAttempts).toHaveLength(2);
     91|   expect(report.metrics).toMatchObject({

 FAIL  tests/unit/COURSES-BREAK-FACULTY-06.test.ts > COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency > FAC-assessments-01 retains historical delivery submissions and excludes them only from missing-roster counts
AssertionError: expected [ { …(5) } ] to have a length of 2 but got 1

- Expected
+ Received

- 2
+ 1

 ❯ tests/unit/COURSES-BREAK-FACULTY-06.test.ts:100:30
     98|  it("FAC-assessments-01 retains historical delivery submissions and ex…
     99|   const report=await getFacultyAssignmentReport(actor,assignmentId,del…
    100|   expect(report.submissions).toHaveLength(2);
       |                              ^
    101|   expect(report.metrics).toMatchObject({eligibleLearners:1,submitted:2,
    102|    missing:0,onTime:1,late:1,graded:2,gradePublished:2,averagePercent:…
```

### tests/unit/chat2-tpo-team-open-increments.test.ts

```
 FAIL  tests/unit/chat2-tpo-team-open-increments.test.ts > TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-30 validates legacy ?c and ?m aliases without redirecting to arbitrary external destinations
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings?tab=team")'

- Expected
+ Received

- redirect("/tpo/settings?tab=team")
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
AssertionError: expected 'const rows = await getDb()\n    .sele…' to contain 'eq(lessonContents.deliveryId,'

- Expected
+ Received

- eq(lessonContents.deliveryId,
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

