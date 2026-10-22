# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-workload-chat2.test.ts (2 failing)
- Team workload sorting > TPO-inbox-team-31 uses only scoped OPEN ask records for real per-person workload

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'workloadByMember.get(member.membershi…'
  - Expected
  + Received
  - workloadByMember.get(member.membershipId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Team workload sorting > TPO-inbox-team-22 exposes ask status in People without fabricating work for other colleges

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '"Overdue first"'
  - Expected
  + Received
  - "Overdue first"
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-chat14-mentor-01.test.ts (1 failing)
- chat-14 mentor UX rollout batch 01 > UX-mentor-mentor-01 preserves route layout, wording, and touch/scroll source contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 max-w-full'
  - Expected
  + Received
  - min-w-0 max-w-full
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
