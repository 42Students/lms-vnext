# Unit-test repair queue (unit13): lane chat-13

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/chat11-super-admin-tenant-route-guard.test.ts` (1 failing)
- [x] `tests/unit/chat9-phase2-college-shortlisted.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat11-super-admin-tenant-route-guard.test.ts

```
 FAIL  tests/unit/chat11-super-admin-tenant-route-guard.test.ts > SA-tenants-modules-SEC-01: never render admin filter recovery before authorization > authenticates every route before handling hostile and repeated query parameters
AssertionError: src/app/(authenticated)/admin/tenants/page.tsx: expected -1 to be greater than -1
 ❯ tests/unit/chat11-super-admin-tenant-route-guard.test.ts:59:22
     57|    const noSpace=source.indexOf("if(!parsed)");
     58|    const recovery=[invalid,invalidNoSpace,whitespace,noSpace].filter(i…
     59|    expect(auth,file).toBeGreaterThan(-1);
       |                      ^
     60|    // Module Access delegates URL validation to the college hierarchy …
     61|    // its own selection and authorization are checked before that hand…

```

### tests/unit/chat9-phase2-college-shortlisted.test.ts

```
 FAIL  tests/unit/chat9-phase2-college-shortlisted.test.ts > college shortlisted route > enforces submitted applications and explicit pipeline stage through the authorized college applicant read
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'stage: requested.stage ?? "ASSESSMENT"'

- Expected
+ Received

- stage: requested.stage ?? "ASSESSMENT"
+ import Link from "next/link";
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
+ import { hasMembershipRole } from "@/modules/identity/context";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
+ import { ErrorState } from "@/components/ui/error-state";
```

