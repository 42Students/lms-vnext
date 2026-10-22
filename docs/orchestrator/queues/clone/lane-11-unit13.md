# Unit-test repair queue (unit13): lane chat-11

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/UX-superadmin-legacy-01.test.ts` (1 failing)
- [ ] `tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts` (2 failing)
- [ ] `tests/unit/w03-learner-project-list.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-superadmin-legacy-01.test.ts

```
 FAIL  tests/unit/UX-superadmin-legacy-01.test.ts > UX-superadmin-legacy-01 > preserves original wording, permissions and supported accessible UX
AssertionError: expected 'import { createHash } from "node:cryp…' to match /query\.q\.length\s*<=\s*100/

- Expected:
/query\.q\.length\s*<=\s*100/

+ Received:
"import { createHash } from \"node:crypto\";
import { and, eq, isNull, sql } from \"drizzle-orm\";
import { notFound, redirect } from \"next/navigation\";
import { ErrorState } from \"@/components/ui/error-state\";
import { PageBackLink } from \"@/components/ui/page-back-link\";
import { PageHeader } from \"@/components/ui/page-header\";
import { getCurrentRequestContext } from \"@/auth/request-context\";
import { getDb } from \"@/db/client\";
import { projectInstances, projectTemplates } from \"@/db/schema\";
```

### tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts

```
 FAIL  tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts > Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read
TypeError: Cannot read properties of undefined (reading 'page')
 ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:58:21
     56|  it("SA-academics-people-65 never drops quiz results filters as later …
     57|   state.reader.mockImplementation(async (_context,_kind,query)=>{
     58|    const page=query.page as number;
       |                     ^
     59|    return {items:[row(page)],total:2,totalPages:2};
     60|   });


 FAIL  tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts > Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records
TypeError: Cannot read properties of undefined (reading 'page')
 ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:75:51
     73|  it("SA-academics-people-64 hard caps CSV at 500 rows and explicitly m…
     74|   state.reader.mockImplementation(async (_context,_kind,query)=>({
     75|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
       |                                                   ^
     76|    total:501,totalPages:21,
     77|   }));
 ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:75:16

```

### tests/unit/w03-learner-project-list.test.ts

```
 FAIL  tests/unit/w03-learner-project-list.test.ts > W03 learner project discovery and attention contract > keeps search, status, needs-action and pagination addressable
AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain 'params.search'

- Expected
+ Received

- params.search
+ import { z } from "zod";
+ import Link from "next/link";
+ import { Banner } from "@/components/ui/banner";
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {
+   ProjectParticipantListControls,
+   ProjectParticipantPagination,
+   type ProjectParticipantListQuery,
```

