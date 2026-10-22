# Unit-test repair queue (unit11): lane chat-4

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-4-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/HR-BREAK-chat19-report-joined.test.ts` (1 failing)
- [ ] `tests/unit/UX-teacher-shared-surfaces.test.ts` (1 failing)
- [ ] `tests/unit/chat19-college-cross-audit.test.ts` (2 failing)
- [ ] `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` (2 failing)
- [ ] `tests/unit/chat7-superadmin-course-tenant-bulk.test.ts` (1 failing)
- [ ] `tests/unit/graceful-raw-error-scan.test.ts` (1 failing)
- [ ] `tests/unit/tpo-team-legacy-people-chat2.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/HR-BREAK-chat19-report-joined.test.ts

```
 FAIL  tests/unit/HR-BREAK-chat19-report-joined.test.ts > HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers > retains historical college applicants in page counts after graduation or deactivation
AssertionError: expected ' jobIds.length === 0\n    ? []\n    :…' to contain 'eq(collegeMemberships.collegeId,'

- Expected
+ Received

- eq(collegeMemberships.collegeId,
+  jobIds.length === 0
+     ? []
+     : await db
+         .select({
+           jobId: placementApplications.jobId,
+           applications: sql<number>`
+             count(
+               distinct ${placementApplications.id}
+             )::integer
```

### tests/unit/UX-teacher-shared-surfaces.test.ts

```
 FAIL  tests/unit/UX-teacher-shared-surfaces.test.ts > Faculty shared surface mobile and focus rollout > UX-teacher-courses-shared-02 preserves course summary roles and 44px filter disclosures
AssertionError: expected 'import type { ReactNode } from "react…' to contain 'flex min-h-11 cursor-pointer'

- Expected
+ Received

- flex min-h-11 cursor-pointer
+ import type { ReactNode } from "react";
+ import { cx } from "@/lib/class-names";
+
+ /** Semantic keyboard disclosure. Native details handles Enter/Space and
+  * reduces motion to the shared opacity-only fade in globals.css. */
+ export function Disclosure({
+   title, children, className, defaultOpen = false,
+   id, summaryAriaLabel, summaryTitle, ariaLabel, summaryClassName, contentClassName, preserveSummary = false,
+ }: {
```

### tests/unit/chat19-college-cross-audit.test.ts

```
 FAIL  tests/unit/chat19-college-cross-audit.test.ts > chat-19 college UX cross-audit > COL-XA-11 uses mobile cards with labelled elective allocation checkboxes
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

 FAIL  tests/unit/chat19-college-cross-audit.test.ts > chat-19 college UX cross-audit > UX-college-scroll-motion-01 responsive rosters offer an actual shared scroll cue instead of a hidden scrollbar
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

### tests/unit/chat4-college-verification-misc-gap-closure.test.ts

```
 FAIL  tests/unit/chat4-college-verification-misc-gap-closure.test.ts > chat-4 College Verification and Misc verification > COL-verification-misc-02 retains source-backed legacy behavior
AssertionError: expected '"use client";\n\nimport {useRouter} f…' to contain '>Retry</Link>'

- Expected
+ Received

- >Retry</Link>
+ "use client";
+
+ import {useRouter} from "next/navigation";
+ import {Button} from "@/components/ui/button";
+ import {useEffect,useState,useTransition,type ComponentProps} from "react";
+ import {CollegeAdminProfileEditor} from "./college-admin-profile-editor";
+ import {ErrorState} from "@/components/ui/error-state";
+ import {Alert} from "@/components/ui/alert";
+

 FAIL  tests/unit/chat4-college-verification-misc-gap-closure.test.ts > chat-4 College Verification and Misc verification > G2-1-026-012 retains the last college profile with a warning and safe retry
AssertionError: expected '"use client";\n\nimport {useRouter} f…' to contain '>Retry</Link>'

- Expected
+ Received

- >Retry</Link>
+ "use client";
+
+ import {useRouter} from "next/navigation";
+ import {Button} from "@/components/ui/button";
+ import {useEffect,useState,useTransition,type ComponentProps} from "react";
+ import {CollegeAdminProfileEditor} from "./college-admin-profile-editor";
+ import {ErrorState} from "@/components/ui/error-state";
+ import {Alert} from "@/components/ui/alert";
+
```

### tests/unit/chat7-superadmin-course-tenant-bulk.test.ts

```
 FAIL  tests/unit/chat7-superadmin-course-tenant-bulk.test.ts > SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > the initial lesson-content query filters both college-owned departments and periods to acting scope before counting matches
AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'selected.length!==input.courseIds.len…'

- Expected
+ Received

- selected.length!==input.courseIds.length
+ import "server-only";
+ import {and,eq,inArray,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {academicPeriods,courseLessons,courseLearningPaths,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
+ import type {RequestContext} from "@/modules/identity/context";
+ import {resolveActingCollege} from "@/modules/permissions/acting-college";
+ import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
+ import {bulkSuperAdminLessonVisibility} from "./super-admin-lesson-bulk-visibility";
```

### tests/unit/graceful-raw-error-scan.test.ts

```
 FAIL  tests/unit/graceful-raw-error-scan.test.ts > new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components
AssertionError: Mutating fetch without useGuardedAction: src/components/tpo/tpo-notice-delivery-retry.tsx: expected [ Array(1) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "src/components/tpo/tpo-notice-delivery-retry.tsx",
+ ]

 ❯ tests/unit/graceful-raw-error-scan.test.ts:111:91
    109|         blobHash(content) !== baseline[file];
    110|     });
    111|     expect(offenders, `Mutating fetch without useGuardedAction: ${offe…
       |                                                                                           ^
```

### tests/unit/tpo-team-legacy-people-chat2.test.ts

```
 FAIL  tests/unit/tpo-team-legacy-people-chat2.test.ts > TPO People roster legacy copy > TPO-inbox-team-32 keeps the number of displayed team members consistent with the filtered roster
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

