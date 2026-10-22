# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-activity-notices-chat2.test.ts (1 failing)
- Team inbox activity and participant notices > TPO-inbox-team-18 orders private conversations by last real message and shows last activity in IST

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'row.lastActivityAt'
  - Expected
  + Received
  - row.lastActivityAt
  + import Link from "next/link";
  + import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
  + import {readTpoInternalConversation,tpoThreadIdSchema} from "@/modules/placements/tpo-team-conversation-service";
  + import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
  ```
