# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-filter-round4.test.ts (2 failing)
- TPO conversations filters > TPO-inbox-team-23 filters only conversations with recorded, unrevoked decisions

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'conversations.asksReady?["ASKS","AT_M…'
  - Expected
  + Received
  - conversations.asksReady?["ASKS","AT_ME"] as const
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO conversations filters > TPO-inbox-team-18 keeps filter state in the URL and explains an empty filtered result

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'tpoTeamConversationFilterSchema.optio…'
  - Expected
  + Received
  - tpoTeamConversationFilterSchema.optional()
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/ux-playbook-primitives.test.tsx (1 failing)
- UX playbook shared behaviour > RV-05 B-02 keeps hidden fields in More details without audited column mapping

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'class="hidden'
  Expected: "class="hidden"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
