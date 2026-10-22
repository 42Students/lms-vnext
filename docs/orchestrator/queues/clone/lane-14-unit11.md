# Unit-test repair queue (unit11): lane chat-14

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-14-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-college-cross-audit-chat19.test.ts` (1 failing)
- [x] `tests/unit/chat13-superadmin-interview-operations.test.ts` (1 failing)
- [x] `tests/unit/chat2-tpo-team-open-increments.test.ts` (1 failing)
- [x] `tests/unit/chat6-superadmin-people-verified-closure.test.ts` (1 failing)
- [ ] `tests/unit/chat9-verify2-learner-assignment-retry.test.ts` (2 failing)
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

## Lane-13 overflow review (2026-10-23)

- [chat-13] `UX-college-cross-audit-chat19.test.ts` — FIXED outdated source-file assertion: allocation page delegates its accessible roster to `elective-eligible-selection.tsx`. Kept mobile-priority and table checks in the extracted component. Commit `966933bc24238942e3a7bc81081393a6ef46449b`.
- [chat-13] `chat13-superadmin-interview-operations.test.ts` — FIXED outdated string assertion for Type and Mode: current real Select controls are inline, while Status/Department use `choices()`. Assertions retain control wiring. Commit `b9684590e3c633ac45991c8b67b7768af50c4f9c`.
- [chat-13] `chat6-superadmin-people-verified-closure.test.ts` — FIXED CSV fixture with literal escaped newline that produced no faculty rows; retained Department and Faculty Type assertions. Commit `ca5ec43b934c3662fe929a3ac39298d0bfeb74c8`.
- Verified by source inspection against current main; no test execution claimed.
