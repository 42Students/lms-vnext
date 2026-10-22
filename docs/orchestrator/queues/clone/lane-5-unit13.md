# Unit-test repair queue (unit13): lane chat-5

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts` (1 failing)
- [ ] `tests/unit/chat3-tenant-public-verified-round13.test.ts` (1 failing)
- [x] `tests/unit/tpo-inbox-team-round5-parity-review.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts > PROJ-BREAK-MENTOR calendar and resource directory independent user safety > PROJ-BREAK-MENTOR-40 meeting links allow only credential-free web protocols
AssertionError: expected null to be 'https://video.example.edu/room' // Object.is equality

- Expected:
"https://video.example.edu/room"

+ Received:
null

 ❯ tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts:32:66
     30|   }
     31|   expect(safeMentorMeetingJoinUrl(base)).toBe("https://video.example.e…
     32|   expect(safeMentorMeetingJoinUrl({...base,status:"REQUESTED"})).toBe(…
       |                                                                  ^
     33|   expect(safeMentorMeetingJoinUrl({...base,status:"CANCELLED"})).toBeN…
     34|   expect(safeMentorMeetingJoinUrl(base,NOW)).toBe("https://video.examp…
```

### tests/unit/chat3-tenant-public-verified-round13.test.ts

```
 FAIL  tests/unit/chat3-tenant-public-verified-round13.test.ts > Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-19 retains college-scoped activity read and authorized CSV without a duplicate GET write
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'collegeId: selectedCollegeId??one(par…'

- Expected
+ Received

- collegeId: selectedCollegeId??one(params.collegeId)
+ import Link from "next/link";
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {
+   ActivityCenter,
+   type ActivityCenterGroup,
+   RAW_AUDIT_FORENSIC_HEADERS,
+   RAW_AUDIT_MISSING_TRANSPORT,
+ } from "@/components/activity/activity-center";
```

### tests/unit/tpo-inbox-team-round5-parity-review.test.ts

```
 FAIL  tests/unit/tpo-inbox-team-round5-parity-review.test.ts > TPO inbox/team outstanding legacy contracts > TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings?tab=team")'

- Expected
+ Received

- redirect("/tpo/settings?tab=team")
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

