# Unit-test repair queue (unit13): lane chat-17

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat2-public-placements-page.test.ts` (1 failing)
- [ ] `tests/unit/learner-coding-profile-privacy.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat2-public-placements-page.test.ts

```
 FAIL  tests/unit/chat2-public-placements-page.test.ts > TPO public placements publication and copy > TPO-campaigns-public-36 uses the college-specific legacy heading and removes platform-only footer
AssertionError: expected 'import { headers } from "next/headers…' to contain 'Placements at {college?.collegeName??…'

- Expected
+ Received

- Placements at {college?.collegeName??"your college"}
+ import { headers } from "next/headers";
+ import {notFound} from "next/navigation";
+ import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
+ import { resolveRequestTenant } from "@/modules/auth/request-tenant";
+ import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
+ import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";
+ import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
+ import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,formatPublicPlacementMetric} from "@/modules/placements/public-page/content-model";
+ import { getPublicPlacementStatistics } from "@/modules/placements/public-page/read-service";
```

### tests/unit/learner-coding-profile-privacy.test.ts

```
 FAIL  tests/unit/learner-coding-profile-privacy.test.ts > never renders spoofed profile hosts or unsafe schemes
AssertionError: expected 'https://github.com/real' to be null

- Expected:
null

+ Received:
"https://github.com/real"

 ❯ tests/unit/learner-coding-profile-privacy.test.ts:1:473


```

