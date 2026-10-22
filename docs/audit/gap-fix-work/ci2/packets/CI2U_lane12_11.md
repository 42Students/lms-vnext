# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-activity-model.test.ts (2 failing)
- College activity model > strictly accepts actor, entity and date filters

  ```
  AssertionError: expected { Object (from, to) } to deeply equal {}
  - Expected
  + Received
  - {}
  + {
  +   "from": "2026-09-23",
  +   "to": "2026-10-22",
  + }
  ```
- College activity model > persists bounded per-page size in cursor URLs without accepting oversized reads

  ```
  AssertionError: expected null to be '50' // Object.is equality
  - Expected:
  "50"
  + Received:
  null
  ```

## tests/unit/college-lecture-hall-directory-model.test.ts (2 failing)
- College Admin lecture hall directory filters > defaults to all statuses and room types with a bounded first page

  ```
  AssertionError: expected { q: '', status: 'ALL', …(4) } to deeply equal { q: '', status: 'ALL', …(3) }
  - Expected
  + Received
  {
  "page": 1,
  +   "pageSize": 10,
  "q": "",
  "roomType": "ALL",
  ```
- College Admin lecture hall directory filters > accepts trimmed search with validated type/status/department/page

  ```
  AssertionError: expected { q: 'Comp Lab', …(6) } to deeply equal { q: 'Comp Lab', …(5) }
  - Expected
  + Received
  {
  "departmentId": "00000000-0000-4000-8000-000000000001",
  "page": 2,
  +   "pageSize": 10,
  "q": "Comp Lab",
  ```

## tests/unit/faculty-courses-chat7-acceptance.test.ts (3 failing)
- Faculty Courses verified source contracts > FAC-courses-01 maintains the faculty course behavior

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Back to courses'
  - Expected
  + Received
  - Back to courses
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  ```
- Faculty Courses verified source contracts > FAC-courses-04 maintains the faculty course behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'course.teachingRole!=="PRIMARY"'
  - Expected
  + Received
  - course.teachingRole!=="PRIMARY"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- Faculty Courses verified source contracts > FAC-courses-05 maintains the faculty course behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'Teaching assignment(s)'
  - Expected
  + Received
  - Teaching assignment(s)
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```

## tests/unit/graceful-alert-ops-contract.test.ts (1 failing)
- independent Telegram health monitoring > GR-118 allows a bounded Cloud Logging batch within the Cron tick HTTP timeout and lease

  ```
  AssertionError: expected 'import { cloudLoggingAccessToken, isC…' to contain 'let limit = 12'
  - Expected
  + Received
  - let limit = 12
  + import { cloudLoggingAccessToken, isCloudLogNamespace, isCloudLogProject, readCloudLogErrorPage } from "./cloud-log-reader";
  + import { reportErrorForAlert } from "./reporter";
  + import { reopenRegressedSignature } from "./policy";
  + import { randomUUID } from "node:crypto";
  ```

## tests/unit/learner-application-url-recovery.test.ts (1 failing)
- recovers valid application filters without admitting duplicated or forged selectors

  ```
  AssertionError: expected 'all' to be 'completed' // Object.is equality
  Expected: "completed"
  Received: "all"
  ```

## tests/unit/learner-jobs-browse-model.test.ts (3 failing)
- Learner job browsing filters > never includes a closed role in eligible-only even if its historic canApply flag is true

  ```
  AssertionError: expected [ 'a', 'b' ] to deeply equal [ 'b' ]
  - Expected
  + Received
  [
  +   "a",
  "b",
  ]
  ```
- Learner job browsing filters > counts employment type using only authorized role options

  ```
  AssertionError: expected undefined to be 2 // Object.is equality
  - Expected:
  2
  + Received:
  undefined
  ```
- Learner job browsing filters > derives facets from real job rows

  ```
  AssertionError: expected { types: [ 'Full-time', …(1) ], …(1) } to deeply equal { types: [ 'FULL_TIME', …(1) ], …(1) }
  - Expected
  + Received
  @@ -3,9 +3,9 @@
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  ],
  ```
