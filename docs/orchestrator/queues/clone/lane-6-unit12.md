# Unit-test repair queue (unit12): lane chat-6

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/UX-college-cross-audit-chat19.test.ts` (1 failing)
- [ ] `tests/unit/chat3-legacy-course-short-title-limit.test.ts` (2 failing)
- [ ] `tests/unit/tpo-batches-24-chat5.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-college-cross-audit-chat19.test.ts

```
 FAIL  tests/unit/UX-college-cross-audit-chat19.test.ts > College cross-audit fixes (independent chat-19) > COL-XA-03 electives/[slotId]/allocate retains mobile identity cards and sticky desktop columns
AssertionError: electives/[slotId]/allocate: expected '"use server";\nimport Link from "next…' to contain '<DataTable'

- Expected
+ Received

- <DataTable
+ "use server";
+ import Link from "next/link";
+ import { redirect, notFound } from "next/navigation";
+ import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
+ import { z } from "zod";
+ import { getDb } from "@/db/client";
+ import {
+   collegeMemberships, electiveOfferings, electiveSlots, learnerProfiles,
+   learnerProgramEnrollments, lmsGroupMembers, lmsGroups, sectionEnrollments, sections, users,
```

### tests/unit/chat3-legacy-course-short-title-limit.test.ts

```
 FAIL  tests/unit/chat3-legacy-course-short-title-limit.test.ts > legacy course short display name length > enforces 255-character title in both create and edit validation
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/unit/chat3-legacy-course-short-title-limit.test.ts:10:17
      8|     expect(createCourseInputSchema.safeParse({
      9|       departmentId:courseId,name:"Data Structures",code:"CS101",shortT…
     10|     }).success).toBe(true);
       |                 ^
     11|     expect(createCourseInputSchema.safeParse({
     12|       departmentId:courseId,name:"Data Structures",code:"CS101",shortT…

 FAIL  tests/unit/chat3-legacy-course-short-title-limit.test.ts > legacy course short display name length > does not prefill more than 255 characters in edit, duplicate and restore paths
AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'maxLength={255} placeholder="e.g. DSA"'

- Expected
+ Received

- maxLength={255} placeholder="e.g. DSA"
+ "use client";
+
+ import Link from "next/link";
+ import Image from "next/image";
+ import {
+   useEffect,
+   useState,
+ } from "react";
+ import { useRouter } from "next/navigation";
```

### tests/unit/tpo-batches-24-chat5.test.ts

```
 FAIL  tests/unit/tpo-batches-24-chat5.test.ts > TPO own eligibility decisions > TPO-batches-24 counts direct learner overrides against inherited decisions and filters the entire cohort
AssertionError: expected 6550 to be less than -1
 ❯ tests/unit/tpo-batches-24-chat5.test.ts:19:48
     17|   const loader=read("src/modules/placements/tpo-batch-workspace-read-s…
     18|   expect(loader).toContain("onlyDirect?exists(");
     19|   expect(loader.indexOf("onlyDirect?exists(")).toBeLessThan(loader.ind…
       |                                                ^
     20|   expect(read("src/app/(authenticated)/tpo/batches/[batchId]/students/…
     21|    .toContain('view.data.source==="LEARNER"');

```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-19-010-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
