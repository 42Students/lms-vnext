# Unit-test repair queue (unit13): lane chat-10

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-mentor-cross-evidence-links-01.test.ts` (1 failing)
- [x] `tests/unit/chat7-college-assessment-export-service-weak.test.ts` (2 failing)
- [x] `tests/unit/ux-admin-first-third.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-mentor-cross-evidence-links-01.test.ts

```
 FAIL  tests/unit/UX-mentor-cross-evidence-links-01.test.ts > UX-mentor-cross-E01 source/demo/attachment links stay sanitized and 44px
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'safeProjectExternalHref(entry.url)'

- Expected
+ Received

- safeProjectExternalHref(entry.url)
+ import Link from "next/link";
+ import {getCurrentRequestContext} from "@/auth/request-context";
+ import {PageHeader} from "@/components/ui/page-header";
+ import {Disclosure} from "@/components/ui/disclosure";
+ import {getMentorDeliveryVersion} from "@/modules/projects/mentor-delivery-version-service";
+ import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
+ export default async function MentorDeliveryVersionPage({params}:{
+   params:Promise<{projectId:string;submissionId:string}>;
+ }){
```

### tests/unit/chat7-college-assessment-export-service-weak.test.ts

```
 FAIL  tests/unit/chat7-college-assessment-export-service-weak.test.ts > COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns quoted spreadsheet and bounded pagination
AssertionError: expected undefined to be 'QUIZ' // Object.is equality

- Expected:
"QUIZ"

+ Received:
undefined

 ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:37:17
     35|  it("reads paginated results using the same current context/kind, retu…
     36|   state.reader.mockImplementation(async (_ctx,kind,query)=>{
     37|    expect(kind).toBe("QUIZ");
       |                 ^
     38|    const page=query.page as number;
     39|    return {items:Array.from({length:page===3?11:COLLEGE_ASSESSMENT_PAG…

 FAIL  tests/unit/chat7-college-assessment-export-service-weak.test.ts > COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41
TypeError: Cannot read properties of undefined (reading 'page')
 ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:57:77
     55|  it("cannot silently export more than 1000 rows, labels truncated set …
     56|   state.reader.mockImplementation(async (_ctx,_kind,query)=>({
     57|    items:Array.from({length:COLLEGE_ASSESSMENT_PAGE_SIZE},(_,i)=>row((…
       |                                                                             ^
     58|    total:1001,totalPages:Math.ceil(1001/COLLEGE_ASSESSMENT_PAGE_SIZE),
     59|   }));
 ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:57:16

```

### tests/unit/ux-admin-first-third.test.ts

```
 FAIL  tests/unit/ux-admin-first-third.test.ts > Super Admin UX first-third rollout > UX-admin-features-collegeId-trace-02 exposes learner actions on phones and keeps resolution level visible
AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'overridesModule:query.overridesModule'

- Expected
+ Received

- overridesModule:query.overridesModule
+ import {Button} from "@/components/ui/button";
+ import {Select} from "@/components/ui/select";
+ import {Input} from "@/components/ui/input";
+ import Link from "next/link";
+ import { notFound } from "next/navigation";
+ import { z } from "zod";
+ import {CopyFindingForClaude} from "@/components/admin/copy-finding-for-claude";
+ import {strictTraceRouteParams} from "@/modules/module-access/admin-trace-route-params";
+
```

