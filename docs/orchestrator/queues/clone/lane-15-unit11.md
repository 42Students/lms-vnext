# Unit-test repair queue (unit11): lane chat-15

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-15-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-college-projects-workspaces-workspaceId-01.test.ts` (1 failing)
- [x] `tests/unit/chat15-faculty-assignment-material-authoring.test.ts` (1 failing)
- [x] `tests/unit/chat2-tpo-unowned-work-parity.test.ts` (1 failing)
- [x] `tests/unit/chat6-tracker-log-scope-policy.test.ts` (1 failing)
- [x] `tests/unit/chat9-verify2-learner-course-recovery.test.ts` (1 failing)
- [x] `tests/unit/public-auth-login-gap-verification.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-college-projects-workspaces-workspaceId-01.test.ts

```
 FAIL  tests/unit/UX-college-projects-workspaces-workspaceId-01.test.ts > /college/projects/workspaces/[workspaceId] UX > UX-college-projects-workspace-detail-02 retains safe route or shared-workspace UX
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect(next+(suffix.size?"?"+suffix…'

- Expected
+ Received

- redirect(next+(suffix.size?"?"+suffix.toString():""))
+ import { redirect } from "next/navigation";
+ import { legacyWorkspaceSummaryQuery } from "@/modules/projects/legacy-workspace-summary-query";
+
+ /** Existing bookmarks, including deep-linked template prompts, remain usable. */
+ export default async function LegacyCollegeWorkspaceRedirect({
+   params,searchParams,
+ }: {
+   params: Promise<{workspaceId:string}>;
+   searchParams: Promise<Record<string,string|string[]|undefined>>;
```

### tests/unit/chat15-faculty-assignment-material-authoring.test.ts

```
 FAIL  tests/unit/chat15-faculty-assignment-material-authoring.test.ts > LEARNER-course-detail-03 and LEARNER-learning-misc-02 authoring recovery > LEARNER-course-detail-03 makes saved assignment links editable without a new page design
AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'File handouts require verified privat…'

- Expected
+ Received

- File handouts require verified private storage.
+ "use client";
+ import { Alert } from "@/components/ui/alert";
+ import { Disclosure } from "@/components/ui/disclosure";
+
+ import { Button } from "@/components/ui/button";
+ import { ConfirmDialog } from "@/components/ui/confirm-dialog";
+ import { LoadingState } from "@/components/ui/loading-state";
+ import { Input } from "@/components/ui/input";
+ import {useEffect,useRef,useState} from "react";
```

### tests/unit/chat2-tpo-unowned-work-parity.test.ts

```
 FAIL  tests/unit/chat2-tpo-unowned-work-parity.test.ts > TPO unowned work assignment safety > TPO-inbox-team-33 exposes a guarded, accessible assigner only when the schema is ready
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

### tests/unit/chat6-tracker-log-scope-policy.test.ts

```
 FAIL  tests/unit/chat6-tracker-log-scope-policy.test.ts > 42 Tracker secure log access policy > SA-placements-projects-118 NOT-A-GAP manager password bypass is disallowed by OD-27; log access remains Super Admin scoped
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if (!isSuperAdmin(context) || context…'

- Expected
+ Received

- if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
+ import Link from "next/link";
+ import type { Metadata } from "next";
+ import { Tabs } from "@/components/ui/tabs";
+
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { getDb } from "@/db/client";
+ import { activityEvents } from "@/db/schema/activity";
+ import { KnownErrorsWorkspace } from "@/components/tracker/known-errors-workspace";
+ import { TrackerLiveLogsExplorer } from "@/components/tracker/tracker-live-logs-explorer";
```

### tests/unit/chat9-verify2-learner-course-recovery.test.ts

```
 FAIL  tests/unit/chat9-verify2-learner-course-recovery.test.ts > learner course recovery and missing class state > names the legacy roadmap loading failure distinctly and offers Retry
AssertionError: expected 'import { Banner } from "@/components/…' to contain 'activeTab==="roadmap"?"Lesson content…'

- Expected
+ Received

- activeTab==="roadmap"?"Lesson content could not be loaded"
+ import { Banner } from "@/components/ui/banner";
+ import { CoursesServiceError } from "@/modules/courses/errors";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { ZodError } from "zod";
+ import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";
+ import type { ReactNode } from "react";
+ import Link from "next/link";
+ import { learnerCourseTabPath } from "@/modules/courses/learner-course-tab-route-model";
+ import {resolveLegacyLearnerCourseDelivery} from "@/modules/courses/learner-course-legacy-route-service";
```

### tests/unit/public-auth-login-gap-verification.test.ts

```
 FAIL  tests/unit/public-auth-login-gap-verification.test.ts > public sign-in verified gap closure > PUB-auth-public-13 restores an unexpired one-time-code attempt after refresh
AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'loadLoginAttempt()'

- Expected
+ Received

- loadLoginAttempt()
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


## Lane chat-15 repair dispositions

- `UX-college-projects-workspaces-workspaceId-01.test.ts`: the redirect uses `legacyWorkspaceSummaryQuery(query)` (sanitized string), not a `URLSearchParams.size` local; updated assertion in commit `4accd98b` to check both sanitizer call and final same-tab redirect.
- `chat15-faculty-assignment-material-authoring.test.ts`: the current warning additionally forbids public Drive links; updated the exact-copy assertion without removing protection in commit `20b03817`.
- `chat2-tpo-unowned-work-parity.test.ts`: old bookmark `/tpo/team` redirects roster requests to `/tpo/settings?tab=team` and retains the role/membership gate; updated assertion in commit `c582bc76`.
- `chat6-tracker-log-scope-policy.test.ts`: page additionally checks ACTIVE platform status and both acting scopes; updated test to assert those controls in commit `ce8f8ac4`.
- `chat9-verify2-learner-course-recovery.test.ts`: failure branch derives `lessonReadFailed` from the rejected roadmap request and renders Retry; updated assertions in commit `cf5d8036`.
- `public-auth-login-gap-verification.test.ts`: recovery calls `loadLoginAttempt(tenantKey)` so a code never resumes for the wrong tenant; updated test and expiration assertion in commit `18dd2247`.

Static source review only: current runner is unavailable; CI pass is not claimed. No test files were deleted or skipped.
