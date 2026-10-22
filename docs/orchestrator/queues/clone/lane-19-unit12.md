# Unit-test repair queue (unit12): lane chat-19

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat17-tenant-domain-service-journeys.test.ts` (1 failing)
- [ ] `tests/unit/chat9-verify2-learner-course-recovery.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat17-tenant-domain-service-journeys.test.ts

```
 FAIL  tests/unit/chat17-tenant-domain-service-journeys.test.ts > WEAK-tenant-domains service authorization, idempotency and hostile host journeys > WEAK-tenant-domains-12 verified host is idempotent; missing token fails closed
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times

Received:

  1st vi.fn() call:

    Array [
      "portal.example.edu",
      "opaque-proof",
    ]


Number of calls: 1

 ❯ tests/unit/chat17-tenant-domain-service-journeys.test.ts:160:24
```

### tests/unit/chat9-verify2-learner-course-recovery.test.ts

```
 FAIL  tests/unit/chat9-verify2-learner-course-recovery.test.ts > learner course recovery and missing class state > names the legacy roadmap loading failure distinctly and offers Retry
AssertionError: expected 'import { Banner } from "@/components/…' to contain 'className="ml-2 inline-flex min-h-11'

- Expected
+ Received

- className="ml-2 inline-flex min-h-11
+ import { Banner } from "@/components/ui/banner";
+ import { CoursesServiceError } from "@/modules/courses/errors";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { ZodError } from "zod";
+ import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";
+ import type { ReactNode } from "react";
+ import Link from "next/link";
+ import { learnerCourseTabPath } from "@/modules/courses/learner-course-tab-route-model";
+ import {resolveLegacyLearnerCourseDelivery} from "@/modules/courses/learner-course-legacy-route-service";
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
