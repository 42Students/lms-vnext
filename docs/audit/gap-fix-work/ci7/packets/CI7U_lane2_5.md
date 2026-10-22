# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-inbox-team-round5-parity-review.test.ts (2 failing)
- TPO inbox/team outstanding legacy contracts > TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'z.string().uuid().safeParse(threadId)'
  - Expected
  + Received
  - z.string().uuid().safeParse(threadId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO inbox/team outstanding legacy contracts > TPO-inbox-team-37 hides temporary coordinator assignments from permanent team roles

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'const activeTeam=team.members.filter(…'
  - Expected
  + Received
  - const activeTeam=team.members.filter(member=>member.roles.includes("TPO")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-chat14-mentor-01.test.ts (1 failing)
- chat-14 mentor UX rollout batch 01 > UX-mentor-mentor-01 preserves route layout, wording, and touch/scroll source contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'mx-auto flex min-h-[320px] w-full max…'
  - Expected
  + Received
  - mx-auto flex min-h-[320px] w-full max-w-[700px]
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
