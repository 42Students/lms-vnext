# Unit-test repair queue (unit11): lane chat-13

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-13-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts` (1 failing)
- [x] `tests/unit/chat13-final-sprint-learner-24.test.ts` (1 failing)
- [x] `tests/unit/chat2-tpo-member-workload-parity.test.ts` (1 failing)
- [x] `tests/unit/chat6-superadmin-people-round3.test.ts` (1 failing)
- [x] `tests/unit/chat9-verify2-admin-course-dependency-pages.test.ts` (1 failing)
- [x] `tests/unit/pub-auth-public-42-rollback.test.ts` (1 failing)

## Repair results

- FIXED `tests/unit/chat6-superadmin-people-round3.test.ts` — commits `5f266475f6c66148c99d47dac1ebf4cf6438d4b0`, `c3e3be0dfdca0a4bba349196751fdd16c19198c6`, `src/components/admin/super-admin-student-bulk-access.tsx`: reinstate 1,000-student safety ceiling on hydrated, page, range, single-checkbox and submission selections while retaining 25-row atomic groups. Restored expected exact validation message.

- FIXED `tests/unit/pub-auth-public-42-rollback.test.ts` — commit `f428306cdcebd4dbf5aa78227634e258e77b3255`: test the actual active-grant rejection, pending-only grant refresh, and invite consumption rollback. An existing PENDING_RECRUITER grant is intentionally updated after signed-in consent rather than universally rejected.

- FIXED `tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts` — commit `401286976c367de1bd21cfa5069abd22df1ec202`: verify `<ElectiveEligibleSelection` is wired in the allocation route, then verify `<DataTable` in the extracted, keyboard-accessible `src/components/academics/elective-eligible-selection.tsx`; retain DataTable sticky-column, ScrollCue, and focus assertions.

- FIXED `tests/unit/chat13-final-sprint-learner-24.test.ts` — commit `178846d8455b3cf7178ced723fabaa1a49f05377`: preserved the exact `Job unavailable` text requirement while permitting JSX newline between element and `title` in `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx`.

- FIXED `tests/unit/chat9-verify2-admin-course-dependency-pages.test.ts` — commit `272a92b481bd87b544dc27f47b4912355444cf99`, `src/app/(authenticated)/admin/courses/page.tsx`: dependency lookup now receives only visible page IDs from `paginateCollegeCourses(workspace?.courses??[],catalogueQuery).items`, bounded by the validated page size, rather than the wrong first 100 unfiltered courses.

- FIXED `tests/unit/chat2-tpo-member-workload-parity.test.ts` — commit `ec44cc5c6f50b41217a1f44d6b5bb0d244d3b3c1`: correct outdated expectation to canonical `/tpo/settings?tab=team` link used by the current People-tab redirect; retain and strengthen People/Members/Roster deep-link routing assertion. Product route: `src/app/(authenticated)/tpo/team/page.tsx:24-35`.

## Failures (from CI log)

### tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts

```
 FAIL  tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts > UX-college-college-electives-slot-id-allocate-01 provides keyboard-scrolling wide roster with fixed identity
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

### tests/unit/chat13-final-sprint-learner-24.test.ts

```
 FAIL  tests/unit/chat13-final-sprint-learner-24.test.ts > LEARNER-placements-24 cancelled/closed drive history > LEARNER-placements-24 preserves own historical applied drives instead of returning notFound
AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<EmptyState title="Job unavailable"'

- Expected
+ Received

- <EmptyState title="Job unavailable"
+ import Link from "next/link";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { Banner } from "@/components/ui/banner";
+ import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
+ import { Tabs } from "@/components/ui/tabs";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { ErrorState } from "@/components/ui/error-state";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { getCurrentRequestContext } from "@/auth/request-context";
```

### tests/unit/chat2-tpo-member-workload-parity.test.ts

```
 FAIL  tests/unit/chat2-tpo-member-workload-parity.test.ts > TPO Team People persisted workloads > TPO-inbox-team-31 shows real drive, company, overdue follow-up and waiting-on-teammate numbers
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

### tests/unit/chat6-superadmin-people-round3.test.ts

```
 FAIL  tests/unit/chat6-superadmin-people-round3.test.ts > Chat-6 Super Admin people round 3 source verification > SA-academics-people-97 supports safe bulk student module overrides with selection cap
AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Select at most 1,000 students.'

- Expected
+ Received

- Select at most 1,000 students.
+ "use client";
+ import { Button } from "@/components/ui/button";
+ import { Select } from "@/components/ui/select";
+ import { Checkbox } from "@/components/ui/checkbox";
+ import { ConfirmDialog } from "@/components/ui/confirm-dialog";
+ import {useEffect,useRef,useState} from "react";
+ import {superAdminStudentBulkFailure} from "@/modules/module-access/super-admin-student-bulk-feedback";
+ import {useRouter} from "next/navigation";
+ type Learner={id:string;name:string};
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

### tests/unit/pub-auth-public-42-rollback.test.ts

```
 FAIL  tests/unit/pub-auth-public-42-rollback.test.ts > PUB-auth-public-42 failed identity and grant steps must roll back > does not commit new user/profile after an invalid post-identity state
AssertionError: expected 'import "server-only";\nimport {create…' to contain 'if(existing)throw invalid()'

- Expected
+ Received

- if(existing)throw invalid()
+ import "server-only";
+ import {createHash} from "node:crypto";
+ import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
+ import type {RequestContext} from "@/modules/identity/context";
+ import {AuthorizationError} from "@/modules/permissions/policy";
+ import {getDb} from "@/db/client";
+ import {
+  activityEvents,collegeMemberships,colleges,membershipRoles,inAppNotifications,
+  placementCompanies,placementCompanyRelationships,
```


## Deep rows (from DEEP_agent2_4.md, unfinished; do these FIRST)

Record each result under ## Results in docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md as OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-015-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
