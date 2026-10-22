# Unit-test repair queue (unit11): lane chat-16

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-16-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-college-roster-data-tables-01.test.ts` (source-level repair committed on chat-16 branch; CI not rerun) (1 failing)
- [x] `tests/unit/chat15-learner-playback-settings.test.ts` (source-level repair committed on chat-16 branch; CI not rerun) (1 failing)
- [x] `tests/unit/chat3-course-visibility-independent.test.ts` (FIXED on chat-16 branch: independent display flag) (1 failing)
- [x] `tests/unit/chat7-application-rate-limit-verify2b.test.ts` (source-level repair committed on chat-16 branch; CI not rerun) (1 failing)
- [x] `tests/unit/college-courses-content-gap-closure.test.ts` (source-level repair committed on chat-16 branch; CI not rerun) (1 failing)
- [x] `tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts` (FIXED on chat-16 branch: HMAC rotation contract) (1 failing)

## Failures (from CI log)

### tests/unit/UX-college-roster-data-tables-01.test.ts

```
 FAIL  tests/unit/UX-college-roster-data-tables-01.test.ts > UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/electives/[slotId]/allocate retains checked learner IDs inside real form submission
AssertionError: expected '"use server";\nimport Link from "next…' to contain 'caption="Eligible students for alloca…'

- Expected
+ Received

- caption="Eligible students for allocation"
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

### tests/unit/chat15-learner-playback-settings.test.ts

```
 FAIL  tests/unit/chat15-learner-playback-settings.test.ts > LEARNER-course-detail-12 playback settings > LEARNER-course-detail-12 applies college override to playback cadence and server completion
AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain 'Math.max(5000,Math.min(120000,saveInt…'

- Expected
+ Received

- Math.max(5000,Math.min(120000,saveIntervalMs))
+ "use client";
+
+ import {
+   useEffect,
+   useRef,
+   useState,
+ } from "react";
+ import { useRouter } from "next/navigation";
+ import { Alert } from "@/components/ui/alert";
```

### tests/unit/chat3-course-visibility-independent.test.ts

```
 FAIL  tests/unit/chat3-course-visibility-independent.test.ts > legacy course visibility is independent from enabled and archive lifecycle > maps only display permission in the dedicated switch and preserves history
AssertionError: expected 'import { randomUUID } from "node:cryp…' to contain 'input.enabled===undefined'

- Expected
+ Received

- input.enabled===undefined
+ import { randomUUID } from "node:crypto";
+ import {
+   and,
+   asc,
+   eq,
+   isNull,
+   ne,
+   sql,
+ } from "drizzle-orm";
```

### tests/unit/chat7-application-rate-limit-verify2b.test.ts

```
 FAIL  tests/unit/chat7-application-rate-limit-verify2b.test.ts > legacy learner application per-minute rate gate > serializes across jobs, counts successful writes and returns exact HTTP 429 copy
AssertionError: expected 'import { NextResponse } from "next/se…' to contain 'error.code==="PLACEMENT_APPLICATION_R…'

- Expected
+ Received

- error.code==="PLACEMENT_APPLICATION_RATE_LIMITED"?429
+ import { NextResponse } from "next/server";
+ import { friendlyApiError } from "@/lib/friendly-error";
+ import { createRequestId } from "@/lib/request-id";
+ import { isDatabaseUnavailableError } from "@/lib/db-outage";
+ import { ZodError } from "zod";
+ import { SessionAuthenticationError } from "@/auth/session";
+ import { ContextResolutionError } from "@/modules/identity/context-service";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { DepartmentHasDependenciesError } from "@/modules/departments/archive-policy";
```

### tests/unit/college-courses-content-gap-closure.test.ts

```
 FAIL  tests/unit/college-courses-content-gap-closure.test.ts > College Courses & Content gap closure > COL-courses-content-04 Duplicate produces distinct unoccupied code, retains metadata, not students
AssertionError: expected { id: 'a', …(4) } to match object { code: 'CS1-COPY2', …(2) }
(2 matching properties omitted from actual)

- Expected
+ Received

  {
    "code": "CS1-COPY2",
    "departmentId": "d",
-   "name": "Algorithms",
+   "name": "Algorithms (Copy)",
  }

 ❯ tests/unit/college-courses-content-gap-closure.test.ts:36:54
     34|  it("COL-courses-content-04 Duplicate produces distinct unoccupied cod…
```

### tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts

```
 FAIL  tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts > REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 rejects untrusted inbound sender, invalid grant, and replay
AssertionError: expected 'import "server-only";\nimport {create…' to contain 'verifyRecruiterMailBridgeSignature(se…'

- Expected
+ Received

- verifyRecruiterMailBridgeSignature(secret,rawBody,signature)
+ import "server-only";
+ import {createHash,randomUUID} from "node:crypto";
+ import {eq,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {placementRecruiterInboundEmailEvents,placementRecruiterMessageMailState} from "@/db/schema";
+ import {inboundMailMessages} from "@/db/schema/inbound-mail";
+ import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
+ import {verifyRecruiterMailBridgeWithRotation,extractRecruiterEmailReply} from "./recruiter-message-email-model";
```


## Deep rows (from DEEP_agent2_4.md, unfinished; do these FIRST)

Record each result under ## Results in docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md as OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [x] G2-2-017-057 — OK: registered migration 0212 replaces pair uniqueness with membership/content/attempt and adds latest-attempt index; recorded in DEEP_agent2_4.md (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
