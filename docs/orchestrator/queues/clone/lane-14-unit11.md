# Unit-test repair queue (unit11): lane chat-14

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-14-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-college-cross-audit-chat19.test.ts` (1 failing)
- [x] `tests/unit/chat13-superadmin-interview-operations.test.ts` (1 failing)
- [x] `tests/unit/chat2-tpo-team-open-increments.test.ts` (1 failing)
- [x] `tests/unit/chat6-superadmin-people-verified-closure.test.ts` (1 failing)
- [x] `tests/unit/chat9-verify2-learner-assignment-retry.test.ts` (2 failing)
- [x] `tests/unit/public-auth-error-retry-round5.test.ts` (1 failing)

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

### tests/unit/chat13-superadmin-interview-operations.test.ts

```
 FAIL  tests/unit/chat13-superadmin-interview-operations.test.ts > Super Admin placement interview operations > SA-placements-projects-46 renders real round Type Status Mode Sort and conflict-only filters
AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'choices("Type"'

- Expected
+ Received

- choices("Type"
+ "use client";
+ import { Checkbox } from "@/components/ui/checkbox";
+ import {SuperAdminInterviewEdit} from "@/components/admin/super-admin-interview-edit";
+ import {useMemo,useState,useTransition} from "react";
+ import Link from "next/link";
+ import {useRouter} from "next/navigation";
+ import {Input} from "@/components/ui/input";
+ import { DataTable } from "@/components/ui/data-table";
+ import { Select } from "@/components/ui/select";
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

### tests/unit/chat6-superadmin-people-verified-closure.test.ts

```
 FAIL  tests/unit/chat6-superadmin-people-verified-closure.test.ts > chat-6 selected-college People gap verification > G2-15-027-052 keeps legacy department and faculty type in import preview and report
Error: No faculty records were found.
 ❯ parseFacultyBulkCsv src/modules/people/faculty-bulk-import-model.ts:65:25
     63|   const data=rows.slice(1);
     64|   if(data.length>500)throw new Error("The maximum batch size is 500 fa…
     65|   if(!data.length)throw new Error("No faculty records were found.");
       |                         ^
     66|   const issues:string[]=[];
     67|   const valid:FacultyBulkRow[]=[];
 ❯ tests/unit/chat6-superadmin-people-verified-closure.test.ts:24:14

```

### tests/unit/chat9-verify2-learner-assignment-retry.test.ts

```
 FAIL  tests/unit/chat9-verify2-learner-assignment-retry.test.ts > learner assignment list recovery preserves legacy messaging and accessibility > never misrepresents a failed read as no assignments
AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'Assignments could not be loaded'

- Expected
+ Received

- Assignments could not be loaded
+ import { Suspense } from "react";
+ import Link from "next/link";
+ import {notFound} from "next/navigation";
+ import {learnerAssignmentListPage,learnerAssignmentListHref} from "@/modules/courses/learner-assignment-page-model";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { CoursesServiceError } from "@/modules/courses/errors";
+ import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {

 FAIL  tests/unit/chat9-verify2-learner-assignment-retry.test.ts > learner assignment list recovery preserves legacy messaging and accessibility > offers a mobile-sized keyboard-accessible retry on the same learner route
AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'href="/learn/allAssignments?retry=1"'

- Expected
+ Received

- href="/learn/allAssignments?retry=1"
+ import { Suspense } from "react";
+ import Link from "next/link";
+ import {notFound} from "next/navigation";
+ import {learnerAssignmentListPage,learnerAssignmentListHref} from "@/modules/courses/learner-assignment-page-model";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { CoursesServiceError } from "@/modules/courses/errors";
+ import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {
```

### tests/unit/public-auth-error-retry-round5.test.ts

```
 FAIL  tests/unit/public-auth-error-retry-round5.test.ts > chat-11 public session resilience > PUB-auth-public-32 respects bounded Retry-After seconds for login backoff
AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'safeRetry < 120'

- Expected
+ Received

- safeRetry < 120
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


## Branch inspection results (CI run 39819012064 predates these branch contents)

- `chat2-tpo-team-open-increments.test.ts`: inspected current `src/app/(authenticated)/tpo/team/page.tsx` against the precise failing assertion; `redirect("/tpo/settings/team")` exists in the `people`/`members`/`roster` branch, while UUID conversation aliases are bounded and scoped. This is a stale failure on the recorded main commit, not a reason to change the test. Source checked; no new test execution claimed.
- `public-auth-error-retry-round5.test.ts`: inspected current `src/components/auth/login-form.tsx`; `safeRetry < 120`, `reason.retryAfterSeconds`, `setCooldown(Math.max(cooldown,safeRetry))`, and the rate-limit copy all exist. The failing string assertion is satisfied by the current branch source. Source checked; no new test execution claimed.

## Current branch source verification (no test execution)

- `UX-college-cross-audit-chat19.test.ts`: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` now contains `<DataTable`, `mobilePriority: "primary"`, and the existing shared responsive table implementation. The recorded failure was from older main.
- `chat13-superadmin-interview-operations.test.ts`: `src/components/admin/super-admin-interview-operations.tsx` currently includes `choices("Type"`, `choices("Status"`, `choices("Mode"`, and `choices("Department"` with retained filter functionality. The recorded failure predates the branch.
- `chat6-superadmin-people-verified-closure.test.ts`: inspected `parseFacultyBulkCsv` with the shared RFC4180 reader; it returns nonblank rows including trailing line-separated records, and the supplied sample retains one data record with normalized +91 phone. Source review only.
- `chat9-verify2-learner-assignment-retry.test.ts`: `src/app/(authenticated)/learn/allAssignments/page.tsx` currently contains `Assignments could not be loaded` and `href="/learn/allAssignments?retry=1"`; route retains its alert state rather than presenting an empty list. Source review only.

The historical CI failures are satisfied by currently inspected branch source; no tests or CI were run and these checks do not certify TypeScript build health.
