# Unit-test repair queue (unit11): lane chat-3

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-3-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts` (4 failing)
- [x] `tests/unit/UX-superadmin-import-tables-chat17.test.ts` (1 failing)
- [x] `tests/unit/chat19-clone-sidebar-checkpoint.test.ts` (1 failing)
- [x] `tests/unit/chat4-college-ux-round5.test.ts` (1 failing)
- [x] `tests/unit/chat7-semester-layout-verify2b.test.ts` (1 failing)
- [x] `tests/unit/faculty-assessment-report.test.ts` (1 failing)
- [ ] `tests/unit/tpo-inbox-team-round5-parity-review.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts

```
 FAIL  tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts > SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > acting in college must not open global Tracker issues or private logs

 FAIL  tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts > SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > acting in organization must not open global Tracker issues or private logs
Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
 ❯ parseServerEnv src/lib/env.ts:88:11
     86|
     87|   if (!parsed.success) {
     88|     throw new Error(
       |           ^
     89|       "Invalid server environment configuration: " +
     90|         z.prettifyError(parsed.error),
 ❯ getServerEnv src/lib/env.ts:134:15
 ❯ poolConfig src/db/client.ts:24:48
 ❯ getPool src/db/client.ts:48:27
 ❯ getDb src/db/client.ts:53:24
 ❯ Module.TrackerLogsPage src/app/(authenticated)/tracker/logs/page.tsx:51:11
 ❯ tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts:44:16

 FAIL  tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts > SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > a disabled Super Admin must be refused before privileged reads
Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
 ❯ parseServerEnv src/lib/env.ts:88:11
     86|
     87|   if (!parsed.success) {
     88|     throw new Error(
       |           ^
     89|       "Invalid server environment configuration: " +
     90|         z.prettifyError(parsed.error),
 ❯ getServerEnv src/lib/env.ts:134:15
 ❯ poolConfig src/db/client.ts:24:48
 ❯ getPool src/db/client.ts:48:27
 ❯ getDb src/db/client.ts:53:24
 ❯ Module.TrackerLogsPage src/app/(authenticated)/tracker/logs/page.tsx:51:11
 ❯ tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts:55:16

 FAIL  tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts > SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > a recruiter company grant is not a global issue or error-log permission
Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
 ❯ parseServerEnv src/lib/env.ts:88:11
     86|
     87|   if (!parsed.success) {
     88|     throw new Error(
       |           ^
     89|       "Invalid server environment configuration: " +
     90|         z.prettifyError(parsed.error),
 ❯ getServerEnv src/lib/env.ts:134:15
 ❯ poolConfig src/db/client.ts:24:48
 ❯ getPool src/db/client.ts:48:27
 ❯ getDb src/db/client.ts:53:24
 ❯ Module.TrackerLogsPage src/app/(authenticated)/tracker/logs/page.tsx:51:11
 ❯ tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts:66:16
```

### tests/unit/UX-superadmin-import-tables-chat17.test.ts

```
 FAIL  tests/unit/UX-superadmin-import-tables-chat17.test.ts > UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > faculty CSV import preserves CAS confirmation, upload bounds and per-row outcomes
AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain 'await askConfirm("Create "+count+" fa…'

- Expected
+ Received

- await askConfirm("Create "+count+" faculty from this locally previewed file?
+ "use client";
+ import { useRef, useState } from "react";
+ import { useRouter } from "next/navigation";
+ import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
+ import {canSubmitFacultyBulkImport} from "@/modules/people/faculty-bulk-import-submit-guard";
+ import {facultyBulkImportResponseSchema,facultyBulkImportFailureMessage} from "@/modules/people/faculty-bulk-import-response-model";
+ import { DataTable } from "@/components/ui/data-table";
+ import { Button } from "@/components/ui/button";
+ import { Alert } from "@/components/ui/alert";
```

### tests/unit/chat19-clone-sidebar-checkpoint.test.ts

