# Unit-test repair queue (unit12): lane chat-17

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat16-faculty-report-parity.test.ts` (1 failing)
- [ ] `tests/unit/chat9-verify2-admin-course-dependency-pages.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat16-faculty-report-parity.test.ts

```
 FAIL  tests/unit/chat16-faculty-report-parity.test.ts > legacy faculty report grading boundaries > rounds assignment percent before allocating legacy distribution bands
AssertionError: expected +0 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 0

 ❯ tests/unit/chat16-faculty-report-parity.test.ts:19:76
     17|   ],100);
     18|   expect(result.averagePercent).toBe(75);
     19|   expect(result.distribution.find(bucket=>bucket.label==="60-69%")?.co…
       |                                                                            ^
     20|   expect(result.distribution.find(bucket=>bucket.label==="90-100%")?.c…
     21|  });
```

### tests/unit/chat9-verify2-admin-course-dependency-pages.test.ts

```
 FAIL  tests/unit/chat9-verify2-admin-course-dependency-pages.test.ts > Super Admin paged course dependency counts > scope is applied on the DB query, not only to presentation counts
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'paginateCollegeCourses(workspace.cour…'

- Expected
+ Received

- paginateCollegeCourses(workspace.courses,catalogueQuery).items
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
+ import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
+ import { AdminCourseRecycleBin } from "@/components/courses/admin-course-recycle-bin";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { Banner } from "@/components/ui/banner";
+ import { CourseProgressPolicyEditor } from "@/components/admin/course-progress-policy-editor";
+ import { getAdminTenantSettingState } from "@/modules/platform-settings/admin-editor-service";
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
