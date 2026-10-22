# Unit-test repair queue (unit13): lane chat-4

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts` (1 failing)
- [x] `tests/unit/chat3-course-home-metadata-legacy-validation.test.ts` (1 failing)
- [x] `tests/unit/tpo-batches-24-chat5.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts > Super Admin Projects and Placements page routes — independent security and UX audit > PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate
AssertionError: src/app/(authenticated)/admin/projects/deleted/page.tsx: expected 'import {redirect} from "next/navigati…' to contain 'getCurrentRequestContext'

- Expected
+ Received

- getCurrentRequestContext
+ import {redirect} from "next/navigation";
+
+ /** Preserve older Super Admin deleted-workspace bookmarks, including query
+  * paging and size, without keeping a second truncated 200-row recovery list. */
+ export default async function DeletedAdminProjectsLegacyRoute({searchParams}:{
+  searchParams:Promise<Record<string,string|string[]|undefined>>;
+ }){
+  const raw=await searchParams;
+  const allowed=new Set(["page","pageSize"]);
```

### tests/unit/chat3-course-home-metadata-legacy-validation.test.ts

```
 FAIL  tests/unit/chat3-course-home-metadata-legacy-validation.test.ts > Super Admin Course Home metadata editor clone > limits Short display name to the legacy 64-character form contract
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ tests/unit/chat3-course-home-metadata-legacy-validation.test.ts:13:15
     11|   expect(updateCourseInputSchema.safeParse({
     12|     expectedUpdatedAt:"2026-10-22T08:00:00.000Z",shortTitle:"X".repeat…
     13|   }).success).toBe(false);
       |               ^
     14|  });
     15|  it("rejects internal, credentialed and non-HTTPS legacy thumbnails be…
```

### tests/unit/tpo-batches-24-chat5.test.ts

```
 FAIL  tests/unit/tpo-batches-24-chat5.test.ts > TPO own eligibility decisions > TPO-batches-24 counts direct learner overrides against inherited decisions and filters the entire cohort
AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'view.data.source==="LEARNER"'

- Expected
+ Received

- view.data.source==="LEARNER"
+ import {Button} from "@/components/ui/button";
+ import {Disclosure} from "@/components/ui/disclosure";
+ import {Badge} from "@/components/ui/badge";
+ import {DataTable} from "@/components/ui/data-table";
+ import {Select} from "@/components/ui/select";
+ import {Input} from "@/components/ui/input";
+ import {PageHeader} from "@/components/ui/page-header";
+ import {Alert} from "@/components/ui/alert";
+ import {SummaryStrip} from "@/components/ui/summary-strip";
```

