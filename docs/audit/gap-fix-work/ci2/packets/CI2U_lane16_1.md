# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-messaging-api-84.test.ts (1 failing)
- HR-MESSAGING-84: recruiter open/reply HTTP role matrix and safe retries > authorized general thread and a reply redirect only to their own returned thread ID

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(3) }, …(1) }, …(2) ]
  Received:
  1st vi.fn() call:
  @@ -12,6 +12,7 @@
  "systemRoles": [],
  },
  },
  "123e4567-e89b-42d3-a456-426614174002",
  ```

## tests/unit/HR-BREAK-chat19-bell-payload.test.ts (2 failing)
- HR-BREAK-BELL-PAYLOAD-35 verified HR notification shell response > retains authorized job links and unread counts without losing ordinary copy

  ```
  AssertionError: expected { status: 'READY', unread: 1, …(2) } to deeply equal { status: 'READY', unread: 1, …(1) }
  - Expected
  + Received
  @@ -1,12 +1,14 @@
  {
  +   "hiddenUnread": 0,
  "items": [
  {
  ```
- HR-BREAK-BELL-PAYLOAD-35 verified HR notification shell response > wires strict parsing before setting any HR shell notification state

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'setState(null);setError('
  - Expected
  + Received
  - setState(null);setError(
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/HR-BREAK-chat19-round-results-principal.test.ts (1 failing)
- HR-BREAK-ROUND-PRINCIPAL-26 and UX-hr-round-results-02 page journey > UX-hr-round-results-02 keeps filter and round actions accessible on phones

  ```
  AssertionError: expected 'Round Results Employer A · College A …' to contain 'Shared candidate'
  Expected: "Shared candidate"
  Received: "Round Results Employer A · College A · Software engineer Choose another drive Open hiring rounds & staging Choose round Technical round EVALUATION  ·  1  eligible, shared candidates APPLIED STAGED results are awaiting placement-cell review; APPLIED results are recorded decisions. This rea
  ```

## tests/unit/PROJ-BREAK-SA-40-planned-submission-risk.test.ts (1 failing)
- PROJ-BREAK-SA-40 Project Admin risk badges must reflect actionable review state > never renders a pending-review badge in projects whose delivery state machine refuses review

  ```
  AssertionError: COMPLETED: expected [ 'Pending review' ] to not include 'Pending review'
  ❯ tests/unit/PROJ-BREAK-SA-40-planned-submission-risk.test.ts:15:35
  13|         latestSubmissionStatus: "SUBMITTED",
  14|       });
  15|       expect(reasons, status).not.toContain("Pending review");
  |                                   ^
  16|       expect(
  17|         canAdminSettleDelivery("SUBMITTED", false, status, "APPROVED"),
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-review-pages.test.tsx (1 failing)
- PROJ-BREAK-MENTOR-83..90 rendered review inbox parity and role journeys > PROJ-BREAK-MENTOR-83 invalid and duplicated filters do not query services

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid review filters'
  Expected: "Invalid review filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Delivery review queue</h1></header><a href="/mentor/reviews">Clear filters</a></section>"
  ```

## tests/unit/PROJ-BREAK-chat6-state-security.test.ts (1 failing)
- IIT Dharwad Projects breaker — state, access, integrity, deadlines and files > PROJ-BREAK-grading-01 never rounds incomplete work to 100 percent

  ```
  AssertionError: expected 100 to be 99 // Object.is equality
  - Expected
  + Received
  - 99
  + 100
  ```
