# Unit-test repair queue (unit13): lane chat-14

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat13-company-verification.test.ts` (1 failing)
- [ ] `tests/unit/chat9-super-admin-orphan-routes.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat13-company-verification.test.ts

```
 FAIL  tests/unit/chat13-company-verification.test.ts > Super Admin platform company verification > SA-placements-projects-24 presents Verified by 42 tag, Only not verified filter and confirmation
AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'SuperAdminCompanyVerification'

- Expected
+ Received

- SuperAdminCompanyVerification
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

### tests/unit/chat9-super-admin-orphan-routes.test.ts

```
 FAIL  tests/unit/chat9-super-admin-orphan-routes.test.ts > Super Admin sidebar consolidation retains orphan routes > keeps domains, academics overview and audit findings reachable
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/admin/domains"'

- Expected
+ Received

- href="/admin/domains"
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