```
 FAIL  tests/unit/chat19-clone-sidebar-checkpoint.test.ts > chat-19 B3/B4 legacy shell source-value checks > has one TPO footer implementation rather than two diverging copies
AssertionError: expected '"use client";\nimport Image from "nex…' to contain '<Button key='

- Expected
+ Received

- <Button key=
+ "use client";
+ import Image from "next/image";
+ import Link from "next/link";
+ import "@/components/shell/legacy-mobile-footer.css";
+ import { usePathname } from "next/navigation";
+
+ /** Legacy phone footer destinations. More opens the actual /tpo/more page
+  * instead of a competing BottomSheet that hid the page navigation. */
+ const links = [
```

### tests/unit/chat4-college-ux-round5.test.ts

```
 FAIL  tests/unit/chat4-college-ux-round5.test.ts > Chat-4 college UX round five > UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens
AssertionError: expected '"use server";\nimport Link from "next…' to contain '<DataTable'

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

### tests/unit/chat7-semester-layout-verify2b.test.ts

```
 FAIL  tests/unit/chat7-semester-layout-verify2b.test.ts > Semester legacy responsive layout > stacks form and directory on small screens and uses a 10/14 card split at lg
AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'grid-cols-1 items-start'

- Expected
+ Received

- grid-cols-1 items-start
+ import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
+ import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {isSuperAdmin} from "@/modules/identity/context";
+ import { CollegeSemesterCreateForm, CollegeSemesterRowActions } from "@/components/academics/college-semester-management";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { Banner } from "@/components/ui/banner";
+ import { ErrorState } from "@/components/ui/error-state";
```

### tests/unit/faculty-assessment-report.test.ts

```
 FAIL  tests/unit/faculty-assessment-report.test.ts > Faculty assignment score precision > rounds the final average, not individual fractional marks
AssertionError: expected 22 to be 21 // Object.is equality

- Expected
+ Received

- 21
+ 22

 ❯ tests/unit/faculty-assessment-report.test.ts:133:36
    131|     const rows = [{ pointsAwarded: 1, gradingStatus: "GRADED" }, { poi…
    132|     const summary = assignmentScoreSummary(rows, 7);
    133|     expect(summary.averagePercent).toBe(21);
       |                                    ^
    134|     expect(summary.distribution.reduce((count, bucket) => count + buck…
    135|   });
```

### tests/unit/tpo-inbox-team-round5-parity-review.test.ts

```
 FAIL  tests/unit/tpo-inbox-team-round5-parity-review.test.ts > TPO inbox/team outstanding legacy contracts > TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias
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


## Lane-3 repairs

- `chat7-semester-layout-verify2b.test.ts`: FIXED in `1559fe7451550fe392fbab0628ed0915eccdd0f7`; responsive form/directory grid now stacks on mobile and uses 10/14 split at lg.
- `faculty-assessment-report.test.ts`: FIXED in `ce33522f3749fb3a0e3df7e59f252f42902ab525`; retain fractional graded percentages before rounding the final average (1/7 and 2/7 average to 21%, not 22%).

- `HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts`: FIXED in `deb168c261a8e2e75551fa43c32b8667bdcf66a7`; mock denied-access audit persistence for isolated unit test while retaining asserted audit call and production fail-closed policy.
- `chat19-clone-sidebar-checkpoint.test.ts`: FIXED in `81858c3f827faa9b6e37d311a567722de04e63dd`; assert actual same-tab accessible `<Link>` footer rather than retired `<Button>` markup, preserving navigation and alias checks.

- `chat4-college-ux-round5.test.ts`: FIXED in `83762c690e67014fcd7ddd4f3994369fe81dba3b`; checks rendered extracted selection component without dropping table, ScrollCue, caption or keyboard target requirements.
- `UX-superadmin-import-tables-chat17.test.ts`: FIXED in `ae80d175cd537b0f910918fc5a417bac7bd3af7f`; confirmation text now asserts the actual server-validated preview flow, rather than obsolete locally-only validation copy.
