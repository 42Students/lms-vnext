# Unit-test repair queue (unit12): lane chat-4

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/HR-BREAK-weak-services-01.test.ts` (1 failing)
- [ ] `tests/unit/chat2-tpo-team-open-increments.test.ts` (1 failing)
- [ ] `tests/unit/public-auth-login-gap-verification.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/HR-BREAK-weak-services-01.test.ts

```
 FAIL  tests/unit/HR-BREAK-weak-services-01.test.ts > HR-BREAK-weak-services-01: actual service branches with mocked persistence > branches service denies all lookup for wrong college or revoked central policy
AssertionError: expected [] to deeply equal [ 'Computer Science', 'Electronics' ]

- Expected
+ Received

- [
-   "Computer Science",
-   "Electronics",
- ]
+ []

 ❯ tests/unit/HR-BREAK-weak-services-01.test.ts:62:5
     60|    []];
     61|   expect(await listRecruiterCollegeBranches(context as never,college))
     62|    .toEqual(["Computer Science","Electronics"]);
```

### tests/unit/chat2-tpo-team-open-increments.test.ts

```
 FAIL  tests/unit/chat2-tpo-team-open-increments.test.ts > TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-30 validates legacy ?c and ?m aliases without redirecting to arbitrary external destinations
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

### tests/unit/public-auth-login-gap-verification.test.ts

```
 FAIL  tests/unit/public-auth-login-gap-verification.test.ts > public sign-in verified gap closure > PUB-auth-public-13 restores an unexpired one-time-code attempt after refresh
AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'stored.expiresAt'

- Expected
+ Received

- stored.expiresAt
+ "use client";
+
+ import { useEffect, useRef, useState } from "react";
+ import { Button } from "@/components/ui/button";
+ import { Input } from "@/components/ui/input";
+ import { Checkbox } from "@/components/ui/checkbox";
+ import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
+ import {reportAuthFailure} from "@/lib/report-client-error";
+ import {FRIENDLY_MESSAGES} from "@/lib/friendly-error";
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-16-027-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
