# Unit-test repair queue (unit12): lane chat-8

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/UX-kit-scroll-motion-01.test.tsx` (1 failing)
- [ ] `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` (1 failing)
- [ ] `tests/unit/tpo-inbox-team-round5-parity-review.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-kit-scroll-motion-01.test.tsx

```
 FAIL  tests/unit/UX-kit-scroll-motion-01.test.tsx > UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-07 skeleton shimmer and disclosure honor reduced-motion defaults
AssertionError: expected '<details data-slot="disclosure" class…' to contain 'min-h-11'

Expected: "min-h-11"
Received: "<details data-slot="disclosure" class="group min-w-0 border-t border-[var(--lms-canvas-border)]"><summary style="min-height:44px" class="flex cursor-pointer list-none items-center justify-between gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] px-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] font-semibold leading-5 text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] group-open:text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] focus-visible:outline-offset-[3px] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] motion-reduce:transition-none [&amp;::-webkit-details-marker]:hidden">More details<span aria-hidden="true" class="shrink-0 transition-transform duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] group-open:rotate-180 motion-reduce:transition-none">⌄</span></summary><div class="min-w-0 pb-[var(--lms-space-2)]"><p>Hidden grade</p></div></details>"

 ❯ tests/unit/UX-kit-scroll-motion-01.test.tsx:108:20
    106|     expect(detail).toContain("<details");
    107|     expect(detail).toContain("<summary");
    108|     expect(detail).toContain("min-h-11");
       |                    ^
    109|     expect(detail).toContain("motion-reduce:transition-none");
    110|     const css=read("src/app/globals.css");

```

### tests/unit/chat4-college-verification-misc-gap-closure.test.ts

```
 FAIL  tests/unit/chat4-college-verification-misc-gap-closure.test.ts > chat-4 College Verification and Misc verification > G2-1-026-012 retains the last college profile with a warning and safe retry
AssertionError: expected '"use client";\n\nimport { Textarea } …' to contain 'if(saving||readOnly)return;'

- Expected
+ Received

- if(saving||readOnly)return;
+ "use client";
+
+ import { Textarea } from "@/components/ui/textarea";
+ import { Input } from "@/components/ui/input";
+ import { Select } from "@/components/ui/select";
+ import { Button } from "@/components/ui/button";
+ import { Alert } from "@/components/ui/alert";
+ import { useRouter } from "next/navigation";
+ import { useEffect, useRef, useState, type FormEvent } from "react";
```

### tests/unit/tpo-inbox-team-round5-parity-review.test.ts

```
 FAIL  tests/unit/tpo-inbox-team-round5-parity-review.test.ts > TPO inbox/team outstanding legacy contracts > TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings/team")'

- Expected
+ Received

- redirect("/tpo/settings/team")
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
+ import { hasMembershipRole } from "@/modules/identity/context";
+
+ type LegacyTeamSearch = Record<string, string | string[] | undefined>;
+
+ function first(value: string | string[] | undefined): string | undefined {
+   return Array.isArray(value) ? value[0] : value;
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-006-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
