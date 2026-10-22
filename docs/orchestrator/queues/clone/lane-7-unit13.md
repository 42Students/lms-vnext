# Unit-test repair queue (unit13): lane chat-7

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/PROJ-BREAK-chat9-admin-view-filter-boundary.test.ts` (1 failing)
- [x] `tests/unit/chat6-cross-page-verification-round4.test.ts` (2 failing)
- [x] `tests/unit/tpo-team-person-context-chat2.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat9-admin-view-filter-boundary.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-chat9-admin-view-filter-boundary.test.ts > IIT Dharwad Projects: strict snapshot filter contract preserves cards and list > PROJ-BREAK-ux-22 admin page projects away view before service but preserves user-selected tabs
AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'q: query.q, status: query.status, pag…'

- Expected
+ Received

- q: query.q, status: query.status, page: query.page, pageSize: query.pageSize
+ import { FilterBar } from "@/components/ui/filter-bar";
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {
+   ProjectAdminFilters,
+   ProjectAdminPagination,
+   type ProjectAdminCollectionQuery,
+ } from "@/components/projects/project-admin-collection-controls";
+ import { CreateProjectControl } from "@/components/projects/project-create-control";
```

### tests/unit/chat6-cross-page-verification-round4.test.ts

```
 FAIL  tests/unit/chat6-cross-page-verification-round4.test.ts > chat-6 cross-page gap source verification > SA-academics-people-68 filters course progress by course and batch with legacy completion guidance
AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'selectedCourse={data.query.courseCode…'

- Expected
+ Received

- selectedCourse={data.query.courseCode} selectedCohort={data.query.cohortCode}
+ import {Button} from "@/components/ui/button";
+ import {Select} from "@/components/ui/select";
+ import {Input} from "@/components/ui/input";
+ import Link from "next/link";
+ import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";
+ import {SuperAdminCourseProgressSelector} from "@/components/courses/super-admin-course-progress-selector";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { Alert } from "@/components/ui/alert";

 FAIL  tests/unit/chat6-cross-page-verification-round4.test.ts > chat-6 cross-page gap source verification > SA-academics-people-79 renders selected-college faculty and student overview metrics from scoped directory counts
AssertionError: expected 'import {getCurrentRequestContext} fro…' to contain 'kind:"FACULTY"'

- Expected
+ Received

- kind:"FACULTY"
+ import {getCurrentRequestContext} from "@/auth/request-context";
+ import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
+ import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
+ import {CollegePersonAuditModal} from "@/components/college/college-person-audit-modal";
+ import {CollegePersonProfileOverviewModal} from "@/components/college/college-person-profile-overview-modal";
+ import Link from "next/link";
+ import {Alert} from "@/components/ui/alert";
+ import {PageHeader} from "@/components/ui/page-header";
+ import { Disclosure } from "@/components/ui/disclosure";
```

### tests/unit/tpo-team-person-context-chat2.test.ts

```
 FAIL  tests/unit/tpo-team-person-context-chat2.test.ts > TPO team conversation and person context > TPO-inbox-team-31 shows You only for the active roster membership
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

