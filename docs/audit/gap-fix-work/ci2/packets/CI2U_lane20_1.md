# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-portfolio-scope-29.test.ts (1 failing)
- HR-PORTFOLIO-SCOPE-29 no cross-employer applicant or offer aggregates > SQL rechecks persisted job college, exact granted relationships, allowed state and archive

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/HR-BREAK-chat19-conversation-ack-receipt.test.ts (1 failing)
- HR-BREAK-CONVO-ACK-53: only persisted own-thread read receipts confirm acknowledgement > rejects revoked and wrong-principal recruiter access

  ```
  AssertionError: expected 200 to be 403 // Object.is equality
  - Expected
  + Received
  - 403
  + 200
  ```

## tests/unit/HR-BREAK-chat19-today-waiting-progress.test.ts (1 failing)
- HR-BREAK-TODAY-WAITING-39 persisted recruiter requests only > does not surface an unvalidated draft title from undefined

  ```
  AssertionError: expected 'Role' to be 'Hiring request' // Object.is equality
  Expected: "Hiring request"
  Received: "Role"
  ```

## tests/unit/PROJ-BREAK-SA-workspace-brief-isolation.test.ts (2 failing)
- Super Admin workspace brief isolation and malformed persisted JSON > PROJ-BREAK-SA-23 never reuses mutable fallback state across workspaces or requests

  ```
  AssertionError: expected { goal: 'tampered', …(4) } to deeply equal { goal: '', description: '', …(3) }
  - Expected
  + Received
  {
  "completionConditions": [],
  -   "deliverables": [],
  +   "deliverables": [
  +     "x",
  ```
- Super Admin workspace brief isolation and malformed persisted JSON > PROJ-BREAK-SA-24 retains strict, bounded, independent valid brief parsing

  ```
  AssertionError: expected { goal: 'Ship a project', …(4) } to deeply equal { goal: '', description: '', …(3) }
  - Expected
  + Received
  {
  -   "completionConditions": [],
  -   "deliverables": [],
  -   "description": "",
  -   "goal": "",
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-sprint-progress-page.test.tsx (2 failing)
- Mentor sprint progress role/page journey > PROJ-BREAK-MENTOR-365 repeated or forged filters deny before sprint service

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid sprint progress filters'
  Expected: "Invalid sprint progress filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Sprint progress</h1></header><a href="/mentor/sprint-progress">Clear filters</a></section>"
  ```
- Mentor sprint progress role/page journey > PROJ-BREAK-MENTOR-366 invalid page and query values cannot reach backend

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid sprint progress filters'
  Expected: "Invalid sprint progress filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Sprint progress</h1></header><a href="/mentor/sprint-progress">Clear filters</a></section>"
  ```

## tests/unit/PROJ-BREAK-chat9-admin-audit-access.test.ts (1 failing)
- IIT Dharwad Projects: global audit authorization > PROJ-BREAK-idor-25 a selected college or organization never quietly becomes global audit scope

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'nextRemaining={result.remainingCount}'
  - Expected
  + Received
  - nextRemaining={result.remainingCount}
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
