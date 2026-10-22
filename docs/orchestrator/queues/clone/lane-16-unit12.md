# Unit-test repair queue (unit12): lane chat-16

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat15-offer-letter-and-placement.test.ts` (1 failing)
- [ ] `tests/unit/chat9-super-admin-unselected-college-copy.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat15-offer-letter-and-placement.test.ts

```
 FAIL  tests/unit/chat15-offer-letter-and-placement.test.ts > chat-15 learner offers and internship truth > LEARNER-placements-45 only reveals persisted safe HTTPS employer letters
AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain '<a href={item.letterHref} target="_bl…'

- Expected
+ Received

- <a href={item.letterHref} target="_blank" rel="noopener noreferrer"
+ "use client";
+
+ import { useRef, useState } from "react";
+ import { useRouter } from "next/navigation";
+ import Link from "next/link";
+ import { learnerOfferAnchor, learnerOfferHref } from "@/modules/placements/learner-offer-deep-link-model";
+ import { Button } from "@/components/ui/button";
+ import { Dialog } from "@/components/ui/dialog";
+ import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";
```

### tests/unit/chat9-super-admin-unselected-college-copy.test.ts

```
 FAIL  tests/unit/chat9-super-admin-unselected-college-copy.test.ts > Super Admin exact dev-legacy unselected-college copy > programs exact copy
AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'Choose a college in the header above …'

- Expected
+ Received

- Choose a college in the header above to create or edit Programs.
+ import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {isSuperAdmin} from "@/modules/identity/context";
+ import {ErrorState} from "@/components/ui/error-state";
+ import {Alert} from "@/components/ui/alert";
+ import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { PageHeader } from "@/components/ui/page-header";
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
