# Unit-test repair queue (unit13): lane chat-12

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts` (1 failing)
- [ ] `tests/unit/chat7-verify2-learner-scoped-job-search.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts

```
 FAIL  tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts > SA-tenants-modules-COURSE-PROGRESS-07 authoritative scope and strict URL state > authenticates Super Admin before offering query fallback and student data retrieval
AssertionError: expected 1340 to be less than -1
 ❯ tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts:54:16
     52|   const read=source.indexOf("getSuperAdminStudentCourseProgress(contex…
     53|   expect(auth).toBeGreaterThan(-1);
     54|   expect(auth).toBeLessThan(parse);
       |                ^
     55|   expect(parse).toBeLessThan(read);
     56|   expect(source).toContain("Student Course Progress");

```

### tests/unit/chat7-verify2-learner-scoped-job-search.test.ts

```
 FAIL  tests/unit/chat7-verify2-learner-scoped-job-search.test.ts > authenticated learner legacy job search > uses the shared eight-field scoped search rather than title-only matching
AssertionError: expected 'import { NextResponse } from "next/se…' to contain 'parsed.data.jobType||undefined'

- Expected
+ Received

- parsed.data.jobType||undefined
+ import { NextResponse } from "next/server";
+ import {z} from "zod";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { isSameOriginRequest } from "@/auth/origin";
+ import { apiErrorResponse } from "@/lib/api-error";
+ import {hasMembershipRole} from "@/modules/identity/context";
+ import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
+ import {DEFAULT_LEARNER_JOB_FILTERS,filterLearnerPlacementJobs} from "@/modules/placements/learner-jobs-browse-model";
+ import {
```

