# Unit-test repair queue (unit13): lane chat-16

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat13-superadmin-26-gap-parity-regression.test.ts` (1 failing)
- [ ] `tests/unit/db04-profile-document-format.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat13-superadmin-26-gap-parity-regression.test.ts

```
 FAIL  tests/unit/chat13-superadmin-26-gap-parity-regression.test.ts > Chat 13 reverified Super Admin placement parity > SA-placements-projects-32 keeps the verified implementation reachable
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

### tests/unit/db04-profile-document-format.test.ts

```
 FAIL  tests/unit/db04-profile-document-format.test.ts > DB04 learner profile formatting regressions > accepts valid alternate telephone digits and rejects alphabetic impostors
AssertionError: expected [Function] to throw an error
 ❯ tests/unit/db04-profile-document-format.test.ts:12:9
     10|     expect(() => learnerProfileDocumentSchema.parse({
     11|       contacts: {alternatePhone: "+91 98765-43210"},
     12|     })).toThrow();
       |         ^
     13|     expect(() => learnerProfileDocumentSchema.parse({
     14|       contacts: {alternatePhone: "dddddddddddd"},

```

