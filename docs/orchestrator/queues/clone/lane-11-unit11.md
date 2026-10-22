# Unit-test repair queue (unit11): lane chat-11

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-11-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/PROJ-BREAK-chat9-readiness-override-atomic-read.test.ts` (1 failing)
- [ ] `tests/unit/chat12-verify2-log-explorer-access-audit.test.ts` (1 failing)
- [ ] `tests/unit/chat2-team-member-and-alert-parity.test.ts` (2 failing)
- [ ] `tests/unit/chat6-superadmin-middle-drive-ist-date.test.ts` (1 failing)
- [ ] `tests/unit/chat9-super-admin-tenant-hub-copy.test.ts` (1 failing)
- [ ] `tests/unit/legacy-lesson-atomic-parity.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat9-readiness-override-atomic-read.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-chat9-readiness-override-atomic-read.test.ts [ tests/unit/PROJ-BREAK-chat9-readiness-override-atomic-read.test.ts ]
ReferenceError: Cannot access 'projectId' before initialization
 ❯ tests/unit/PROJ-BREAK-chat9-readiness-override-atomic-read.test.ts:10:10
      8| const state=vi.hoisted(()=>({
      9|   reads:0,scope:0,liveChecks:0,transactionCalls:0,lock:"",revoked:fals…
     10|   rows:[{projectId,metadata:{state:"FORCE_UNLOCK",note:"Approved excep…
       |          ^
     11|     by:"College Admin",at:new Date("2026-10-17T20:00:00.000Z")}] as {
     12|       projectId:string;metadata:{state:string;note?:string};by:string|…
 ❯ tests/unit/PROJ-BREAK-chat9-readiness-override-atomic-read.test.ts:8:16

```

### tests/unit/chat12-verify2-log-explorer-access-audit.test.ts

```
 FAIL  tests/unit/chat12-verify2-log-explorer-access-audit.test.ts > chat-12 verify2 privileged tracker log view > requires a named unscoped Super Admin and audits each authorized explorer read
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

### tests/unit/chat2-team-member-and-alert-parity.test.ts

```
 FAIL  tests/unit/chat2-team-member-and-alert-parity.test.ts > chat-2 Team membership, context and event notifications > TPO-inbox-team-38 lets authorized college admins and TPO admins participate, with persisted college scope
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

 FAIL  tests/unit/chat2-team-member-and-alert-parity.test.ts > chat-2 Team membership, context and event notifications > TPO-inbox-team-34 retains Away until and back-now updates on Team People
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

### tests/unit/chat6-superadmin-middle-drive-ist-date.test.ts

```
 FAIL  tests/unit/chat6-superadmin-middle-drive-ist-date.test.ts > Super Admin placement drive directory date safety > SA-admin-middle-drives-IST-01 never renders a UTC ISO date fragment for either timestamp
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminDriveIstDate(row.job.application…'

- Expected
+ Received

- adminDriveIstDate(row.job.applicationDeadline)
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { listPlacementOperationsJobPage } from "@/modules/placements/tpo-operations-service";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { PageBackLink } from "@/components/ui/page-back-link";
+ import { SuperAdminDriveDirectoryFilters } from "@/components/placements/super-admin-drive-directory-filters";
+ import { Input } from "@/components/ui/input";
```

### tests/unit/chat9-super-admin-tenant-hub-copy.test.ts

```
 FAIL  tests/unit/chat9-super-admin-tenant-hub-copy.test.ts > Super Admin Tenant Setup dev-legacy stage copy > keeps Create and Set up explicitly reachable without assuming college scope
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain 'href="/admin/tenants/create"'

- Expected
+ Received

- href="/admin/tenants/create"
+ import SuperAdminTenantSetup from "./setup/page";
+ import TenantDirectory from "./directory/page";
+
+ /** Old Tenant Setup lands in the two-step structure/launch workspace.
+  * The independent college directory remains reachable as a secondary route.
+  * Keep existing filtered directory deep links working after the route split.
+  */
+ export default async function SuperAdminTenantLanding({searchParams}:{
+  searchParams:Promise<Record<string,string|string[]|undefined>>;
```

### tests/unit/legacy-lesson-atomic-parity.test.ts

```
 FAIL  tests/unit/legacy-lesson-atomic-parity.test.ts > legacy lesson authoring is atomic and scoped > inserts the lesson and all course-wide child contents under one transaction
AssertionError: expected -1 to be greater than 6784
 ❯ tests/unit/legacy-lesson-atomic-parity.test.ts:30:20
     28|   const audit=lesson.indexOf("recordActivityEventInTransaction(tx, con…
     29|   expect(start).toBeGreaterThan(-1);
     30|   expect(inserted).toBeGreaterThan(start);
       |                    ^
     31|   expect(children).toBeGreaterThan(inserted);
     32|   expect(audit).toBeGreaterThan(children);

```

