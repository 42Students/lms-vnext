# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-messaging-63.test.ts (1 failing)
- HR-MESSAGING-DEPTH-63: thread allowlist before unread message lookup > reads unread information only for an actually owned thread

  ```
  AssertionError: expected { id: 'own', jobId: null, …(5) } to match object { id: 'own', unread: 2 }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  "id": "own",
  -   "unread": 2,
  +   "unread": NaN,
  ```

## tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts (8 failing)
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"collegeId":"other"} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"page":"0"} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"page":"1.5"} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"kind":"PRIVATE"} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"q":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"collegeId":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"page":["1","2"]} before querying history

  ```
  
  ```
- HR-BREAK-chat19-activity-results: release-scoped source and abnormal inputs > rejects invalid activity filters {"q":["a","b"]} before querying history

  ```
  AssertionError: expected '  Hiring activity   Invalid activity …' to contain 'Invalid activity filters.'
  Expected: "Invalid activity filters."
  Received: "  Hiring activity   Invalid activity filters Review the college and event filters. "
  ```

## tests/unit/HR-BREAK-chat19-report-joined.test.ts (1 failing)
- HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers > leaves no shared applicant names or contacts in the funnel SQL

  ```
  AssertionError: expected '\n      select id from placement_jobs…' to contain 'm.status=\'ACTIVE\''
  - Expected
  + Received
  - m.status='ACTIVE'
  +
  +       select id from placement_jobs
  +       where college_id=${collegeId}::uuid
  +         and company_relationship_id=${relationshipId}::uuid
  ```

## tests/unit/PROJ-BREAK-SA-38-39-risk-activity-guards.test.ts (1 failing)
- chat-13 IIT Dharwad adversarial project admin risk projection > PROJ-BREAK-SA-39 ignores historical submissions after a newer revision and never flags archived delivery for pending review

  ```
  AssertionError: expected [ 'Active blocker', 'Pending review' ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "Active blocker",
  +   "Pending review",
  + ]
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-resource-races.test.ts (1 failing)
- Mentor resource mutation and reorder permission matrix > PROJ-BREAK-MENTOR-278 reorder produces one audit event after committed sequence moves

  ```
  ProjectsServiceError: PROJECT_RESOURCE_STALE_VERSION
  ❯ src/modules/projects/resource-service.ts:515:13
  513|     if(!expectedOrderIds||expectedOrderIds.length!==old.length||
  514|        expectedOrderIds.some((id,i)=>id!==old[i])){
  515|       throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
  |             ^
  516|     }
  517|     const maxSequence=Math.max(-1,...all.map(item=>item.sequence));
  ```

## tests/unit/PROJ-BREAK-chat6-role-journeys.test.ts (1 failing)
- Projects IIT Dharwad — cross-account navigation and denial breaker > PROJ-BREAK-pages-01 Super Admin without a college scope cannot list or mutate someone else's projects

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'context.adminScope?.collegeId ?? null'
  - Expected
  + Received
  - context.adminScope?.collegeId ?? null
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
