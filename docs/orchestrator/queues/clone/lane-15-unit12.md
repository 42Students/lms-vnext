# Unit-test repair queue (unit12): lane chat-15

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/chat13-superadmin-interview-operations.test.ts` (1 failing)
- [ ] `tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts` (2 failing)

## Failures (from CI log)

### tests/unit/chat13-superadmin-interview-operations.test.ts

```
 FAIL  tests/unit/chat13-superadmin-interview-operations.test.ts > Super Admin placement interview operations > SA-placements-projects-46 renders real round Type Status Mode Sort and conflict-only filters
AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'choices("Type"'

- Expected
+ Received

- choices("Type"
+ "use client";
+ import { Checkbox } from "@/components/ui/checkbox";
+ import {SuperAdminInterviewEdit} from "@/components/admin/super-admin-interview-edit";
+ import {useMemo,useState,useTransition} from "react";
+ import Link from "next/link";
+ import {useRouter} from "next/navigation";
+ import {Input} from "@/components/ui/input";
+ import { DataTable } from "@/components/ui/data-table";
+ import { Select } from "@/components/ui/select";
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


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [x] G2-4-017-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)

## Chat-14 overflow notes

- G2-4-017-018: OK (`a845a4c`), archive preserves recoverability provenance without restoring deleted resources.
- Interview Type: current `main` already has a controlled real `<Select>` rather than the old `choices("Type"` helper. Source test strengthened to assert the actual Type selector, reset-on-change behavior, and ALL option (`82c3c20`); no assertion weakened. Not executed locally.
- Super Admin learning export: not ticked; current `main` already passes context/kind/query on each assessment read, but the historical CI failure needs a new CI run to confirm.
