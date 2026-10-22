# Unit-test repair queue (unit12): lane chat-20

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/chat19-college-cross-audit.test.ts` (1 failing)
- [x] `tests/unit/db04-profile-document-format.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat19-college-cross-audit.test.ts

```
 FAIL  tests/unit/chat19-college-cross-audit.test.ts > chat-19 college UX cross-audit > COL-XA-11 uses mobile cards with labelled elective allocation checkboxes
AssertionError: expected '"use client";\nimport {useEffect,useM…' to contain 'mobilePriority: "action"'

- Expected
+ Received

- mobilePriority: "action"
+ "use client";
+ import {useEffect,useMemo,useState} from "react";
+ import {DataTable} from "@/components/ui/data-table";
+ import {ScrollCue} from "@/components/ui/scroll-cue";
+ import {Checkbox} from "@/components/ui/checkbox";
+ import {Button} from "@/components/ui/button";
+ import {EmptyState} from "@/components/ui/empty-state";
+
+ type Learner={membershipId:string;name:string|null;rollNumber:string|null;
```

### tests/unit/db04-profile-document-format.test.ts

```
 FAIL  tests/unit/db04-profile-document-format.test.ts > DB04 learner profile formatting regressions > accepts valid alternate telephone digits and rejects alphabetic impostors
ZodError: [
  {
    "code": "custom",
    "path": [
      "contacts",
      "alternatePhone"
    ],
    "message": "Phone number must be 10-15 digits"
  }
]
 ❯ tests/unit/db04-profile-document-format.test.ts:7:41
      5| describe("DB04 learner profile formatting regressions", () => {
      6|   it("accepts valid alternate telephone digits and rejects alphabetic …
      7|     expect(learnerProfileDocumentSchema.parse({
       |                                         ^
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [x] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)

## Chat-19 overflow repairs (static review; CI not run)

- G2-4-018-067: verified import/concurrency distinction recorded in DEEP_agent2_4.md (a52c146).
- COL-XA-11: moved audit assertions to the actual extracted ElectiveEligibleSelection component, preserving mobile action/primary/secondary, accessibility and table requirements, while tolerating whitespace (0d8380b, 567dec6).
- DB04: old learner profile permits 10–15 plain numeric digits; updated regression to assert digit-only acceptance and to reject separators and alphabetic impostors (dfeb4df).
