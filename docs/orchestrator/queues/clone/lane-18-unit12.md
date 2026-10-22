# Unit-test repair queue (unit12): lane chat-18

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/chat16-mentor-calendar-status-r5.test.ts` (2 failing)
- [x] `tests/unit/chat9-verify2-learner-assignment-retry.test.ts` (2 failing)

## Failures (from CI log)

### tests/unit/chat16-mentor-calendar-status-r5.test.ts

```
 FAIL  tests/unit/chat16-mentor-calendar-status-r5.test.ts > chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 shows DRAFT and RESCHEDULED without guessing missing states
AssertionError: expected 'https://meet.example.org/room' to be null

- Expected:
null

+ Received:
"https://meet.example.org/room"

 ❯ tests/unit/chat16-mentor-calendar-status-r5.test.ts:24:50
     22|     expect(mentorMeetingDisplayStatus(rescheduled, now)).toBe("RESCHED…
     23|     // Only scheduled or rescheduled meetings within their live window…
     24|     expect(safeMentorMeetingJoinUrl(draft, now)).toBeNull();
       |                                                  ^
     25|     expect(safeMentorMeetingJoinUrl(rescheduled, now)).toBe("https://m…
     26|   });

 FAIL  tests/unit/chat16-mentor-calendar-status-r5.test.ts > chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 does not allow a past rescheduled or cancelled meeting join
AssertionError: expected 'https://meet.example.org/room' to be null

- Expected:
null

+ Received:
"https://meet.example.org/room"

 ❯ tests/unit/chat16-mentor-calendar-status-r5.test.ts:30:78
     28|     const past = new Date("2099-10-17T08:01:00Z");
     29|     expect(mentorMeetingDisplayStatus({...base, status: "RESCHEDULED"}…
     30|     expect(safeMentorMeetingJoinUrl({...base, status: "RESCHEDULED"}, …
       |                                                                              ^
     31|     expect(safeMentorMeetingJoinUrl({...base, status: "CANCELLED"}, pa…
     32|     expect(safeMentorMeetingJoinUrl({...base, status: "REQUESTED"}, pa…
```

### tests/unit/chat9-verify2-learner-assignment-retry.test.ts

```
 FAIL  tests/unit/chat9-verify2-learner-assignment-retry.test.ts > learner assignment list recovery preserves legacy messaging and accessibility > never misrepresents a failed read as no assignments
AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'Assignments could not be loaded'

- Expected
+ Received

- Assignments could not be loaded
+ import { Suspense } from "react";
+ import Link from "next/link";
+ import {notFound} from "next/navigation";
+ import {learnerAssignmentListPage,learnerAssignmentListHref} from "@/modules/courses/learner-assignment-page-model";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { CoursesServiceError } from "@/modules/courses/errors";
+ import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {

 FAIL  tests/unit/chat9-verify2-learner-assignment-retry.test.ts > learner assignment list recovery preserves legacy messaging and accessibility > offers a mobile-sized keyboard-accessible retry on the same learner route
AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'href="/learn/allAssignments?retry=1"'

- Expected
+ Received

- href="/learn/allAssignments?retry=1"
+ import { Suspense } from "react";
+ import Link from "next/link";
+ import {notFound} from "next/navigation";
+ import {learnerAssignmentListPage,learnerAssignmentListHref} from "@/modules/courses/learner-assignment-page-model";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { CoursesServiceError } from "@/modules/courses/errors";
+ import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [x] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)

## Unit12 repair results

- G2-4-018-045 — OK: recorded in `docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md` ([chat-18] `67ab374`).
- `chat9-verify2-learner-assignment-retry.test.ts` — FIXED: page now renders explicit alert and same-route retry for failed reads ([chat-18] `d9e5f75`).
- `chat16-mentor-calendar-status-r5.test.ts` — FIXED: join URL only permitted for SCHEDULED/RESCHEDULED inside active meeting window ([chat-18] `46cb987`).
- Runtime test execution unavailable in this lane; assertions reviewed against source; re-run CI required.
