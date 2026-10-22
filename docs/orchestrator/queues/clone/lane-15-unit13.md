# Unit-test repair queue (unit13): lane chat-15

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat13-super-admin-placements-s3-copy-verification.test.ts` (1 failing)
- [ ] `tests/unit/chat9-verify2-admin-course-dependency-pages.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat13-super-admin-placements-s3-copy-verification.test.ts

```
 FAIL  tests/unit/chat13-super-admin-placements-s3-copy-verification.test.ts > Chat 13 Super Admin placement legacy copy and S3 contracts > SA-placements-projects-32 archived company restore
AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'SuperAdminCompanyRestore'

- Expected
+ Received

- SuperAdminCompanyRestore
+ import {Button} from "@/components/ui/button";
+ import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
+ import {Banner} from "@/components/ui/banner";
+ import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
+ import {Select} from "@/components/ui/select";
+ import {Input} from "@/components/ui/input";
+ import Link from "next/link";
+ import {redirect} from "next/navigation";
+ import { SuperAdminCompanyMerge } from "@/components/admin/super-admin-company-merge";
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

