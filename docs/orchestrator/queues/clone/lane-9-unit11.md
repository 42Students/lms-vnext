# Unit-test repair queue (unit11): lane chat-9

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-9-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/PROJ-BREAK-chat9-admin-IST-dates.test.ts` (2 failing)
- [ ] `tests/unit/chat12-verify2-hiring-ist-boundary.test.ts` (1 failing)
- [ ] `tests/unit/chat2-team-college-admin-access.test.ts` (1 failing)
- [ ] `tests/unit/chat6-super-admin-people-contact-redaction.test.tsx` (2 failing)
- [x] `tests/unit/chat9-super-admin-orphan-routes.test.ts` (1 failing) — OK on current main: authenticated admin/tenants/page.tsx contains same-tab <Link href="/admin/domains"> after scoped role/permission gate. Earlier CI predates that link. Source inspection only.
- [x] `tests/unit/learner-placements-chat7-schedule-surface.test.ts` (1 failing) — FIXED stale new-tab assertion; now verifies validated HTTPS same-tab anchor, noreferrer, and copy fallback (chat-3 commit f42d83e).
- [ ] `tests/unit/ux-admin-loading-recovery.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat9-admin-IST-dates.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-chat9-admin-IST-dates.test.ts > IIT Dharwad Projects Admin IST date-boundary integrity > PROJ-BREAK-admin-time-33 the workspace card and scoped export show the same IST calendar day at UTC midnight
AssertionError: expected '\ufeff"Workspace","Status","Progress"…' to contain '"2 Jun 2099"'

- Expected
+ Received

- "2 Jun 2099"
+ ﻿"Workspace","Status","Progress","Mentor","Template ID"

+ "IIT Dharwad","In progress","50","Mentor","Not available"

+

 ❯ tests/unit/PROJ-BREAK-chat9-admin-IST-dates.test.ts:22:17
     20|     }).format(lateUtc);
     21|     expect(istDate).not.toBe(utcDate);

 FAIL  tests/unit/PROJ-BREAK-chat9-admin-IST-dates.test.ts > IIT Dharwad Projects Admin IST date-boundary integrity > PROJ-BREAK-admin-exports-35 Super Admin export uses the same visible status and timezone as cards
AssertionError: expected 'import {collegeWorkspaceStatusLabel} …' to contain 'formatProjectAdminUpdatedDateIst(item…'

- Expected
+ Received

- formatProjectAdminUpdatedDateIst(item.updatedAt)
+ import {collegeWorkspaceStatusLabel} from "./college-workspace-status-label";
+ import {projectAdminCsv,projectAdminCsvCell} from "./project-admin-csv-model";
+
+ export type VisibleWorkspaceExportRow = {
+   title: string;
+   mentorName: string | null;
+   templateId?: string | null;
+   status: string;
+   riskReasons?: readonly string[];
```

### tests/unit/chat12-verify2-hiring-ist-boundary.test.ts

```
 FAIL  tests/unit/chat12-verify2-hiring-ist-boundary.test.ts > chat-12 verify2: legacy hiring report inclusive IST dates > handles month/year and leap-day boundaries without local machine timezone
AssertionError: expected '2026-12-31T18:30:00.000Z' to be '2027-01-01T18:30:00.000Z' // Object.is equality

Expected: "2027-01-01T18:30:00.000Z"
Received: "2026-12-31T18:30:00.000Z"

 ❯ tests/unit/chat12-verify2-hiring-ist-boundary.test.ts:39:59
     37|
     38|   it("handles month/year and leap-day boundaries without local machine…
     39|     expect(istStartOfNextDay("2026-12-31").toISOString()).toBe("2027-0…
       |                                                           ^
     40|     expect(istStartOfNextDay("2028-02-29").toISOString()).toBe("2028-0…
     41|     expect(istStartOfDay("2028-03-01").getTime()).toBe(istStartOfNextD…

```

### tests/unit/chat2-team-college-admin-access.test.ts

```
 FAIL  tests/unit/chat2-team-college-admin-access.test.ts > College placement team access > TPO-inbox-team-37 lists college administrators in the Team People roster
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

### tests/unit/chat6-super-admin-people-contact-redaction.test.tsx

```
 FAIL  tests/unit/chat6-super-admin-people-contact-redaction.test.tsx > SA-admin-middle-people-03 person view fails private-contact disclosure tests > SA-admin-middle-people-03 renders no phone/email even if an improperly populated service object still has raw data
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
 ❯ getAdminLearnerProfileSections src/modules/people/admin-learner-profile-sections-service.ts:21:24
 ❯ Module.MembershipDetail src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx:19:9

 FAIL  tests/unit/chat6-super-admin-people-contact-redaction.test.tsx > SA-admin-middle-people-03 person view fails private-contact disclosure tests > SA-admin-middle-people-03 selected-college exact match retains legitimate contact fields
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
 ❯ getAdminLearnerProfileSections src/modules/people/admin-learner-profile-sections-service.ts:21:24
 ❯ Module.MembershipDetail src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx:19:9
```

### tests/unit/chat9-super-admin-orphan-routes.test.ts

```
 FAIL  tests/unit/chat9-super-admin-orphan-routes.test.ts > Super Admin sidebar consolidation retains orphan routes > keeps domains, academics overview and audit findings reachable
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain 'href="/admin/domains"'

- Expected
+ Received

- href="/admin/domains"
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

### tests/unit/learner-placements-chat7-schedule-surface.test.ts

```
 FAIL  tests/unit/learner-placements-chat7-schedule-surface.test.ts > Chat-7 schedule parity > LEARNER-placements-41 exposes online assessments without pretending schedule is attendance
AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'target="_blank" rel="noopener norefer…'

- Expected
+ Received

- target="_blank" rel="noopener noreferrer"
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

### tests/unit/ux-admin-loading-recovery.test.ts

```
 FAIL  tests/unit/ux-admin-loading-recovery.test.ts > UX-admin-attendance-03 bounded loading
AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'label="Loading scoped attendance"'

- Expected
+ Received

- label="Loading scoped attendance"
+ import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
+
+ export default function SuperAdminAttendanceLoading() {
+   return <GracefulPageLoading label="Loading monthly attendance">
+     <div className="min-w-0 space-y-4">
+       <div className="h-7 w-56 max-w-full animate-pulse rounded bg-muted" />
+       <div className="flex flex-wrap gap-3 border-b border-border pb-4">
+         {Array.from({ length: 3 }, (_, index) => (
+           <div key={index} className="h-10 w-40 max-w-full animate-pulse rounded bg-muted" />
```


## chat-6 overflow repairs

- `PROJ-BREAK-chat9-admin-IST-dates.test.ts`: FIXED on `chatgpt/chat-6-b` in `1395b72d09315dff174f14c3d353133f47fdc7f1`; scoped export now includes the same IST date as workspace cards. No tests executed locally.
