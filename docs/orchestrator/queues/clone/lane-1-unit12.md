# Unit-test repair queue (unit12): lane chat-1

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (2 failing)
- [x] `tests/unit/chat2-public-placements-heading-parity.test.ts` (1 failing)
- [x] `tests/unit/learner-coding-profile-link.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/COURSES-BREAK-FACULTY-06.test.ts

```
 FAIL  tests/unit/COURSES-BREAK-FACULTY-06.test.ts > COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency > FAC-assessments-01 retains delivery-authorized historical attempts while current roster controls missing counts
AssertionError: expected [ { …(6) }, { …(6) } ] to have a length of 3 but got 2

- Expected
+ Received

- 3
+ 2

 ❯ tests/unit/COURSES-BREAK-FACULTY-06.test.ts:89:27
     87|  it("FAC-assessments-01 retains delivery-authorized historical attempt…
     88|   const report=await getFacultyQuizReport(actor,quizId,deliveryId);
     89|   expect(report.attempts).toHaveLength(3);
       |                           ^
     90|   expect(report.latestAttempts).toHaveLength(2);
     91|   expect(report.metrics).toMatchObject({

 FAIL  tests/unit/COURSES-BREAK-FACULTY-06.test.ts > COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency > FAC-assessments-01 retains historical delivery submissions and excludes them only from missing-roster counts
AssertionError: expected [ { …(5) } ] to have a length of 2 but got 1

- Expected
+ Received

- 2
+ 1

 ❯ tests/unit/COURSES-BREAK-FACULTY-06.test.ts:100:30
     98|  it("FAC-assessments-01 retains historical delivery submissions and ex…
     99|   const report=await getFacultyAssignmentReport(actor,assignmentId,del…
    100|   expect(report.submissions).toHaveLength(2);
       |                              ^
    101|   expect(report.metrics).toMatchObject({eligibleLearners:1,submitted:2,
    102|    missing:0,onTime:1,late:1,graded:2,gradePublished:2,averagePercent:…
```

### tests/unit/chat2-public-placements-heading-parity.test.ts

```
 FAIL  tests/unit/chat2-public-placements-heading-parity.test.ts > TPO public college placements legacy framing > TPO-campaigns-public-36 renders only the college's actual name, not an invented Placements at prefix
AssertionError: expected 'import { headers } from "next/headers…' to contain '{college?.collegeName??"College place…'

- Expected
+ Received

- {college?.collegeName??"College placements"}
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

### tests/unit/learner-coding-profile-link.test.ts

```
 FAIL  tests/unit/learner-coding-profile-link.test.ts > accepts known coding platforms and canonicalizes legacy HTTP input to HTTPS
AssertionError: expected null to be 'https://github.com/learner' // Object.is equality

- Expected:
"https://github.com/learner"

+ Received:
null

 ❯ tests/unit/learner-coding-profile-link.test.ts:6:50
      4| it("accepts known coding platforms and canonicalizes legacy HTTP input…
      5|  expect(f("GITHUB","https://github.com/learner")).toBe("https://github…
      6|  expect(f("GITHUB","http://github.com/learner")).toBe("https://github.…
       |                                                  ^
      7|  expect(f("GITHUB","https://github.com.evil.test/x")).toBeNull();
      8|  expect(f("FORGED","https://github.com/x")).toBeNull();
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-12-016-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
- [ ] G2-4-018-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
