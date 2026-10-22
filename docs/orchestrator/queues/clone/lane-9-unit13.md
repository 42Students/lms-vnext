# Unit-test repair queue (unit13): lane chat-9

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` (1 failing)
- [x] `tests/unit/chat6-superadmin-course-catalogue-round4.test.ts` (1 failing; selected-college lesson counts passed to overview on branch; dependency service cleanup 47d4a13)
- [x] `tests/unit/ux-admin-chat9-batch-04.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-kit-projects-hardening-chat17.test.tsx

```
 FAIL  tests/unit/UX-kit-projects-hardening-chat17.test.tsx > UX-kit-HARDEN-22 declared 38-element shared UI surface register > UX-kit-HARDEN-22 third-party-link remains in the checked-in kit and has no native popup or one-off >300ms interactive duration
AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'href={safeHref} rel="noopener norefer…'

- Expected
+ Received

- href={safeHref} rel="noopener noreferrer"
+ "use client";
+
+ import { useId, useState } from "react";
+ import { Button } from "@/components/ui/button";
+
+ /** WebView-safe external navigation with a user-selectable, copyable fallback.
+  * Clipboard failures never hide the original validated HTTPS URL. */
+ export function ThirdPartyLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel?: string }) {
+   const [showFallback, setShowFallback] = useState(false);
```

### tests/unit/chat6-superadmin-course-catalogue-round4.test.ts

```
 FAIL  tests/unit/chat6-superadmin-course-catalogue-round4.test.ts > chat-6 Super Admin selected-college course directory parity > SA-academics-people-74 counts lesson dependencies only in the selected college and preflights archive
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'lessonCountByCourse={lessonCountByCou…'

- Expected
+ Received

- lessonCountByCourse={lessonCountByCourse}
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

### tests/unit/ux-admin-chat9-batch-04.test.ts

```
 FAIL  tests/unit/ux-admin-chat9-batch-04.test.ts > chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-01 preserves shared UX and scoped route behavior
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'can(context,"admin-scope.select")'

- Expected
+ Received

- can(context,"admin-scope.select")
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { can } from "@/modules/permissions/policy";
+ import { isSuperAdmin } from "@/modules/identity/context";
+ import { ErrorState } from "@/components/ui/error-state";
+ import SuperAdminTenantSetup from "./setup/page";
+ import TenantDirectory from "./directory/page";
+
+ /** Preserve filtered directory deep links and keep the domain management
```

