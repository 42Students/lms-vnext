# Unit-test repair queue (unit13): lane chat-8

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/UX-college-cross-audit-chat19.test.ts` (6 failing)
- [ ] `tests/unit/chat6-superadmin-content-round2.test.ts` (1 failing)
- [ ] `tests/unit/tpo-team-workload-chat2.test.ts` (2 failing)

## Failures (from CI log)

### tests/unit/UX-college-cross-audit-chat19.test.ts

```
 FAIL  tests/unit/UX-college-cross-audit-chat19.test.ts > College cross-audit fixes (independent chat-19) > COL-XA-03 attendance/corrections retains mobile identity cards and sticky desktop columns
AssertionError: attendance/corrections: expected 'import { DateInput } from "@/componen…' to match /mobilePriority:\\s*["']primary["']/

- Expected:
/mobilePriority:\\s*["']primary["']/

+ Received:
"import { DateInput } from \"@/components/ui/date-input\";
import { Button } from \"@/components/ui/button\";
import Link from \"next/link\";
import {getCurrentRequestContext} from \"@/auth/request-context\";
import {PageHeader} from \"@/components/ui/page-header\";
import {DataTable} from \"@/components/ui/data-table\";
import {ErrorState} from \"@/components/ui/error-state\";
import {Alert} from \"@/components/ui/alert\";
import {EmptyState} from \"@/components/ui/empty-state\";

 FAIL  tests/unit/UX-college-cross-audit-chat19.test.ts > College cross-audit fixes (independent chat-19) > COL-XA-03 batch-promotion retains mobile identity cards and sticky desktop columns
AssertionError: batch-promotion: expected 'import { FilterBar } from "@/componen…' to match /mobilePriority:\\s*["']primary["']/

- Expected:
/mobilePriority:\\s*["']primary["']/

+ Received:
"import { FilterBar } from \"@/components/ui/filter-bar\";
import { Checkbox } from \"@/components/ui/checkbox\";
import Link from \"next/link\";
import { CollegeBatchGraduateButton } from \"@/components/academics/college-batch-graduate-button\";
import { CollegePromotionConfirmation } from \"@/components/academics/college-promotion-confirmation\";
import {AuthorizationError} from \"@/modules/permissions/policy\";
import { getCurrentRequestContext } from \"@/auth/request-context\";
import { ErrorState } from \"@/components/ui/error-state\";
import { PageHeader } from \"@/components/ui/page-header\";

 FAIL  tests/unit/UX-college-cross-audit-chat19.test.ts > College cross-audit fixes (independent chat-19) > COL-XA-03 batches/[cohortId]/students retains mobile identity cards and sticky desktop columns
AssertionError: batches/[cohortId]/students: expected 'import Link from "next/link";\nimport…' to match /mobilePriority:\\s*["']primary["']/

- Expected:
/mobilePriority:\\s*["']primary["']/

+ Received:
"import Link from \"next/link\";
import { FilterBar } from \"@/components/ui/filter-bar\";
import { notFound, redirect } from \"next/navigation\";
import { and, eq, ilike, or } from \"drizzle-orm\";
import { z } from \"zod\";
import { getDb } from \"@/db/client\";
import {
  cohorts, collegeMemberships, departments, learnerProfiles,
  learnerProgramEnrollments, programs, sectionEnrollments, sections, users,

 FAIL  tests/unit/UX-college-cross-audit-chat19.test.ts > College cross-audit fixes (independent chat-19) > COL-XA-03 electives/[slotId]/offerings/[offeringId]/roster retains mobile identity cards and sticky desktop columns
AssertionError: electives/[slotId]/offerings/[offeringId]/roster: expected '"use server";\nimport Link from "next…' to match /mobilePriority:\\s*["']primary["']/

- Expected:
/mobilePriority:\\s*["']primary["']/

+ Received:
"\"use server\";
import Link from \"next/link\";
import { notFound, redirect } from \"next/navigation\";
import { and, count, eq, ilike, isNull, or, sql } from \"drizzle-orm\";
import { z } from \"zod\";
import { getDb } from \"@/db/client\";
import { collegeMemberships, colleges, electiveOfferings, electiveSlots, learnerProfiles, lmsGroupMembers, members
```

### tests/unit/chat6-superadmin-content-round2.test.ts

```
 FAIL  tests/unit/chat6-superadmin-content-round2.test.ts > Super Admin Courses and Content gap closure > SA-academics-people-51 Super Admin duplicate course prepopulates draft and returns to correct route
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'duplicateCourseId={duplicateCourseId}'

- Expected
+ Received

- duplicateCourseId={duplicateCourseId}
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

### tests/unit/tpo-team-workload-chat2.test.ts

```
 FAIL  tests/unit/tpo-team-workload-chat2.test.ts > Team workload sorting > TPO-inbox-team-31 uses only scoped OPEN ask records for real per-person workload
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

 FAIL  tests/unit/tpo-team-workload-chat2.test.ts > Team workload sorting > TPO-inbox-team-22 exposes ask status in People without fabricating work for other colleges
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

