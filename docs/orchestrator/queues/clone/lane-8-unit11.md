# Unit-test repair queue (unit11): lane chat-8

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-8-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/PROJ-BREAK-chat19-workspace-brief-and-comment-kinds.test.ts` (1 failing)
- [x] `tests/unit/chat12-round37-xlsx-export.test.ts` (1 failing)
- [x] `tests/unit/chat2-public-placements-page.test.ts` (1 failing)
- [x] `tests/unit/chat6-inbound-reply-body-provenance.test.ts` (1 failing)
- [x] `tests/unit/chat9-super-admin-exact-page-copy.test.ts` (1 failing)
- [x] `tests/unit/learner-job-detail-parity.test.ts` (1 failing)
- [x] `tests/unit/ux-admin-chat9-interactions.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat19-workspace-brief-and-comment-kinds.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-chat19-workspace-brief-and-comment-kinds.test.ts > PROJ-BREAK-BRIEF-01: workspace brief and persisted task-kind integrity > untrusted invalid persisted JSON is replaced by fresh independent empty lists
AssertionError: expected { goal: 'Injected', …(4) } to deeply equal { goal: '', description: '', …(3) }

- Expected
+ Received

  {
    "completionConditions": [],
    "deliverables": [],
    "description": "",
-   "goal": "",
+   "goal": "Injected",
    "personas": [],
  }

 ❯ tests/unit/PROJ-BREAK-chat19-workspace-brief-and-comment-kinds.test.ts:50:17
```

### tests/unit/chat12-round37-xlsx-export.test.ts

```
 FAIL  tests/unit/chat12-round37-xlsx-export.test.ts > uses the saved view label for an export and safely strips HTTP-header control characters
AssertionError: expected 'TCS-r-nOther- value.csv' to be 'TCS-Other- value.csv' // Object.is equality

Expected: "TCS-Other- value.csv"
Received: "TCS-r-nOther- value.csv"

 ❯ tests/unit/chat12-round37-xlsx-export.test.ts:29:66
     27|  expect(endpoint).toContain('legacySavedViewExportFilename(viewName, "…
     28|  expect(legacyGridExportFilename("TCS shortlist","xlsx")).toBe("TCS sh…
     29|  expect(legacyGridExportFilename("TCS\\r\\nOther: value","csv")).toBe(…
       |                                                                  ^
     30| });

```

### tests/unit/chat2-public-placements-page.test.ts

```
 FAIL  tests/unit/chat2-public-placements-page.test.ts > TPO public placements publication and copy > TPO-campaigns-public-36 uses the college-specific legacy heading and removes platform-only footer
AssertionError: expected 'import { headers } from "next/headers…' to contain 'Placements at {college?.collegeName??…'

- Expected
+ Received

- Placements at {college?.collegeName??"your college"}
+ import { headers } from "next/headers";
+ import {notFound} from "next/navigation";
+ import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
+ import { resolveRequestTenant } from "@/modules/auth/request-tenant";
+ import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
+ import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";
+ import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
+ import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,formatPublicPlacementMetric} from "@/modules/placements/public-page/content-model";
+ import { getPublicPlacementStatistics } from "@/modules/placements/public-page/read-service";
```

### tests/unit/chat6-inbound-reply-body-provenance.test.ts

```
 FAIL  tests/unit/chat6-inbound-reply-body-provenance.test.ts > verified recruiter email reply provenance > requires gateway HMAC and authorized sender before posting
AssertionError: expected 'import "server-only";\nimport {create…' to contain 'verifyRecruiterMailBridgeSignature(se…'

- Expected
+ Received

- verifyRecruiterMailBridgeSignature(secret,rawBody,signature)
+ import "server-only";
+ import {createHash,randomUUID} from "node:crypto";
+ import {eq,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {placementRecruiterInboundEmailEvents,placementRecruiterMessageMailState} from "@/db/schema";
+ import {inboundMailMessages} from "@/db/schema/inbound-mail";
+ import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
+ import {verifyRecruiterMailBridgeWithRotation,extractRecruiterEmailReply} from "./recruiter-message-email-model";
```

### tests/unit/chat9-super-admin-exact-page-copy.test.ts

```
 FAIL  tests/unit/chat9-super-admin-exact-page-copy.test.ts > Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > admin/tenants/page.tsx uses the exact title case
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain 'title="Tenant Setup"'

- Expected
+ Received

- title="Tenant Setup"
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

### tests/unit/learner-job-detail-parity.test.ts

```
 FAIL  tests/unit/learner-job-detail-parity.test.ts > Learner published placement Job Detail > does not disclose unpublished/other-college jobs on arbitrary job IDs
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

### tests/unit/ux-admin-chat9-interactions.test.ts

```
 FAIL  tests/unit/ux-admin-chat9-interactions.test.ts > chat-9 UX last-third substantive interactions > UX-admin-tenants-03 enforces the accessible interaction contract
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain '<Input'

- Expected
+ Received

- <Input
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


## Deep rows (from DEEP_agent2_4.md, unfinished; do these FIRST)

Record each result under ## Results in docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md as OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-006-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
