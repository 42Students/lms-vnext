# Unit-test repair queue (unit13): lane chat-20

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/chat2-tpo-member-workload-parity.test.ts` (1 failing)
- [x] `tests/unit/learner-projects-round2-gap-closure.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat2-tpo-member-workload-parity.test.ts

```
 FAIL  tests/unit/chat2-tpo-member-workload-parity.test.ts > TPO Team People persisted workloads > TPO-inbox-team-31 shows real drive, company, overdue follow-up and waiting-on-teammate numbers
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

### tests/unit/learner-projects-round2-gap-closure.test.ts

```
 FAIL  tests/unit/learner-projects-round2-gap-closure.test.ts > learner/projects round-two gap verification > LEARNER-projects-04 supports legacy Active In progress Ready and Blocked status choices
AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain 'status: statusSchema.safeParse(status…'

- Expected
+ Received

- status: statusSchema.safeParse(status).data
+ import { z } from "zod";
+ import Link from "next/link";
+ import { Banner } from "@/components/ui/banner";
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {
+   ProjectParticipantListControls,
+   ProjectParticipantPagination,
+   type ProjectParticipantListQuery,
```

