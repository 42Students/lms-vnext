# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-team-member-and-alert-parity.test.ts (1 failing)
- chat-2 Team membership, context and event notifications > TPO-inbox-team-38 lets authorized college admins and TPO admins participate, with persisted college scope

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'new Set(teammates.map(row=>row.id)).s…'
  - Expected
  + Received
  - new Set(teammates.map(row=>row.id)).size!==others.length
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
  ```
