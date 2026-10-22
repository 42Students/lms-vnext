# Unit-test repair queue (unit12): lane chat-5

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts` (1 failing)
- [x] `tests/unit/chat20-verify2-workspace-legacy-tenant-metadata.test.ts` (1 failing)
- [x] `tests/unit/super-admin-legacy-wording.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts > Super Admin Projects and Placements page routes — independent security and UX audit > PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate
AssertionError: src/app/(authenticated)/admin/placements/page.tsx: expected 'import Link from "next/link";\nimport…' not to match /<table(?:\s|>)/

- Expected:
/<table(?:\s|>)/

+ Received:
"import Link from \"next/link\";
import { listPlatformPlacementPolicy } from \"@/modules/placements/platform-placement-policy-service\";
import {getSuperAdminCompanyHiringReport} from \"@/modules/admin-ui/super-admin-hiring-report-service\";
import { SuperAdminPlatformPlacementPolicy } from \"@/components/placements/super-admin-platform-placement-policy\";
import { SuperAdminPlacementOversightNav } from \"@/components/admin/super-admin-placement-oversight-nav\";
import { getCurrentRequestContext } from \"@/auth/request-context\";
import { PlacementOperationsWorkspace } from \"@/components/placements/placement-operations-workspace\";
import { EmptyState } from \"@/components/ui/empty-state\";
import {Alert} from \"@/components/ui/alert\";
```

### tests/unit/chat20-verify2-workspace-legacy-tenant-metadata.test.ts

```
 FAIL  tests/unit/chat20-verify2-workspace-legacy-tenant-metadata.test.ts > legacy project overview migration > preserves authored brief content even if trusted source carries old tenant metadata
AssertionError: expected { goal: '', description: '', …(3) } to match object { goal: 'Restore lessons', …(3) }
(1 matching property omitted from actual)

- Expected
+ Received

  {
-   "completionConditions": [
-     "Project approved",
-   ],
-   "deliverables": [
-     "Release prototype",
-   ],
-   "goal": "Restore lessons",
-   "personas": [
```

### tests/unit/super-admin-legacy-wording.test.ts

```
 FAIL  tests/unit/super-admin-legacy-wording.test.ts > Super Admin legacy label fixes that do not orphan pages (superAdminNavigationMenuFlat) > page headings use the legacy titles
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'return <SuperAdminTenantSetup'

- Expected
+ Received

- return <SuperAdminTenantSetup
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


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-17-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
